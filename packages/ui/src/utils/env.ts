import { z } from "zod";

const envSchema = z.object({
	VITE_API_URL: z.string().default("localhost:3000"),
	VITE_HOCUSPOCUS_URL: z.string().default("localhost:3001"),
	VITE_API_URL_SECURE: z.enum(["true", "false"]).default("false"),
	VITE_HOCUSPOCUS_URL_SECURE: z.enum(["true", "false"]).default("false"),
});

const env = envSchema.parse(import.meta.env);

interface EndpointConfig {
	url: string;
	secure: boolean;
}

const createEndpointConfig = (url: string, secure: string): EndpointConfig => ({
	url,
	secure: secure === "true",
});

const apiConfig = createEndpointConfig(env.VITE_API_URL, env.VITE_API_URL_SECURE);
const hocuspocusConfig = createEndpointConfig(env.VITE_HOCUSPOCUS_URL, env.VITE_HOCUSPOCUS_URL_SECURE);

const getProtocol = (secure: boolean, isWs: boolean): string =>
	secure ? (isWs ? "wss" : "https") : isWs ? "ws" : "http";

const createEndpoint = (config: EndpointConfig, isWs: boolean): string =>
	`${getProtocol(config.secure, isWs)}://${config.url}`;

export default {
	api: {
		ws: createEndpoint(apiConfig, true) + "/trpc",
		http: createEndpoint(apiConfig, false) + "/trpc",
	},
	hocuspocus: {
		ws: createEndpoint(hocuspocusConfig, true),
	},
};
