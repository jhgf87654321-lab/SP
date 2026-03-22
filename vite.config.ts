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
if (!apiKey) console.warn('[Vite] GEMINI_API_KEY not found (check .env locally or Vercel env vars)');

export default defineConfig({
  root,
  envDir: root,
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
        secure: true,
      }
    }
  },
});
