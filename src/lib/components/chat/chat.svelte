<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';
	import { toast } from 'svelte-sonner';

	import IconLogo from '~icons/hugeicons/paint-board';
	import IconChevronDown from '~icons/hugeicons/arrow-down-02';

	import { AutoScroll } from '$lib/components/auto-scroll';
	import { Button } from '$lib/components/ui/button';
	import { Message } from '$lib/components/message';
	import { setFileAttachmentContext } from '$lib/contexts/file-attachment.svelte.js';
	import type { Message as MessageType, MessagePart } from '$lib/messages';
	import { createUploadUrl } from '$lib/remote/storage.remote';
	import { getRecentProjects, getUserProjects } from '$lib/remote/projects.remote';
	import { currentProjectStore } from '$lib/stores/current-project.svelte';
	import { formatTimeAgo } from '$lib/utils/formatting';

	import ChatInput, { type AttachedFile } from './chat-input.svelte';

	interface Props {
		id: string;
		title?: string;
		messages: MessageType[];
		resume?: boolean;
	}

	let { id, title, messages, resume = false }: Props = $props();

	const fileAttachmentService = setFileAttachmentContext();
	const recentProjects = await getRecentProjects();

	let showScrollButton = $state(false);
	let autoScrollRef = $state<AutoScroll>();
	let input = $state('');
	let files = $state<AttachedFile[]>([]);
	let uploadingFiles = $state(false);

	const chat = new Chat({
		id,
		messages,
		transport: new DefaultChatTransport({
			api: '/api/generate'
		}),
		generateId: () => crypto.randomUUID(),
		onData: ({ data, type }) => {
			if (type === 'data-project-metadata') {
				if (data.id && page.params.id !== data.id) {
					goto(resolve(`/projects/${data.id}`));
				}
				if (data.title) {
					currentProjectStore.updateTitle(data.title);
				}
			}
		},
		onFinish: async () => {
			await getUserProjects(undefined).refresh();
		},
		onError: () => {
			toast.error("We couldn't process your request. Please try again.");
		}
	});

	const canSubmit = $derived(input.trim().length > 0 || files.length > 0);

	async function uploadFiles(filesToUpload: AttachedFile[]): Promise<string[]> {
		if (filesToUpload.length === 0) return [];

		const uploadData = await createUploadUrl({
			files: filesToUpload.map((f) => ({
				name: f.file!.name,
				type: f.file!.type,
				size: f.file!.size
			}))
		});

		const uploadResults = await Promise.allSettled(
			uploadData.uploads.map(async (upload, index) => {
				const file = filesToUpload[index].file!;
				const response = await fetch(upload.uploadUrl, {
					method: 'PUT',
					body: file,
					headers: {
						'Content-Type': file.type
					}
				});

				if (!response.ok) {
					throw new Error(`Failed to upload ${file.name}`);
				}

				return upload.imageUrl;
			})
		);

		const successfulUploads = uploadResults
			.filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
			.map((result) => result.value);

		const failedUploads = uploadResults.filter((result) => result.status === 'rejected');

		if (failedUploads.length > 0) {
			toast.warning(`${failedUploads.length} file(s) failed to upload`);
		}

		return successfulUploads;
	}

	function createMessageParts(
		text: string,
		files: AttachedFile[],
		uploadedUrls: string[]
	): MessagePart[] {
		const parts: MessagePart[] = [];

		if (text) {
			parts.push({
				type: 'text',
				text
			});
		}

		let uploadIndex = 0;
		for (const file of files) {
			if (file.file) {
				parts.push({
					type: 'file',
					mediaType: file.file.type,
					url: uploadedUrls[uploadIndex++]
				});
			} else {
				parts.push({
					type: 'file',
					mediaType: file.mediaType || 'image/png',
					url: file.url
				});
			}
		}

		return parts;
	}

	async function handleSubmit(event?: Event) {
		event?.preventDefault();

		if (!canSubmit) return;

		const messageText = input.trim();
		const currentFiles = [...files];

		try {
			const filesToUpload = currentFiles.filter((f) => f.file);

			if (filesToUpload.length > 0) {
				uploadingFiles = true;
			}

			const uploadedUrls = await uploadFiles(filesToUpload);
			uploadingFiles = false;

			const parts = createMessageParts(messageText, currentFiles, uploadedUrls);

			input = '';
			files = [];
			fileAttachmentService.clearFiles();

			await chat.sendMessage({ parts });
		} catch (error) {
			console.error('Failed to send message:', error);
			uploadingFiles = false;
			input = messageText;
			files = currentFiles;
		}
	}

	function scrollToBottom() {
		autoScrollRef?.scrollToBottomManually();
	}

	const latestToolCallMessageIndex = $derived(() => {
		const map = new SvelteMap<string, number>();
		chat.messages.forEach((message, index) => {
			message.parts?.forEach((part) => {
				if ('toolCallId' in part && part.toolCallId && part.type?.startsWith('tool-')) {
					map.set(part.toolCallId, index);
				}
			});
		});
		return map;
	});

	function handleScrollButtonVisibilityChange(visible: boolean) {
		showScrollButton = visible;
	}

	$effect(() => {
		const contextFiles = fileAttachmentService.attachedFiles;
		for (const contextFile of contextFiles) {
			const exists = files.some((f) => f.url === contextFile.url);
			if (!exists) {
				const attachedFile: AttachedFile = {
					id: contextFile.id,
					url: contextFile.url,
					file: undefined,
					mediaType: contextFile.mediaType
				};
				files = [...files, attachedFile];
			}
		}
	});

	onMount(async () => {
		currentProjectStore.setProject({ id, title });

		if (resume) {
			await chat.resumeStream();
		}
	});

	onDestroy(() => {
		currentProjectStore.clear();
	});
</script>

{#if chat.messages.length === 0}
	<div class="fixed inset-0 flex items-center justify-center">
		<div class="w-full max-w-2xl px-4">
			<div class="mb-8 flex items-center justify-center gap-2 text-3xl font-semibold">
				<IconLogo class="size-8" />
				Artisan
			</div>
			<ChatInput
				bind:input
				bind:files
				status={chat.status}
				onSubmit={handleSubmit}
				{uploadingFiles}
				class="rounded-md border-b"
			/>

			{#if recentProjects && recentProjects.length > 0}
				<div class="mt-8">
					<p class="text-muted-foreground mb-2 text-xs tracking-wide uppercase">Recent</p>
					<div class="flex flex-col gap-2">
						{#each recentProjects as project (project.id)}
							<a
								href={resolve(`/projects/${project.id}`)}
								class="hover:bg-accent/50 flex items-center justify-between rounded-md px-3 py-2 transition-colors"
							>
								<span class="text-foreground text-sm">{project.title}</span>
								<span class="text-muted-foreground text-xs">
									{formatTimeAgo(project.lastMessageAt)}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="relative flex h-full w-full flex-col">
		<AutoScroll
			bind:this={autoScrollRef}
			items={chat.messages}
			isStreaming={chat.status === 'streaming'}
			onScrollButtonVisibilityChange={handleScrollButtonVisibilityChange}
			class="scrollbar-gutter-stable h-full flex-1 overflow-y-auto pt-20 pb-40"
		>
			<div class="mx-auto w-full max-w-3xl px-4 pb-4 md:px-0">
				{#each chat.messages as message, index (message.id)}
					<Message
						{message}
						status={chat.status}
						isLastMessage={index === chat.messages.length - 1}
						messageIndex={index}
						latestToolCallMessageIndex={latestToolCallMessageIndex()}
					/>
				{/each}
			</div>
		</AutoScroll>

		{#if showScrollButton}
			<div
				class="fixed right-0 bottom-28 left-0 z-20 mx-auto w-full max-w-3xl px-4 md:absolute md:px-0"
			>
				<div class="flex justify-center">
					<Button size="sm" onclick={scrollToBottom} aria-label="Scroll to bottom of conversation">
						<IconChevronDown class="size-4" aria-hidden="true" />
						<span>Scroll to bottom</span>
					</Button>
				</div>
			</div>
		{/if}

		<div class="fixed inset-x-0 bottom-0">
			<div class="mx-auto max-w-3xl">
				<ChatInput
					bind:input
					bind:files
					status={chat.status}
					onSubmit={handleSubmit}
					{uploadingFiles}
				/>
			</div>
		</div>
	</div>
{/if}
