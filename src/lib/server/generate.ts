import { valibotSchema } from '@ai-sdk/valibot';
import { convertToModelMessages, generateObject } from 'ai';
import * as v from 'valibot';

import type { Message } from '$lib/messages';
import { openrouter } from '$lib/server/ai';
import { GENERATE_PROJECT_TITLE_PROMPT } from '$lib/server/prompts';

export async function generateProjectTitle({
	message
}: {
	message: Message;
}): Promise<{ title: string }> {
	try {
		const result = await generateObject({
			model: openrouter.chat('google/gemini-2.5-flash-lite-preview-09-2025'),
			output: 'object',
			schema: valibotSchema(
				v.object({
					title: v.string()
				})
			),
			system: GENERATE_PROJECT_TITLE_PROMPT,
			messages: convertToModelMessages([message])
		});
		return {
			title: result.object.title
		};
	} catch (error) {
		console.error('Failed to generate project title', { cause: error });
		return { title: 'Untitled Project' };
	}
}
