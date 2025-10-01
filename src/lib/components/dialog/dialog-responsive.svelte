<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import type { Snippet } from 'svelte';

	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '$lib/components/ui/drawer';

	const isDesktop = new MediaQuery('(min-width: 768px)');

	interface Props {
		open?: boolean;
		title: string;
		subtitle?: string;
		icon?: Snippet;
		iconContainerClass?: string;
		children: Snippet;
		contentClass?: string;
	}

	let {
		open = $bindable(false),
		title,
		subtitle,
		icon,
		children,
		contentClass = 'sm:max-w-lg',
		iconContainerClass = 'bg-muted rounded-lg p-2'
	}: Props = $props();
</script>

{#if isDesktop.current}
	<Dialog bind:open>
		<DialogContent class={contentClass}>
			<DialogHeader class="space-y-1">
				<div class="flex items-center gap-3">
					{#if icon}
						<div class={iconContainerClass}>
							{@render icon()}
						</div>
					{/if}
					<div>
						<DialogTitle class="text-base">{title}</DialogTitle>
						{#if subtitle}
							<p class="text-muted-foreground text-xs">{subtitle}</p>
						{/if}
					</div>
				</div>
			</DialogHeader>

			{@render children()}
		</DialogContent>
	</Dialog>
{:else}
	<Drawer bind:open>
		<DrawerContent class="max-h-[90vh]">
			<DrawerHeader class="text-left">
				<div class="flex items-center gap-3">
					{#if icon}
						<div class={iconContainerClass}>
							{@render icon()}
						</div>
					{/if}
					<div>
						<DrawerTitle class="text-base">{title}</DrawerTitle>
						{#if subtitle}
							<p class="text-muted-foreground text-xs">{subtitle}</p>
						{/if}
					</div>
				</div>
			</DrawerHeader>

			<div class="flex-1 overflow-y-auto px-4 pb-6">
				{@render children()}
			</div>
		</DrawerContent>
	</Drawer>
{/if}
