<script lang="ts">
	import IconPlay from '~icons/hugeicons/play';
	import IconPause from '~icons/hugeicons/pause';
	import IconDownload from '~icons/hugeicons/download-04';
	import IconFullscreen from '~icons/hugeicons/full-screen';
	import IconVolumeHigh from '~icons/hugeicons/volume-high';
	import IconVolumeMute from '~icons/hugeicons/volume-mute-02';

	import { Progress } from '$lib/components/ui/progress';
	import { Slider } from '$lib/components/ui/slider';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { useMediaPlayer, formatTime } from '$lib/hooks/use-media-player.svelte';

	interface Props {
		videos: { url: string }[];
		onDragStart?: (event: DragEvent, video: { url: string }, index: number) => void;
		onDragEnd?: () => void;
		showMultipleIndicator?: boolean;
		downloadFilename?: (index: number) => string;
		ariaLabel?: (index: number) => string;
		class?: string;
	}

	let {
		videos,
		onDragStart,
		onDragEnd,
		showMultipleIndicator = true,
		downloadFilename = (index) => `video-${index + 1}.mp4`,
		ariaLabel = (index) => `Video ${index + 1}`,
		class: className = ''
	}: Props = $props();

	const player = useMediaPlayer(videos.length);

	let draggingIndex = $state<number | null>(null);
	let videoElements = $state<(HTMLVideoElement | null)[]>([]);

	$effect(() => {
		videoElements.forEach((el, index) => {
			if (el) player.registerElement(index, el);
		});
	});

	function toggleFullscreen(index: number, element: HTMLVideoElement) {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			element.requestFullscreen();
		}
	}

	function handleInternalDragStart(event: DragEvent, video: { url: string }, index: number) {
		draggingIndex = index;
		onDragStart?.(event, video, index);
	}

	function handleInternalDragEnd() {
		draggingIndex = null;
		onDragEnd?.();
	}
</script>

<div class="space-y-4 {className}">
	{#each videos as video, index (`video-${index}`)}
		{@const state = player.getState(index)}
		<div
			role="article"
			class="border-border/50 bg-background/50 overflow-hidden rounded-xl border transition-opacity duration-200 {draggingIndex ===
			index
				? 'opacity-50'
				: 'opacity-100'}"
			ondragstart={(event) => handleInternalDragStart(event, video, index)}
			ondragend={handleInternalDragEnd}
			draggable={!!onDragStart}
			aria-label={ariaLabel(index)}
		>
			<div class="relative aspect-video bg-black">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					bind:this={videoElements[index]}
					src={video.url}
					ontimeupdate={() => player.handleTimeUpdate(index)}
					onended={() => player.handleEnded(index)}
					onloadedmetadata={() => player.handleLoadedMetadata(index)}
					onclick={() => player.togglePlayPause(index)}
					preload="metadata"
					class="h-full w-full cursor-pointer object-contain"
					playsInline
				></video>

				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-300"
					class:opacity-0={state.isPlaying}
					class:opacity-100={!state.isPlaying}
				>
					<div class="absolute inset-0 flex items-center justify-center">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
						>
							{#if state.isPlaying}
								<IconPause class="h-8 w-8 text-white" />
							{:else}
								<IconPlay class="ml-1 h-8 w-8 text-white" />
							{/if}
						</div>
					</div>
				</div>
			</div>

			<div class="p-4">
				<div class="flex items-center gap-3">
					<button
						onclick={() => player.togglePlayPause(index)}
						class="hover:bg-primary/10 bg-muted flex h-10 w-10 items-center justify-center rounded-full transition-colors"
						aria-label={state.isPlaying ? 'Pause' : 'Play'}
					>
						{#if state.isPlaying}
							<IconPause class="text-primary h-4 w-4" />
						{:else}
							<IconPlay class="text-primary ml-0.5 h-4 w-4" />
						{/if}
					</button>

					<div class="flex-1">
						<div class="group relative">
							<Progress
								value={state.duration ? (state.currentTime / state.duration) * 100 : 0}
								class="h-2 cursor-pointer"
							/>
							<input
								type="range"
								min="0"
								max={state.duration || 0}
								value={state.currentTime}
								step="0.1"
								oninput={(e) =>
									player.handleSeek(index, parseFloat((e.target as HTMLInputElement).value))}
								class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
								aria-label="Seek video"
							/>
						</div>
						<div class="text-muted-foreground mt-1 flex justify-between text-xs">
							<span>{formatTime(state.currentTime)}</span>
							<span>{formatTime(state.duration)}</span>
						</div>
					</div>

					<div class="hidden sm:flex">
						<Popover>
							<PopoverTrigger>
								{#snippet child({ props })}
									<button
										{...props}
										class="hover:bg-muted/50 text-muted-foreground rounded-lg p-2 transition-colors"
										aria-label="Volume controls"
									>
										{#if state.isMuted}
											<IconVolumeMute class="h-4 w-4" />
										{:else}
											<IconVolumeHigh class="h-4 w-4" />
										{/if}
									</button>
								{/snippet}
							</PopoverTrigger>
							<PopoverContent class="w-48 p-3" align="center">
								<div class="flex items-center gap-3">
									<button
										onclick={() => player.toggleMute(index)}
										class="hover:bg-muted rounded-lg p-1 transition-colors"
										aria-label={state.isMuted ? 'Unmute' : 'Mute'}
									>
										{#if state.isMuted}
											<IconVolumeMute class="h-4 w-4" />
										{:else}
											<IconVolumeHigh class="h-4 w-4" />
										{/if}
									</button>
									<div class="flex-1">
										<Slider
											value={state.isMuted ? 0 : state.volume}
											type="single"
											max={1}
											step={0.1}
											class="w-full"
											onValueChange={(value: number) => player.handleVolumeChange(index, value)}
										/>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<button
						onclick={(e) => {
							const videoEl = e.currentTarget.closest('[role="article"]')?.querySelector('video');
							if (videoEl) toggleFullscreen(index, videoEl);
						}}
						class="hover:bg-muted/50 text-muted-foreground rounded-lg p-2 transition-colors"
						aria-label="Toggle fullscreen"
					>
						<IconFullscreen class="h-4 w-4" />
					</button>

					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={video.url}
						download={downloadFilename(index)}
						class="hover:bg-muted/50 text-muted-foreground rounded-lg p-2 transition-colors"
						aria-label="Download video"
						data-sveltekit-reload
					>
						<IconDownload class="h-4 w-4" />
					</a>
				</div>

				{#if showMultipleIndicator && videos.length > 1}
					<div class="text-muted-foreground mt-3 text-xs">
						Video {index + 1} of {videos.length}
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>
