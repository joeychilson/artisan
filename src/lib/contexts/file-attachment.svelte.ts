import { getContext, setContext } from 'svelte';

export interface AttachableFile {
	id: string;
	url: string;
	type: 'image' | 'video' | 'audio';
	name?: string;
	source?: string;
	mediaType?: string;
}

class FileAttachmentService {
	#attachedFiles = $state<AttachableFile[]>([]);

	get attachedFiles(): AttachableFile[] {
		return this.#attachedFiles;
	}

	attachFile(file: AttachableFile): void {
		const exists = this.#attachedFiles.some((f) => f.url === file.url);
		if (exists) return;

		this.#attachedFiles = [...this.#attachedFiles, file];
	}

	removeFile(id: string): void {
		this.#attachedFiles = this.#attachedFiles.filter((file) => file.id !== id);
	}

	clearFiles(): void {
		this.#attachedFiles = [];
	}

	hasFile(url: string): boolean {
		return this.#attachedFiles.some((file) => file.url === url);
	}
}

const FILE_ATTACHMENT_CONTEXT_KEY = Symbol('file-attachment');

export function setFileAttachmentContext(): FileAttachmentService {
	const service = new FileAttachmentService();
	setContext(FILE_ATTACHMENT_CONTEXT_KEY, service);
	return service;
}

export function getFileAttachmentContext(): FileAttachmentService | null {
	return getContext<FileAttachmentService>(FILE_ATTACHMENT_CONTEXT_KEY) ?? null;
}
