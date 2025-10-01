<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	import { toast } from 'svelte-sonner';
	import { toggleMode } from 'mode-watcher';

	import IconArrowLeft from '~icons/hugeicons/arrow-left-01';
	import IconSun from '~icons/hugeicons/sun-02';
	import IconMoon from '~icons/hugeicons/moon-02';
	import IconLoading from '~icons/hugeicons/loading-03';
	import IconGoogle from '~icons/hugeicons/google';

	import darkBackground from '$lib/assets/bg-dark.png';
	import lightBackground from '$lib/assets/bg-light.png';

	import { signIn } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';

	let isLoading = $state(false);

	const redirectTo = $derived(page.url.searchParams.get('redirect'));

	const providers = [
		{ provider: 'google', icon: IconGoogle, label: 'Sign in with Google' }
	] as const;

	type ProviderName = (typeof providers)[number]['provider'];

	async function handleSignIn(provider: string) {
		isLoading = true;
		try {
			await signIn.social({ provider: provider as ProviderName, callbackURL: redirectTo || '/' });
		} catch {
			toast.error('Unable to sign in, please try again.');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Artisan</title>
	<meta name="description" content="Sign in to your Artisan account." />
</svelte:head>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="bg-muted/60 relative hidden lg:block">
		<img
			src={lightBackground}
			sizes="60vw"
			alt="Background"
			class="absolute inset-0 h-full w-full object-cover dark:hidden"
		/>
		<img
			src={darkBackground}
			sizes="60vw"
			alt="Background"
			class="absolute inset-0 hidden h-full w-full object-cover dark:block"
		/>
	</div>
	<div class="bg-background relative flex flex-col gap-4 p-6">
		<div class="absolute top-4 left-4">
			<Button onclick={() => goto(resolve('/'))} variant="outline" size="icon" disabled={isLoading}>
				<IconArrowLeft class="size-5" />
			</Button>
		</div>
		<div class="absolute top-4 right-4">
			<Button onclick={toggleMode} variant="outline" size="icon" disabled={isLoading}>
				<IconSun
					class="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
				/>
				<IconMoon
					class="absolute size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-sm">
				<div class="mb-8 text-center">
					<h1 class="text-3xl font-semibold tracking-tight">Sign in to Artisan</h1>
					<p class="text-muted-foreground mt-2 text-sm">Use your Google account to continue.</p>
				</div>
				<div class="grid gap-3">
					{#each providers as provider (provider.provider)}
						<Button
							class="relative h-11 w-full justify-center font-normal"
							variant="outline"
							disabled={isLoading}
							onclick={() => handleSignIn(provider.provider)}
						>
							{#if isLoading}
								<IconLoading class="absolute left-4 size-5 animate-spin" />
							{:else}
								<provider.icon class="absolute left-4 size-4" />
							{/if}
							<span class={isLoading ? 'opacity-70' : ''}>
								{isLoading ? 'Signing in...' : provider.label}
							</span>
						</Button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
