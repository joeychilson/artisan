let currentProject = $state<{ title?: string; id?: string } | null>(null);

export const currentProjectStore = {
	get project() {
		return currentProject;
	},
	setProject(project: { title?: string; id?: string } | null) {
		currentProject = project;
	},
	updateTitle(title: string) {
		if (currentProject) {
			currentProject.title = title;
		}
	},
	clear() {
		currentProject = null;
	}
};
