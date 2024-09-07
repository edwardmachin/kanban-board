import type { RedisSubscriptionData, RedisSubscriptionKey } from "@api/redis/types";
import env from "@api/utils/env";
import logger from "@api/utils/logger";
import Redis from "ioredis";

const host = env.redis.host;
const port = env.redis.port;

const clients = {
	publisher: new Redis({ host, port }),
	subscriber: new Redis({ host, port }),
};

for (const [type, client] of Object.entries(clients)) {
	client.on("error", (err) => logger.error({ err }, `Redis client ${type} error`));
	client.on("connect", () => logger.info(`Redis client ${type} connected to Redis server`));
	client.on("reconnecting", () => logger.warn(`Redis client ${type} reconnecting to Redis server...`));
}

const subscriptions: Map<RedisSubscriptionKey, Set<(data: RedisSubscriptionData<any>) => void>> = new Map();

const messageHandler = (channel: string, message: string) => {
	const callbacks = subscriptions.get(channel as RedisSubscriptionKey);
	if (callbacks) {
		const data = JSON.parse(message);
		callbacks.forEach((callback) => callback(data));
	}
};

clients.subscriber.on("message", messageHandler);

const subscribe = <T extends RedisSubscriptionKey>(key: T, callback: (data: RedisSubscriptionData<T>) => void) => {
	if (!subscriptions.has(key)) {
		subscriptions.set(key, new Set());
		clients.subscriber.subscribe(key).catch((err) => logger.error({ err, key }, `Failed to subscribe to ${key}`));
	}
	subscriptions.get(key)!.add(callback as any);

	return () => {
		const callbacks = subscriptions.get(key);
		if (callbacks) {
			callbacks.delete(callback as any);
			if (callbacks.size === 0) {
				subscriptions.delete(key);
				clients.subscriber
					.unsubscribe(key)
					.catch((err) => logger.error({ err, key }, `Failed to unsubscribe from ${key}`));
			}
		}
	};
};

const publish = <T extends RedisSubscriptionKey>(key: T, data: RedisSubscriptionData<T>) => {
	const message = JSON.stringify(data);
	return clients.publisher.publish(key, message);
};

export { publish, subscribe };
