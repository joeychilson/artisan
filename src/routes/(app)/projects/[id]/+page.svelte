<script lang="ts">
	import type { PageData } from './$types';

	import { Chat } from '$lib/components/chat';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.project.title || 'Untitled Project'} - Artisan</title>
	<meta
		name="description"
		content="View and interact with a project created with your imagination"
	/>
	<meta name="robots" content="noindex" />
</svelte:head>

<Chat
	id={data.project.id}
	title={data.project.title || 'Untitled Project'}
	messages={data.project.messages}
	resume={data.project.resume}
/>
