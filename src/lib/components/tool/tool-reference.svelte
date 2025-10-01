<script lang="ts">
	import IconFiles from '~icons/hugeicons/files-01';
	import IconAudio from '~icons/hugeicons/audio-wave-01';

	import { Viewer } from '$lib/components/viewer';

	import type { MediaType } from './tool-config';

	export interface ReferenceFile {
		url: string;
		type: MediaType;
		name?: string;
	}

	interface Props {
		files: ReferenceFile[];
	}

	let { files }: Props = $props();

	let viewerOpen = $state(false);
	let viewerIndex = $state(0);

	function openViewer(file: ReferenceFile) {
		viewerIndex = files.indexOf(file);
		viewerOpen = true;
	}

	function closeViewer() {
		viewerOpen = false;
	}

	function getAriaLabel(file: ReferenceFile, index: number): string {
		switch (file.type) {
			case 'image':
				return `View image ${index + 1} fullscreen`;
			case 'video':
				return `View video ${index + 1} fullscreen`;
			case 'audio':
				return `Play audio ${index + 1}`;
			default:
				return `View file ${index + 1}`;
		}
	}
</script>

{#if files.length > 0}
	<div class="mb-6">
		<div class="mb-2 flex items-center gap-2">
			<IconFiles class="text-muted-foreground h-4 w-4" />
			<h4 class="text-muted-foreground text-sm font-medium">
				Reference {files.length === 1 ? 'File' : 'Files'}
			</h4>
		</div>
		<div class="bg-muted/20 rounded-lg p-3">
			<div class="flex gap-2">
				{#each files as file, index (index)}
					<button
						class="group border-border/40 focus:ring-primary hover:border-border flex-shrink-0 overflow-hidden rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
						onclick={() => openViewer(file)}
						aria-label={getAriaLabel(file, index)}
					>
						{#if file.type === 'image'}
							<img
								src={file.url}
								alt={file.name || `Reference image ${index + 1}`}
								class="h-16 w-16 object-cover transition-transform duration-200 group-hover:scale-105"
								loading="lazy"
							/>
						{:else if file.type === 'video'}
							<video src={file.url} class="h-16 w-16 object-cover" preload="metadata" muted></video>
						{:else if file.type === 'audio'}
							<div class="bg-muted/40 flex h-16 w-16 items-center justify-center">
								<IconAudio class="text-muted-foreground h-6 w-6" />
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

{#if viewerOpen && files.length > 0}
	<Viewer
		files={files.map((f, i) => ({
			url: f.url,
			name: f.name || `Reference ${f.type} ${i + 1}`,
			type: f.type
		}))}
		initialIndex={viewerIndex}
		onClose={closeViewer}
	/>
{/if}
