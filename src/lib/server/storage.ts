import { env } from '$env/dynamic/private';

import { S3Client } from 'bun';

import { getFileUrl } from '$lib/storage';
import type { MediaFile } from '$lib/server/tools';
import { getFileExtension, getDefaultContentType } from '$lib/utils/media';

if (!env.S3_ACCESS_KEY) {
	throw new Error('S3_ACCESS_KEY is not set');
}

if (!env.S3_SECRET_KEY) {
	throw new Error('S3_SECRET_KEY is not set');
}

if (!env.S3_ENDPOINT) {
	throw new Error('S3_ENDPOINT is not set');
}

export const s3Client = new S3Client({
	endpoint: env.S3_ENDPOINT,
	region: env.S3_REGION || 'us-east-1',
	accessKeyId: env.S3_ACCESS_KEY,
	secretAccessKey: env.S3_SECRET_KEY,
	bucket: env.S3_BUCKET!
});

export async function uploadMedia(
	files: Array<{ url: string; contentType?: string }>,
	options: {
		userId: string;
		mediaType: 'image' | 'video' | 'audio';
	}
): Promise<MediaFile[]> {
	return Promise.all(
		files.map(async (file) => {
			const contentType = file.contentType || getDefaultContentType(options.mediaType);
			const result = await uploadSingleMedia({
				userId: options.userId,
				mediaType: options.mediaType,
				contentType,
				url: file.url
			});

			return {
				url: result.url,
				contentType,
				mediaType: options.mediaType
			};
		})
	);
}

async function uploadSingleMedia(options: {
	userId: string;
	mediaType: 'image' | 'video' | 'audio';
	contentType: string;
	url: string;
}): Promise<{ url: string }> {
	const { url, contentType, userId, mediaType } = options;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${mediaType} from URL: ${response.statusText}`);
		}

		const blob = await response.blob();
		const buffer = Buffer.from(await blob.arrayBuffer());

		const fileId = crypto.randomUUID();
		const fileExtension = getFileExtension(contentType);
		const extension = fileExtension ? fileExtension.slice(1) : 'bin';

		const typeFolder = `${mediaType}s`;
		const storagePath = `${typeFolder}/${userId}/${fileId}.${extension}`;

		const s3File = s3Client.file(storagePath, {
			type: contentType
		});

		await s3File.write(buffer);

		const publicUrl = getFileUrl(storagePath);

		return { url: publicUrl };
	} catch (error) {
		console.error(`Failed to upload ${mediaType} to storage:`, error);
		throw new Error(
			`Failed to upload ${mediaType} to storage: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
