import env from "@api/utils/env";
import fs from "fs";
import path from "path";
import pino from "pino";
import pinoRotatingFileStream from "pino-rotating-file-stream";

const streams = [];

if (env.logger.filePath) {
	const now = new Date();
	const timestamp = [
		now.getFullYear(),
		(now.getMonth() + 1).toString().padStart(2, "0"),
		now.getDate().toString().padStart(2, "0"),
		now.getHours().toString().padStart(2, "0"),
		now.getMinutes().toString().padStart(2, "0"),
		now.getSeconds().toString().padStart(2, "0"),
	].join("-");

	const parsedPath = path.parse(env.logger.filePath);
	const dir = parsedPath.dir;

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const rotatingStream = pinoRotatingFileStream({
		filename: `${parsedPath.name}-${timestamp}${parsedPath.ext}`,
		path: dir,
		size: "10M",
		interval: "1d",
		compress: "gzip",
	});

	streams.push({ stream: rotatingStream });
}

streams.push({
	stream: pino.transport({
		target: "pino-pretty",
		options: {
			colorize: true,
		},
	}),
});

const logger = pino(
	{
		level: env.logger.level || "info",
		formatters: {
			level: (label) => {
				return { level: label.toUpperCase() };
			},
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	pino.multistream(streams),
);

process.on("SIGINT", () => {
	logger.info("Application shutting down");
	process.exit(0);
});

export default logger;
