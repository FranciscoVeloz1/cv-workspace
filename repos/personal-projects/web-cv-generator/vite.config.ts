import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/web-cv-generator/',
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**']
  }
})
