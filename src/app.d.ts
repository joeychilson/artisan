import 'unplugin-icons/types/svelte';

import type { User, Session } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			user: User | undefined;
			session: Session | undefined;
		}
	}
}

export {};
