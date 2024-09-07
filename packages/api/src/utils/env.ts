import dotenv from "dotenv";
import { z } from "zod";

const envSchema = z.object({
	API_WS_HTTP_PORT: z.string().regex(/^\d+$/).transform(Number).default("3000"),
	API_HOCUSPOCUS_PORT: z.string().regex(/^\d+$/).transform(Number).default("3001"),
	API_REDIS_HOST: z.string().default("localhost"),
	API_REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default("6379"),
	API_JWT_SECRET: z.string().min(1).default("supersecret"),
	API_JWT_EXPIRY: z.string().default("12h"),
	API_LOG_FILE_PATH: z.string().default("logs/api.log"),
	API_LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
	API_UI_ENDPOINT: z.string().default(""),
});

dotenv.config();
const env = envSchema.parse(process.env);

const config = {
	api: {
		port: env.API_WS_HTTP_PORT,
		uiEndpoint: env.API_UI_ENDPOINT,
	},
	hocuspocus: {
		port: env.API_HOCUSPOCUS_PORT,
	},
	redis: {
		host: env.API_REDIS_HOST,
		port: env.API_REDIS_PORT,
	},
	jwt: {
		secret: env.API_JWT_SECRET,
		expiry: env.API_JWT_EXPIRY,
	},
	logger: {
		filePath: env.API_LOG_FILE_PATH,
		level: env.API_LOG_LEVEL,
	},
} as const;

export default config;
export type EnvConfig = typeof config;
