import { getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';

import * as v from 'valibot';
import { eq, desc, and, count, sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { projects, messages, mediaFiles } from '$lib/server/schema';

export const getProject = query(v.optional(v.string()), async (projectId) => {
	const { locals } = getRequestEvent();

	if (!locals.session || !locals.user) {
		return error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	if (!projectId) {
		return error(400, 'A project ID is required to load the project.');
	}

	const project = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
		.limit(1);

	if (!project.length) {
		return error(404, 'Project not found.');
	}

	const projectMessages = await db
		.select()
		.from(messages)
		.where(eq(messages.projectId, projectId))
		.orderBy(messages.createdAt);

	return {
		id: project[0].id,
		title: project[0].title,
		messages: projectMessages,
		resume: project[0].streamId ? true : false
	};
});

export const getUserProjects = query(
	v.optional(
		v.object({
			search: v.optional(v.string()),
			status: v.optional(v.string()),
			sort: v.optional(
				v.union([v.literal('newest'), v.literal('oldest'), v.literal('title'), v.literal('status')])
			)
		})
	),
	async (filters) => {
		const { locals } = getRequestEvent();

		if (!locals.session || !locals.user) {
			return error(401, 'Unauthorized');
		}

		const userId = locals.user.id;
		const { search, status: statusFilter, sort = 'newest' } = filters || {};

		const projectsWithData = await db
			.select({
				id: projects.id,
				title: projects.title,
				status: projects.status,
				lastMessageAt: projects.lastMessageAt,
				createdAt: projects.createdAt,
				updatedAt: projects.updatedAt,
				mediaCount: count(mediaFiles.id),
				messageCount: sql<number>`(
				SELECT COUNT(*) FROM ${messages}
				WHERE ${messages.projectId} = ${projects.id}
			)`,
				latestImage: sql<string | null>`(
				SELECT url FROM ${mediaFiles}
				WHERE ${mediaFiles.projectId} = ${projects.id}
				AND ${mediaFiles.type} = 'image'
				ORDER BY ${mediaFiles.createdAt} DESC
				LIMIT 1
			)`
			})
			.from(projects)
			.leftJoin(mediaFiles, eq(projects.id, mediaFiles.projectId))
			.where(
				and(
					eq(projects.userId, userId),
					search ? sql`${projects.title} ILIKE ${`%${search}%`}` : undefined,
					statusFilter && statusFilter !== 'all'
						? eq(projects.status, statusFilter as 'submitted' | 'streaming' | 'ready' | 'error')
						: undefined
				)
			)
			.groupBy(
				projects.id,
				projects.title,
				projects.status,
				projects.lastMessageAt,
				projects.createdAt,
				projects.updatedAt
			)
			.orderBy(
				sort === 'newest'
					? desc(projects.lastMessageAt)
					: sort === 'oldest'
						? projects.lastMessageAt
						: sort === 'title'
							? projects.title
							: sort === 'status'
								? projects.status
								: desc(projects.lastMessageAt)
			);

		return projectsWithData.map((project) => ({
			id: project.id,
			title: project.title || 'Untitled Project',
			status: project.status,
			lastMessageAt: project.lastMessageAt,
			mediaCount: project.mediaCount,
			messageCount: project.messageCount,
			latestImage: project.latestImage,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt
		}));
	}
);

export const getRecentProjects = query(async () => {
	const { locals } = getRequestEvent();

	if (!locals.session || !locals.user) {
		return [];
	}

	const userId = locals.user.id;

	const recentProjects = await db
		.select({
			id: projects.id,
			title: projects.title,
			lastMessageAt: projects.lastMessageAt
		})
		.from(projects)
		.where(eq(projects.userId, userId))
		.orderBy(desc(projects.lastMessageAt))
		.limit(5);

	return recentProjects.map((project) => ({
		id: project.id,
		title: project.title || 'Untitled',
		lastMessageAt: project.lastMessageAt
	}));
});
