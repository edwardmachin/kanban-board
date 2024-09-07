import { listenExpress } from "@api/express";
import { hocuspocusListen } from "@api/hocuspocus";

const startServers = () => {
	const expressCleanup = listenExpress();
	const hocuspocusCleanup = hocuspocusListen();

	process.on("SIGTERM", () => {
		expressCleanup();
		hocuspocusCleanup();
	});
};

export { startServers };
