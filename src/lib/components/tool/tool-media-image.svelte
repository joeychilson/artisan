<script lang="ts">
	import { Viewer } from '$lib/components/viewer';
	import { getGridLayout, getAspectRatio } from '$lib/utils/tools';

	interface Props {
		images: { url: string }[];
		aspectRatio?: string;
		onDragStart?: (event: DragEvent, image: { url: string }, index: number) => void;
		onDragEnd?: () => void;
		ariaLabel?: (index: number) => string;
		class?: string;
	}

	let {
		images,
		aspectRatio = '1:1',
		onDragStart,
		onDragEnd,
		ariaLabel = (index) =>
			`Image ${index + 1}. Click to view fullscreen. Drag to attach to prompt.`,
		class: className = ''
	}: Props = $props();

	let viewerOpen = $state(false);
	let viewerIndex = $state(0);
	let draggingIndex = $state<number | null>(null);

	function openViewer(index: number) {
		viewerIndex = index;
		viewerOpen = true;
	}

	function closeViewer() {
		viewerOpen = false;
	}

	function handleInternalDragStart(event: DragEvent, image: { url: string }, index: number) {
		draggingIndex = index;
		onDragStart?.(event, image, index);
	}

	function handleInternalDragEnd() {
		draggingIndex = null;
		onDragEnd?.();
	}
</script>

<div class="{getGridLayout(images.length, aspectRatio)} {className}">
	{#each images as image, index (`image-${index}`)}
		<div
			class="group border-border/50 hover:ring-primary/50 relative overflow-hidden rounded-xl border transition-all duration-200 hover:ring-2 hover:ring-offset-2 {draggingIndex ===
			index
				? 'opacity-50'
				: 'opacity-100'}"
		>
			<button
				onclick={() => openViewer(index)}
				ondragstart={(event) => handleInternalDragStart(event, image, index)}
				ondragend={handleInternalDragEnd}
				draggable={!!onDragStart}
				class="focus:ring-primary relative block h-full w-full focus:ring-2 focus:ring-offset-2 focus:outline-none"
				aria-label={ariaLabel(index)}
			>
				<div class="{getAspectRatio(aspectRatio)} relative w-full">
					<img
						src={image.url}
						alt={`Generated image ${index + 1}`}
						class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>

					<div
						class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
					></div>
				</div>
			</button>
		</div>
	{/each}
</div>

{#if viewerOpen}
	<Viewer
		files={images.map((img, i) => ({
			url: img.url,
			name: `Generated image ${i + 1}`,
			type: 'image' as const
		}))}
		initialIndex={viewerIndex}
		onClose={closeViewer}
	/>
{/if}
