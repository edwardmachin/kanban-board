import { createContext } from "@api/trpc";
import { appRouter } from "@api/trpc/routes";
import env from "@api/utils/env";
import logger from "@api/utils/logger";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import { WebSocketServer } from "ws";

const setupExpress = () => {
	const app = express();
	const server = http.createServer(app);
	const wss = new WebSocketServer({ server });

	app.use(
		cors({
			origin: env.api.uiEndpoint === "" ? "*" : env.api.uiEndpoint,
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	);

	app.use(compression());

	app.use(helmet());

	app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext }));

	const wssHandler = applyWSSHandler({
		wss,
		router: appRouter,
		createContext,
		keepAlive: { enabled: true, pingMs: 30000, pongWaitMs: 5000 },
	});

	return { app, server, wss, wssHandler };
};

const listenExpress = () => {
	const port = env.api.port;
	const { server, wssHandler } = setupExpress();

	server.listen(port);
	logger.info(`HTTP listening on http://0.0.0.0:${port}`);
	logger.info(`WS listening on ws://0.0.0.0:${port}`);

	return () => {
		wssHandler.broadcastReconnectNotification();
		server.close();
	};
};

export { listenExpress };
