import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['app.shettigarevents.com', 'ec2-13-201-3-9.ap-south-1.compute.amazonaws.com','ec2-13-201-3-9.ap-south-1.compute.amazonaws.comm', 'f3d592c9a105.ngrok-free.app'],
    watch: {
      usePolling: true
    }
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
})
