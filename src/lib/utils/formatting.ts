export function formatTimeAgo(date: Date): string {
	const diff = Date.now() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return 'Just now';
}

export function formatDate(date: string | Date): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return dateObj.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}
