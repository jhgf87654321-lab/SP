/**
 * Google Veo video generation via Gemini API (REST v1beta).
 * @see https://ai.google.dev/gemini-api/docs/video
 */

export const V1BETA = 'https://generativelanguage.googleapis.com/v1beta';

/** 默认使用标准版：支持 referenceImages + 文案同时提交 */
export const DEFAULT_VEO_MODEL = 'veo-3.1-generate-preview';

/**
 * @param {string | undefined} explicit 请求体里的 model
 * @returns {string}
 */
export function resolveVeoModel(explicit) {
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  return process.env.VEO_MODEL || DEFAULT_VEO_MODEL;
}

/**
 * Veo **Fast** 模型不接受 referenceImages 里的 inlineData，会报错：
 * `inlineData isn't supported by this model`.
 * 参考图仅适用于非 Fast 的 3.1 预览（如 veo-3.1-generate-preview）。
 * @param {string} modelId
 */
export function veoSupportsReferenceImages(modelId) {
  const id = String(modelId || '').toLowerCase();
  return !id.includes('fast');
}

/**
 * 标准版必须与 prompt 同时提供至少一张参考图。
 * @param {string} modelId
 * @param {string} prompt
 * @param {unknown[] | undefined} referenceImages 已校验后的数组
 * @returns {{ ok: true } | { ok: false; error: string }}
 */
export function validateVeoStartInputs(modelId, prompt, referenceImages) {
  const p = typeof prompt === 'string' ? prompt.trim() : '';
  if (!p) return { ok: false, error: 'Missing "prompt"' };
  const n = Array.isArray(referenceImages) ? referenceImages.length : 0;
  if (veoSupportsReferenceImages(modelId) && n < 1) {
    return {
      ok: false,
      error:
        '标准版 Veo 需要分镜文案与至少一张参考图（商品或模特）同时提交。请上传图片后重试，或改用 Fast 模型（VEO_MODEL 含 fast，且可不传参考图）。',
    };
  }
  return { ok: true };
}

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
  const model = resolveVeoModel(opts.model);
  const url = `${V1BETA}/models/${model}:predictLongRunning`;

  const instance = { prompt: opts.prompt };
  let referenceImagesAttached = false;
  if (
    opts.referenceImages?.length &&
    veoSupportsReferenceImages(model)
  ) {
    instance.referenceImages = opts.referenceImages.slice(0, 3).map((ref) => ({
      image: {
        inlineData: {
          mimeType: ref.mimeType || 'image/jpeg',
          data: ref.data,
        },
      },
      referenceType: ref.referenceType || 'asset',
    }));
    referenceImagesAttached = true;
  }

  const referenceImagesSkipped =
    (opts.referenceImages?.length || 0) > 0 && !referenceImagesAttached;
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
  return {
    operationName: data.name,
    model,
    referenceImagesAttached,
    referenceImagesSkipped,
  };
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
