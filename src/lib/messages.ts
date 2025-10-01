import type { UIMessage, UIMessagePart } from 'ai';

import type { ToolSet } from '$lib/server/tools';

export type MessageMetadata = {
	[key: string]: unknown;
};

export type ProjectMetadata = {
	id?: string;
	title?: string;
};

export type MessageData = {
	'project-metadata': ProjectMetadata;
};

export type Message = UIMessage<MessageMetadata, MessageData, ToolSet>;
export type MessagePart = UIMessagePart<MessageData, ToolSet>;
