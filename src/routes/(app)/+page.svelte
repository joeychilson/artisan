<script lang="ts">
	import { Chat } from '$lib/components/chat';
</script>

<svelte:head>
	<title>Artisan</title>
	<meta name="description" content="Create anything you can imagine" />
</svelte:head>

<Chat id={crypto.randomUUID()} messages={[]} />
