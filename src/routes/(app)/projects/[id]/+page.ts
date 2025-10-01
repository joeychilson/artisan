import type { PageLoad } from './$types';
import { getProject } from '$lib/remote/projects.remote';

export const load: PageLoad = async ({ params }) => {
	const project = await getProject(params.id);

	return { project };
};
