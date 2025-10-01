<script lang="ts">
	import type { ChatRequestOptions } from 'ai';
	import { toast } from 'svelte-sonner';

	import IconLoader from '~icons/hugeicons/loading-03';
	import IconSend from '~icons/hugeicons/arrow-up-02';
	import IconX from '~icons/hugeicons/cancel-01';
	import IconAttachment from '~icons/hugeicons/attachment';

	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { cn } from '$lib/utils/ui';
	import { getFileAttachmentContext } from '$lib/contexts/file-attachment.svelte.js';
	import { handleDrop, convertBlobUrlToDataUrl } from '$lib/utils/file-attachment.js';
	import { getAcceptString, isAllowedFileType } from '$lib/utils/media.js';

	export interface AttachedFile {
		id: string;
		url: string;
		file?: File;
		mediaType?: string;
	}

	type ChatStatus = 'streaming' | 'submitted' | 'ready' | 'error';

	interface Props {
		status: ChatStatus;
		input: string;
		files: AttachedFile[];
		uploadingFiles?: boolean;
		onSubmit: (event?: Event, options?: ChatRequestOptions) => Promise<void>;
		class?: string;
	}

	let {
		status,
		input = $bindable(''),
		files = $bindable([]),
		uploadingFiles = false,
		onSubmit,
		class: className
	}: Props = $props();

	let maxFiles = $state<number>(4);
	let fileInputRef = $state<HTMLInputElement>();
	let isDragOver = $state(false);

	const attachmentContext = getFileAttachmentContext();

	const canAddFiles = $derived(files.length < maxFiles);
	const isSubmitDisabled = $derived(
		status === 'submitted' || status === 'streaming' || (!input.trim() && files.length === 0)
	);
	const showFileUpload = $derived(maxFiles > 0);

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();

		const currentTarget = event.currentTarget as HTMLElement;
		if (!currentTarget?.contains(event.relatedTarget as Node)) {
			isDragOver = false;
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	}

	async function handleDropEvent(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = false;

		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			const droppedFiles = Array.from(event.dataTransfer.files);

			const validFiles = droppedFiles.filter((file) => {
				if (!isAllowedFileType(file)) {
					toast.error(
						`File type not supported: ${file.name}. Only PNG, JPG, WebP, MP4, and MP3 files are allowed.`
					);
					return false;
				}
				return true;
			});

			if (validFiles.length === 0) return;

			const remainingSlots = maxFiles - files.length;
			const filesToAdd = Math.min(validFiles.length, remainingSlots);

			if (filesToAdd === 0) {
				toast.warning(`Maximum ${maxFiles} files allowed`);
				return;
			}

			if (validFiles.length > remainingSlots) {
				toast.warning(
					`Only adding ${filesToAdd} of ${validFiles.length} files (max ${maxFiles} allowed)`
				);
			}

			for (let i = 0; i < filesToAdd; i++) {
				const file = validFiles[i];
				try {
					const reader = new FileReader();
					reader.onload = (e) => {
						const result = e.target?.result;
						if (typeof result === 'string') {
							files = [
								...files,
								{
									id: crypto.randomUUID(),
									url: result,
									file
								}
							];
						} else {
							console.error('Failed to read file as data URL:', file.name);
							toast.error(`Failed to read file: ${file.name}`);
						}
					};
					reader.onerror = (error) => {
						console.error('FileReader error:', error);
						toast.error(`Failed to read file: ${file.name}`);
					};
					reader.readAsDataURL(file);
				} catch (error) {
					console.error('Failed to read file:', error);
					toast.error(`Failed to read file: ${file.name}`);
				}
			}
			return;
		}

		const droppedFile = handleDrop(event);
		if (!droppedFile) return;

		if (files.length >= maxFiles) {
			toast.warning(`Maximum ${maxFiles} files allowed`);
			return;
		}

		try {
			let url = droppedFile.url;
			if (url.startsWith('blob:')) {
				url = await convertBlobUrlToDataUrl(url);
			}

			const newFile: AttachedFile = {
				id: droppedFile.id,
				url,
				file: undefined,
				mediaType: droppedFile.mediaType
			};

			files = [...files, newFile];
		} catch (error) {
			console.error('Failed to attach file:', error);
			toast.error('Failed to attach file');
		}
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const selectedFiles = target.files;
		if (!selectedFiles?.length) return;

		const validFiles = Array.from(selectedFiles).filter((file) => {
			if (!isAllowedFileType(file)) {
				toast.error(
					`File type not supported: ${file.name}. Only PNG, JPG, WebP, MP4, and MP3 files are allowed.`
				);
				return false;
			}
			return true;
		});

		if (validFiles.length === 0) {
			target.value = '';
			return;
		}

		const remainingSlots = maxFiles - files.length;
		const filesToAdd = Math.min(validFiles.length, remainingSlots);

		if (filesToAdd === 0) {
			toast.warning(`Maximum ${maxFiles} files allowed`);
		} else {
			if (validFiles.length > remainingSlots) {
				toast.warning(
					`Only adding ${filesToAdd} of ${validFiles.length} files (max ${maxFiles} allowed)`
				);
			}

			for (let i = 0; i < filesToAdd; i++) {
				const file = validFiles[i];
				const reader = new FileReader();
				reader.onload = (e) => {
					const result = e.target?.result;
					if (typeof result === 'string') {
						files = [
							...files,
							{
								id: crypto.randomUUID(),
								url: result,
								file
							}
						];
					} else {
						console.error('Failed to read file as data URL:', file.name);
						toast.error(`Failed to read file: ${file.name}`);
					}
				};
				reader.onerror = (error) => {
					console.error('FileReader error:', error);
					toast.error(`Failed to read file: ${file.name}`);
				};
				reader.readAsDataURL(file);
			}
		}

		target.value = '';
	}

	function removeFile(id: string) {
		files = files.filter((file) => file.id !== id);
		attachmentContext?.removeFile(id);
	}

	function triggerFileInput() {
		fileInputRef?.click();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.isComposing) return;

		if (event.key === 'Enter' && event.metaKey) {
			event.preventDefault();
			if (status === 'submitted') {
				toast.warning('Please wait before sending another message.');
			} else if (!isSubmitDisabled) {
				onSubmit(event);
			}
		}
	}

	function handleSubmitClick(event: Event) {
		event.preventDefault();
		if (!isSubmitDisabled) {
			onSubmit(event);
		}
	}
</script>

<div
	class="relative space-y-3"
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDropEvent}
	role="region"
	aria-label="Message input with file attachment drop zone"
>
	{#if isDragOver}
		<div
			class="from-primary/20 to-primary/10 ring-primary/50 ring-offset-background absolute inset-0 z-10 rounded-md bg-gradient-to-b ring-2 ring-offset-2 backdrop-blur-sm"
		></div>
	{/if}

	{#if showFileUpload && files.length > 0}
		<div class="flex gap-2 px-2">
			{#each files as file (file.id)}
				<div class="border-border/50 bg-card/95 relative size-20 overflow-hidden rounded-lg border">
					<img src={file.url} alt="Attached file" class="size-full object-cover" />
					{#if uploadingFiles && file.file}
						<div
							class="bg-background/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm"
						>
							<IconLoader class="text-primary size-6 animate-spin" />
						</div>
					{/if}
					<button
						onclick={() => removeFile(file.id)}
						class="bg-background/90 text-foreground hover:bg-background border-border/50 absolute top-1 right-1 rounded-full border p-0.5 transition-opacity"
						aria-label="Remove file"
						disabled={uploadingFiles}
					>
						<IconX class="size-3" />
					</button>
				</div>
			{/each}

			{#if canAddFiles && !uploadingFiles}
				<button
					onclick={triggerFileInput}
					class="border-border/50 bg-card/95 hover:bg-card flex size-20 items-center justify-center rounded-lg border transition-colors"
					aria-label="Add file"
				>
					<IconAttachment class="text-muted-foreground/50 size-6" />
				</button>
			{/if}
		</div>
	{/if}

	<div
		class={cn('border-border/50 bg-card/95 rounded-md rounded-b-none border border-b-0', className)}
	>
		<input
			bind:this={fileInputRef}
			type="file"
			accept={getAcceptString()}
			multiple
			onchange={handleFileUpload}
			class="hidden"
		/>

		<Textarea
			rows={1}
			aria-label="What do you want to create?"
			placeholder="What do you want to create?"
			class="max-h-58 w-full resize-none overflow-y-auto border-0 bg-transparent shadow-none focus-visible:ring-0"
			onkeydown={handleKeyDown}
			bind:value={input}
			disabled={uploadingFiles || status === 'submitted'}
		/>

		<div class="flex justify-between gap-2 p-2.5">
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1.5">
					{#if showFileUpload}
						<Button
							size="icon"
							variant="ghost"
							class="size-9"
							onclick={triggerFileInput}
							aria-label="Upload file"
							disabled={uploadingFiles}
						>
							<IconAttachment class="text-muted-foreground size-5" />
						</Button>
					{/if}
				</div>
			</div>
			<div class="flex items-center">
				<Button
					size="icon"
					variant={input.trim() && status === 'ready' && !uploadingFiles ? 'default' : 'secondary'}
					class="size-9"
					aria-label={input.trim() ? 'Send message' : 'Send message (message required)'}
					disabled={isSubmitDisabled}
					onclick={handleSubmitClick}
				>
					{#if status === 'ready' && !uploadingFiles}
						<IconSend class={input.trim() ? 'size-5' : 'text-muted-foreground size-5'} />
					{:else if status === 'streaming' || status === 'submitted' || uploadingFiles}
						<IconLoader class="size-5 animate-spin" />
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>
