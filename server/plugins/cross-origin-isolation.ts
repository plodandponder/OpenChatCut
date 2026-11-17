// Cross-Origin-Isolation for WebAssembly threading.
//
// onnxruntime-web ships a threaded wasm build (ort-wasm-simd-threaded) that
// is only activated when SharedArrayBuffer is available, which requires
// crossOriginIsolated = true (COOP same-origin + COEP credentialless). Without
// it, local ASR runs single-threaded and long audio transcription is several
// times slower. The app serves all resources same-origin, so credentialless
// COEP keeps external font stylesheets working while enabling threading.
import type { Plugin } from 'vite';

function applySecurityHeaders(res: { setHeader(name: string, value: string): void }): void {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export function crossOriginIsolationPlugin(): Plugin {
  return {
    name: 'openchatcut-cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        applySecurityHeaders(res);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        applySecurityHeaders(res);
        next();
      });
    },
  };
}
