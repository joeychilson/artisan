import type { Message } from '$lib/messages';

export function addFileListToMessage(message: Message): Message {
	const fileUrls =
		message.parts
			?.filter((part) => part.type === 'file')
			.map((part) => part.url)
			.filter(Boolean) || [];

	if (fileUrls.length > 0) {
		const fileList = fileUrls
			.map((url, index) => {
				return `  Image ${index + 1}: ${url}`;
			})
			.join('\n');

		return {
			...message,
			parts: [
				...(message.parts || []),
				{
					type: 'text',
					text: `Attached File List:\n${fileList}`
				}
			]
		};
	}

	return message;
}
