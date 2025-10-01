import * as v from 'valibot';
import { getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';

import { eq, desc, and } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { mediaFiles } from '$lib/server/schema';

export const getAllUserMedia = query(
	v.optional(
		v.union([v.literal('image'), v.literal('video'), v.literal('audio'), v.literal('all')])
	),
	async (typeFilter) => {
		const { locals } = getRequestEvent();

		if (!locals.session || !locals.user) {
			return error(401, 'Unauthorized');
		}

		const userId = locals.user.id;

		const whereConditions = [eq(mediaFiles.userId, userId)];

		if (typeFilter && typeFilter !== 'all') {
			whereConditions.push(eq(mediaFiles.type, typeFilter));
		}

		const userMedia = await db
			.select({
				id: mediaFiles.id,
				projectId: mediaFiles.projectId,
				type: mediaFiles.type,
				contentType: mediaFiles.contentType,
				url: mediaFiles.url,
				createdAt: mediaFiles.createdAt
			})
			.from(mediaFiles)
			.where(and(...whereConditions))
			.orderBy(desc(mediaFiles.createdAt));

		return userMedia;
	}
);
