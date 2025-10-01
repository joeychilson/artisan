<script lang="ts">
	import { onMount } from 'svelte';

	import IconChevronLeft from '~icons/hugeicons/arrow-left-02';
	import IconChevronRight from '~icons/hugeicons/arrow-right-02';
	import IconCheck from '~icons/hugeicons/tick-02';
	import IconClose from '~icons/hugeicons/cancel-01';
	import IconCopy from '~icons/hugeicons/copy-link';
	import IconDownload from '~icons/hugeicons/download-02';
	import IconShare from '~icons/hugeicons/share-08';
	import IconAttach from '~icons/hugeicons/attachment';
	import IconAudio from '~icons/hugeicons/audio-wave-01';

	import { Button } from '$lib/components/ui/button';
	import { getFileAttachmentContext } from '$lib/contexts/file-attachment.svelte';
	import { createAttachableFileFromImage } from '$lib/utils/file-attachment';

	import ViewerImage from './viewer-image.svelte';
	import ViewerVideo from './viewer-video.svelte';
	import ViewerAudio from './viewer-audio.svelte';

	import type { ViewerProps } from './types';

	const attachmentContext = getFileAttachmentContext();

	let { files, initialIndex = 0, onClose }: ViewerProps = $props();

	let currentIndex = $state(initialIndex);
	let copied = $state(false);
	let attached = $state(false);
	let touchStartX = $state(0);
	let touchStartY = $state(0);
	let thumbnailScrollOffset = $state(0);
	let maxVisibleThumbnails = $state(7);

	const currentFile = $derived(files[currentIndex]);
	const canGoPrev = $derived(currentIndex > 0);
	const canGoNext = $derived(currentIndex < files.length - 1);
	const hasMultipleFiles = $derived(files.length > 1);
	const shareSupported = $derived(typeof navigator !== 'undefined' && 'share' in navigator);
	const visibleThumbnails = $derived(
		files.slice(
			Math.max(0, thumbnailScrollOffset - 1),
			thumbnailScrollOffset + maxVisibleThumbnails + 1
		)
	);
	const canScrollThumbnailsLeft = $derived(thumbnailScrollOffset > 0);
	const canScrollThumbnailsRight = $derived(
		thumbnailScrollOffset + maxVisibleThumbnails < files.length
	);

	function goToPrevious() {
		if (!canGoPrev) return;
		currentIndex--;

		if (hasMultipleFiles) {
			centerThumbnailView(currentIndex);
		}
	}

	function goToNext() {
		if (!canGoNext) return;
		currentIndex++;

		if (hasMultipleFiles) {
			centerThumbnailView(currentIndex);
		}
	}

	function selectFile(index: number) {
		if (index === currentIndex || !files[index]) return;
		currentIndex = index;

		centerThumbnailView(index);
	}

	function centerThumbnailView(targetIndex: number) {
		const halfVisible = Math.floor(maxVisibleThumbnails / 2);
		let newOffset = targetIndex - halfVisible;

		newOffset = Math.max(0, Math.min(newOffset, files.length - maxVisibleThumbnails));
		thumbnailScrollOffset = newOffset;
	}

	function scrollThumbnailsLeft() {
		if (!canScrollThumbnailsLeft) return;
		thumbnailScrollOffset = Math.max(0, thumbnailScrollOffset - 1);
	}

	function scrollThumbnailsRight() {
		if (!canScrollThumbnailsRight) return;
		thumbnailScrollOffset = Math.min(
			files.length - maxVisibleThumbnails,
			thumbnailScrollOffset + 1
		);
	}

	async function handleCopy() {
		if (!currentFile) return;

		try {
			const response = await fetch(currentFile.url);
			const blob = await response.blob();
			await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch (error) {
			console.error('Failed to copy file', error);
		}
	}

	async function handleShare() {
		if (!currentFile || !shareSupported) return;

		try {
			const response = await fetch(currentFile.url);
			const blob = await response.blob();
			const extension =
				currentFile.type === 'video' ? 'mp4' : currentFile.type === 'audio' ? 'mp3' : 'png';
			const file = new File([blob], currentFile.name || `${currentFile.type}.${extension}`, {
				type: blob.type
			});
			await navigator.share({ files: [file], title: currentFile.name || currentFile.type });
		} catch (error) {
			console.error('Failed to share file', error);
		}
	}

	function handleDownload() {
		if (!currentFile) return;

		const link = document.createElement('a');
		link.href = currentFile.url;
		const extension =
			currentFile.type === 'video' ? '.mp4' : currentFile.type === 'audio' ? '.mp3' : '.png';
		link.download = currentFile.name || `${currentFile.type}-${currentIndex + 1}${extension}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function handleAttach() {
		if (!currentFile || !attachmentContext) return;

		const attachableFile = createAttachableFileFromImage(
			currentFile.url,
			currentFile.name || `${currentFile.type} ${currentIndex + 1}`,
			'viewer'
		);

		attachmentContext.attachFile(attachableFile);
		attached = true;
		setTimeout(() => (attached = false), 1600);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!files.length) return;

		if (event.shiftKey) {
			switch (event.key) {
				case 'ArrowLeft':
					event.preventDefault();
					scrollThumbnailsLeft();
					break;
				case 'ArrowRight':
					event.preventDefault();
					scrollThumbnailsRight();
					break;
			}
			return;
		}

		switch (event.key) {
			case 'Escape':
				onClose();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				goToPrevious();
				break;
			case 'ArrowRight':
				event.preventDefault();
				goToNext();
				break;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		const target = event.target as HTMLElement;

		if (event.target === event.currentTarget) {
			onClose();
			return;
		}

		if (target) {
			const isButton = target.tagName === 'BUTTON' || target.closest('button');
			const isImg = target.tagName === 'IMG';
			const isVideo = target.tagName === 'VIDEO';
			const isAudio = target.tagName === 'AUDIO';
			const isMedia = isImg || isVideo || isAudio;
			const isCarouselArea = target.closest('.thumbnail-area');

			if (!isButton && !isMedia && !isCarouselArea) {
				onClose();
			}
		}
	}

	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
	}

	function handleTouchEnd(event: TouchEvent) {
		if (!files.length || !hasMultipleFiles) return;

		const touchEndX = event.changedTouches[0].clientX;
		const touchEndY = event.changedTouches[0].clientY;
		const deltaX = touchStartX - touchEndX;
		const deltaY = touchStartY - touchEndY;

		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
			if (deltaX > 0) {
				goToNext();
			} else {
				goToPrevious();
			}
		}
	}

	onMount(() => {
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		// Center the initial view
		if (hasMultipleFiles) {
			centerThumbnailView(currentIndex);
		}

		// Update max visible thumbnails based on screen size
		const updateMaxVisible = () => {
			const width = window.innerWidth;
			if (width < 640) {
				maxVisibleThumbnails = 3;
			} else if (width < 1024) {
				maxVisibleThumbnails = 5;
			} else {
				maxVisibleThumbnails = 7;
			}
			centerThumbnailView(currentIndex);
		};

		updateMaxVisible();
		window.addEventListener('resize', updateMaxVisible);

		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener('resize', updateMaxVisible);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 backdrop-blur"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="dialog"
	aria-modal="true"
	aria-label="{currentFile?.type || 'Media'} viewer"
	tabindex="-1"
>
	<div class="relative flex h-full items-center justify-center px-4 py-6 sm:px-10">
		<div class="absolute top-4 right-4">
			<Button type="button" size="icon" variant="ghost" onclick={onClose} aria-label="Close viewer">
				<IconClose class="size-5" />
			</Button>
		</div>

		<div
			class="relative flex w-full max-w-5xl flex-col items-center gap-12 pb-40"
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
		>
			<div class="relative flex w-full justify-center">
				{#if hasMultipleFiles}
					<Button
						type="button"
						size="icon"
						variant="ghost"
						onclick={goToPrevious}
						disabled={!canGoPrev}
						aria-label="Previous file"
						class="text-foreground/70 hover:text-foreground absolute top-1/2 left-0 -translate-y-1/2 sm:left-[-3.5rem]"
					>
						<IconChevronLeft class="size-6" />
					</Button>
				{/if}

				{#if currentFile}
					{#if currentFile.type === 'image'}
						<ViewerImage file={currentFile} />
					{:else if currentFile.type === 'video'}
						<ViewerVideo file={currentFile} />
					{:else if currentFile.type === 'audio'}
						<ViewerAudio file={currentFile} />
					{/if}
				{/if}

				{#if hasMultipleFiles}
					<Button
						type="button"
						size="icon"
						variant="ghost"
						onclick={goToNext}
						disabled={!canGoNext}
						aria-label="Next file"
						class="text-foreground/70 hover:text-foreground absolute top-1/2 right-0 -translate-y-1/2 sm:right-[-3.5rem]"
					>
						<IconChevronRight class="size-6" />
					</Button>
				{/if}
			</div>
		</div>

		{#if hasMultipleFiles}
			<div class="thumbnail-area fixed bottom-4 left-1/2 z-60 -translate-x-1/2">
				<div class="flex flex-col items-center gap-4">
					<div
						class="bg-card/80 border-border/50 relative overflow-hidden rounded-2xl border px-4 py-2 backdrop-blur-sm"
						style="width: {maxVisibleThumbnails * 68 + (maxVisibleThumbnails - 1) * 12 + 32}px;"
					>
						{#if canScrollThumbnailsLeft}
							<div
								class="from-card/80 pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent"
							></div>
						{/if}
						{#if canScrollThumbnailsRight}
							<div
								class="from-card/80 pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 bg-gradient-to-l to-transparent"
							></div>
						{/if}

						<div
							class="flex items-center gap-3 transition-transform duration-300 ease-out"
							style="transform: translateX({-(
								thumbnailScrollOffset - Math.max(0, thumbnailScrollOffset - 1)
							) * 80}px);"
						>
							{#each visibleThumbnails as file, visibleIndex (Math.max(0, thumbnailScrollOffset - 1) + visibleIndex)}
								{@const actualIndex = Math.max(0, thumbnailScrollOffset - 1) + visibleIndex}
								{@const isInMainView =
									actualIndex >= thumbnailScrollOffset &&
									actualIndex < thumbnailScrollOffset + maxVisibleThumbnails}
								<button
									type="button"
									onclick={() => selectFile(actualIndex)}
									class="focus-visible:ring-primary relative flex h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 {actualIndex ===
									currentIndex
										? 'border-primary scale-105 shadow-lg'
										: 'border-border/50 hover:border-border opacity-70 hover:scale-102 hover:opacity-100'} {!isInMainView
										? 'scale-90 opacity-50'
										: ''}"
									aria-label={`View ${file.type} ${actualIndex + 1}`}
									aria-pressed={actualIndex === currentIndex}
								>
									{#if file.type === 'image'}
										<img
											src={file.url}
											alt={file.name || `${file.type} ${actualIndex + 1}`}
											class="size-full object-cover"
											loading="lazy"
										/>
									{:else if file.type === 'video'}
										<video src={file.url} class="size-full object-cover" preload="metadata" muted
										></video>
									{:else if file.type === 'audio'}
										<div
											class="bg-muted/80 flex size-full items-center justify-center backdrop-blur-sm"
										>
											<IconAudio class="text-muted-foreground size-7" />
										</div>
									{/if}

									{#if actualIndex === currentIndex}
										<div
											class="border-primary pointer-events-none absolute inset-0 rounded-xl border-2"
										></div>
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<div class="flex items-center gap-3">
						{#if attachmentContext}
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onclick={handleAttach}
								disabled={!currentFile}
							>
								{#if attached}
									<IconCheck class="size-4 text-emerald-500" />
									<span>Attached</span>
								{:else}
									<IconAttach class="size-4" />
									<span>Attach</span>
								{/if}
							</Button>
						{/if}
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onclick={handleCopy}
							disabled={!currentFile}
						>
							{#if copied}
								<IconCheck class="size-4 text-emerald-500" />
								<span>Copied</span>
							{:else}
								<IconCopy class="size-4" />
								<span>Copy</span>
							{/if}
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onclick={handleDownload}
							disabled={!currentFile}
						>
							<IconDownload class="size-4" />
							<span>Download</span>
						</Button>
						{#if shareSupported}
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onclick={handleShare}
								disabled={!currentFile}
							>
								<IconShare class="size-4" />
								<span>Share</span>
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
