import type { Component } from 'svelte';

import IconComputer from '~icons/hugeicons/computer';
import IconSmartphone from '~icons/hugeicons/smart-phone-01';
import IconTablet from '~icons/hugeicons/tablet-01';
import IconGlobe from '~icons/hugeicons/globe-02';

export interface DeviceInfo {
	type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
	name: string;
	icon: Component;
}

export function getDeviceInfo(userAgent: string | null): DeviceInfo {
	if (!userAgent) {
		return { type: 'unknown', name: 'Unknown Device', icon: IconGlobe };
	}

	const ua = userAgent.toLowerCase();

	if (ua.includes('android')) {
		return { type: 'mobile', name: 'Android', icon: IconSmartphone };
	}

	if (ua.includes('iphone')) {
		return { type: 'mobile', name: 'iPhone', icon: IconSmartphone };
	}

	if (ua.includes('ipad')) {
		return { type: 'tablet', name: 'iPad', icon: IconTablet };
	}

	if (ua.includes('mobile')) {
		return { type: 'mobile', name: 'Mobile', icon: IconSmartphone };
	}

	if (ua.includes('tablet')) {
		return { type: 'tablet', name: 'Tablet', icon: IconTablet };
	}

	if (ua.includes('chrome')) {
		return { type: 'desktop', name: 'Chrome', icon: IconComputer };
	}

	if (ua.includes('firefox')) {
		return { type: 'desktop', name: 'Firefox', icon: IconComputer };
	}

	if (ua.includes('safari') && !ua.includes('chrome')) {
		return { type: 'desktop', name: 'Safari', icon: IconComputer };
	}

	if (ua.includes('edge')) {
		return { type: 'desktop', name: 'Edge', icon: IconComputer };
	}

	return { type: 'desktop', name: 'Desktop', icon: IconComputer };
}
