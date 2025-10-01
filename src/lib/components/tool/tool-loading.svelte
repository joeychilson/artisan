<script lang="ts">
	import IconLoader from '~icons/hugeicons/loading-03';
	import { getGridLayout, getAspectRatio } from '$lib/utils/tools';

	import type { MediaType } from './tool-config';

	interface Props {
		aspectRatio: string;
		loadingText: string;
		loadingSubtext?: string;
		mediaType?: MediaType;
		numberOfItems?: number;
	}

	let { aspectRatio, loadingText, loadingSubtext, mediaType, numberOfItems = 1 }: Props = $props();

	const isMultiple = $derived(numberOfItems > 1);
	const isAuto = $derived(aspectRatio === 'auto');
	const isAudio = $derived(mediaType === 'audio');
</script>

{#if isMultiple}
	<div class={getGridLayout(numberOfItems, aspectRatio)}>
		{#each Array.from({ length: numberOfItems }, (_, i) => i) as i (i)}
			<div
				class="border-border/50 bg-muted/60 flex {getAspectRatio(
					aspectRatio
				)} w-full items-center justify-center rounded-xl border"
			>
				<div class="text-muted-foreground flex flex-col items-center gap-2">
					<IconLoader class="size-5 animate-spin" />
					<span class="text-xs">{loadingText}</span>
				</div>
			</div>
		{/each}
	</div>
{:else if isAuto}
	<div class={getGridLayout(1, '1:1')}>
		<div class="group border-border/50 bg-muted/60 relative overflow-hidden rounded-xl border">
			<div class="{getAspectRatio('1:1')} relative flex w-full items-center justify-center">
				<div class="text-muted-foreground flex flex-col items-center gap-2">
					<IconLoader class="size-5 animate-spin" />
					<span class="text-xs">{loadingText}</span>
				</div>
			</div>
		</div>
	</div>
{:else if mediaType === 'video'}
	<div
		class="border-border/50 bg-muted/60 flex aspect-video items-center justify-center rounded-xl border"
	>
		<div class="text-muted-foreground flex flex-col items-center gap-2">
			<IconLoader class="size-6 animate-spin" />
			<span class="text-sm">{loadingText}</span>
			{#if loadingSubtext}
				<span class="text-xs opacity-75">{loadingSubtext}</span>
			{/if}
		</div>
	</div>
{:else if isAudio}
	<div class="border-border/50 bg-muted/60 flex h-24 items-center justify-center rounded-xl border">
		<div class="text-muted-foreground flex flex-col items-center gap-2">
			<IconLoader class="size-5 animate-spin" />
			<span class="text-xs">{loadingText}</span>
		</div>
	</div>
{:else}
	<div class={getGridLayout(1, aspectRatio)}>
		<div
			class="border-border/50 bg-muted/60 flex {getAspectRatio(
				aspectRatio
			)} items-center justify-center rounded-xl border"
		>
			<div class="text-muted-foreground flex flex-col items-center gap-2">
				<IconLoader class="size-5 animate-spin" />
				<span class="text-xs">{loadingText}</span>
			</div>
		</div>
	</div>
{/if}
