/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_CONTRACT_NAME?: string;
  readonly VITE_NETWORK?: string;
  readonly VITE_STACKS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
