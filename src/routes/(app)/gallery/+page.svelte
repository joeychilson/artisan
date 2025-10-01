<script lang="ts">
	import Masonry from 'svelte-bricks';

	import IconGallery from '~icons/hugeicons/image-02';
	import IconClose from '~icons/hugeicons/cancel-01';

	import { Button } from '$lib/components/ui/button';
	import { Viewer } from '$lib/components/viewer';
	import { GalleryMedia } from '$lib/components/gallery';
	import { SelectAsync } from '$lib/components/ui/select';
	import { getAllUserMedia } from '$lib/remote/media.remote';
	import { convertToViewerFiles } from '$lib/utils/media';

	let typeFilter = $state<'all' | 'image' | 'video' | 'audio'>('all');

	const media = $derived(await getAllUserMedia(typeFilter));

	let showViewer = $state(false);
	let selectedIndex = $state(0);

	const hasActiveFilters = $derived(typeFilter !== 'all');

	function handlePreviewClick(index: number) {
		selectedIndex = index;
		showViewer = true;
	}

	function closeViewer() {
		showViewer = false;
	}

	function clearFilters() {
		typeFilter = 'all';
	}

	const viewerFiles = $derived(convertToViewerFiles(media));

	const filterOptions = [
		{ value: 'all', label: 'All Media' },
		{ value: 'image', label: 'Images' },
		{ value: 'video', label: 'Videos' },
		{ value: 'audio', label: 'Audio' }
	];
</script>

<svelte:head>
	<title>Gallery - Artisan</title>
	<meta name="description" content="Browse all your created media" />
</svelte:head>

<div class="mx-auto max-w-5xl pt-16 pb-6">
	<div class="flex items-center justify-between p-4 sm:p-6">
		<div class="flex items-center gap-3">
			<div class="bg-muted/50 flex size-10 items-center justify-center rounded-lg">
				<IconGallery class="text-muted-foreground size-5" />
			</div>
			<div class="space-y-0.5">
				<h1 class="font-medium">Gallery</h1>
				<p class="text-muted-foreground text-xs">Browse all your created media</p>
			</div>
		</div>
	</div>

	<div class="px-4 sm:px-6">
		<div class="flex items-center justify-end gap-2">
			{#if hasActiveFilters}
				<Button variant="ghost" size="sm" onclick={clearFilters} class="h-9 px-2 text-xs">
					<IconClose class="size-3" />
					Clear
				</Button>
			{/if}
			<SelectAsync
				value={typeFilter}
				onValueChange={(value) => (typeFilter = value as typeof typeFilter)}
				options={filterOptions}
				triggerClass="h-9 w-[130px] text-xs"
			/>
		</div>
	</div>

	<div class="px-4 pt-6 pb-6 sm:px-6">
		{#if media.length === 0}
			<div class="py-12 text-center">
				<IconGallery class="text-muted-foreground mx-auto mb-2 size-8" />
				<h3 class="mb-2 font-medium">No media yet</h3>
				<p class="text-muted-foreground mb-4 text-sm">
					Your created media will appear here in the gallery.
				</p>
			</div>
		{:else}
			<Masonry
				items={media}
				minColWidth={200}
				maxColWidth={400}
				gap={8}
				duration={0}
				getId={(item) => item.id}
			>
				{#snippet children({ item, idx })}
					<GalleryMedia media={item} onclick={() => handlePreviewClick(idx)} />
				{/snippet}
			</Masonry>
		{/if}
	</div>
</div>

{#if showViewer}
	<Viewer files={viewerFiles} initialIndex={selectedIndex} onClose={closeViewer} />
{/if}
