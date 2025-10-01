import { env } from '$env/dynamic/public';

import { createAuthClient } from 'better-auth/svelte';

export const client = createAuthClient({
	baseURL: env.PUBLIC_BASE_URL
});

export const { signIn, signOut, deleteUser } = client;
