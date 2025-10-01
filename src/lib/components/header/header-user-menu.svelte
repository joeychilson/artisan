<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import type { User } from 'better-auth';
	import { setMode, mode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';

	import IconSettings from '~icons/hugeicons/settings-01';
	import IconMoon from '~icons/hugeicons/moon-02';
	import IconSun from '~icons/hugeicons/sun-02';
	import IconLogout from '~icons/hugeicons/logout-01';
	import IconFolder from '~icons/hugeicons/folder-02';
	import IconGallery from '~icons/hugeicons/image-02';

	import { signOut } from '$lib/auth';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	let { user }: { user: User } = $props();
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Avatar
				class="size-9 rounded-lg border"
				aria-label="User menu for {user?.name || 'User'}"
				{...props}
			>
				{#if user && user.image}
					<AvatarImage src={user.image} alt={user.name || 'User avatar'} />
				{/if}
				<AvatarFallback class="size-9 rounded-lg">
					{user?.name?.[0] || '?'}
				</AvatarFallback>
			</Avatar>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" preventScroll={false} class="w-40">
		<DropdownMenuItem class="sm:hidden" onclick={() => goto(resolve('/projects'))}>
			<IconFolder class="size-4" />
			<span>Projects</span>
		</DropdownMenuItem>
		<DropdownMenuItem class="sm:hidden" onclick={() => goto(resolve('/gallery'))}>
			<IconGallery class="size-4" />
			<span>Gallery</span>
		</DropdownMenuItem>
		<DropdownMenuItem onclick={() => goto(resolve('/settings'))}>
			<IconSettings class="size-4" />
			<span>Settings</span>
		</DropdownMenuItem>
		<DropdownMenuItem
			onclick={() => {
				if (mode.current === 'light') {
					setMode('dark');
				} else {
					setMode('light');
				}
			}}
		>
			{#if mode.current === 'light'}
				<IconMoon class="size-4" />
				<span>Dark Mode</span>
			{:else}
				<IconSun class="size-4" />
				<span>Light Mode</span>
			{/if}
		</DropdownMenuItem>
		<DropdownMenuItem
			onclick={async () => {
				await signOut();
				goto(resolve('/signin'), { invalidateAll: true });
				toast.success('Goodbye! Hope to see you back soon!');
			}}
		>
			<IconLogout class="size-4" />
			<span>Sign out</span>
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
