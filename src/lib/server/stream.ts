import { env } from '$env/dynamic/private';

import { RedisClient } from 'bun';
import { createResumableStreamContext, type Publisher, type Subscriber } from 'resumable-stream';

const redisUrl = env.REDIS_URL;

if (!redisUrl) {
	throw new Error('REDIS_URL environment variable is not set');
}

let redisClientPromise: Promise<RedisClient> | null = null;
let isConnecting = false;

async function getOrCreateRedisClient(): Promise<RedisClient> {
	if (redisClientPromise && !isConnecting) {
		return redisClientPromise;
	}

	if (isConnecting) {
		while (isConnecting) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		if (redisClientPromise) return redisClientPromise;
	}

	isConnecting = true;
	const client = new RedisClient(redisUrl);

	client.onclose = (error) => {
		if (error) {
			console.error('Redis client disconnected', error);
		}
		redisClientPromise = null;
		isConnecting = false;
	};

	redisClientPromise = client
		.connect()
		.then(() => {
			isConnecting = false;
			return client;
		})
		.catch((error) => {
			redisClientPromise = null;
			isConnecting = false;
			throw error;
		});

	return redisClientPromise;
}

function createSubscriberAdapter(client: RedisClient): Subscriber {
	return {
		connect: () => client.connect(),
		subscribe: async (channel, callback) => {
			return client.subscribe(channel, callback);
		},
		unsubscribe: (channel) => client.unsubscribe(channel)
	};
}

function createPublisherAdapter(client: RedisClient): Publisher {
	return {
		connect: () => client.connect(),
		publish: (channel, message) => client.publish(channel, message),
		set: (key, value, options) => {
			return options?.EX !== undefined
				? client.set(key, value, 'EX', options.EX)
				: client.set(key, value);
		},
		get: (key) => client.get(key),
		incr: (key) => client.incr(key)
	};
}

export const getStreamContext = async () => {
	const publisherClient = await getOrCreateRedisClient();
	const subscriberClient = await publisherClient.duplicate();

	return createResumableStreamContext({
		waitUntil: async (promise) => {
			await promise;
		},
		publisher: createPublisherAdapter(publisherClient),
		subscriber: createSubscriberAdapter(subscriberClient)
	});
};
