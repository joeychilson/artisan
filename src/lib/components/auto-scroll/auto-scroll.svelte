<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		items: unknown[];
		isStreaming?: boolean;
		scrollThreshold?: number;
		mutationDelay?: number;
		onScrollButtonVisibilityChange?: (visible: boolean) => void;
		class?: string;
		children: Snippet;
	}

	let {
		items,
		isStreaming = false,
		scrollThreshold = 100,
		mutationDelay = 350,
		onScrollButtonVisibilityChange,
		class: className = '',
		children
	}: Props = $props();

	let scrollContainer: HTMLElement;
	let isUserScrolledUp = $state(false);
	let previousItemCount = $state(items.length);

	function checkScrollNeeded() {
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const isScrollNeeded = scrollHeight > clientHeight;
		const isScrolledUp = scrollHeight - scrollTop - clientHeight > scrollThreshold;

		isUserScrolledUp = isScrolledUp;
		const showScrollButton = isScrollNeeded && isScrolledUp;

		onScrollButtonVisibilityChange?.(showScrollButton);
	}

	function scrollToBottom() {
		if (!scrollContainer) return;
		scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}

	function autoScroll(element: HTMLElement): { destroy(): void } {
		scrollContainer = element;
		let isDestroyed = false;

		function handleScroll() {
			if (!isDestroyed) checkScrollNeeded();
		}

		element.addEventListener('scroll', handleScroll);

		const observer = new MutationObserver(() => {
			if (!isDestroyed) {
				requestAnimationFrame(checkScrollNeeded);

				setTimeout(() => {
					if (!isDestroyed) {
						requestAnimationFrame(checkScrollNeeded);
					}
				}, mutationDelay);
			}
		});

		observer.observe(element, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ['style', 'class']
		});

		const resizeObserver = new ResizeObserver(() => {
			if (!isDestroyed) {
				requestAnimationFrame(checkScrollNeeded);
			}
		});

		resizeObserver.observe(element);

		scrollToBottom();

		return {
			destroy() {
				isDestroyed = true;
				element.removeEventListener('scroll', handleScroll);
				observer.disconnect();
				resizeObserver.disconnect();
			}
		};
	}

	$effect(() => {
		if (!scrollContainer) return;

		const currentItemCount = items.length;

		const shouldScrollToBottom =
			!isUserScrolledUp && (currentItemCount > previousItemCount || isStreaming);

		previousItemCount = currentItemCount;

		tick().then(() => {
			if (!scrollContainer) return;

			if (shouldScrollToBottom) {
				scrollToBottom();
				tick().then(() => {
					checkScrollNeeded();
				});
				return;
			}

			checkScrollNeeded();
		});
	});

	export function scrollToBottomManually() {
		scrollToBottom();
	}
</script>

<div class={className} use:autoScroll>
	{@render children()}
</div>
