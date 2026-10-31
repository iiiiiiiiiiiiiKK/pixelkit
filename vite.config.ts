import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * PixelKit is a 100% client-side app: it never talks to a server, never loads
 * third-party scripts and never uploads a user file. A Content-Security-Policy
 * that encodes exactly that is injected into the production HTML.
 *
 * GitHub Pages cannot send HTTP response headers, so the policy ships as a
 * <meta http-equiv> tag. That covers script/style/connect/worker directives;
 * frame-ancestors and X-Frame-Options cannot be expressed in a meta tag and are
 * documented as a known limitation in README.md.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

/**
 * `public/theme-init.js` restores the stored colour scheme before first paint.
 * It is injected here (rather than written in index.html) so Vite does not try
 * to bundle a file that intentionally lives in `public/` as-is.
 */
function themeBootstrapPlugin(): Plugin {
  return {
    name: 'pixelkit-theme-bootstrap',
    transformIndexHtml(html) {
      return html.replace('<!--THEME-->', '<script src="theme-init.js"></script>')
    },
  }
}

function cspPlugin(): Plugin {
  return {
    name: 'pixelkit-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!--CSP-->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      )
    },
  }
}

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/, so the
// base path has to match. The deploy workflow sets GITHUB_PAGES=true.
const base = process.env.GITHUB_PAGES === 'true' ? '/pixelkit/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), themeBootstrapPlugin(), cspPlugin()],
  build: {
    target: 'es2022',
    cssTarget: 'chrome111',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5180,
    strictPort: false,
  },
  preview: {
    port: 5181,
    strictPort: false,
  },
})
