import { fal } from '$lib/server/ai';
import {
	MODELS,
	type ModelKey,
	type Imagen4Input,
	type GeminiFlashEditInput,
	type KlingVideoInput,
	type KlingVideoImageToVideoInput,
	type ElevenlabsSoundEffectsInput,
	type FfmpegMergeInput,
	type RembgInput,
	type ElevenlabsTtsInput,
	type ElevenlabsDialogueInput,
	type LipsyncInput,
	type FfmpegMergeVideosInput,
	type FfmpegExtractFrameInput,
	type TopazUpscaleImageInput,
	type TopazUpscaleVideoInput
} from '$lib/server/models';
import { uploadMedia } from '$lib/server/storage';
import type { MediaFile } from '$lib/server/tools';

type GenerateMediaContext = {
	userId: string;
	projectId: string;
	toolCallId: string;
};

type GenerateMediaResult = {
	files: MediaFile[];
};

type ModelInputMap = {
	imagen4: Imagen4Input;
	geminiFlashEdit: GeminiFlashEditInput;
	klingVideoTextToVideo: KlingVideoInput;
	klingVideoImageToVideo: KlingVideoImageToVideoInput;
	elevenlabsSoundEffects: ElevenlabsSoundEffectsInput;
	ffmpegMergeAudioVideo: FfmpegMergeInput;
	rembg: RembgInput;
	elevenlabsTts: ElevenlabsTtsInput;
	elevenlabsDialogue: ElevenlabsDialogueInput;
	lipsync: LipsyncInput;
	ffmpegMergeVideos: FfmpegMergeVideosInput;
	ffmpegExtractFrame: FfmpegExtractFrameInput;
	topazUpscaleImage: TopazUpscaleImageInput;
	topazUpscaleVideo: TopazUpscaleVideoInput;
};

export async function generateMedia<T extends ModelKey>({
	model,
	input,
	context,
	abortSignal
}: {
	model: T;
	input: ModelInputMap[T];
	context: GenerateMediaContext;
	abortSignal?: AbortSignal;
}): Promise<GenerateMediaResult> {
	const modelConfig = MODELS[model];

	const result = await fal.subscribe(modelConfig.id, {
		mode: 'streaming',
		input,
		abortSignal
	});

	const resultFiles = extractFiles(result.data, modelConfig.type);

	const files = await uploadMedia(resultFiles, {
		userId: context.userId,
		mediaType: modelConfig.type
	});

	return { files };
}

type FalResponse = Record<string, unknown>;

interface FileResponse {
	url: string;
	content_type?: string;
}

function extractFiles(
	data: FalResponse,
	type: 'image' | 'video' | 'audio'
): Array<{ url: string; contentType?: string }> {
	if (data.images && Array.isArray(data.images)) {
		return (data.images as FileResponse[]).map((img) => ({
			url: img.url,
			contentType: img.content_type
		}));
	}

	if (data.video) {
		const video = data.video as FileResponse;
		return [
			{
				url: video.url,
				contentType: video.content_type || 'video/mp4'
			}
		];
	}

	if (data.audio || data.audio_file) {
		const audio = (data.audio || data.audio_file) as FileResponse;
		return [
			{
				url: audio.url,
				contentType: audio.content_type || 'audio/mpeg'
			}
		];
	}

	if (
		data.output &&
		typeof data.output === 'object' &&
		data.output !== null &&
		'url' in data.output
	) {
		const output = data.output as FileResponse;
		return [
			{
				url: output.url,
				contentType: 'video/mp4'
			}
		];
	}

	if (data.image) {
		const image = data.image as FileResponse;
		return [
			{
				url: image.url,
				contentType: image.content_type || 'image/png'
			}
		];
	}

	throw new Error(`Unable to extract files from ${type} response`);
}
