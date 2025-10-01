<script lang="ts">
	import IconAudioPlaceholder from '~icons/hugeicons/audio-wave-01';
	import IconPlay from '~icons/hugeicons/play';
	import IconPause from '~icons/hugeicons/pause';
	import IconVolume from '~icons/hugeicons/volume-high';
	import IconVolumeLow from '~icons/hugeicons/volume-low';
	import IconVolumeOff from '~icons/hugeicons/volume-off';
	import IconSkipBack from '~icons/hugeicons/previous';
	import IconSkipForward from '~icons/hugeicons/next';

	import { Progress } from '$lib/components/ui/progress';
	import { Slider } from '$lib/components/ui/slider';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';

	import type { ViewerFile } from './types';

	let { file }: { file: ViewerFile } = $props();

	let isLoading = $state(true);
	let audioRef = $state<HTMLAudioElement>();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(0.7);
	let isMuted = $state(false);
	let animationFrame = $state<number>(0);

	function startSmoothUpdates() {
		const updateProgress = () => {
			if (audioRef && isPlaying && !audioRef.paused) {
				currentTime = audioRef.currentTime;
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
		if (!audioRef) return;

		if (isPlaying) {
			audioRef.pause();
			isPlaying = false;
			stopSmoothUpdates();
		} else {
			audioRef.play();
			isPlaying = true;
			startSmoothUpdates();
		}
	}

	function handleTimeUpdate() {
		if (audioRef) {
			currentTime = audioRef.currentTime;
		}
	}

	function handleLoadedMetadata() {
		if (audioRef) {
			duration = audioRef.duration;
			audioRef.volume = volume;
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
		if (audioRef) {
			audioRef.currentTime = 0;
			currentTime = 0;
		}
	}

	function handleVolumeChange() {
		if (audioRef) {
			volume = audioRef.volume;
			isMuted = audioRef.muted;
		}
	}

	function toggleMute() {
		if (!audioRef) return;

		if (isMuted) {
			audioRef.volume = volume;
			isMuted = false;
		} else {
			audioRef.volume = 0;
			isMuted = true;
		}
	}

	function handleSeek(event: Event) {
		if (!audioRef) return;
		const input = event.target as HTMLInputElement;
		audioRef.currentTime = parseFloat(input.value);
		currentTime = audioRef.currentTime;
	}

	function handleVolumeSliderChange(newVolume: number) {
		if (!audioRef) return;
		audioRef.volume = newVolume;
		volume = newVolume;
		if (newVolume > 0 && isMuted) {
			isMuted = false;
		}
	}

	function skipBackward() {
		if (!audioRef) return;
		audioRef.currentTime = Math.max(0, audioRef.currentTime - 10);
	}

	function skipForward() {
		if (!audioRef) return;
		audioRef.currentTime = Math.min(duration, audioRef.currentTime + 10);
	}

	function formatTime(seconds: number): string {
		if (!isFinite(seconds)) return '0:00';
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}
</script>

{#if file}
	<div class="w-full max-w-2xl">
		{#if isLoading}
			<div class="mb-4 flex justify-center">
				<div
					class="border-border/70 border-t-primary size-8 animate-spin rounded-full border-[3px]"
				></div>
			</div>
		{/if}

		<!-- Audio Player Card -->
		<div
			class="border-border/50 bg-background rounded-xl border p-4 transition-opacity duration-200"
			class:opacity-0={isLoading}
		>
			<audio
				bind:this={audioRef}
				src={file.url}
				onloadedmetadata={handleLoadedMetadata}
				ontimeupdate={handleTimeUpdate}
				onplay={handlePlay}
				onpause={handlePause}
				onended={handleEnded}
				onvolumechange={handleVolumeChange}
				preload="metadata"
				class="hidden"
			></audio>

			<!-- Main Controls -->
			<div class="flex items-center gap-3">
				<button
					onclick={skipBackward}
					class="hover:bg-muted/50 text-muted-foreground flex-shrink-0 rounded-lg p-2 transition-colors"
					aria-label="Skip back 10 seconds"
				>
					<IconSkipBack class="size-4" />
				</button>

				<button
					onclick={togglePlayPause}
					disabled={isLoading}
					class="hover:bg-primary/10 bg-muted flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-50 sm:h-10 sm:w-10"
					aria-label={isPlaying ? 'Pause' : 'Play'}
				>
					{#if isLoading}
						<div
							class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
					{:else if isPlaying}
						<IconPause class="text-primary h-5 w-5 sm:h-4 sm:w-4" />
					{:else}
						<IconPlay class="text-primary ml-0.5 h-5 w-5 sm:h-4 sm:w-4" />
					{/if}
				</button>

				<button
					onclick={skipForward}
					class="hover:bg-muted/50 text-muted-foreground flex-shrink-0 rounded-lg p-2 transition-colors"
					aria-label="Skip forward 10 seconds"
				>
					<IconSkipForward class="size-4" />
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
							aria-label="Seek audio"
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
									{:else if volume > 0.5}
										<IconVolume class="h-4 w-4" />
									{:else}
										<IconVolumeLow class="h-4 w-4" />
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
									{:else if volume > 0.5}
										<IconVolume class="h-4 w-4" />
									{:else}
										<IconVolumeLow class="h-4 w-4" />
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
			</div>
		</div>
	</div>
{:else}
	<div
		class="text-muted-foreground flex h-[60vh] w-full flex-col items-center justify-center gap-3"
	>
		<IconAudioPlaceholder class="size-12" />
		<p class="text-sm font-medium">No audio available</p>
	</div>
{/if}
