const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = (env) => {
	const isProduction = env === "production";
	return {
		plugins: [
			new HtmlWebpackPlugin({
				title: "Hot Module Replacement",
				template: "./public/index.html",
			}),
			new Dotenv({ path: "./config/.env" }),
		],
		entry: ["react-hot-loader/patch", "./src/index.js"],
		output: {
			path: path.resolve(__dirname, "public/dist/"),
			// path: path.resolve(__dirname, "functions/dist/"),
			filename: "build.js",
		},
		mode: isProduction ? "production" : "development",
		devtool: isProduction ? "none" : "inline-source-map",
		devServer: {
			static: "./public",
			proxy: {
				"/api": {
					target: "http://localhost:5001",
				},
			},
		},
		resolve: {
			extensions: [".js", ".jsx", ".json"],
			fallback: {
				timers: require.resolve("timers-browserify"),
				buffer: require.resolve("buffer/"),
				stream: require.resolve("stream-browserify"),
				path: require.resolve("path-browserify"),
				url: require.resolve("url/"),
				util: require.resolve("util/"),
				http: require.resolve("stream-http"),
				crypto: require.resolve("crypto-browserify"),
				zlib: require.resolve("browserify-zlib"),
				assert: require.resolve("assert/"),
				async_hooks: false,
				net: false,
				fs: false,
			},
		},

		module: {
			rules: [
				{
					test: /\.(js|jsx)$/,
					exclude: /node_modules/,
					use: "babel-loader",
				},
				{
					test: /\.css$/i,
					use: ["style-loader", "css-loader"],
				},
			],
		},
	};
};
