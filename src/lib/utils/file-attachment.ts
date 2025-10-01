import type { AttachableFile } from '$lib/contexts/file-attachment.svelte';

export interface DragData {
	type: 'attachable-file';
	file: AttachableFile;
}

export function startImageDrag(event: DragEvent, file: AttachableFile): void {
	if (!event.dataTransfer) return;

	const dragData: DragData = {
		type: 'attachable-file',
		file
	};

	event.dataTransfer.setData('application/json', JSON.stringify(dragData));
	event.dataTransfer.effectAllowed = 'copy';

	if (file.url && event.target instanceof HTMLElement) {
		const img = event.target.querySelector('img');
		if (img) {
			event.dataTransfer.setDragImage(img, 50, 50);
		}
	}
}

export function handleDrop(event: DragEvent): AttachableFile | null {
	event.preventDefault();

	if (!event.dataTransfer) return null;

	const data = event.dataTransfer.getData('application/json');
	if (!data) return null;

	const dragData: DragData = JSON.parse(data);
	if (dragData.type === 'attachable-file') {
		return dragData.file;
	}

	return null;
}

export function createAttachableFileFromImage(
	url: string,
	name?: string,
	source?: string
): AttachableFile {
	return {
		id: crypto.randomUUID(),
		url,
		type: 'image',
		name,
		source,
		mediaType: 'image/*'
	};
}

export async function convertBlobUrlToDataUrl(blobUrl: string): Promise<string> {
	try {
		const response = await fetch(blobUrl);
		const blob = await response.blob();

		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error('Failed to convert blob URL to data URL:', error);
		throw error;
	}
}
