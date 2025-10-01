import { SvelteMap } from 'svelte/reactivity';

interface MediaPlayerState {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMuted: boolean;
	animationFrame: number;
}

const defaultState: MediaPlayerState = {
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	volume: 0.7,
	isMuted: false,
	animationFrame: 0
};

export function useMediaPlayer(mediaCount: number) {
	const states = new SvelteMap<number, MediaPlayerState>();
	const elements = new SvelteMap<number, HTMLMediaElement>();

	$effect(() => {
		for (let i = 0; i < mediaCount; i++) {
			if (!states.has(i)) {
				states.set(i, { ...defaultState });
			}
		}
	});

	function registerElement(index: number, element: HTMLMediaElement) {
		elements.set(index, element);
	}

	function getState(index: number): MediaPlayerState {
		return states.get(index) || { ...defaultState };
	}

	function setState(index: number, updates: Partial<MediaPlayerState>) {
		const current = getState(index);
		states.set(index, { ...current, ...updates });
	}

	function startSmoothUpdates(index: number) {
		const element = elements.get(index);
		const state = getState(index);

		const updateProgress = () => {
			if (element && state.isPlaying && !element.paused) {
				setState(index, { currentTime: element.currentTime });
				setState(index, { animationFrame: requestAnimationFrame(updateProgress) });
			}
		};
		setState(index, { animationFrame: requestAnimationFrame(updateProgress) });
	}

	function stopSmoothUpdates(index: number) {
		const state = getState(index);
		if (state.animationFrame) {
			cancelAnimationFrame(state.animationFrame);
			setState(index, { animationFrame: 0 });
		}
	}

	function togglePlayPause(index: number) {
		const element = elements.get(index);
		if (!element) return;

		const state = getState(index);

		if (state.isPlaying) {
			element.pause();
			setState(index, { isPlaying: false });
			stopSmoothUpdates(index);
		} else {
			elements.forEach((el, i) => {
				if (i !== index && getState(i).isPlaying) {
					el.pause();
					setState(i, { isPlaying: false });
					stopSmoothUpdates(i);
				}
			});

			element.play();
			setState(index, { isPlaying: true });
			startSmoothUpdates(index);
		}
	}

	function handleTimeUpdate(index: number) {
		const element = elements.get(index);
		if (!element) return;

		setState(index, {
			currentTime: element.currentTime,
			duration: element.duration || 0
		});
	}

	function handleEnded(index: number) {
		const element = elements.get(index);
		stopSmoothUpdates(index);

		if (element) {
			element.currentTime = 0;
			setState(index, { isPlaying: false, currentTime: 0 });
		}
	}

	function handleSeek(index: number, time: number) {
		const element = elements.get(index);
		if (!element) return;

		element.currentTime = time;
		setState(index, { currentTime: time });
	}

	function handleVolumeChange(index: number, newVolume: number) {
		const element = elements.get(index);
		if (!element) return;

		element.volume = newVolume;
		setState(index, {
			volume: newVolume,
			isMuted: newVolume === 0 ? getState(index).isMuted : false
		});
	}

	function toggleMute(index: number) {
		const element = elements.get(index);
		if (!element) return;

		const state = getState(index);

		if (state.isMuted) {
			element.volume = state.volume;
			setState(index, { isMuted: false });
		} else {
			element.volume = 0;
			setState(index, { isMuted: true });
		}
	}

	function handleLoadedMetadata(index: number) {
		const element = elements.get(index);
		if (!element) return;

		const state = getState(index);
		element.volume = state.volume;
		handleTimeUpdate(index);
	}

	return {
		registerElement,
		getState,
		togglePlayPause,
		handleTimeUpdate,
		handleEnded,
		handleSeek,
		handleVolumeChange,
		toggleMute,
		handleLoadedMetadata
	};
}

export function formatTime(seconds: number): string {
	if (!isFinite(seconds)) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}
