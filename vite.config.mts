import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseEnv } from 'node:util'

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

const { url } = parseEnv(
  readFileSync(new URL('./.env/account.env', import.meta.url), 'utf8'),
)
const accountApiUrl = URL.parse(url ?? '')
if (
  accountApiUrl?.protocol !== 'https:' ||
  accountApiUrl.username ||
  accountApiUrl.password ||
  accountApiUrl.href !== `${accountApiUrl.origin}/`
) {
  throw new Error('.env/account.env must set url to an HTTPS origin')
}

export default defineConfig({
  root: 'src',
  server: { port: 3000 },
  plugins: [
    svgr(),
    react(),
    legacy({
      modernTargets: ['edge>=109', 'safari>=14'],
      renderLegacyChunks: false,
      // Auto-detected from the emitted bundle, dependencies included,
      // so post-Safari-14 APIs never depend on extending a manual list.
      modernPolyfills: true,
      additionalModernPolyfills: [
        path.resolve('./src/polyfills/matchMedia.js'),
        path.resolve('./src/polyfills/WeakRef.js'),
        path.resolve('./src/polyfills/RegExp.js'),
      ],
    }),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
      '@root': path.resolve('.'),
      'monaco-editor/esm/vs/editor/editor.worker.js':
        'monaco-editor/editor/editor.worker',
    },
  },
  define: {
    OS_PLATFORM: `"${process.platform}"`,
    'import.meta.env.XRAY_ACCOUNT_API_URL': JSON.stringify(
      accountApiUrl.origin,
    ),
  },
})
