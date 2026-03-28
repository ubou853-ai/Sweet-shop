/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_VAPID_KEY: string
  readonly VITE_FCM_SERVER_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
