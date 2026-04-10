/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface Window {
  gtag?: (...args: unknown[]) => void;
}
