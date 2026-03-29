import { readJsonBody } from './lib/http.js';
import { veoFetchVideo } from './lib/veoGoogle.js';

function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  );
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server missing GEMINI_API_KEY' }));
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { videoUri } = body;
  if (!videoUri || typeof videoUri !== 'string') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing "videoUri"' }));
    return;
  }

  try {
    const upstream = await veoFetchVideo(apiKey, videoUri);
    if (!upstream.ok) {
      const t = await upstream.text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = upstream.status >= 400 ? upstream.status : 502;
      res.end(JSON.stringify({ error: t || 'Download failed' }));
      return;
    }
    const ct = upstream.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = 200;
    res.end(buf);
  } catch (e) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        error: e instanceof Error ? e.message : 'Proxy failed',
      }),
    );
  }
}
