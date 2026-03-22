/**
 * Server-side Gemini proxy — avoids "User location is not supported" when
 * users in restricted regions call the API from the browser.
 * Set GEMINI_API_KEY (or VITE_GEMINI_API_KEY) in Vercel Environment Variables.
 */

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
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

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: 'Server missing GEMINI_API_KEY. Add it in Vercel → Settings → Environment Variables.',
      }),
    );
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== 'string') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing "prompt" string in body' }));
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = data?.error?.message || r.statusText || 'Gemini API error';
      res.statusCode = r.status >= 400 ? r.status : 502;
      res.end(JSON.stringify({ error: msg, details: data?.error }));
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    res.statusCode = 200;
    res.end(JSON.stringify({ text, model: MODEL }));
  } catch (e) {
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        error: e instanceof Error ? e.message : 'Upstream request failed',
      }),
    );
  }
}
