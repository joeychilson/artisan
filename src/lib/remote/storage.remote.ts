import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';

import * as v from 'valibot';

import { s3Client } from '$lib/server/storage';
import { getFileUrl } from '$lib/storage';

export const createUploadUrl = command(
	v.object({
		files: v.array(
			v.object({
				name: v.string(),
				type: v.string(),
				size: v.number()
			})
		)
	}),
	async ({ files }) => {
		const { locals } = getRequestEvent();

		if (!locals.session || !locals.user) {
			return error(401, 'Unauthorized');
		}

		const userId = locals.user.id;

		try {
			if (files.length === 0) {
				return error(400, 'Please upload a file.');
			}

			const uploads = await Promise.all(
				files.map(async (file) => {
					const fileId = crypto.randomUUID();
					const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
					const storagePath = `uploads/${userId}/${fileId}.${fileExtension}`;

					const uploadUrl = s3Client.presign(storagePath, {
						method: 'PUT',
						type: file.type,
						expiresIn: 3600
					});

					const imageUrl = getFileUrl(storagePath);

					return {
						type: 'new',
						uploadUrl,
						imageUrl,
						filename: file.name
					};
				})
			);

			return { success: true, uploads };
		} catch (err) {
			console.error('Failed to create upload URLs', err);
			return error(500, 'Unable to upload files. Please try again.');
		}
	}
);
