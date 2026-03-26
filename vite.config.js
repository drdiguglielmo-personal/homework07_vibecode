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

  /** Netlify sets COMMIT_REF during `npm run build`; empty locally. View source on the live site to verify deploy. */
  const buildCommit = process.env.COMMIT_REF || process.env.CACHED_COMMIT_REF || "";

  return {
    plugins: [
      {
        name: "inject-build-commit-meta",
        transformIndexHtml(html) {
          return html.replace(
            "</head>",
            `<meta name="x-build-commit" content="${buildCommit}" />\n</head>`
          );
        }
      }
    ],
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
