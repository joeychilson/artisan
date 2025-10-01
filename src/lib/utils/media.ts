import type { ViewerFile, ViewerFileType } from '$lib/components/viewer/types';

export type MediaItem = {
	id: string;
	projectId: string;
	type: string;
	contentType: string;
	url: string;
	createdAt: string | Date;
};

export function getMediaTypeFromContentType(contentType: string): ViewerFileType {
	if (contentType.startsWith('image/')) {
		return 'image';
	}
	if (contentType.startsWith('video/')) {
		return 'video';
	}
	if (contentType.startsWith('audio/')) {
		return 'audio';
	}

	return 'image';
}

function convertToViewerFile(mediaItem: MediaItem): ViewerFile {
	return {
		url: mediaItem.url,
		name: `${mediaItem.type}-${mediaItem.id}`,
		type: getMediaTypeFromContentType(mediaItem.contentType)
	};
}

export function convertToViewerFiles(mediaItems: MediaItem[]): ViewerFile[] {
	return mediaItems.map(convertToViewerFile);
}

export function getDefaultContentType(mediaType: 'image' | 'video' | 'audio'): string {
	switch (mediaType) {
		case 'image':
			return 'image/png';
		case 'video':
			return 'video/mp4';
		case 'audio':
			return 'audio/mpeg';
	}
}

export function getFileExtension(contentType: string): string {
	const typeMap: Record<string, string> = {
		'image/jpeg': '.jpg',
		'image/png': '.png',
		'image/gif': '.gif',
		'image/webp': '.webp',
		'video/mp4': '.mp4',
		'video/webm': '.webm',
		'video/mov': '.mov',
		'audio/mp3': '.mp3',
		'audio/mpeg': '.mp3',
		'audio/wav': '.wav',
		'audio/ogg': '.ogg'
	};

	return typeMap[contentType] || '';
}

export function getAllowedMimeTypes(): string[] {
	return ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'audio/mp3', 'audio/mpeg'];
}

export function getAcceptString(): string {
	return getAllowedMimeTypes().join(',');
}

export function isAllowedFileType(file: File): boolean {
	const allowedMimeTypes = getAllowedMimeTypes();
	return allowedMimeTypes.includes(file.type);
}

export function getContentTypeFromPath(path: string): string {
	const ext = path.toLowerCase().split('.').pop();

	const mimeTypes: Record<string, string> = {
		// Images
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		svg: 'image/svg+xml',
		// Videos
		mp4: 'video/mp4',
		webm: 'video/webm',
		mov: 'video/quicktime',
		// Audio
		mp3: 'audio/mpeg',
		wav: 'audio/wav',
		ogg: 'audio/ogg',
		m4a: 'audio/mp4'
	};

	return mimeTypes[ext || ''] || 'application/octet-stream';
}
