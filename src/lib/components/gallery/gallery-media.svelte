<script lang="ts">
	import IconAudioWave from '~icons/hugeicons/audio-wave-01';
	import IconPlay from '~icons/hugeicons/play';
	import IconImageError from '~icons/hugeicons/image-not-found-02';
	import IconVideoError from '~icons/hugeicons/video-off';
	import IconFileError from '~icons/hugeicons/file-not-found';

	import { getMediaTypeFromContentType, type MediaItem } from '$lib/utils/media';
	import { formatDate } from '$lib/utils/formatting';
	import { cn } from '$lib/utils/ui';

	interface Props {
		media: MediaItem;
		onclick?: () => void;
	}

	let { media, onclick }: Props = $props();

	const currentType = $derived(getMediaTypeFromContentType(media.contentType));

	let isLoading = $state(true);
	let hasError = $state(false);
	let imageElement = $state<HTMLImageElement | null>(null);
	let videoElement = $state<HTMLVideoElement | null>(null);

	const shouldTrackLoading = $derived(currentType === 'image' || currentType === 'video');
	const showLoader = $derived(shouldTrackLoading && isLoading && !hasError);

	const buttonClass = $derived(
		cn(
			'group relative w-full cursor-pointer overflow-hidden rounded-lg border transition-all duration-200',
			'border-border/30 shadow-sm hover:scale-[1.01] hover:shadow-md',
			'hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
			currentType === 'audio' ? 'bg-gradient-to-br from-muted/10 to-muted/5' : 'bg-muted/5'
		)
	);

	$effect(() => {
		if (!shouldTrackLoading) {
			isLoading = false;
			hasError = false;
			return;
		}

		isLoading = true;
		hasError = false;

		const checkCached = () => {
			if (currentType === 'image' && imageElement?.complete) {
				isLoading = false;
			} else if (currentType === 'video' && videoElement && videoElement.readyState >= 1) {
				isLoading = false;
			}
		};

		checkCached();
		setTimeout(checkCached, 0);
	});

	function markLoaded() {
		isLoading = false;
	}

	function markError() {
		hasError = true;
		isLoading = false;
	}
</script>

<div class="group relative">
	<button
		class={buttonClass}
		style:aspect-ratio={currentType === 'audio' ? '2/1' : undefined}
		{onclick}
		type="button"
	>
		{#if shouldTrackLoading}
			{#if showLoader}
				<div class="bg-muted/20 absolute inset-0 animate-pulse">
					<div class="absolute inset-0 flex items-center justify-center">
						<div
							class="border-border/40 border-t-primary size-5 animate-spin rounded-full border-2"
						></div>
					</div>
				</div>
			{/if}

			{#if !hasError}
				{#if currentType === 'image'}
					<img
						bind:this={imageElement}
						src={media.url}
						alt=""
						class="w-full object-cover transition-transform duration-300 group-hover:scale-110"
						class:opacity-0={showLoader}
						loading="lazy"
						onload={markLoaded}
						onerror={markError}
					/>
				{:else}
					<video
						bind:this={videoElement}
						src={media.url}
						class="w-full object-cover transition-transform duration-300 group-hover:scale-110"
						class:opacity-0={showLoader}
						preload="metadata"
						muted
						onloadedmetadata={markLoaded}
						onerror={markError}
					></video>
					<div
						class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
					>
						<div class="rounded-full bg-black/70 p-3 backdrop-blur-sm">
							<IconPlay class="size-6 text-white" />
						</div>
					</div>
				{/if}
			{:else}
				<div class="bg-muted/30 flex aspect-[4/3] w-full items-center justify-center">
					<div class="text-muted-foreground flex flex-col items-center gap-2">
						{#if currentType === 'image'}
							<IconImageError class="size-8 opacity-60" />
						{:else}
							<IconVideoError class="size-8 opacity-60" />
						{/if}
						<span class="text-xs opacity-75">Failed to load</span>
					</div>
				</div>
			{/if}

			<div
				class="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
			></div>
		{:else if currentType === 'audio'}
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
				<IconAudioWave
					class="text-muted-foreground group-hover:text-foreground size-8 transition-colors duration-200"
				/>
				<span
					class="text-muted-foreground group-hover:text-foreground text-xs font-medium transition-colors duration-200"
				>
					Audio
				</span>
			</div>
			<div
				class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
			>
				<div class="rounded-full bg-black/70 p-3 backdrop-blur-sm">
					<IconPlay class="size-4 text-white" />
				</div>
			</div>
		{:else}
			<div class="bg-muted/30 flex aspect-[4/3] w-full items-center justify-center">
				<div class="text-muted-foreground flex flex-col items-center gap-2">
					<IconFileError class="size-8 opacity-60" />
					<span class="text-xs opacity-75">Unsupported media</span>
				</div>
			</div>
		{/if}
	</button>

	<div class="absolute top-2 right-2">
		<div
			class="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 dark:bg-black/90 dark:text-gray-300"
		>
			{formatDate(media.createdAt)}
		</div>
	</div>
</div>
