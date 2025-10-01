<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import type { User } from 'better-auth';

	import IconHome from '~icons/hugeicons/home-03';
	import IconLogin from '~icons/hugeicons/login-01';
	import IconFolder from '~icons/hugeicons/folder-02';
	import IconGallery from '~icons/hugeicons/image-02';

	import { Button } from '$lib/components/ui/button';
	import { currentProjectStore } from '$lib/stores/current-project.svelte';

	import UserMenu from './header-user-menu.svelte';

	let { user }: { user: User | undefined } = $props();
</script>

<header
	class="bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 w-full backdrop-blur"
>
	<div class="flex h-16 items-center px-4">
		<div class="flex-1">
			<Button
				onclick={() => goto(resolve('/'), { invalidateAll: true })}
				variant="outline"
				size="icon"
			>
				<IconHome class="size-5" />
			</Button>
		</div>

		<div class="flex-1 text-center">
			{#if currentProjectStore.project?.title}
				<h1 class="truncate text-lg font-semibold">{currentProjectStore.project.title}</h1>
			{/if}
		</div>

		<div class="flex flex-1 justify-end">
			<div class="flex items-center gap-1 sm:gap-2">
				{#if user}
					<Button
						variant="outline"
						size="icon"
						class="hidden sm:flex"
						onclick={() => goto(resolve('/projects'))}
					>
						<IconFolder class="size-5" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						class="hidden sm:flex"
						onclick={() => goto(resolve('/gallery'))}
					>
						<IconGallery class="size-5" />
					</Button>
					<UserMenu {user} />
				{:else}
					<Button variant="outline" onclick={() => goto(resolve('/signin'))}>
						<IconLogin class="size-5" />
						Sign In
					</Button>
				{/if}
			</div>
		</div>
	</div>
</header>
