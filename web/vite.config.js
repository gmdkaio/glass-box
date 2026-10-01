import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// runes everywhere except node_modules
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({ fallback: '404.html' }),

			// GitHub Pages serves a project site from /<repo>. CI sets BASE_PATH=/glass-box.
			paths: {
				base: process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? '')
			}
		})
	]
});
