import type { ContextType, CreateContextOptions, ProtectedContextType } from "@api/trpc/types";
import { Messages } from "@api/utils/constants";
import { verifyToken } from "@api/utils/jwt";
import logger from "@api/utils/logger";
import { prisma } from "@api/utils/prisma";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { IncomingMessage } from "http";

const isWebSocketRequest = (req: any): req is IncomingMessage & { url: string } => {
	return (
		"url" in req &&
		req.url !== undefined &&
		req.headers &&
		req.headers.upgrade &&
		req.headers.upgrade.toLowerCase() === "websocket"
	);
};

const createContext = (opts: CreateContextOptions): ContextType => {
	const { req, res } = opts;
	const getToken = (): string | null => {
		if (isWebSocketRequest(req)) {
			const url = new URL(req.url, `ws://${req.headers.host}`);
			return url.searchParams.get("token");
		} else {
			const authHeader = req.headers.authorization;
			return authHeader ? authHeader.split(" ")[1] : null;
		}
	};
	const token = getToken();
	return {
		req,
		res,
		token,
		user: null,
	};
};

const createExpressContext = (opts: CreateExpressContextOptions): ContextType => createContext(opts);
const createWSContext = (opts: CreateWSSContextFnOptions): ContextType => createContext(opts);

const t = initTRPC.context<ContextType>().create();

const router = t.router;
const middleware = t.middleware;

const loggerMiddleware = middleware(async ({ path, type, next }) => {
	const start = Date.now();
	logger.info({
		type: "request",
		path,
		procedureType: type,
	});
	try {
		const result = await next();
		const durationMs = Date.now() - start;
		logger.info({
			type: "response",
			path,
			procedureType: type,
			durationMs,
			status: "success",
		});
		return result;
	} catch (error) {
		const durationMs = Date.now() - start;
		logger.error({
			type: "response",
			path,
			procedureType: type,
			durationMs,
			status: "error",
			error: error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Unknown error",
		});

		throw error;
	}
});

const publicProcedure = t.procedure.use(loggerMiddleware);

const protectedProcedure: typeof publicProcedure = publicProcedure.use(async (opts) => {
	const { ctx } = opts;
	if (!ctx.token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Protected Middleware Rejection" });
	const { token } = ctx;
	try {
		const tokenData = verifyToken(token);
		const user = await prisma.user.findUnique({
			where: { id: tokenData.userId },
			select: { id: true, createdAt: true, updatedAt: true, username: true },
		});
		if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: Messages.UNAUTHORIZED });
		return opts.next({
			ctx: {
				...ctx,
				user,
			} as ProtectedContextType,
		});
	} catch {
		throw new TRPCError({ code: "UNAUTHORIZED", message: Messages.UNAUTHORIZED });
	}
});

export {
	createContext,
	createExpressContext as createExpressMiddleware,
	createWSContext,
	middleware,
	protectedProcedure,
	publicProcedure,
	router,
};
