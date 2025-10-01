<script lang="ts">
	import SvelteMarkdown from '@humanspeak/svelte-markdown';

	import { Tool } from '$lib/components/tool';
	import type { Message } from '$lib/messages';
	import type { ToolOutput, ToolInput } from '$lib/server/tools';

	import type { MessageStatus } from './message.svelte';

	interface Props {
		message: Message;
		status: MessageStatus;
		isLastMessage?: boolean;
		messageIndex?: number;
		latestToolCallMessageIndex?: Map<string, number>;
	}

	let {
		message,
		status,
		isLastMessage = false,
		messageIndex = 0,
		latestToolCallMessageIndex
	}: Props = $props();

	function isLatestToolCall(toolCallId?: string) {
		if (!toolCallId || !latestToolCallMessageIndex) {
			return true;
		}

		const latestIndex = latestToolCallMessageIndex.get(toolCallId);
		return latestIndex === undefined || latestIndex === messageIndex;
	}

	const visibleParts = $derived(() =>
		message.parts.filter((part) => {
			if (part.type === 'text') {
				return Boolean(part.text && part.text.trim());
			}

			if (part.type.startsWith('tool-') && 'input' in part) {
				return isLatestToolCall(part.toolCallId);
			}

			return false;
		})
	);
</script>

<div class="space-y-8">
	{#each visibleParts() as part, index (index)}
		{#if part.type === 'text'}
			<div class="mx-auto max-w-4xl">
				<div class="prose text-foreground/90 whitespace-pre-wrap">
					<SvelteMarkdown source={part.text} />
				</div>
			</div>
		{:else if part.type.startsWith('tool-') && 'input' in part}
			<div class="mx-auto max-w-4xl">
				<Tool
					toolName={part.type.replace('tool-', '')}
					input={part.input as ToolInput | undefined}
					output={part.output as ToolOutput | undefined}
					state={part.state}
				/>
			</div>
		{/if}
	{/each}

	{#if isLastMessage && (status === 'streaming' || status === 'submitted')}
		<div class="mx-auto mt-4 max-w-4xl">
			<div class="text-muted-foreground flex items-center gap-2">
				<span class="flex animate-pulse gap-1">...</span>
			</div>
		</div>
	{/if}
</div>
