import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { veoFetchVideo, veoPoll, veoStart } from './api/lib/veoGoogle.js';

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
        let body: {
          prompt?: string;
          images?: Array<{ mimeType: string; data: string }>;
        };
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
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: prompt },
        ];
        if (Array.isArray(body.images)) {
          for (const im of body.images.slice(0, 12)) {
            if (im?.data && im?.mimeType) {
              parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } });
            }
          }
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(serverApiKey)}`;
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
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
          const candParts = data.candidates?.[0]?.content?.parts ?? [];
          const text = candParts
            .filter((p): p is { text: string } => typeof (p as { text?: string }).text === 'string')
            .map((p) => p.text)
            .join('\n')
            .trim();
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
      server.middlewares.use('/api/video-start', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (!serverApiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY missing' }));
          return;
        }
        let body: {
          prompt?: string;
          aspectRatio?: string;
          resolution?: string;
          model?: string;
          referenceImages?: Array<{ mimeType: string; data: string; referenceType?: string }>;
        };
        try {
          const raw = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
            req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            req.on('error', reject);
          });
          body = raw ? JSON.parse(raw) : {};
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        if (!body.prompt || typeof body.prompt !== 'string') {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing "prompt"' }));
          return;
        }
        let refs: Array<{ mimeType: string; data: string; referenceType?: string }> | undefined;
        if (Array.isArray(body.referenceImages) && body.referenceImages.length > 0) {
          refs = body.referenceImages
            .filter((r) => r?.data && r?.mimeType)
            .slice(0, 3)
            .map((r) => ({
              mimeType: r.mimeType,
              data: r.data,
              referenceType: r.referenceType || 'asset',
            }));
        }
        try {
          const out = await veoStart(serverApiKey, {
            prompt: body.prompt.slice(0, 8000),
            aspectRatio: body.aspectRatio || process.env.VEO_ASPECT_RATIO || '9:16',
            resolution: body.resolution || process.env.VEO_RESOLUTION,
            model: body.model,
            referenceImages: refs,
          });
          res.statusCode = 200;
          res.end(JSON.stringify(out));
        } catch (e) {
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              error: e instanceof Error ? e.message : 'Veo start failed',
            }),
          );
        }
      });
      server.middlewares.use('/api/video-status', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (!serverApiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY missing' }));
          return;
        }
        let body: { operationName?: string };
        try {
          const raw = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
            req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            req.on('error', reject);
          });
          body = raw ? JSON.parse(raw) : {};
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        if (!body.operationName) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing operationName' }));
          return;
        }
        try {
          const out = await veoPoll(serverApiKey, body.operationName);
          res.statusCode = 200;
          res.end(JSON.stringify(out));
        } catch (e) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Poll failed' }));
        }
      });
      server.middlewares.use('/api/video-proxy', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        if (!serverApiKey) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY missing' }));
          return;
        }
        let body: { videoUri?: string };
        try {
          const raw = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
            req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            req.on('error', reject);
          });
          body = raw ? JSON.parse(raw) : {};
        } catch {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        if (!body.videoUri) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing videoUri' }));
          return;
        }
        try {
          const upstream = await veoFetchVideo(serverApiKey, body.videoUri);
          if (!upstream.ok) {
            const t = await upstream.text();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = upstream.status >= 400 ? upstream.status : 502;
            res.end(JSON.stringify({ error: t || 'Download failed' }));
            return;
          }
          const ct = upstream.headers.get('content-type') || 'video/mp4';
          res.setHeader('Content-Type', ct);
          const buf = Buffer.from(await upstream.arrayBuffer());
          res.statusCode = 200;
          res.end(buf);
        } catch (e) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 502;
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Proxy failed' }));
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
