import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ✅ Google OAuth 팝업을 허용하기 위한 헤더 설정
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },
    proxy: {
      '/api/lunar': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lunar/, '/B090041/openapi/service/LrsrCldInfoService')
      },
      '/api/geocoding': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geocoding/, ''),
        headers: {
          'User-Agent': 'MindFlowApp/1.0'
        }
      }
    }
  }
})
