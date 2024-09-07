const path = require("path");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
	target: "node",
	mode: "production",
	entry: "./src/index.ts",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js",
	},
	resolve: {
		plugins: [new TsconfigPathsPlugin()],
		extensions: [".ts", ".js"],
	},
	externals: [nodeExternals()],
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	optimization: {
		minimize: false,
	},
};
