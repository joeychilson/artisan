<script lang="ts">
	import { onDestroy } from 'svelte';

	import IconVideoPlaceholder from '~icons/hugeicons/video-02';
	import IconPlay from '~icons/hugeicons/play';
	import IconPause from '~icons/hugeicons/pause';
	import IconVolume from '~icons/hugeicons/volume-high';
	import IconVolumeOff from '~icons/hugeicons/volume-off';
	import IconFullscreen from '~icons/hugeicons/full-screen';

	import { Progress } from '$lib/components/ui/progress';
	import { Slider } from '$lib/components/ui/slider';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';

	import type { ViewerFile } from './types';

	let { file }: { file: ViewerFile } = $props();

	let isLoading = $state(true);
	let videoRef = $state<HTMLVideoElement>();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(0.7);
	let isMuted = $state(false);
	let showControls = $state(false);
	let controlsTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
	let animationFrame = $state<number>(0);

	function startSmoothUpdates() {
		const updateProgress = () => {
			if (videoRef && isPlaying && !videoRef.paused) {
				currentTime = videoRef.currentTime;
				animationFrame = requestAnimationFrame(updateProgress);
			}
		};
		animationFrame = requestAnimationFrame(updateProgress);
	}

	function stopSmoothUpdates() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = 0;
		}
	}

	function togglePlayPause() {
		if (!videoRef) return;

		if (isPlaying) {
			videoRef.pause();
			isPlaying = false;
			stopSmoothUpdates();
		} else {
			videoRef.play();
			isPlaying = true;
			startSmoothUpdates();
		}
	}

	function handleTimeUpdate() {
		if (videoRef) {
			currentTime = videoRef.currentTime;
		}
	}

	function handleLoadedMetadata() {
		if (videoRef) {
			duration = videoRef.duration;
			videoRef.volume = volume;
			isLoading = false;
		}
	}

	function handlePlay() {
		isPlaying = true;
		startSmoothUpdates();
	}

	function handlePause() {
		isPlaying = false;
		stopSmoothUpdates();
	}

	function handleEnded() {
		isPlaying = false;
		stopSmoothUpdates();
		if (videoRef) {
			videoRef.currentTime = 0;
			currentTime = 0;
		}
	}

	function handleVolumeChange() {
		if (videoRef) {
			volume = videoRef.volume;
			isMuted = videoRef.muted;
		}
	}

	function toggleMute() {
		if (!videoRef) return;

		if (isMuted) {
			videoRef.volume = volume;
			isMuted = false;
		} else {
			videoRef.volume = 0;
			isMuted = true;
		}
	}

	function handleSeek(event: Event) {
		if (!videoRef) return;
		const input = event.target as HTMLInputElement;
		videoRef.currentTime = parseFloat(input.value);
		currentTime = videoRef.currentTime;
	}

	function handleVolumeSliderChange(newVolume: number) {
		if (!videoRef) return;
		videoRef.volume = newVolume;
		volume = newVolume;
		if (newVolume > 0 && isMuted) {
			isMuted = false;
		}
	}

	function toggleFullscreen() {
		if (!videoRef) return;

		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			videoRef.requestFullscreen();
		}
	}

	function formatTime(seconds: number): string {
		if (!isFinite(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function showVideoControls() {
		showControls = true;
		if (controlsTimeout) {
			clearTimeout(controlsTimeout);
		}
		controlsTimeout = setTimeout(() => {
			if (isPlaying) {
				showControls = false;
			}
		}, 3000);
	}

	function hideVideoControls() {
		if (controlsTimeout) {
			clearTimeout(controlsTimeout);
		}
		showControls = false;
	}

	onDestroy(() => {
		stopSmoothUpdates();
		if (controlsTimeout) {
			clearTimeout(controlsTimeout);
			controlsTimeout = null;
		}
	});
</script>

{#if file}
	<div class="w-full max-w-4xl">
		{#if isLoading}
			<div class="mb-4 flex justify-center">
				<div
					class="border-border/70 border-t-primary size-8 animate-spin rounded-full border-[3px]"
				></div>
			</div>
		{/if}

		<div
			class="border-border/50 bg-background overflow-hidden rounded-xl border transition-opacity duration-200"
			class:opacity-0={isLoading}
			onmouseenter={showVideoControls}
			onmouseleave={hideVideoControls}
			onmousemove={showVideoControls}
			role="application"
			aria-label="Video player"
		>
			<div class="relative aspect-video bg-black">
				<video
					bind:this={videoRef}
					src={file.url}
					class="h-full w-full cursor-pointer object-contain"
					onloadedmetadata={handleLoadedMetadata}
					ontimeupdate={handleTimeUpdate}
					onplay={handlePlay}
					onpause={handlePause}
					onended={handleEnded}
					onvolumechange={handleVolumeChange}
					onclick={togglePlayPause}
					controls={false}
					preload="metadata"
					playsInline
				>
					<track kind="captions" />
				</video>

				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-300"
					class:opacity-0={!showControls && isPlaying}
					class:opacity-100={showControls || !isPlaying}
				>
					<div class="absolute inset-0 flex items-center justify-center">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
						>
							{#if isPlaying}
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
						onclick={togglePlayPause}
						class="hover:bg-primary/10 bg-muted flex h-10 w-10 items-center justify-center rounded-full transition-colors"
						aria-label={isPlaying ? 'Pause' : 'Play'}
					>
						{#if isPlaying}
							<IconPause class="text-primary h-4 w-4" />
						{:else}
							<IconPlay class="text-primary ml-0.5 h-4 w-4" />
						{/if}
					</button>

					<div class="flex-1">
						<div class="group relative">
							<Progress
								value={duration ? (currentTime / duration) * 100 : 0}
								class="h-2 cursor-pointer"
							/>
							<input
								type="range"
								min="0"
								max={duration || 0}
								value={currentTime}
								step="0.1"
								oninput={handleSeek}
								class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
								aria-label="Seek video"
							/>
						</div>
						<div class="text-muted-foreground mt-1 flex justify-between text-xs">
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(duration)}</span>
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
										{#if isMuted}
											<IconVolumeOff class="h-4 w-4" />
										{:else}
											<IconVolume class="h-4 w-4" />
										{/if}
									</button>
								{/snippet}
							</PopoverTrigger>
							<PopoverContent class="w-48 p-3" align="center">
								<div class="flex items-center gap-3">
									<button
										onclick={toggleMute}
										class="hover:bg-muted rounded-lg p-1 transition-colors"
										aria-label={isMuted ? 'Unmute' : 'Mute'}
									>
										{#if isMuted}
											<IconVolumeOff class="h-4 w-4" />
										{:else}
											<IconVolume class="h-4 w-4" />
										{/if}
									</button>
									<div class="flex-1">
										<Slider
											value={isMuted ? 0 : volume}
											type="single"
											max={1}
											step={0.1}
											class="w-full"
											onValueChange={handleVolumeSliderChange}
										/>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<button
						onclick={toggleFullscreen}
						class="hover:bg-muted/50 text-muted-foreground rounded-lg p-2 transition-colors"
						aria-label="Toggle fullscreen"
					>
						<IconFullscreen class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div
		class="text-muted-foreground flex h-[60vh] w-full flex-col items-center justify-center gap-3"
	>
		<IconVideoPlaceholder class="size-12" />
		<p class="text-sm font-medium">No video available</p>
	</div>
{/if}
