<script lang="ts">
	import IconImagePlaceholder from '~icons/hugeicons/image-02';

	import type { ViewerFile } from './types';

	let { file }: { file: ViewerFile } = $props();

	let isLoading = $state(true);
</script>

{#if file}
	{#if isLoading}
		<div class="absolute inset-0 z-[1] flex items-center justify-center">
			<div
				class="border-border/70 border-t-primary size-10 animate-spin rounded-full border-[3px]"
			></div>
		</div>
	{/if}

	<img
		src={file.url}
		alt={file.name || 'Image'}
		class="max-h-[80vh] w-auto rounded-xl object-contain transition-opacity duration-300"
		class:opacity-0={isLoading}
		onload={() => (isLoading = false)}
		draggable="false"
	/>
{:else}
	<div
		class="text-muted-foreground flex h-[60vh] w-full flex-col items-center justify-center gap-3"
	>
		<IconImagePlaceholder class="size-12" />
		<p class="text-sm font-medium">No image available</p>
	</div>
{/if}
