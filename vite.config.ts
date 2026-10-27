import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
 base: '/',
 plugins: [react()],
 resolve: {alias: {'@': fileURLToPath(new URL('.', import.meta.url))}},
 css: {postcss: {plugins: [tailwindcss()]}},
 build: {rollupOptions: {input: {main: fileURLToPath(new URL('./index.html',import.meta.url)),editor: fileURLToPath(new URL('./edit/index.html',import.meta.url)),guidelines: fileURLToPath(new URL('./guidelines/index.html',import.meta.url))}}}
});
