/**
 * 将图片缩放到最大边长 maxSide，输出 JPEG base64（减小请求体积，避免 Vercel body 限制）
 */
export function imageUrlToResizedJpegBase64(
  src: string,
  maxSide = 1024,
  quality = 0.82,
): Promise<{ mimeType: string; data: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (!w || !h) {
          resolve(null);
          return;
        }
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = c.toDataURL('image/jpeg', quality);
        const data = dataUrl.split(',')[1];
        if (!data) {
          resolve(null);
          return;
        }
        resolve({ mimeType: 'image/jpeg', data });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
