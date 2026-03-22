import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);

/** Manually parse .env (handles UTF-16, BOM, dotenv quirks) */
function loadEnvManual(envPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  const clean = (s: string) => s.replace(/\u0000/g, '').trim(); // UTF-16 null bytes
  try {
    let content = fs.readFileSync(envPath, 'utf-8');
    content = content.replace(/^\uFEFF/, ''); // BOM
    for (const line of content.split(/\r?\n/)) {
      const trimmed = clean(line);
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = clean(trimmed.slice(0, eq));
        let val = clean(trimmed.slice(eq + 1));
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        out[key] = val;
      }
    }
  } catch {
    // .env may not exist
  }
  return out;
}

const env = loadEnvManual(path.join(root, '.env'));
const apiKey =
  process.env.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  env.VITE_GEMINI_API_KEY ||
  env.GEMINI_API_KEY ||
  '';
if (!apiKey) console.warn('[Vite] GEMINI_API_KEY not found (needed for /api/gemini in dev)');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/** Local dev: same server-side proxy as Vercel `api/gemini.js` */
function geminiDevPlugin(serverApiKey: string) {
  return {
    name: 'gemini-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (!serverApiKey) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: 'GEMINI_API_KEY missing in .env (local dev server)',
            }),
          );
          return;
        }
        const raw = await new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
          req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
          req.on('error', reject);
        });
        let body: { prompt?: string };
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }
        const prompt = body.prompt;
        if (!prompt || typeof prompt !== 'string') {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing "prompt" string in body' }));
          return;
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(serverApiKey)}`;
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
            }),
          });
          const data = (await r.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            error?: { message?: string };
          };
          if (!r.ok) {
            const msg = data?.error?.message || r.statusText || 'Gemini API error';
            res.statusCode = r.status >= 400 ? r.status : 502;
            res.end(JSON.stringify({ error: msg, details: data?.error }));
            return;
          }
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          res.statusCode = 200;
          res.end(JSON.stringify({ text, model: GEMINI_MODEL }));
        } catch (e) {
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              error: e instanceof Error ? e.message : 'Upstream request failed',
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  root,
  envDir: root,
  plugins: [react(), tailwindcss(), geminiDevPlugin(apiKey)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
