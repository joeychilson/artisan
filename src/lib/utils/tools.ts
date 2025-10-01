export function getGridLayout(count: number, aspectRatio?: string): string {
	if (count === 1) {
		if (aspectRatio === '16:9') {
			return 'mx-auto w-full max-w-2xl';
		}
		if (aspectRatio === '4:3') {
			return 'mx-auto w-full max-w-lg';
		}
		if (aspectRatio === '9:16' || aspectRatio === '3:4') {
			return 'mx-auto w-full max-w-sm';
		}
		return 'mx-auto w-full max-w-md';
	}

	if (count === 2) {
		return 'mx-auto grid w-full max-w-4xl grid-cols-2 gap-3';
	}
	if (count === 3) {
		return 'mx-auto grid w-full max-w-5xl grid-cols-3 gap-3';
	}
	if (count === 4) {
		return 'mx-auto grid w-full max-w-5xl grid-cols-2 sm:grid-cols-4 gap-3';
	}

	return 'mx-auto grid w-full max-w-5xl grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3';
}

export function getAspectRatio(imageSize: string): string {
	const aspectMap: Record<string, string> = {
		'1:1': 'aspect-square',
		'4:3': 'aspect-[4/3]',
		'9:16': 'aspect-[9/16]',
		'16:9': 'aspect-[16/9]',
		'3:4': 'aspect-[3/4]'
	};
	return aspectMap[imageSize] || 'aspect-square';
}
