<script lang="ts">
	import type { LayoutData } from './$types';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import IconLogo from '~icons/hugeicons/paint-board';
	import IconHome from '~icons/hugeicons/home-07';

	import { Header } from '$lib/components/header';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: LayoutData } = $props();

	const errors: Record<number, { title: string; message: string }> = {
		404: { title: 'Page Not Found', message: "The page you're looking for doesn't exist." },
		403: { title: 'Access Denied', message: "You don't have permission to view this page." },
		500: { title: 'Server Error', message: 'Something went wrong on our end.' }
	};

	let errorInfo = errors[page.status] || {
		title: 'Something Went Wrong',
		message: 'An unexpected error occurred.'
	};
</script>

<svelte:head>
	<title>{errorInfo.title} - Artisan</title>
</svelte:head>

<div class="flex h-screen w-full flex-col">
	<Header user={data.user} />
	<div class="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center p-4 sm:p-6">
		<div class="max-w-md text-center">
			<IconLogo class="text-muted-foreground mx-auto mb-4 size-10" />

			<h1 class="mb-2 text-xl font-bold tracking-tight">
				{errorInfo.title}
			</h1>

			<p class="text-muted-foreground mb-6 text-sm">
				{errorInfo.message}
			</p>

			<div class="flex flex-col justify-center gap-3 sm:flex-row">
				<Button onclick={() => goto(resolve('/'))} variant="outline">
					<IconHome class="size-4" />
					Go home
				</Button>
			</div>
		</div>
	</div>
</div>
