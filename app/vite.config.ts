import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// 빌드 결과물을 저장소 맨 위에 둔다.
// GitHub Pages가 main 브랜치의 맨 위 폴더를 그대로 배포하기 때문.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: fileURLToPath(new URL('..', import.meta.url)),
    emptyOutDir: false,
    assetsDir: 'assets',
  },
  test: {
    environment: 'node',
  },
});
