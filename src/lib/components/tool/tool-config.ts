import type { ToolOutput } from '$lib/server/tools';

export type MediaType = 'image' | 'video' | 'audio';

export type ToolState = 'input-streaming' | 'output-available' | 'input-available' | 'output-error';

export interface ToolConfig {
	loadingText: string;
	loadingSubtext?: string;
	defaultAspectRatio: string;
	outputType: ToolOutput['type'];
	mediaType?: MediaType;
	downloadFilename: (index: number) => string;
	ariaLabel: (index: number) => string;
	dragLabel: (index: number) => string;
	supportsMultiple?: boolean;
	hasReferenceFiles?: boolean;
}

export const toolConfigs: Record<string, ToolConfig> = {
	'text-to-image': {
		loadingText: 'Generating image...',
		defaultAspectRatio: '1:1',
		outputType: 'media',
		mediaType: 'image',
		downloadFilename: (index) => `generated-image-${index + 1}.png`,
		ariaLabel: (index) =>
			`Generated image ${index + 1}. Click to view fullscreen. Drag to attach to prompt.`,
		dragLabel: (index) => `Generated image ${index + 1}`,
		supportsMultiple: true
	},
	'image-to-image': {
		loadingText: 'Generating image...',
		defaultAspectRatio: '1:1',
		outputType: 'media',
		mediaType: 'image',
		downloadFilename: (index) => `generated-image-${index + 1}.png`,
		ariaLabel: (index) =>
			`Generated image ${index + 1}. Click to view fullscreen. Drag to attach to prompt.`,
		dragLabel: (index) => `Generated image ${index + 1}`,
		supportsMultiple: true,
		hasReferenceFiles: true
	},
	'text-to-sound-effect': {
		loadingText: 'Generating sound effect...',
		defaultAspectRatio: '1:1',
		outputType: 'media',
		mediaType: 'audio',
		downloadFilename: (index) => `sound-effect-${index + 1}.mp3`,
		ariaLabel: (index) => `Sound effect ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Sound effect ${index + 1}`
	},
	'text-to-speech': {
		loadingText: 'Generating speech...',
		defaultAspectRatio: '1:1',
		outputType: 'media',
		mediaType: 'audio',
		downloadFilename: (index) => `speech-${index + 1}.mp3`,
		ariaLabel: (index) => `Speech ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Speech ${index + 1}`
	},
	'text-to-video': {
		loadingText: 'Generating video...',
		loadingSubtext: 'This may take a few minutes',
		defaultAspectRatio: '16:9',
		outputType: 'media',
		mediaType: 'video',
		downloadFilename: (index) => `generated-video-${index + 1}.mp4`,
		ariaLabel: (index) => `Generated video ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Generated video ${index + 1}`
	},
	'image-to-video': {
		loadingText: 'Generating video...',
		loadingSubtext: 'This may take a few minutes',
		defaultAspectRatio: '16:9',
		outputType: 'media',
		mediaType: 'video',
		downloadFilename: (index) => `generated-video-${index + 1}.mp4`,
		ariaLabel: (index) => `Generated video ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Generated video ${index + 1}`,
		hasReferenceFiles: true
	},
	lipsync: {
		loadingText: 'Lip-syncing video...',
		loadingSubtext: 'This may take a few minutes',
		defaultAspectRatio: '16:9',
		outputType: 'media',
		mediaType: 'video',
		downloadFilename: (index) => `lipsync-${index + 1}.mp4`,
		ariaLabel: (index) => `Lip-synced video ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Lip-synced video ${index + 1}`,
		hasReferenceFiles: true
	},
	'merge-audio-video': {
		loadingText: 'Merging audio and video...',
		defaultAspectRatio: '16:9',
		outputType: 'media',
		mediaType: 'video',
		downloadFilename: (index) => `merged-video-${index + 1}.mp4`,
		ariaLabel: (index) => `Merged video ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Merged video ${index + 1}`,
		hasReferenceFiles: true
	},
	'merge-videos': {
		loadingText: 'Merging videos...',
		defaultAspectRatio: '16:9',
		outputType: 'media',
		mediaType: 'video',
		downloadFilename: (index) => `merged-videos-${index + 1}.mp4`,
		ariaLabel: (index) => `Merged video ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Merged video ${index + 1}`,
		hasReferenceFiles: true
	},
	'text-to-dialogue': {
		loadingText: 'Generating dialogue...',
		defaultAspectRatio: '1:1',
		outputType: 'media',
		mediaType: 'audio',
		downloadFilename: (index) => `dialogue-${index + 1}.mp3`,
		ariaLabel: (index) => `Dialogue ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Dialogue ${index + 1}`
	},
	'extract-frame': {
		loadingText: 'Extracting frame...',
		defaultAspectRatio: 'auto',
		outputType: 'media',
		mediaType: 'image',
		downloadFilename: (index) => `extracted-frame-${index + 1}.png`,
		ariaLabel: (index) =>
			`Extracted frame ${index + 1}. Click to view fullscreen. Drag to attach to prompt.`,
		dragLabel: (index) => `Extracted frame ${index + 1}`,
		hasReferenceFiles: true
	},
	'remove-background': {
		loadingText: 'Removing background...',
		defaultAspectRatio: 'auto',
		outputType: 'media',
		mediaType: 'image',
		downloadFilename: (index) => `no-background-${index + 1}.png`,
		ariaLabel: (index) =>
			`Image ${index + 1} with background removed. Click to view fullscreen. Drag to attach to prompt.`,
		dragLabel: (index) => `Image ${index + 1} with background removed`,
		hasReferenceFiles: true
	},
	'upscale-image': {
		loadingText: 'Upscaling image...',
		loadingSubtext: 'Enhancing quality and resolution',
		defaultAspectRatio: 'auto',
		outputType: 'media',
		mediaType: 'image',
		downloadFilename: (index) => `upscaled-image-${index + 1}.png`,
		ariaLabel: (index) =>
			`Upscaled image ${index + 1}. Click to view fullscreen. Drag to attach to prompt.`,
		dragLabel: (index) => `Upscaled image ${index + 1}`,
		hasReferenceFiles: true
	},
	'upscale-video': {
		loadingText: 'Upscaling video...',
		loadingSubtext: 'This may take several minutes',
		defaultAspectRatio: 'auto',
		outputType: 'media',
		mediaType: 'video',
		downloadFilename: (index) => `upscaled-video-${index + 1}.mp4`,
		ariaLabel: (index) => `Upscaled video ${index + 1}. Drag to attach to prompt.`,
		dragLabel: (index) => `Upscaled video ${index + 1}`,
		hasReferenceFiles: true
	},
	'extract-metadata': {
		loadingText: 'Extracting metadata...',
		defaultAspectRatio: '1:1',
		outputType: 'data',
		downloadFilename: (index) => `metadata-${index + 1}.json`,
		ariaLabel: (index) => `Metadata ${index + 1}`,
		dragLabel: (index) => `Metadata ${index + 1}`,
		hasReferenceFiles: true
	}
};

export function getToolConfig(toolName: string): ToolConfig {
	return (
		toolConfigs[toolName] || {
			loadingText: 'Processing...',
			defaultAspectRatio: '1:1',
			outputType: 'media',
			downloadFilename: (index) => `output-${index + 1}`,
			ariaLabel: (index) => `Output ${index + 1}`,
			dragLabel: (index) => `Output ${index + 1}`
		}
	);
}
