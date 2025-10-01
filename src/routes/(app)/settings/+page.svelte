<script lang="ts">
	import type { PageData } from './$types';

	import { toast } from 'svelte-sonner';

	import IconSettings from '~icons/hugeicons/settings-01';
	import IconUser from '~icons/hugeicons/user';
	import IconMail from '~icons/hugeicons/mail-02';
	import IconCalendar from '~icons/hugeicons/calendar-03';
	import IconShield from '~icons/hugeicons/shield-01';
	import IconTrash from '~icons/hugeicons/delete-01';
	import IconAlertDiamond from '~icons/hugeicons/alert-diamond';
	import IconCancelCircle from '~icons/hugeicons/cancel-circle';

	import { client } from '$lib/auth';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { AccountDeleteDialog } from '$lib/components/dialog';
	import { getUserSessions } from '$lib/remote/user.remote';
	import { getDeviceInfo } from '$lib/utils/device';
	import { formatTimeAgo } from '$lib/utils/formatting';

	let sessions = await getUserSessions();

	let { data }: { data: PageData } = $props();

	let deleteAccountOpen = $state(false);
	let isRevokingSession = $state<string | null>(null);

	const sortedSessions = $derived(
		[...(sessions ?? [])].sort((a, b) => {
			if (a.id === data.session?.id) return -1;
			if (b.id === data.session?.id) return 1;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		})
	);

	async function revokeSession(sessionId: string, sessionToken: string) {
		isRevokingSession = sessionId;
		try {
			await client.revokeSession({ token: sessionToken });
			sessions = sessions?.filter((s) => s.id !== sessionId) ?? [];
			await getUserSessions().refresh();
			toast.success('Session revoked');
		} catch {
			toast.error('Unable to revoke session');
		} finally {
			isRevokingSession = null;
		}
	}
</script>

<svelte:head>
	<title>Settings - Artisan</title>
	<meta name="description" content="Manage your account and security settings" />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl pt-16 pb-6">
	<div class="flex items-center justify-between p-4 sm:p-6">
		<div class="flex items-center gap-3">
			<div class="bg-muted/50 flex size-10 items-center justify-center rounded-lg">
				<IconSettings class="text-muted-foreground size-5" />
			</div>
			<div class="space-y-0.5">
				<h1 class="font-medium">Settings</h1>
				<p class="text-muted-foreground text-xs">Manage your account and security settings</p>
			</div>
		</div>
	</div>

	<div class="space-y-6 px-4 pb-6 sm:px-6">
		<Card>
			<CardHeader>
				<div class="flex items-start gap-3">
					<div class="bg-muted flex size-9 items-center justify-center overflow-hidden rounded-lg">
						<Avatar class="size-full rounded-lg">
							<AvatarImage
								src={data.user?.image ?? undefined}
								alt={data.user?.name ?? 'User avatar'}
							/>
							<AvatarFallback class="rounded-lg">{data.user?.name?.[0] ?? 'U'}</AvatarFallback>
						</Avatar>
					</div>
					<div class="space-y-1">
						<CardTitle class="font-medium">Account</CardTitle>
						<CardDescription class="text-muted-foreground text-xs">
							Your profile information and account details
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="flex items-start gap-4">
						<div class="bg-muted rounded-lg p-2">
							<IconUser class="size-5" />
						</div>
						<div class="flex-1">
							<Label class="text-muted-foreground text-xs">Name</Label>
							<p class="text-sm font-medium">{data.user?.name ?? 'Not set'}</p>
						</div>
					</div>

					<div class="flex items-start gap-4">
						<div class="bg-muted rounded-lg p-2">
							<IconMail class="size-5" />
						</div>
						<div class="flex-1">
							<Label class="text-muted-foreground text-xs">Email</Label>
							<p class="text-sm font-medium">{data.user?.email}</p>
						</div>
					</div>

					<div class="flex items-start gap-4">
						<div class="bg-muted rounded-lg p-2">
							<IconCalendar class="size-5" />
						</div>
						<div class="flex-1">
							<Label class="text-muted-foreground text-xs">Member since</Label>
							<p class="text-sm font-medium">
								{data.user?.createdAt ? formatTimeAgo(data.user.createdAt) : '-'}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div class="flex items-start gap-3">
						<div class="bg-muted rounded-lg p-2">
							<IconShield class="size-5" />
						</div>
						<div class="space-y-1">
							<CardTitle class="font-medium">Security Sessions</CardTitle>
							<CardDescription class="text-muted-foreground text-xs">
								Manage devices and browsers signed into your account
							</CardDescription>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{#if sortedSessions.length}
					<div class="space-y-2">
						{#each sortedSessions as session (session.id)}
							{@const device = getDeviceInfo(session.userAgent ?? null)}
							<div
								class="group bg-card/50 hover:bg-card/80 relative rounded-xl border p-3 transition-colors"
							>
								<div class="flex items-center justify-between">
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<div class="bg-muted/60 shrink-0 rounded-lg p-2">
											<device.icon class="text-foreground/70 size-4" />
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<h4 class="truncate text-sm font-medium">{device.name}</h4>
												{#if session.id === data.session?.id}
													<Badge variant="secondary" class="h-5 px-1.5 text-[10px] font-medium">
														Current
													</Badge>
												{/if}
											</div>
											<div class="mt-0.5 space-y-0.5">
												<p class="text-muted-foreground text-xs">
													Active {formatTimeAgo(session.createdAt)}
												</p>
												{#if session.ipAddress}
													<p class="text-muted-foreground/70 truncate font-mono text-xs">
														{session.ipAddress}
													</p>
												{/if}
											</div>
										</div>
									</div>

									{#if session.id !== data.session?.id}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => revokeSession(session.id, session.token)}
											disabled={isRevokingSession === session.id}
											class="text-muted-foreground hover:text-destructive h-8 shrink-0 px-2 text-xs"
										>
											<IconCancelCircle class="mr-1 size-3.5" />
											{isRevokingSession === session.id ? 'Revoking' : 'Revoke'}
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-sm">
						<IconShield class="size-6" />
						<p>No active sessions found.</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card class="border-destructive/20 bg-destructive/5">
			<CardHeader>
				<div class="flex items-start gap-3">
					<div class="bg-destructive/10 rounded-lg p-2">
						<IconAlertDiamond class="text-destructive size-5" />
					</div>
					<div class="space-y-1">
						<CardTitle class="font-medium">Delete Account</CardTitle>
						<CardDescription class="text-muted-foreground text-xs">
							Permanently remove your account and all associated data
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div class="border-destructive/20 bg-background rounded-lg border p-4">
					<ul class="text-muted-foreground space-y-2 text-xs">
						<li class="flex items-start gap-2">
							<span class="text-destructive">•</span>
							All your data will be permanently deleted
						</li>
						<li class="flex items-start gap-2">
							<span class="text-destructive">•</span>
							Active sessions will be immediately terminated
						</li>
						<li class="flex items-start gap-2">
							<span class="text-destructive">•</span>
							This action cannot be undone
						</li>
					</ul>
				</div>

				<Button
					variant="destructive"
					size="sm"
					class="mt-4"
					onclick={() => (deleteAccountOpen = true)}
				>
					<IconTrash class="size-4" />
					Delete Account
				</Button>

				<AccountDeleteDialog bind:open={deleteAccountOpen} />
			</CardContent>
		</Card>
	</div>
</div>
