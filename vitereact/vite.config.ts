import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import cofounderVitePlugin from "./src/_cofounder/vite-plugin/index";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		// webcontainers stuff
		{
			name: "isolation",
			configureServer(server) {
				server.middlewares.use((_req, res, next) => {
					res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
					res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
					next();
				});
			},
		},
		// pre transform ; to replace/inject <GenUi*> to allow editing ui - COMMENTED OUT
		/*
		{
			name: "cofounderVitePluginPre",
			async transform(code, id) {
				return await cofounderVitePlugin.pre({
					code,
					path: id,
				});
			},
			enforce: "pre", // ensure this plugin runs before other transformations
		},
		*/

		react(),
	],
	server: {
		host: true,
		port: 5173,
		allowedHosts: [
			'prog.launchpulse.ai',
			'.launchpulse.ai',
			'sandy-ecuador-compensation-amplifier.trycloudflare.com',
			'.trycloudflare.com',
			'localhost',
			'127.0.0.1',
			'0.0.0.0'
		],
		cors: {
			origin: ['*', 'https://prog.launchpulse.ai', 'http://prog.launchpulse.ai'],
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
			credentials: true
		},
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
		}
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		outDir: "public",
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom', 'react-router-dom']
				}
			}
		}
	},
	optimizeDeps: {
		include: ['react', 'react-dom', 'react-router-dom']
	},
});
