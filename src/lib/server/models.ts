export type Imagen4Input = {
	prompt: string;
	aspect_ratio: string;
	resolution: '1K' | '2K';
	num_images: number;
};

export type GeminiFlashEditInput = {
	prompt: string;
	image_urls: string[];
	num_images: number;
};

export type KlingVideoInput = {
	prompt: string;
	duration: '5' | '10';
	aspect_ratio: string;
	negative_prompt?: string;
	cfg_scale: number;
};

export type KlingVideoImageToVideoInput = {
	prompt: string;
	image_url: string;
	duration: '5' | '10';
	negative_prompt?: string;
	cfg_scale: number;
};

export type ElevenlabsSoundEffectsInput = {
	text: string;
	prompt_influence: number;
	output_format: string;
	duration_seconds?: number;
};

export type FfmpegMergeInput = {
	video_url: string;
	audio_url: string;
	start_offset: number;
};

export type RembgInput = {
	image_url: string;
	crop_to_bbox: boolean;
};

export type ElevenlabsTtsInput = {
	text: string;
	voice: string;
	stability: number;
	similarity_boost: number;
	speed: number;
	style?: number;
	timestamps: boolean;
	previous_text?: string;
	next_text?: string;
};

export type ElevenlabsDialogueInput = {
	inputs: Array<{
		text: string;
		voice: string;
	}>;
	stability: number;
};

export type LipsyncInput = {
	video_url: string;
	audio_url: string;
	loop: boolean;
};

export type FfmpegMergeVideosInput = {
	video_urls: string[];
	target_fps?: number;
	resolution?:
		| 'square_hd'
		| 'square'
		| 'portrait_4_3'
		| 'portrait_9_16'
		| 'landscape_4_3'
		| 'landscape_16_9'
		| {
				width: number;
				height: number;
		  };
};

export type FfmpegExtractFrameInput = {
	video_url: string;
	frame_type?: 'first' | 'middle' | 'last';
};

export type TopazUpscaleImageInput = {
	image_url: string;
	model: 'Standard V2' | 'Recovery V2' | 'High Fidelity V2' | 'CGI' | 'Text Refine' | 'Redefine';
	upscale_factor: number;
	subject_detection?: 'Foreground' | 'Background' | 'All';
	face_enhancement?: boolean;
	face_enhancement_strength?: number;
	face_enhancement_creativity?: number;
	crop_to_fill?: boolean;
};

export type TopazUpscaleVideoInput = {
	video_url: string;
	upscale_factor: number;
	target_fps?: number;
};

export const MODELS = {
	imagen4: {
		id: 'fal-ai/imagen4/preview',
		type: 'image' as const
	},
	geminiFlashEdit: {
		id: 'fal-ai/gemini-25-flash-image/edit',
		type: 'image' as const
	},
	klingVideoTextToVideo: {
		id: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
		type: 'video' as const
	},
	klingVideoImageToVideo: {
		id: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
		type: 'video' as const
	},
	elevenlabsSoundEffects: {
		id: 'fal-ai/elevenlabs/sound-effects/v2',
		type: 'audio' as const
	},
	ffmpegMergeAudioVideo: {
		id: 'fal-ai/ffmpeg-api/merge-audio-video',
		type: 'video' as const
	},
	rembg: {
		id: 'fal-ai/imageutils/rembg',
		type: 'image' as const
	},
	elevenlabsTts: {
		id: 'fal-ai/elevenlabs/tts/eleven-v3',
		type: 'audio' as const
	},
	elevenlabsDialogue: {
		id: 'fal-ai/elevenlabs/text-to-dialogue/eleven-v3',
		type: 'audio' as const
	},
	lipsync: {
		id: 'creatify/lipsync',
		type: 'video' as const
	},
	ffmpegMergeVideos: {
		id: 'fal-ai/ffmpeg-api/merge-videos',
		type: 'video' as const
	},
	ffmpegExtractFrame: {
		id: 'fal-ai/ffmpeg-api/extract-frame',
		type: 'image' as const
	},
	topazUpscaleImage: {
		id: 'fal-ai/topaz/upscale/image',
		type: 'image' as const
	},
	topazUpscaleVideo: {
		id: 'fal-ai/topaz/upscale/video',
		type: 'video' as const
	}
} as const;

export type ModelKey = keyof typeof MODELS;
