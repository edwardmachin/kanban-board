import env from "@api/utils/env";
import { verifyToken } from "@api/utils/jwt";
import logger from "@api/utils/logger";
import { prisma } from "@api/utils/prisma";
import { Database } from "@hocuspocus/extension-database";
import { Hocuspocus } from "@hocuspocus/server";
import { encodeStateAsUpdate } from "yjs";

const hocuspocusListen = () => {
	const port = env.hocuspocus.port;
	const hocuspocusServer = new Hocuspocus({
		port,
		extensions: [
			new Database({
				fetch: async ({ documentName }) => {
					//TODO: only grab docs they have access too
					// const {username, id : userID} = context.user;
					const document = await prisma.documents.findUnique({
						where: { name: documentName },
					});
					if (!document) return null;
					return Buffer.from(document.data);
				},
				store: async ({ documentName, document }) => {
					//TODO: only store docs they have access too
					// const {username, id : userID} = context.user;
					const encoded = encodeStateAsUpdate(document);
					const buffer = Buffer.from(encoded);
					await prisma.documents.upsert({
						where: { name: documentName },
						update: {
							data: buffer,
						},
						create: {
							data: buffer,
							name: documentName,
						},
					});
				},
			}),
		],
		async onAuthenticate({ token, documentName, socketId }) {
			if (!token) {
				throw new Error("Hocuspocus authentication failed: No token provided");
			}
			try {
				const decoded = verifyToken(token);
				const user = await prisma.user.findUnique({
					where: { id: decoded.userId },
					select: { username: true, id: true },
				});
				if (!user) {
					throw new Error("Hocuspocus authentication failed: User not found");
				}
				logger.info({ socketId, user: user.username, documentName }, "Hocuspocus: Successfully authenticated user");
				return { user };
			} catch (error) {
				logger.error({ err: error }, "Hocuspocus: Authentication error");
				throw new Error("Hocuspocus authentication failed: Invalid token");
			}
		},
		async onConnect({ connection, documentName, socketId }) {
			connection.requiresAuthentication = true;
			logger.info({ socketId, documentName }, "Hocuspocus: Connected authenticated user");
		},
	});
	hocuspocusServer.listen();
	logger.info(`Hocuspocus server listening on ws://0.0.0.0:${port}`);
	return () => {
		hocuspocusServer.closeConnections();
	};
};

export { hocuspocusListen };
