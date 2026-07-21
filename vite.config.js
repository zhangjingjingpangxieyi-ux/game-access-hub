import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const pfxPath = env.VITE_HTTPS_PFX && path.resolve(env.VITE_HTTPS_PFX)

  return {
    plugins: [react()],
    base: env.VITE_APP_BASE || './',
    build: {
      rollupOptions: {
        output: { inlineDynamicImports: true },
      },
    },
    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: Number(env.VITE_DEV_PORT || 8888),
      strictPort: true,
      hmr: {
        host: 'cli-chat.q1.com',
        protocol: 'wss',
        clientPort: Number(env.VITE_DEV_PORT || 8888),
      },
      https: pfxPath ? {
        pfx: fs.readFileSync(pfxPath),
        passphrase: env.VITE_HTTPS_PASSPHRASE,
      } : undefined,
      proxy: {
        '/__glacier-sdk.js': {
          target: 'https://chat.q1.com',
          changeOrigin: true,
          rewrite: () => '/baas/glacier-baas-sdk.js',
        },
      },
    },
  }
})
