import { env } from '$env/dynamic/public';

export function getFileUrl(path: string): string {
	return `${env.PUBLIC_BASE_URL}/m/${path}`;
}
