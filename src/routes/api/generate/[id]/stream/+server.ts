import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { and, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { getStreamContext } from '$lib/server/stream';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || !locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id;
	const id = params.id;

	if (!id) {
		return json({ error: 'Invalid project ID' }, { status: 400 });
	}

	const project = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, id), eq(projects.userId, userId)))
		.execute();

	if (project.length === 0) {
		return json({ error: 'Project not found' }, { status: 404 });
	}

	if (!project[0].streamId) {
		return json({ error: 'Stream not available' }, { status: 400 });
	}

	let streamContext;
	try {
		streamContext = await getStreamContext();
	} catch (error) {
		console.error('Failed to get stream context', error, { id, userId });
		return json({ error: 'Failed to establish stream connection' }, { status: 500 });
	}

	try {
		const emptyDataStream = createUIMessageStream({
			execute: () => {}
		});

		const stream = await streamContext.resumableStream(project[0].streamId, () =>
			emptyDataStream.pipeThrough(new JsonToSseTransformStream())
		);

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'X-Accel-Buffering': 'no'
			}
		});
	} catch (error) {
		console.error('Failed to create resumable stream', error, {
			id,
			streamId: project[0].streamId
		});
		if (error instanceof Error && error.message.includes('ETIMEDOUT')) {
			return json({ error: 'Stream temporarily unavailable, please retry' }, { status: 503 });
		}
		return json({ error: 'Failed to create stream' }, { status: 500 });
	}
};
