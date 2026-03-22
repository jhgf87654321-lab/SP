import { readJsonBody } from './lib/http.js';
import { veoPoll } from './lib/veoGoogle.js';

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

  const { operationName } = body;
  if (!operationName || typeof operationName !== 'string') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing "operationName"' }));
    return;
  }

  try {
    const out = await veoPoll(apiKey, operationName);
    res.statusCode = 200;
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        error: e instanceof Error ? e.message : 'Poll failed',
      }),
    );
  }
}
