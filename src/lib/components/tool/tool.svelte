<script lang="ts">
	import type { ToolOutput, ToolInput } from '$lib/server/tools';
	import { startImageDrag, createAttachableFileFromImage } from '$lib/utils/file-attachment';

	import { getToolConfig, type ToolState } from './tool-config';
	import ToolMedia from './tool-media.svelte';
	import ToolReference, { type ReferenceFile } from './tool-reference.svelte';
	import ToolLoading from './tool-loading.svelte';

	interface Props {
		toolName: string;
		input?: ToolInput;
		output?: ToolOutput;
		state: ToolState;
	}

	let { toolName, input, output, state }: Props = $props();

	const config = getToolConfig(toolName);
	const hasInput = $derived(state === 'input-streaming' || state === 'input-available');
	const hasOutput = $derived(state === 'output-available');

	const referenceFiles: ReferenceFile[] = $derived.by(() => {
		if (!input || !config.hasReferenceFiles) return [];

		const files: ReferenceFile[] = [];

		if ('imageUrls' in input && Array.isArray(input.imageUrls)) {
			files.push(
				...input.imageUrls.map((url, i) => ({
					url,
					type: 'image' as const,
					name: `Source image ${i + 1}`
				}))
			);
		}

		if ('imageUrl' in input && typeof input.imageUrl === 'string') {
			files.push({
				url: input.imageUrl,
				type: 'image' as const,
				name: 'Source image'
			});
		}

		if ('audioUrl' in input && typeof input.audioUrl === 'string') {
			files.push({
				url: input.audioUrl,
				type: 'audio' as const,
				name: toolName === 'lipsync' ? 'Audio file' : 'Source audio'
			});
		}

		if ('videoUrl' in input && typeof input.videoUrl === 'string') {
			files.push({
				url: input.videoUrl,
				type: 'video' as const,
				name: 'Source video'
			});
		}

		if ('mediaUrl' in input && typeof input.mediaUrl === 'string') {
			files.push({
				url: input.mediaUrl,
				type: 'image' as const,
				name: 'Media file'
			});
		}

		return files;
	});

	function handleDragStart(event: DragEvent, file: { url: string }, index: number) {
		const attachableFile = createAttachableFileFromImage(
			file.url,
			config.dragLabel(index),
			toolName
		);

		startImageDrag(event, attachableFile);
	}

	const aspectRatio = $derived.by(() => {
		if (!input) return config.defaultAspectRatio;
		if ('aspectRatio' in input && input.aspectRatio) {
			return input.aspectRatio;
		}
		return config.defaultAspectRatio;
	});
</script>

{#if hasInput && input}
	<ToolLoading
		{aspectRatio}
		loadingText={config.loadingText}
		loadingSubtext={config.loadingSubtext}
		mediaType={config.mediaType}
		numberOfItems={config.supportsMultiple && 'numberOfImages' in input && input.numberOfImages
			? input.numberOfImages
			: 1}
	/>
{:else if hasOutput && output}
	{#if output.type === 'media' && config.mediaType}
		<ToolMedia
			files={output.files}
			mediaType={config.mediaType}
			{aspectRatio}
			onDragStart={handleDragStart}
			downloadFilename={config.downloadFilename}
			ariaLabel={config.ariaLabel}
		/>
	{:else if output.type === 'text'}
		<div class="bg-muted/20 rounded-lg p-4">
			<pre class="text-sm whitespace-pre-wrap">{output.content}</pre>
		</div>
	{:else if output.type === 'data'}
		<div class="bg-muted/20 rounded-lg p-4">
			<pre class="text-sm whitespace-pre-wrap">{JSON.stringify(output.payload, null, 2)}</pre>
		</div>
	{/if}
{/if}

{#if referenceFiles.length > 0}
	<div class="mt-4">
		<ToolReference files={referenceFiles} />
	</div>
{/if}
