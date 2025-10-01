import type { RequestHandler } from './$types';

import { json } from '@sveltejs/kit';
import {
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	smoothStream,
	stepCountIs,
	streamText
} from 'ai';
import { eq, sql } from 'drizzle-orm';

import type { Message } from '$lib/messages';
import { openrouter } from '$lib/server/ai';
import { db } from '$lib/server/db';
import { generateProjectTitle } from '$lib/server/generate';
import { SYSTEM_PROMPT } from '$lib/server/prompts';
import { projects, messages as messagesTable, mediaFiles } from '$lib/server/schema';
import { getStreamContext } from '$lib/server/stream';
import { tools, type ToolOutput } from '$lib/server/tools';
import { addFileListToMessage } from '$lib/utils/messages';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || !locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id;

	const { id, messages }: { id: string; messages: Message[] } = await request.json();
	if (!id) {
		return json({ error: 'Project ID is required' }, { status: 400 });
	}

	if (!messages || !Array.isArray(messages)) {
		return json({ error: 'Messages are required and must be an array' }, { status: 400 });
	}

	let project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

	if (!project.length) {
		const newProject = await db
			.insert(projects)
			.values({
				id: id,
				userId: userId
			})
			.returning();
		project = newProject;
	} else if (project[0].userId !== userId) {
		return json({ error: 'Project access denied' }, { status: 403 });
	}

	await db.transaction(async (tx) => {
		const messageValues = messages.map((message) => ({
			id: message.id,
			projectId: id,
			role: message.role,
			parts: message.parts,
			metadata: message.metadata
		}));

		if (messageValues.length > 0) {
			await tx
				.insert(messagesTable)
				.values(messageValues)
				.onConflictDoUpdate({
					target: messagesTable.id,
					set: {
						parts: sql`excluded.parts`,
						metadata: sql`excluded.metadata`
					}
				});
		}
	});

	const userMessage = messages.findLast((message) => message.role === 'user');
	const hasValidText = userMessage?.parts?.some(
		(part) => part.type === 'text' && part.text && part.text.trim().length > 0
	);
	const hasValidFile = userMessage?.parts?.some((part) => part.type === 'file');

	if (!userMessage || (!hasValidText && !hasValidFile)) {
		return json({ error: 'A valid user message with text or files is required.' }, { status: 400 });
	}

	const processedMessages = messages.map((message) => {
		if (message.role === 'user') {
			return addFileListToMessage(message);
		}
		return message;
	});

	const stream = createUIMessageStream<Message>({
		originalMessages: messages,
		generateId: () => crypto.randomUUID(),
		execute: async ({ writer }) => {
			await db.update(projects).set({ status: 'streaming' }).where(eq(projects.id, id));

			if (project[0]?.title === 'Untitled Project') {
				try {
					const { title } = await generateProjectTitle({ message: userMessage });

					await db.update(projects).set({ title }).where(eq(projects.id, id));
					project[0].title = title;

					writer.write({
						type: 'data-project-metadata',
						data: { id, title },
						transient: true
					});
				} catch (error) {
					console.error('Failed to generate project title', error, { projectId: id, userId });
				}
			}

			const result = streamText({
				model: openrouter.chat('x-ai/grok-4-fast'),
				system: SYSTEM_PROMPT,
				messages: convertToModelMessages(processedMessages),
				tools,
				stopWhen: stepCountIs(20),
				experimental_transform: smoothStream({ chunking: 'word' }),
				experimental_context: { userId, projectId: id },
				async onStepFinish({ toolResults }) {
					for (const result of toolResults) {
						if (!result.output) continue;

						const output = result.output as ToolOutput;

						switch (output.type) {
							case 'media': {
								const mediaValues = output.files.map((file) => ({
									userId: userId,
									projectId: id,
									type: file.mediaType,
									contentType: file.contentType,
									url: file.url
								}));

								if (mediaValues.length > 0) {
									await db.insert(mediaFiles).values(mediaValues);
								}
								break;
							}
						}
					}
				}
			});

			result.consumeStream();

			writer.merge(result.toUIMessageStream());
		},
		onFinish: async ({ responseMessage }) => {
			await db.transaction(async (tx) => {
				await tx
					.insert(messagesTable)
					.values({
						id: responseMessage.id,
						projectId: id,
						role: responseMessage.role,
						parts: responseMessage.parts,
						metadata: responseMessage.metadata
					})
					.onConflictDoUpdate({
						target: messagesTable.id,
						set: {
							parts: sql`excluded.parts`,
							metadata: sql`excluded.metadata`,
							updatedAt: new Date()
						}
					});

				await tx
					.update(projects)
					.set({ status: 'ready', lastMessageAt: new Date() })
					.where(eq(projects.id, id));
			});
		},
		onError: (error) => {
			console.error('Generation error:', error, { projectId: id, userId });
			db.update(projects)
				.set({ status: 'error', streamId: null, updatedAt: new Date() })
				.where(eq(projects.id, id))
				.catch((updateError) => {
					console.error('Failed to mark project as errored after generation failure', updateError, {
						projectId: id,
						userId
					});
				});
			return 'An unexpected error occurred, please try again.';
		}
	});

	return createUIMessageStreamResponse({
		stream,
		consumeSseStream: async ({ stream }) => {
			const streamContext = await getStreamContext();
			const streamId = crypto.randomUUID();

			await streamContext.resumableStream(streamId, () => stream);
			await db.update(projects).set({ streamId }).where(eq(projects.id, id));
		}
	});
};
