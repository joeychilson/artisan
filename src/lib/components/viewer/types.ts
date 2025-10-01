export type ViewerFileType = 'image' | 'video' | 'audio';

export interface ViewerFile {
	url: string;
	name?: string;
	type: ViewerFileType;
}

export interface ViewerProps {
	files: ViewerFile[];
	initialIndex?: number;
	onClose: () => void;
}
