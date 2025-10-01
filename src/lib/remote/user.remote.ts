import { query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';

export const getUserSessions = query(async () => {
	const { locals, request } = getRequestEvent();

	if (!locals.session || !locals.user) {
		return error(401, 'Unauthorized');
	}

	const sessions = await auth.api.listSessions({ headers: request.headers });

	return sessions;
});
