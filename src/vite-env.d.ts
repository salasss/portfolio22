/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_ENDPOINT?: string
  readonly VITE_PLAUSIBLE_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
