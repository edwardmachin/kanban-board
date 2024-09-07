import react from "@vitejs/plugin-react-swc";
import VitePluginCssMediaSplitter from "css-media-splitter/vite-plugin";
import path from "path";
import { defineConfig } from "vite";
import { chunkSplitPlugin } from "vite-plugin-chunk-split";
import ViteCompression from "vite-plugin-compression";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import tsconfig from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@ui": path.resolve(__dirname, "./src"),
			"@api": path.resolve(__dirname, "../api/src"),
		},
	},
	plugins: [
		react(),
		tsconfig(),
		ViteImageOptimizer({
			png: {
				quality: 95,
			},
			jpeg: {
				quality: 95,
			},
			jpg: {
				quality: 95,
			},
			webp: {
				quality: 95,
			},
		}),
		cssInjectedByJsPlugin(),
		chunkSplitPlugin({
			strategy: "single-vendor",
		}),
		VitePluginCssMediaSplitter(),
		ViteCompression({
			algorithm: "gzip",
		}),
	],
	build: {
		sourcemap: false,
		minify: "terser",
		cssCodeSplit: true,
	},
});
