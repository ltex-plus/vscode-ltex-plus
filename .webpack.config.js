//@ts-check

const Path = require("node:path");

/**@type {import('webpack').Configuration}*/
const config = {
	target: "node",
	entry: "./src/extension.ts",
	output: {
		path: Path.resolve(__dirname, "dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]",
	},
	devtool: "source-map",
	externals: {
		vscode: "commonjs vscode",
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
						options: {
							configFile: "tsconfig.json",
						},
					},
				],
			},
		],
	},
	optimization: {
		minimizer: [
			() => ({
				terserOptions: {
					extractComments: false,
				},
			}),
		],
	},
};

module.exports = config;
