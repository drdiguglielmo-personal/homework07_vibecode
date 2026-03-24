import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const sheetsTarget = env.VITE_SHEETS_API_URL;
  let sheetsOrigin = "";
  let sheetsPathname = "";

  if (sheetsTarget) {
    try {
      const parsed = new URL(sheetsTarget);
      sheetsOrigin = parsed.origin;
      sheetsPathname = parsed.pathname;
    } catch {
      // If URL parsing fails, proxy is skipped and app will show runtime errors.
    }
  }

  return {
    server: sheetsOrigin && sheetsPathname
      ? {
          proxy: {
            "/api/sheets": {
              target: sheetsOrigin,
              changeOrigin: true,
              secure: true,
              rewrite: () => sheetsPathname,
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  // Apps Script can reject proxied requests when localhost origin/referrer are forwarded.
                  proxyReq.removeHeader("origin");
                  proxyReq.removeHeader("referer");
                });
              }
            }
          }
        }
      : undefined
  };
});
