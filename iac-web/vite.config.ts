import { defineConfig, loadEnv } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    base: '/app/',
    resolve: { tsconfigPaths: true },
    plugins: [
      tailwindcss(),
      tanstackStart(),
      nitro({
        compressPublicAssets: true,
        routeRules: {
          '/app/assets/**': {
            headers: { 'cache-control': 'public, max-age=31536000, immutable' },
          },
        },
      }),
      viteReact(),
    ],
    server: {
      // Google's redirect form returns to the frontend origin. Production uses
      // its reverse proxy; local Vite needs the same auth endpoint routing.
      proxy: env.VITE_API_BASE_URL
        ? {
            '/api/v1/auth/google': {
              target: env.VITE_API_BASE_URL,
              changeOrigin: true,
            },
          }
        : undefined,
      watch: {
        ignored: ['**/public/**'],
      },
    },
  }
})

export default config
