<script lang="ts">
	import type { MediaFile } from '$lib/server/tools';
	import type { MediaType } from './tool-config';

	import ImageOutput from './tool-media-image.svelte';
	import VideoOutput from './tool-media-video.svelte';
	import AudioOutput from './tool-media-audio.svelte';

	interface Props {
		files: MediaFile[];
		mediaType: MediaType;
		aspectRatio?: string;
		onDragStart?: (event: DragEvent, file: { url: string }, index: number) => void;
		onDragEnd?: () => void;
		downloadFilename?: (index: number) => string;
		ariaLabel?: (index: number) => string;
		class?: string;
	}

	let {
		files,
		mediaType,
		aspectRatio,
		onDragStart,
		onDragEnd,
		downloadFilename,
		ariaLabel,
		class: className
	}: Props = $props();
</script>

{#if mediaType === 'image'}
	<ImageOutput
		images={files}
		{aspectRatio}
		{onDragStart}
		{onDragEnd}
		{ariaLabel}
		class={className}
	/>
{:else if mediaType === 'video'}
	<VideoOutput videos={files} {onDragStart} {downloadFilename} {ariaLabel} class={className} />
{:else if mediaType === 'audio'}
	<AudioOutput
		audios={files}
		{onDragStart}
		{onDragEnd}
		{downloadFilename}
		{ariaLabel}
		class={className}
	/>
{/if}
