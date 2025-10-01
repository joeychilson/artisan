import { env } from '$env/dynamic/private';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { fal } from '@fal-ai/client';

if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');

export const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY
});

if (!env.FAL_API_KEY) throw new Error('FAL_API_KEY is not set');

fal.config({
	credentials: env.FAL_API_KEY
});

export { fal };
