import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

const repoBase = "/minipix/";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["icon.svg", "icon-maskable.svg"],
			manifest: {
				name: "MiniPix",
				short_name: "MiniPix",
				description: "Convertisseur d'images et d'animations.",
				theme_color: "#f9f2e7",
				background_color: "#f9f2e7",
				display: "standalone",
				start_url: ".",
				scope: ".",
				icons: [
					{
						src: "icon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any",
					},
					{
						src: "icon-maskable.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				navigateFallback: "index.html",
				globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
				cleanupOutdatedCaches: true,
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.destination === "image",
						handler: "CacheFirst",
						options: {
							cacheName: "images",
							expiration: {
								maxEntries: 64,
								maxAgeSeconds: 60 * 60 * 24 * 30,
							},
						},
					},
					{
						urlPattern: ({ request }) =>
							["style", "script", "worker"].includes(request.destination),
						handler: "CacheFirst",
						options: {
							cacheName: "static-resources",
							expiration: {
								maxEntries: 64,
								maxAgeSeconds: 60 * 60 * 24 * 30,
							},
						},
					},
				],
			},
		}),
	],
	// Use the repository sub-path when building the static bundle for GitHub Pages
	site: "https://lordfpx.github.io/",
	base: process.env.GITHUB_PAGES === "true" && mode === "production" ? repoBase : "/minipix/",
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
}));
