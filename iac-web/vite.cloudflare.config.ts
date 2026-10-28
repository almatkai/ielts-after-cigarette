import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// Independent of vite.config.ts: the Node/Docker production build stays intact.
export default defineConfig(() => {
  const origin = new URL(
    process.env.IAC_CF_FRONTEND_ORIGIN || 'http://127.0.0.1:8787',
  )
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    !(
      (origin.protocol === 'https:' &&
        !origin.port &&
        [
          'ielts.woolet.cc',
          'ielts-web-dev.kairatovalmat2003.workers.dev',
        ].includes(origin.hostname)) ||
      (origin.protocol === 'http:' &&
        ['127.0.0.1', 'localhost'].includes(origin.hostname))
    )
  ) {
    throw new Error(
      'Use the approved IELTS DEV HTTPS origin or a local HTTP origin',
    )
  }

  return {
    base: '/app/',
    envDir: false,
    envPrefix: 'IAC_CF_PUBLIC_',
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(origin.origin),
      'import.meta.env.VITE_SITE_URL': JSON.stringify(origin.origin),
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(''),
    },
    resolve: { tsconfigPaths: true },
    plugins: [
      {
        name: 'cloudflare-source-scan',
        enforce: 'pre',
        transform(css, id) {
          if (
            id.split('?')[0] !== resolve('src/styles.css') ||
            /[?&]url(?:&|$)/.test(id)
          )
            return
          // Archives inside ignored folders can make Tailwind's automatic
          // detection include dependencies and generated output. Scope only
          // this build in memory; leave the archived stylesheet unchanged.
          const scoped = css.replace(
            /@import\s+(['"])tailwindcss\1\s*;/,
            "@import 'tailwindcss' source('./');",
          )
          if (scoped === css) {
            throw new Error(
              'Review the Cloudflare Tailwind source scope for this revision',
            )
          }
          return scoped
        },
      },
      tailwindcss(),
      tanstackStart(),
      nitro({
        preset: 'cloudflare_module',
        compatibilityDate: '2026-07-31',
        baseURL: '/app/',
        output: { dir: '.output-cloudflare.local' },
        cloudflare: { deployConfig: false, nodeCompat: true },
        compressPublicAssets: false,
      }),
      viteReact(),
    ],
  }
})
