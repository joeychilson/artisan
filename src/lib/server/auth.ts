import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	baseURL: publicEnv.PUBLIC_BASE_URL,
	secret: privateEnv.AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg',
		usePlural: true
	}),
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	},
	socialProviders: {
		google: {
			clientId: privateEnv.GOOGLE_CLIENT_ID as string,
			clientSecret: privateEnv.GOOGLE_CLIENT_SECRET as string
		}
	},
	advanced: {
		database: { generateId: false }
	},
	user: {
		deleteUser: { enabled: true }
	}
});
