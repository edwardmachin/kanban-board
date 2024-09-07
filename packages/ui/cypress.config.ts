import { defineConfig } from "cypress";

export default defineConfig({
	viewportWidth: 1920,
	viewportHeight: 1080,
	component: {
		devServer: {
			framework: "react",
			bundler: "vite",
		},
	},

	e2e: {
		baseUrl: "http://localhost",
	},
});
