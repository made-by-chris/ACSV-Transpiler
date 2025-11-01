import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      // For browser builds, these will be undefined (handled in code)
      fs: false,
      path: false,
    }
  },
  define: {
    // Ensure process is available for browser builds (will be undefined if not available)
    'process.env': {}
  },
  optimizeDeps: {
    exclude: ['fs', 'path']
  }
})
