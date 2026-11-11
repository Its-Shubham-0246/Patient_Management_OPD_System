/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_DEFAULT_CLINIC_NAME: string;
  readonly VITE_DEFAULT_TAGLINE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
