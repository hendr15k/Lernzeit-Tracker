/// <reference types="vite/client" />

declare global {
  interface Window {
    __firebase_config: string;
    __app_id: string;
    __initial_auth_token: string | undefined;
  }
  const __firebase_config: string;
  const __app_id: string;
  const __initial_auth_token: string | undefined;
}

export {};
