import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@src': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      manifestFilename: 'site.webmanifest',
      devOptions: { enabled: true, type: 'module' },
      injectRegister: false,
      includeAssets: [
        'img/logo/logo.png',
        'img/logo/pwa.png',
        'fonts/GoogleIcon/kJEhBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oFsI.woff2',
        'fonts/Cal_Sans/CalSans-Regular.ttf',
        'fonts/Monoton/Monoton-Regular.ttf',
      ],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,woff,ttf,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globIgnores: [
          'fonts/Noto_Color_Emoji/NotoColorEmoji-Regular.ttf',
        ],
      },
      manifest: {
        name: 'HubCortex',
        short_name: 'HubCortex',
        start_url: '/',
        display: 'fullscreen',
        background_color: '#f7f6f6',
        theme_color: '#f7f6f6',
        description: 'App utility generali personali',
        icons: [
          { src: '/img/logo/pwa.png', sizes: '192x192', type: 'image/png' },
        ],

      }
    })
  ],
})
