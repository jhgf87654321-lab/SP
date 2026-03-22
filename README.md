<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/464761d2-446c-44af-920e-2549443f4816

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set up your Gemini API key:
   - Open the `.env` file in the root directory
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key
   - Get your API key from: https://makersuite.google.com/app/apikey
3. Run the app:
   `npm run dev`
4. Open http://localhost:3000 in your browser

## Environment Variables

**Local:** In `.env` set `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` (used by the dev server proxy at `/api/gemini`).

**Vercel:** Add **`GEMINI_API_KEY`** under Project → Settings → Environment Variables (server-side only; do not rely on browser calls to Google — they are blocked in some regions). Redeploy after saving.

- `GEMINI_API_KEY`: Required for AI generation (via `/api/gemini`, `/api/video-*`)
- `GEMINI_MODEL`: Optional, default `gemini-2.5-flash`
- `VEO_MODEL`: Optional，默认 **`veo-3.1-generate-preview`（标准版）**。标准版要求 **分镜文案（prompt）与至少一张参考图同时提交**；若改用 **`veo-3.1-fast-generate-preview`**，可不传参考图（Fast 不接受 `referenceImages` 的 `inlineData`）。见 [Veo pricing](https://ai.google.dev/gemini-api/docs/pricing#veo-3.1)。
- `VITE_VEO_MODEL`: 可选，与 `VEO_MODEL` 同步填写（含 `fast` 时前端不再强制「必须有参考图」校验，与纯 Fast 部署一致）。
- `VEO_ASPECT_RATIO`: Optional, default `9:16`
- `VITE_ENABLE_VEO`: Set to `false` in Vercel env if you only want storyboard text (no video API calls)
- `APP_URL`: Optional app URL for local/dev notes

Video generation uses **Google Veo** (long-running job + polling). On Vercel, use a plan that allows **long enough function duration** for `/api/video-proxy` (see `vercel.json`).
