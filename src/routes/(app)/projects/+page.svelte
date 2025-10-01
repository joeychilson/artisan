<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import IconFolder from '~icons/hugeicons/folder-02';
	import IconPlus from '~icons/hugeicons/plus-sign';
	import IconSearch from '~icons/hugeicons/search-01';
	import IconClose from '~icons/hugeicons/cancel-01';
	import IconAlert from '~icons/hugeicons/alert-02';
	import IconLoading from '~icons/hugeicons/loading-03';
	import IconCheckmark from '~icons/hugeicons/checkmark-circle-01';
	import IconClock from '~icons/hugeicons/clock-01';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { SelectAsync } from '$lib/components/ui/select';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { getUserProjects } from '$lib/remote/projects.remote';
	import { formatTimeAgo } from '$lib/utils/formatting';

	const initialProjects = await getUserProjects(undefined);

	let filteredProjects = $state(initialProjects);
	let search = $state('');
	let status = $state('all');
	let sort = $state<'newest' | 'oldest' | 'title' | 'status'>('newest');
	let searchTimeout: ReturnType<typeof setTimeout>;
	let isLoading = $state(false);

	const hasActiveFilters = $derived(search !== '' || status !== 'all' || sort !== 'newest');

	async function applyFilters() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			isLoading = true;
			try {
				const filters = {
					search: search || undefined,
					status: status === 'all' ? undefined : status,
					sort
				};

				const result = await getUserProjects(filters);
				filteredProjects = result;
			} finally {
				isLoading = false;
			}
		}, 300);
	}

	function handleSearchUpdate(value: string) {
		search = value;
		applyFilters();
	}

	function handleFilterChange(filterType: 'status' | 'sort', value: string) {
		if (filterType === 'status') {
			status = value;
		} else if (filterType === 'sort') {
			sort = value as 'newest' | 'oldest' | 'title' | 'status';
		}
		applyFilters();
	}

	async function clearFilters() {
		search = '';
		status = 'all';
		sort = 'newest';
		isLoading = true;
		try {
			const result = await getUserProjects(undefined);
			filteredProjects = result;
		} finally {
			isLoading = false;
		}
	}

	function getStatusIcon(projectStatus: string) {
		switch (projectStatus) {
			case 'ready':
				return { icon: IconCheckmark, class: 'text-green-500' };
			case 'streaming':
				return { icon: IconLoading, class: 'text-blue-500 animate-spin' };
			case 'submitted':
				return { icon: IconClock, class: 'text-blue-500' };
			case 'error':
				return { icon: IconAlert, class: 'text-red-500' };
			default:
				return { icon: IconClock, class: 'text-gray-500' };
		}
	}

	function getStatusLabel(projectStatus: string) {
		switch (projectStatus) {
			case 'streaming':
				return 'Processing';
			case 'submitted':
				return 'Submitted';
			case 'ready':
				return 'Ready';
			case 'error':
				return 'Failed';
			default:
				return 'Unknown';
		}
	}

	function getStatusColor(projectStatus: string) {
		switch (projectStatus) {
			case 'ready':
				return 'text-green-600 dark:text-green-400';
			case 'submitted':
			case 'streaming':
				return 'text-blue-600 dark:text-blue-400';
			case 'error':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-muted-foreground';
		}
	}

	onDestroy(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
	});
</script>

<svelte:head>
	<title>Projects - Artisan</title>
	<meta name="description" content="Manage your creation projects" />
</svelte:head>

<div class="mx-auto max-w-5xl pt-16 pb-6">
	<div class="flex items-center justify-between p-4 sm:p-6">
		<div class="flex items-center gap-3">
			<div class="bg-muted/50 flex size-10 items-center justify-center rounded-lg">
				<IconFolder class="text-muted-foreground size-5" />
			</div>
			<div class="space-y-0.5">
				<h1 class="font-medium">Projects</h1>
				<p class="text-muted-foreground text-xs">Manage your creation projects</p>
			</div>
		</div>
		<Button onclick={() => goto(resolve('/'))}>
			<IconPlus />
			New Project
		</Button>
	</div>

	<div class="px-4 sm:px-6">
		<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
			<div class="w-full md:max-w-sm">
				<div class="relative">
					<IconSearch
						class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
					/>
					<Input
						placeholder="Search projects..."
						value={search}
						oninput={(e) => handleSearchUpdate(e.currentTarget.value)}
						class="h-9 pr-10 pl-10"
					/>
					{#if search}
						<button
							onclick={() => handleSearchUpdate('')}
							class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
						>
							<IconClose class="size-4" />
						</button>
					{/if}
				</div>
			</div>

			<div class="flex items-center gap-2">
				{#if hasActiveFilters}
					<Button
						variant="ghost"
						size="sm"
						onclick={clearFilters}
						class="order-last h-9 px-2 text-xs md:order-first"
					>
						<IconClose class="size-3" />
						Clear
					</Button>
				{/if}

				<SelectAsync
					value={status}
					onValueChange={(v) => handleFilterChange('status', v)}
					options={[
						{ value: 'all', label: 'All Status' },
						{ value: 'submitted', label: 'Submitted' },
						{ value: 'streaming', label: 'Processing' },
						{ value: 'ready', label: 'Ready' },
						{ value: 'error', label: 'Failed' }
					]}
					triggerClass="h-9 w-[110px] text-xs"
				/>

				<SelectAsync
					value={sort}
					onValueChange={(v) => handleFilterChange('sort', v)}
					options={[
						{ value: 'newest', label: 'Newest First' },
						{ value: 'oldest', label: 'Oldest First' },
						{ value: 'title', label: 'Title A-Z' },
						{ value: 'status', label: 'Status' }
					]}
					triggerClass="h-9 w-[130px] text-xs"
				/>
			</div>
		</div>
	</div>

	<div class="px-4 pt-6 pb-6 sm:px-6">
		{#if isLoading}
			<div class="py-12 text-center">
				<IconLoading class="text-muted-foreground mx-auto mb-2 size-8 animate-spin" />
				<h3 class="mb-2 font-medium">Loading projects...</h3>
			</div>
		{:else if !filteredProjects || filteredProjects.length === 0}
			<div class="py-12 text-center">
				<IconFolder class="text-muted-foreground mx-auto mb-2 size-8" />
				<h3 class="mb-2 font-medium">
					{hasActiveFilters ? 'No projects found' : 'No projects yet'}
				</h3>
				<p class="text-muted-foreground mb-4 text-sm">
					{hasActiveFilters
						? 'Try adjusting your filters to see more results.'
						: 'Your projects will appear here once you start creating.'}
				</p>
				<div class="flex justify-center gap-2">
					{#if hasActiveFilters}
						<Button variant="outline" onclick={clearFilters}>Clear Filters</Button>
					{/if}
					<Button onclick={() => goto(resolve('/'))}>
						<IconPlus />
						{hasActiveFilters ? 'Create New Project' : 'Start Creating'}
					</Button>
				</div>
			</div>
		{:else}
			<div class="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow class="bg-muted/50">
							<TableHead class="w-[10%] text-center">Preview</TableHead>
							<TableHead class="w-[30%]">Project</TableHead>
							<TableHead class="w-[20%] text-center">Status</TableHead>
							<TableHead class="hidden w-[10%] text-center sm:table-cell">Messages</TableHead>
							<TableHead class="hidden w-[10%] text-center sm:table-cell">Media</TableHead>
							<TableHead class="w-[20%] text-center">Last Activity</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filteredProjects as project (project.id)}
							{@const statusIcon = getStatusIcon(project.status)}
							<TableRow
								class="hover:bg-muted/50 cursor-pointer transition-colors"
								onclick={() => goto(resolve(`/projects/${project.id}`))}
							>
								<TableCell class="text-center">
									<div class="mx-auto h-12 w-12 overflow-hidden rounded-lg">
										{#if project.latestImage}
											<img
												src={project.latestImage}
												alt="Preview"
												class="h-full w-full object-cover"
												loading="lazy"
											/>
										{:else}
											<div class="bg-muted flex h-full w-full items-center justify-center">
												<IconFolder class="text-muted-foreground size-6" />
											</div>
										{/if}
									</div>
								</TableCell>
								<TableCell>
									<div class="truncate text-sm font-medium" title={project.title}>
										{project.title}
									</div>
								</TableCell>
								<TableCell class="text-center">
									<div class="flex items-center justify-center gap-2">
										<statusIcon.icon class={`size-4 ${statusIcon.class}`} />
										<span class={`text-sm ${getStatusColor(project.status)}`}>
											{getStatusLabel(project.status)}
										</span>
									</div>
								</TableCell>
								<TableCell class="hidden text-center sm:table-cell">
									<span class="text-muted-foreground text-sm">
										{project.messageCount}
									</span>
								</TableCell>
								<TableCell class="hidden text-center sm:table-cell">
									<span class="text-muted-foreground text-sm">
										{project.mediaCount}
									</span>
								</TableCell>
								<TableCell class="text-center">
									<span class="text-muted-foreground text-sm">
										{formatTimeAgo(project.lastMessageAt)}
									</span>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</div>
</div>
