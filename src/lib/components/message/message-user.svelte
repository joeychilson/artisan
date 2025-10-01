<script lang="ts">
	import SvelteMarkdown from '@humanspeak/svelte-markdown';

	import { Viewer } from '$lib/components/viewer';
	import type { Message } from '$lib/messages';

	interface Props {
		message: Message;
	}

	let { message }: Props = $props();

	let viewerOpen = $state(false);
	let viewerIndex = $state(0);

	const attachedFiles = $derived(
		message.parts
			.filter((part) => part.type === 'file')
			.map((part, index) => ({
				id: `${message.id}-file-${index}`,
				url: part.url,
				name: part.filename || 'Attached file',
				type: 'image' as const
			}))
	);

	function openViewer(index: number) {
		viewerIndex = index;
		viewerOpen = true;
	}

	function closeViewer() {
		viewerOpen = false;
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="flex justify-end">
		<div class="max-w-prose">
			{#if attachedFiles.length > 0}
				<div class="mb-2 flex justify-end gap-2">
					{#each attachedFiles as file, index (file.id)}
						<button
							class="focus:ring-primary size-20 flex-shrink-0 overflow-hidden rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:outline-none"
							onclick={() => openViewer(index)}
							aria-label="View {file.name}"
						>
							<img src={file.url} alt={file.name} class="size-full object-cover" loading="lazy" />
						</button>
					{/each}
				</div>
			{/if}

			{#each message.parts as part, index (index)}
				{#if part.type === 'text'}
					<div class="bg-muted rounded-lg px-3 py-2">
						<div class="prose text-foreground/90 whitespace-pre-wrap">
							<SvelteMarkdown source={part.text} />
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>

{#if viewerOpen}
	<Viewer files={attachedFiles} initialIndex={viewerIndex} onClose={closeViewer} />
{/if}
