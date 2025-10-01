<script lang="ts">
	import IconPlay from '~icons/hugeicons/play';
	import IconPause from '~icons/hugeicons/pause';
	import IconDownload from '~icons/hugeicons/download-04';
	import IconVolumeHigh from '~icons/hugeicons/volume-high';
	import IconVolumeLow from '~icons/hugeicons/volume-low';
	import IconVolumeMute from '~icons/hugeicons/volume-mute-02';

	import { Progress } from '$lib/components/ui/progress';
	import { Slider } from '$lib/components/ui/slider';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { useMediaPlayer, formatTime } from '$lib/hooks/use-media-player.svelte';

	interface Props {
		audios: { url: string }[];
		onDragStart?: (event: DragEvent, audio: { url: string }, index: number) => void;
		onDragEnd?: () => void;
		showMultipleIndicator?: boolean;
		downloadFilename?: (index: number) => string;
		ariaLabel?: (index: number) => string;
		class?: string;
	}

	let {
		audios,
		onDragStart,
		onDragEnd,
		showMultipleIndicator = true,
		downloadFilename = (index) => `audio-${index + 1}.mp3`,
		ariaLabel = (index) => `Audio ${index + 1}`,
		class: className = ''
	}: Props = $props();

	const player = useMediaPlayer(audios.length);
	let draggingIndex = $state<number | null>(null);
	let audioElements = $state<(HTMLAudioElement | null)[]>([]);

	$effect(() => {
		audioElements.forEach((el, index) => {
			if (el) player.registerElement(index, el);
		});
	});

	function handleInternalDragStart(event: DragEvent, audio: { url: string }, index: number) {
		draggingIndex = index;
		onDragStart?.(event, audio, index);
	}

	function handleInternalDragEnd() {
		draggingIndex = null;
		onDragEnd?.();
	}
</script>

<div class="space-y-3 {className}">
	{#each audios as audio, index (`audio-${index}`)}
		{@const state = player.getState(index)}
		<div
			role="article"
			class="border-border/50 bg-background/50 rounded-xl border p-4 transition-opacity duration-200 {draggingIndex ===
			index
				? 'opacity-50'
				: 'opacity-100'}"
			ondragstart={(event) => handleInternalDragStart(event, audio, index)}
			ondragend={handleInternalDragEnd}
			draggable={!!onDragStart}
			aria-label={ariaLabel(index)}
		>
			<audio
				bind:this={audioElements[index]}
				src={audio.url}
				ontimeupdate={() => player.handleTimeUpdate(index)}
				onended={() => player.handleEnded(index)}
				onloadedmetadata={() => player.handleLoadedMetadata(index)}
				preload="metadata"
				class="hidden"
			></audio>

			<div class="flex items-center gap-3">
				<button
					onclick={() => player.togglePlayPause(index)}
					class="hover:bg-primary/10 bg-muted flex h-12 w-12 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10"
					aria-label={state.isPlaying ? 'Pause' : 'Play'}
				>
					{#if state.isPlaying}
						<IconPause class="text-primary h-5 w-5 sm:h-4 sm:w-4" />
					{:else}
						<IconPlay class="text-primary ml-0.5 h-5 w-5 sm:h-4 sm:w-4" />
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
							aria-label="Seek audio"
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
									{:else if state.volume > 0.5}
										<IconVolumeHigh class="h-4 w-4" />
									{:else}
										<IconVolumeLow class="h-4 w-4" />
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
									{:else if state.volume > 0.5}
										<IconVolumeHigh class="h-4 w-4" />
									{:else}
										<IconVolumeLow class="h-4 w-4" />
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

				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href={audio.url}
					download={downloadFilename(index)}
					class="hover:bg-muted/50 text-muted-foreground rounded-lg p-3 transition-colors sm:p-2"
					aria-label="Download audio"
				>
					<IconDownload class="h-5 w-5 sm:h-4 sm:w-4" />
				</a>
			</div>

			{#if showMultipleIndicator && audios.length > 1}
				<div class="text-muted-foreground mt-2 text-xs">
					Audio {index + 1} of {audios.length}
				</div>
			{/if}
		</div>
	{/each}
</div>
