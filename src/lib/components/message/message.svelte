<script lang="ts">
	import type { Message } from '$lib/messages';

	import MessageUser from './message-user.svelte';
	import MessageAssistant from './message-assistant.svelte';

	export type MessageStatus = 'submitted' | 'streaming' | 'ready' | 'error';

	interface Props {
		message: Message;
		status?: MessageStatus;
		isLastMessage?: boolean;
		messageIndex?: number;
		latestToolCallMessageIndex?: Map<string, number>;
	}

	let {
		message,
		status = 'ready',
		isLastMessage = false,
		messageIndex,
		latestToolCallMessageIndex
	}: Props = $props();
</script>

<div class="mb-8">
	{#if message.role === 'user'}
		<MessageUser {message} />
	{:else if message.role === 'assistant'}
		<MessageAssistant
			{message}
			{status}
			{isLastMessage}
			{messageIndex}
			{latestToolCallMessageIndex}
		/>
	{/if}
</div>
