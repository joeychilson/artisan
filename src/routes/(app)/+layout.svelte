<script lang="ts">
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	import { Header } from '$lib/components/header';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<Header user={data.user} />
<main class="relative h-dvh flex-shrink flex-grow">
	{@render children()}
</main>
