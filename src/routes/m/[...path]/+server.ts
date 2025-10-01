import type { RequestHandler } from './$types';

import { error } from '@sveltejs/kit';

import { s3Client } from '$lib/server/storage';
import { getContentTypeFromPath } from '$lib/utils/media';

export const GET: RequestHandler = async ({ params }) => {
	const path = params.path;

	if (!path) {
		return error(400, 'Path is required');
	}

	try {
		const file = s3Client.file(path);

		const exists = await file.exists();
		if (!exists) {
			return error(404, 'File not found');
		}

		const buffer = await file.arrayBuffer();
		const contentType = getContentTypeFromPath(path);

		const etag = `"${await generateETag(path, buffer.byteLength)}"`;

		return new Response(buffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': 'inline',
				'Cache-Control': 'public, max-age=31536000, immutable',
				ETag: etag,
				'Content-Length': buffer.byteLength.toString()
			}
		});
	} catch (err) {
		console.error('Error serving file:', err);
		return error(500, 'Failed to serve file');
	}
};

async function generateETag(path: string, size: number): Promise<string> {
	const data = `${path}-${size}`;
	const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex.substring(0, 32);
}
