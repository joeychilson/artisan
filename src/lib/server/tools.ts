import { valibotSchema } from '@ai-sdk/valibot';
import { tool, type InferUITools } from 'ai';
import * as v from 'valibot';

import { fal } from '$lib/server/ai';
import { generateMedia } from '$lib/server/media';

export interface MediaFile {
	url: string;
	contentType: string;
	mediaType: 'image' | 'video' | 'audio';
	size?: number;
	duration?: number;
	dimensions?: { width: number; height: number };
}

export interface MediaOutput {
	type: 'media';
	files: MediaFile[];
}

export interface TextOutput {
	type: 'text';
	content: string;
	format: 'plain' | 'markdown' | 'html';
}

export interface DataOutput {
	type: 'data';
	payload: unknown;
	format: 'json' | 'csv' | 'xml' | 'binary';
}

export type ToolOutput = MediaOutput | TextOutput | DataOutput;

type ToolContext = {
	userId: string;
	projectId: string;
};

function getToolContext(context: unknown): ToolContext {
	const ctx = context as ToolContext;
	if (!ctx?.userId || !ctx?.projectId) {
		throw new Error('Invalid tool execution context: missing userId or projectId');
	}
	return ctx;
}

function handleToolError(toolName: string, error: unknown): Error {
	console.error(`${toolName} tool execution error:`, error);

	if (!(error instanceof Error)) {
		return new Error(
			`${toolName} failed: Unknown error occurred during execution. This could be due to service unavailability or an internal error.`
		);
	}

	const message = error.message.toLowerCase();

	if (message.includes('fetch') || message.includes('network')) {
		return new Error(
			`${toolName} failed: Network connectivity issues prevented the request from completing. This is likely a temporary issue.`
		);
	}

	if (message.includes('storage')) {
		return new Error(
			`${toolName} failed: Generated content could not be saved to storage. The generation completed but file upload failed.`
		);
	}

	if (message.includes('timeout')) {
		return new Error(
			`${toolName} failed: Request timed out, likely due to complex input or high server load. Suggest trying simpler parameters or trying again later.`
		);
	}

	if (message.includes('invalid') || message.includes('rejected')) {
		return new Error(
			`${toolName} failed: Input was rejected by content safety filters. The user should modify their input to remove potentially problematic content.`
		);
	}

	if (message.includes('rate limit')) {
		return new Error(
			`${toolName} failed: Rate limit exceeded. The user needs to wait before making another request.`
		);
	}

	return new Error(
		`${toolName} failed: ${error.message}. This could be due to service unavailability or an internal error.`
	);
}

const textToImageSchema = v.object({
	prompt: v.pipe(v.string(), v.description('The text prompt to generate images from.')),
	aspectRatio: v.pipe(
		v.picklist(['1:1', '4:3', '9:16', '16:9', '3:4']),
		v.description('The aspect ratio of the generated images.')
	),
	resolution: v.pipe(
		v.picklist(['1K', '2K']),
		v.description('The resolution of the generated images.')
	),
	numberOfImages: v.pipe(
		v.number(),
		v.minValue(1),
		v.maxValue(4),
		v.description('Number of separate model generations to be run with the prompt.')
	)
});

export type TextToImageInput = v.InferOutput<typeof textToImageSchema>;

const textToImageTool = tool({
	description: `
		Generate completely new images from text prompts only. Creates original imagery from scratch without visual references.

		WHEN TO USE:
		- Creating new concept art, illustrations, portraits, landscapes, logos
		- No existing visual references available
		- Need multiple variations (use numberOfImages parameter for batch generation)

		WHEN NOT TO USE:
		- Modifying existing images → use image-to-image instead
		- Character appears in multiple scenes → generate ONCE, reuse URL across scenes
		- Creating variations of existing design → use image-to-image with base URL

		EFFICIENCY TIPS:
		- For conversations: Generate 1 portrait per unique speaker, NOT per dialogue line
		- For character consistency: Generate portrait once, reuse URL across all animations
		- For variations: Use numberOfImages for batch generation in single call
		- Rich prompts get better results: include lighting, atmosphere, art style, camera angle
		`,
	inputSchema: valibotSchema(textToImageSchema),
	execute: async (
		{ prompt, aspectRatio, resolution, numberOfImages }: TextToImageInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'imagen4',
				input: {
					prompt,
					aspect_ratio: aspectRatio,
					resolution: resolution,
					num_images: numberOfImages
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('text-to-image', error);
		}
	}
});

const imageToImageSchema = v.object({
	prompt: v.pipe(v.string(), v.description('The prompt for the image generation')),
	imageUrls: v.pipe(
		v.array(v.string()),
		v.description('The URLs of the source images used by the model')
	),
	aspectRatio: v.pipe(
		v.picklist(['1:1', '4:3', '9:16', '16:9', '3:4']),
		v.description('The aspect ratio of the generated images.')
	),
	numberOfImages: v.pipe(
		v.number(),
		v.minValue(1),
		v.maxValue(4),
		v.description('Number of separate model generations to be run with the prompt.')
	)
});

export type ImageToImageInput = v.InferOutput<typeof imageToImageSchema>;

const imageToImageTool = tool({
	description: `
		Transform, modify, enhance, or create variations from existing images.

		WHEN TO USE:
		- Modifying existing images (add/remove elements, change colors/lighting/composition)
		- Combining multiple images (compositing, collaging, blending)
		- Style transfers and artistic transformations
		- Creating variations of existing designs (logos, illustrations, concepts)
		- Using images as style/mood references

		WHEN NOT TO USE:
		- Creating completely new images without references → use text-to-image
		- Simple background removal → use remove-background (faster, specialized)

		EFFICIENCY TIPS:
		- Reuse base images for multiple variations (generate logo once, create color variants by reusing base URL)
		- Clearly specify what to preserve vs what to change in prompt
		- When using multiple image URLs, explain how they should interact
		`,
	inputSchema: valibotSchema(imageToImageSchema),
	execute: async (
		{ prompt, imageUrls, numberOfImages }: ImageToImageInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'geminiFlashEdit',
				input: {
					prompt,
					image_urls: imageUrls,
					num_images: numberOfImages
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('image-to-image', error);
		}
	}
});

const textToSoundEffectSchema = v.object({
	text: v.pipe(v.string(), v.description('The text describing the sound effect to generate.')),
	durationSeconds: v.optional(
		v.pipe(
			v.number(),
			v.minValue(0.5),
			v.maxValue(22),
			v.description(
				'Duration in seconds (0.5-22). If omitted, optimal duration will be determined from prompt.'
			)
		)
	),
	promptInfluence: v.pipe(
		v.number(),
		v.minValue(0),
		v.maxValue(1),
		v.description(
			'How closely to follow the prompt (0-1). Higher values mean less variation. Default: 0.3'
		)
	)
});

export type TextToSoundEffectInput = v.InferOutput<typeof textToSoundEffectSchema>;

const textToSoundEffectTool = tool({
	description: `
		Generate sound effects from text descriptions. Create ambient sounds, impacts, transitions, foley, atmospheric audio.

		WHEN TO USE:
		- UI sounds, game effects, video sound design, atmospheric audio, transitions
		- Need specific sound characteristics (pitch, intensity, texture, decay)

		EFFICIENCY TIPS:
		- Fast, cheap operation - generate liberally
		- Be specific in description: "heavy wooden door closing in large hall" vs just "door close"
		- Lower promptInfluence (0.2-0.4) for more creative variety
		- Auto-determine duration when possible (omit durationSeconds parameter)
	`,
	inputSchema: valibotSchema(textToSoundEffectSchema),
	execute: async (
		{ text, durationSeconds, promptInfluence }: TextToSoundEffectInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'elevenlabsSoundEffects',
				input: {
					text,
					prompt_influence: promptInfluence,
					output_format: 'mp3_44100_128',
					...(durationSeconds !== undefined && { duration_seconds: durationSeconds })
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('text-to-sound-effect', error);
		}
	}
});

const textToVideoSchema = v.object({
	prompt: v.pipe(v.string(), v.description('The text describing the video to generate.')),
	duration: v.pipe(
		v.picklist(['5', '10']),
		v.description('Duration of the video in seconds (5 or 10).')
	),
	aspectRatio: v.pipe(
		v.picklist(['1:1', '9:16', '16:9']),
		v.description('The aspect ratio of the generated video.')
	),
	negativePrompt: v.optional(
		v.pipe(v.string(), v.description('What to avoid in the video generation.'))
	),
	cfgScale: v.pipe(
		v.number(),
		v.minValue(0),
		v.maxValue(1),
		v.description('How closely to follow the prompt (0-1). Higher values stick closer to prompt.')
	)
});

export type TextToVideoInput = v.InferOutput<typeof textToVideoSchema>;

const textToVideoTool = tool({
	description: `
		Generate videos from text descriptions. Creates dynamic video content with motion and visual storytelling.

		WHEN TO USE:
		- Creating video content from scratch with described motion and action
		- Dynamic scenes requiring camera movement and subject animation

		WHEN NOT TO USE:
		- Need audio → This generates SILENT video only. Generate video + audio IN PARALLEL, then use merge-audio-video
		- Animating existing images → use image-to-video (faster, better results)

		CRITICAL: NO AUDIO - This tool produces silent video. Always generate audio separately and merge.

		EFFICIENCY TIPS:
		- Most expensive operation - parallelize with other operations when possible
		- For videos with sound: PARALLEL generate video + audio, then merge
		- Describe motion explicitly: camera movement, subject actions, pacing, transitions
		- Use negative prompts to avoid unwanted artifacts
	`,
	inputSchema: valibotSchema(textToVideoSchema),
	execute: async (
		{ prompt, duration, aspectRatio, negativePrompt, cfgScale }: TextToVideoInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'klingVideoTextToVideo',
				input: {
					prompt,
					duration,
					aspect_ratio: aspectRatio,
					negative_prompt: negativePrompt || '',
					cfg_scale: cfgScale
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('text-to-video', error);
		}
	}
});

const imageToVideoSchema = v.object({
	prompt: v.pipe(
		v.string(),
		v.description('The description of how to animate or transform the image.')
	),
	imageUrl: v.pipe(v.string(), v.description('The URL of the source image to animate.')),
	duration: v.pipe(
		v.picklist(['5', '10']),
		v.description('Duration of the video in seconds (5 or 10).')
	),
	negativePrompt: v.optional(
		v.pipe(v.string(), v.description('What to avoid in the video generation.'))
	),
	cfgScale: v.pipe(
		v.number(),
		v.minValue(0),
		v.maxValue(1),
		v.description('How closely to follow the prompt (0-1). Higher values stick closer to prompt.')
	)
});

export type ImageToVideoInput = v.InferOutput<typeof imageToVideoSchema>;

const imageToVideoTool = tool({
	description: `
		Animate static images with motion and effects. Brings photos to life with described movements.

		WHEN TO USE:
		- Bringing static images to life with motion
		- Creating transitions and dynamic storytelling from static images

		WHEN NOT TO USE:
		- Need audio → This generates SILENT video only. Use merge-audio-video afterward

		CRITICAL: NO AUDIO - Generates silent video only. Generate video + audio IN PARALLEL, then merge.

		EFFICIENCY TIPS:
		- Expensive operation - parallelize with other operations when possible
		- Describe desired motion clearly: zoom, pan, rotation, character movement
		- Specify what should remain static vs what should move
		- Lower cfgScale (0.3-0.5) allows more creative interpretation
	`,
	inputSchema: valibotSchema(imageToVideoSchema),
	execute: async (
		{ prompt, imageUrl, duration, negativePrompt, cfgScale }: ImageToVideoInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'klingVideoImageToVideo',
				input: {
					prompt,
					image_url: imageUrl,
					duration,
					negative_prompt: negativePrompt || '',
					cfg_scale: cfgScale
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('image-to-video', error);
		}
	}
});

const mergeAudioVideoSchema = v.object({
	videoUrl: v.pipe(
		v.string(),
		v.description('The URL of the video file to use as the video track.')
	),
	audioUrl: v.pipe(
		v.string(),
		v.description('The URL of the audio file to use as the audio track.')
	),
	startOffset: v.pipe(
		v.number(),
		v.minValue(0),
		v.description('Offset in seconds for when the audio should start relative to the video.')
	)
});

export type MergeAudioVideoInput = v.InferOutput<typeof mergeAudioVideoSchema>;

const mergeAudioVideoTool = tool({
	description: `
		Merge a single audio file with a single video file. Combines separate video and audio tracks with timing control.

		WHEN TO USE:
		- Adding audio to silent videos (from text-to-video or image-to-video)
		- Replacing video soundtracks
		- Synchronizing narration or music with video content

		EFFICIENCY TIPS:
		- Fast, cheap operation - use liberally
		- Always generate video + audio IN PARALLEL, then merge (never sequential)
		- If lengths differ, output matches video duration (audio loops or cuts)
		- Use startOffset for precise audio synchronization
	`,
	inputSchema: valibotSchema(mergeAudioVideoSchema),
	execute: async (
		{ videoUrl, audioUrl, startOffset }: MergeAudioVideoInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'ffmpegMergeAudioVideo',
				input: {
					video_url: videoUrl,
					audio_url: audioUrl,
					start_offset: startOffset
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('merge-audio-video', error);
		}
	}
});

const removeBackgroundSchema = v.object({
	imageUrl: v.pipe(
		v.string(),
		v.description('The URL of the source image to remove background from.')
	),
	cropToBbox: v.pipe(
		v.boolean(),
		v.description('Whether to crop the result to the bounding box of the main subject.')
	)
});

export type RemoveBackgroundInput = v.InferOutput<typeof removeBackgroundSchema>;

const upscaleImageSchema = v.object({
	imageUrl: v.pipe(v.string(), v.description('The URL of the image to upscale.')),
	model: v.pipe(
		v.picklist([
			'Standard V2',
			'Recovery V2',
			'High Fidelity V2',
			'CGI',
			'Text Refine',
			'Redefine'
		]),
		v.description(
			'Model to use for upscaling. Standard V2: balanced quality. Recovery V2: recover details from compressed images. High Fidelity V2: maximum detail preservation. CGI: optimized for computer-generated imagery. Text Refine: sharpen text in images. Redefine: creative enhancement.'
		)
	),
	upscaleFactor: v.pipe(
		v.number(),
		v.minValue(1),
		v.maxValue(4),
		v.description('Factor to upscale the image by (e.g. 2.0 doubles width and height).')
	),
	subjectDetection: v.optional(
		v.pipe(
			v.picklist(['Foreground', 'Background', 'All']),
			v.description(
				'Subject detection mode. Foreground: enhance foreground subjects. Background: enhance background. All: enhance entire image.'
			)
		)
	),
	faceEnhancement: v.optional(
		v.pipe(v.boolean(), v.description('Whether to apply face enhancement to detected faces.'))
	),
	faceEnhancementStrength: v.optional(
		v.pipe(
			v.number(),
			v.minValue(0),
			v.maxValue(1),
			v.description(
				'Strength of face enhancement (0.0 = no enhancement, 1.0 = maximum). Only used if faceEnhancement is true.'
			)
		)
	),
	faceEnhancementCreativity: v.optional(
		v.pipe(
			v.number(),
			v.minValue(0),
			v.maxValue(1),
			v.description(
				'Creativity level for face enhancement (0.0 = no creativity, 1.0 = maximum). Only used if faceEnhancement is true.'
			)
		)
	),
	cropToFill: v.optional(
		v.pipe(v.boolean(), v.description('Whether to crop the result to fill the target dimensions.'))
	)
});

export type UpscaleImageInput = v.InferOutput<typeof upscaleImageSchema>;

const upscaleVideoSchema = v.object({
	videoUrl: v.pipe(v.string(), v.description('The URL of the video to upscale.')),
	upscaleFactor: v.pipe(
		v.number(),
		v.minValue(1),
		v.maxValue(4),
		v.description('Factor to upscale the video by (e.g. 2.0 doubles width and height).')
	),
	targetFps: v.optional(
		v.pipe(
			v.number(),
			v.minValue(1),
			v.maxValue(120),
			v.description(
				'Target FPS for frame interpolation. If set, frame interpolation will be enabled to smooth motion.'
			)
		)
	)
});

export type UpscaleVideoInput = v.InferOutput<typeof upscaleVideoSchema>;

const textToSpeechSchema = v.object({
	text: v.pipe(v.string(), v.description('The text to convert to speech.')),
	voice: v.pipe(
		v.picklist([
			'Aria',
			'Roger',
			'Sarah',
			'Laura',
			'Charlie',
			'George',
			'Callum',
			'River',
			'Liam',
			'Charlotte',
			'Alice',
			'Matilda',
			'Will',
			'Jessica',
			'Eric',
			'Chris',
			'Brain',
			'Daniel',
			'Lilly',
			'Bill',
			'Rachel'
		]),
		v.description('The voice to use for speech generation.')
	),
	stability: v.pipe(
		v.picklist([0.0, 0.5, 1.0]),
		v.description('Voice stability: 0.0 = Creative, 0.5 = Natural, 1.0 = Robust (consistent)')
	),
	similarityBoost: v.pipe(
		v.number(),
		v.minValue(0),
		v.maxValue(1),
		v.description('Similarity boost (0-1). Higher values make speech closer to the original voice.')
	),
	speed: v.pipe(
		v.number(),
		v.minValue(0.7),
		v.maxValue(1.2),
		v.description('Speech speed (0.7-1.2). Values below 1.0 slow down, above 1.0 speed up.')
	),
	style: v.optional(
		v.pipe(
			v.number(),
			v.minValue(0),
			v.maxValue(1),
			v.description('Style exaggeration (0-1). Higher values add more emotion and expression.')
		)
	),
	timestamps: v.pipe(
		v.boolean(),
		v.description('Whether to return timestamps for each word in the generated speech.')
	)
});

export type TextToSpeechInput = v.InferOutput<typeof textToSpeechSchema>;

const textToDialogueSchema = v.object({
	inputs: v.pipe(
		v.array(
			v.object({
				text: v.pipe(v.string(), v.description('The text for this speaker to say.')),
				voice: v.pipe(
					v.picklist([
						'Aria',
						'Roger',
						'Sarah',
						'Laura',
						'Charlie',
						'George',
						'Callum',
						'River',
						'Liam',
						'Charlotte',
						'Alice',
						'Matilda',
						'Will',
						'Jessica',
						'Eric',
						'Chris',
						'Brain',
						'Daniel',
						'Lilly',
						'Bill',
						'Rachel'
					]),
					v.description('The voice for this speaker.')
				)
			})
		),
		v.minLength(2),
		v.description('Array of dialogue turns with text and voice for each speaker.')
	),
	stability: v.pipe(
		v.number(),
		v.minValue(0),
		v.maxValue(1),
		v.description(
			'Voice stability (0-1). Lower values introduce emotional range, higher values are more monotonous.'
		)
	)
});

export type TextToDialogueInput = v.InferOutput<typeof textToDialogueSchema>;

const lipsyncSchema = v.object({
	videoUrl: v.pipe(
		v.string(),
		v.description(
			'The URL of a video showing someone talking/speaking (with visible mouth movements).'
		)
	),
	audioUrl: v.pipe(
		v.string(),
		v.description('The URL of the new audio that the person should lip-sync to.')
	),
	loop: v.pipe(
		v.boolean(),
		v.description(
			'Whether to loop the video if the new audio is longer than the original video duration.'
		)
	)
});

export type LipsyncInput = v.InferOutput<typeof lipsyncSchema>;

const metadataSchema = v.object({
	mediaUrl: v.pipe(
		v.string(),
		v.description('The URL of the media file (image, video, or audio) to extract metadata from.')
	),
	extractFrames: v.pipe(
		v.boolean(),
		v.description(
			'Whether to extract frame thumbnails from video files. Set to false for images and audio.'
		)
	)
});

export type MetadataInput = v.InferOutput<typeof metadataSchema>;

const mergeVideosSchema = v.object({
	videoUrls: v.pipe(
		v.array(v.string()),
		v.minLength(2),
		v.description('Array of video URLs to merge together. Minimum 2 videos required.')
	),
	targetFps: v.optional(
		v.pipe(
			v.number(),
			v.minValue(1),
			v.maxValue(60),
			v.description(
				'Target FPS for the output video (1-60). If not provided, uses the lowest FPS from input videos.'
			)
		)
	),
	resolution: v.optional(
		v.pipe(
			v.union([
				v.picklist([
					'square_hd',
					'square',
					'portrait_4_3',
					'portrait_9_16',
					'landscape_4_3',
					'landscape_16_9'
				]),
				v.object({
					width: v.pipe(v.number(), v.minValue(512), v.maxValue(2048)),
					height: v.pipe(v.number(), v.minValue(512), v.maxValue(2048))
				})
			]),
			v.description(
				'Resolution preset or custom dimensions. Width and height must be between 512 and 2048.'
			)
		)
	)
});

export type MergeVideosInput = v.InferOutput<typeof mergeVideosSchema>;

const extractFrameSchema = v.object({
	videoUrl: v.pipe(v.string(), v.description('The URL of the video file to extract a frame from.')),
	frameType: v.optional(
		v.pipe(
			v.picklist(['first', 'middle', 'last']),
			v.description(
				'Type of frame to extract: first, middle, or last frame of the video. Default: first'
			)
		)
	)
});

export type ExtractFrameInput = v.InferOutput<typeof extractFrameSchema>;

const textToSpeechTool = tool({
	description: `
		Convert text to natural-sounding speech. Generates audio narration and voice-overs with multiple voice options.

		WHEN TO USE:
		- Voice-overs for videos, narration, accessibility features, audio presentations
		- Need natural human speech with emotional expression control

		EFFICIENCY TIPS:
		- Fast, cheap operation - generate liberally
		- For conversations: Use CONSISTENT voice per character throughout (Sarah for Person A, Charlie for Person B across all lines)
		- Match stability to use case: 0.0 for expressive/creative, 1.0 for consistent narration
		- Adjust style parameter for emotional content; omit for neutral speech
	`,
	inputSchema: valibotSchema(textToSpeechSchema),
	execute: async (
		{ text, voice, stability, similarityBoost, speed, style, timestamps }: TextToSpeechInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'elevenlabsTts',
				input: {
					text,
					voice,
					stability,
					similarity_boost: similarityBoost,
					speed,
					style,
					timestamps
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('text-to-speech', error);
		}
	}
});

const textToDialogueTool = tool({
	description: `
		Generate natural multi-speaker conversation audio as a single continuous file with realistic timing, overlaps, and contextual tone changes between speakers.

		WHEN TO USE:
		- Want single continuous conversation audio with natural flow and timing
		- Creating single-take conversation videos (wide shots, podcast-style, interviews)
		- Need contextual tone changes (speaker B reacts to speaker A's emotion)
		- Podcast discussions, interview videos, documentary narration with guest voices

		WHEN NOT TO USE:
		- Need visual cuts between speakers per line → use separate text-to-speech + lipsync per line instead
		- Need individual control over each line's audio parameters (speed, style, etc.)
		- Creating segmented conversation videos with alternating close-ups of speakers

		EFFICIENCY TIPS:
		- Generates entire multi-speaker conversation in one API call vs multiple text-to-speech calls
		- Best paired with wide shots showing both speakers or single-speaker-focus videos
		- Use square brackets for sound effects: [applause], [gulps], [laughs], [sighs]
		- Use square brackets for accents/emotions: [strong canadian accent], [excited], [whispers]
		- Output is single audio file with all speakers - cannot be split per speaker afterward
		- More natural conversation flow with proper pacing and speaker interactions than separate TTS calls
	`,
	inputSchema: valibotSchema(textToDialogueSchema),
	execute: async (
		{ inputs, stability }: TextToDialogueInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'elevenlabsDialogue',
				input: {
					inputs,
					stability
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('text-to-dialogue', error);
		}
	}
});

const lipsyncTool = tool({
	description: `
		Replace audio in a video of someone talking and automatically adjust their mouth movements to match the new audio. Outputs complete video with synced audio.

		WHEN TO USE:
		- Dubbing existing talking videos with different audio/language
		- Creating multiple versions of same talking video with different narration
		- Replacing placeholder audio in talking head videos

		WHEN NOT TO USE:
		- Video doesn't show someone talking/speaking (requires visible mouth movements)
		- Need to generate video from scratch → use text-to-video or image-to-video first

		EFFICIENCY CRITICAL - ASSET REUSE:
		- For conversations: Generate ONE base talking video, reuse it with MULTIPLE different audio files
		- Example: 8-line conversation = 1 base talking video + 8 lip-syncs with different audio (NOT 8 video generations!)
		- Use loop parameter to repeat video if new audio is longer than original video
		- Works best with clear frontal view of person talking
		- Output includes both synced video AND audio - no need to merge separately
	`,
	inputSchema: valibotSchema(lipsyncSchema),
	execute: async (
		{ videoUrl, audioUrl, loop }: LipsyncInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'lipsync',
				input: {
					video_url: videoUrl,
					audio_url: audioUrl,
					loop
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('lipsync', error);
		}
	}
});

const removeBackgroundTool = tool({
	description: `
		Remove background from images automatically, creating transparent PNGs.

		WHEN TO USE:
		- Product photos, portraits, preparing images for compositing, creating transparent assets
		- Need to isolate subject from background quickly

		EFFICIENCY TIPS:
		- Fast, cheap operation - use liberally
		- Use cropToBbox: true for cleaner results when subject isolation is the goal
		- Works best with clear subjects and distinct backgrounds
		- May struggle with complex edges or transparent/reflective objects
	`,
	inputSchema: valibotSchema(removeBackgroundSchema),
	execute: async (
		{ imageUrl, cropToBbox }: RemoveBackgroundInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'rembg',
				input: {
					image_url: imageUrl,
					crop_to_bbox: cropToBbox
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('remove-background', error);
		}
	}
});

const upscaleImageTool = tool({
	description: `
		Upscale and enhance image quality using professional AI models. Increases resolution while preserving or enhancing details.

		WHEN TO USE:
		- Improve quality of generated or existing images
		- Prepare images for large displays or prints
		- Enhance low-resolution images
		- Recover details from compressed images
		- Sharpen text in images

		MODEL SELECTION:
		- Standard V2: Balanced quality for general use (default)
		- Recovery V2: Best for recovering details from compressed/low-quality images
		- High Fidelity V2: Maximum detail preservation for high-quality sources
		- CGI: Optimized for computer-generated imagery and graphics
		- Text Refine: Specialized for sharpening text and documents
		- Redefine: Creative enhancement with artistic interpretation

		EFFICIENCY TIPS:
		- Use after generating images that need higher resolution
		- Enable faceEnhancement for portraits (improves facial details)
		- Use Recovery V2 for images that look compressed or degraded
		- Higher upscaleFactor means larger file sizes and longer processing
	`,
	inputSchema: valibotSchema(upscaleImageSchema),
	execute: async (
		{
			imageUrl,
			model,
			upscaleFactor,
			subjectDetection,
			faceEnhancement,
			faceEnhancementStrength,
			faceEnhancementCreativity,
			cropToFill
		}: UpscaleImageInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'topazUpscaleImage',
				input: {
					image_url: imageUrl,
					model,
					upscale_factor: upscaleFactor,
					...(subjectDetection !== undefined && { subject_detection: subjectDetection }),
					...(faceEnhancement !== undefined && { face_enhancement: faceEnhancement }),
					...(faceEnhancementStrength !== undefined && {
						face_enhancement_strength: faceEnhancementStrength
					}),
					...(faceEnhancementCreativity !== undefined && {
						face_enhancement_creativity: faceEnhancementCreativity
					}),
					...(cropToFill !== undefined && { crop_to_fill: cropToFill })
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('upscale-image', error);
		}
	}
});

const upscaleVideoTool = tool({
	description: `
		Upscale and enhance video quality using professional AI. Increases resolution while preserving details. Can also interpolate frames for smoother motion.

		WHEN TO USE:
		- Improve quality of generated or existing videos
		- Prepare videos for large displays
		- Enhance low-resolution videos
		- Smooth out choppy motion with frame interpolation

		EFFICIENCY TIPS:
		- Use after generating videos that need higher resolution
		- Enable targetFps for frame interpolation to create smoother motion (e.g., convert 24fps to 60fps)
		- Higher upscaleFactor means larger file sizes and longer processing (can take several minutes)
		- Frame interpolation adds processing time but creates much smoother video
	`,
	inputSchema: valibotSchema(upscaleVideoSchema),
	execute: async (
		{ videoUrl, upscaleFactor, targetFps }: UpscaleVideoInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'topazUpscaleVideo',
				input: {
					video_url: videoUrl,
					upscale_factor: upscaleFactor,
					...(targetFps !== undefined && { target_fps: targetFps })
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('upscale-video', error);
		}
	}
});

const metadataTool = tool({
	description: `
		Extract comprehensive metadata from media files (images, videos, audio). Analyzes dimensions, duration, bitrate, codec, format.

		WHEN TO USE:
		- Understanding file properties before processing
		- Validating media types and quality settings
		- Checking durations/dimensions for workflow planning

		EFFICIENCY TIPS:
		- Fast operation - use when needed for workflow validation
		- Returns detailed technical specifications as JSON
		- For videos: set extractFrames: true to get start/end thumbnails
	`,
	inputSchema: valibotSchema(metadataSchema),
	execute: async (
		{ mediaUrl, extractFrames }: MetadataInput,
		{ abortSignal }
	): Promise<DataOutput> => {
		try {
			const result = await fal.subscribe('fal-ai/ffmpeg-api/metadata', {
				mode: 'streaming',
				input: {
					media_url: mediaUrl,
					extract_frames: extractFrames
				},
				abortSignal
			});

			return { type: 'data', payload: result.data, format: 'json' };
		} catch (error) {
			throw handleToolError('extract-metadata', error);
		}
	}
});

const mergeVideosTool = tool({
	description: `
		Concatenate multiple video files into single output. Combines separate video files with consistent formatting.

		WHEN TO USE:
		- Creating video compilations, combining clips, merging segmented content, montages
		- Need to concatenate 2 or more videos in specific sequence

		CRITICAL - ORDER PRESERVATION:
		- Array order = output video order (first URL in array = first video in output)
		- For conversations: Ensure videoUrls array is in DIALOGUE SEQUENCE, not completion order
		- Example conversation order: [personA_line1, personB_line1, personA_line2, personB_line2, ...]
		- For stories: [intro, middle, end] = story sequence in output
		- NEVER pass videos in completion order - ALWAYS pass in intended sequence order

		EFFICIENCY TIPS:
		- Fast, cheap operation - use liberally
		- Videos concatenated in exact array order
		- All input videos scaled/cropped to match output resolution
		- Specify targetFps for consistent frame rate across all clips
	`,
	inputSchema: valibotSchema(mergeVideosSchema),
	execute: async (
		{ videoUrls, targetFps, resolution }: MergeVideosInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'ffmpegMergeVideos',
				input: {
					video_urls: videoUrls,
					...(targetFps !== undefined && { target_fps: targetFps }),
					...(resolution !== undefined && { resolution })
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('merge-videos', error);
		}
	}
});

const extractFrameTool = tool({
	description: `
		Extract a single frame from a video as an image. Captures specific moments as high-quality still images.

		WHEN TO USE:
		- Creating video thumbnails, extracting key frames for analysis
		- Generating preview images or capturing specific moments
		- Feeding extracted frames to image-to-image or image-to-video tools

		EFFICIENCY TIPS:
		- Fast, cheap operation - use as needed
		- Choose frameType: 'first' (default), 'middle', or 'last'
		- Useful for chaining workflows: extract frame → modify with image-to-image → animate with image-to-video
	`,
	inputSchema: valibotSchema(extractFrameSchema),
	execute: async (
		{ videoUrl, frameType }: ExtractFrameInput,
		{ abortSignal, experimental_context: context, toolCallId }
	): Promise<MediaOutput> => {
		try {
			const ctx = getToolContext(context);

			const { files } = await generateMedia({
				model: 'ffmpegExtractFrame',
				input: {
					video_url: videoUrl,
					...(frameType !== undefined && { frame_type: frameType })
				},
				context: {
					userId: ctx.userId,
					projectId: ctx.projectId,
					toolCallId
				},
				abortSignal
			});

			return { type: 'media', files };
		} catch (error) {
			throw handleToolError('extract-frame', error);
		}
	}
});

export const tools = {
	'text-to-image': textToImageTool,
	'image-to-image': imageToImageTool,
	'text-to-sound-effect': textToSoundEffectTool,
	'text-to-speech': textToSpeechTool,
	'text-to-dialogue': textToDialogueTool,
	'text-to-video': textToVideoTool,
	'image-to-video': imageToVideoTool,
	lipsync: lipsyncTool,
	'merge-audio-video': mergeAudioVideoTool,
	'merge-videos': mergeVideosTool,
	'extract-frame': extractFrameTool,
	'remove-background': removeBackgroundTool,
	'upscale-image': upscaleImageTool,
	'upscale-video': upscaleVideoTool,
	'extract-metadata': metadataTool
};

export type ToolInput =
	| TextToImageInput
	| ImageToImageInput
	| TextToSoundEffectInput
	| TextToSpeechInput
	| TextToDialogueInput
	| TextToVideoInput
	| ImageToVideoInput
	| LipsyncInput
	| MergeAudioVideoInput
	| MergeVideosInput
	| ExtractFrameInput
	| RemoveBackgroundInput
	| UpscaleImageInput
	| UpscaleVideoInput
	| MetadataInput;

export type ToolSet = InferUITools<typeof tools>;
