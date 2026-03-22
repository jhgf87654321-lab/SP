/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string
  /** 设为 "false" 时仅生成分镜文案，不调用 Veo */
  readonly VITE_ENABLE_VEO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
