/**
 * Google Veo video generation via Gemini API (REST v1beta).
 * @see https://ai.google.dev/gemini-api/docs/video
 */

export const V1BETA = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * @param {string} apiKey
 * @param {{
 *   prompt: string;
 *   aspectRatio?: string;
 *   resolution?: string;
 *   model?: string;
 *   referenceImages?: Array<{ mimeType: string; data: string; referenceType?: string }>;
 * }} opts
 */
export async function veoStart(apiKey, opts) {
  // 默认 Veo 3.1 Fast；可设 VEO_MODEL=veo-3.1-generate-preview 换标准版
  const model = opts.model || process.env.VEO_MODEL || 'veo-3.1-fast-generate-preview';
  const url = `${V1BETA}/models/${model}:predictLongRunning`;

  const instance = { prompt: opts.prompt };
  if (opts.referenceImages?.length) {
    instance.referenceImages = opts.referenceImages.slice(0, 3).map((ref) => ({
      image: {
        inlineData: {
          mimeType: ref.mimeType || 'image/jpeg',
          data: ref.data,
        },
      },
      referenceType: ref.referenceType || 'asset',
    }));
  }
  const parameters = {};
  if (opts.aspectRatio) parameters.aspectRatio = opts.aspectRatio;
  if (opts.resolution) parameters.resolution = opts.resolution;

  const body = { instances: [instance] };
  if (Object.keys(parameters).length > 0) body.parameters = parameters;

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await r.json();
  if (!r.ok) {
    const msg = data?.error?.message || r.statusText || 'Veo start failed';
    throw new Error(msg);
  }
  if (!data.name) throw new Error('No operation name from Veo');
  return { operationName: data.name, model };
}

/**
 * @param {string} apiKey
 * @param {string} operationName e.g. operations/abc123
 */
export async function veoPoll(apiKey, operationName) {
  const url = `${V1BETA}/${operationName}`;
  const r = await fetch(url, { headers: { 'x-goog-api-key': apiKey } });
  const data = await r.json();
  if (!r.ok) {
    return { done: true, error: data?.error?.message || r.statusText };
  }
  if (!data.done) {
    return { done: false };
  }
  if (data.error) {
    return { done: true, error: data.error.message || JSON.stringify(data.error) };
  }
  const gv = data.response?.generateVideoResponse;
  const sample =
    gv?.generatedSamples?.[0] ||
    gv?.generatedVideos?.[0] ||
    data.response?.generatedVideos?.[0];
  const uri = sample?.video?.uri;
  if (!uri) {
    return {
      done: true,
      error: '视频已生成但未返回下载地址，请检查账号是否开通 Veo 权限。',
    };
  }
  return { done: true, videoUri: uri };
}

export async function veoFetchVideo(apiKey, videoUri) {
  return fetch(videoUri, {
    headers: { 'x-goog-api-key': apiKey },
    redirect: 'follow',
  });
}
