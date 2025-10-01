<script lang="ts">
	import { untrack } from 'svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	interface SelectOption {
		value: string;
		label: string;
	}

	interface Props {
		value: string;
		onValueChange: (value: string) => void;
		options: SelectOption[];
		placeholder?: string;
		class?: string;
		triggerClass?: string;
		contentClass?: string;
	}

	let {
		value = $bindable(),
		onValueChange,
		options,
		placeholder,
		class: className,
		triggerClass,
		contentClass
	}: Props = $props();

	let mounted = $state(false);

	$effect(() => {
		// Ensure we're in browser and component is ready
		untrack(() => {
			mounted = true;
		});
	});
</script>

{#if mounted}
	<Select type="single" {value} {onValueChange}>
		<SelectTrigger class={triggerClass || className}>
			<span class="truncate">
				{options.find((opt) => opt.value === value)?.label || placeholder || 'Select...'}
			</span>
		</SelectTrigger>
		<SelectContent class={contentClass}>
			{#each options as option (option.value)}
				<SelectItem value={option.value}>{option.label}</SelectItem>
			{/each}
		</SelectContent>
	</Select>
{/if}
