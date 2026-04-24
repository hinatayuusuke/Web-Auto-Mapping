import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';

  return {
    // WHY: GitHub Pages は /<repo>/ 配下の subpath 配信になるため、Actions 上の build だけ base を切り替える。
    base: isGitHubPagesBuild ? '/Web-Auto-Mapping/' : '/',
    plugins: [react(), tailwindcss()],
  };
});
