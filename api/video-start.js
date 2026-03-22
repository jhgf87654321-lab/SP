import { readJsonBody } from './lib/http.js';
import { veoStart } from './lib/veoGoogle.js';

function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  );
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server missing GEMINI_API_KEY' }));
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { prompt, aspectRatio, resolution, model, referenceImages } = body;
  if (!prompt || typeof prompt !== 'string') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing "prompt"' }));
    return;
  }

  let refs;
  if (Array.isArray(referenceImages) && referenceImages.length > 0) {
    refs = referenceImages
      .filter((r) => r && typeof r.data === 'string' && typeof r.mimeType === 'string')
      .slice(0, 3)
      .map((r) => ({
        mimeType: r.mimeType,
        data: r.data,
        referenceType: r.referenceType || 'asset',
      }));
  }

  try {
    const out = await veoStart(apiKey, {
      prompt: prompt.slice(0, 8000),
      aspectRatio: aspectRatio || process.env.VEO_ASPECT_RATIO || '9:16',
      resolution: resolution || process.env.VEO_RESOLUTION,
      model,
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
}
