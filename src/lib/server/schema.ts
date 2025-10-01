import { sql } from 'drizzle-orm';
import {
	pgEnum,
	pgTable,
	text,
	timestamp,
	boolean,
	index,
	uuid,
	varchar,
	jsonb
} from 'drizzle-orm/pg-core';

import type { MessageMetadata, MessagePart } from '$lib/messages';

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		email: text('email').notNull().unique(),
		emailVerified: boolean('email_verified')
			.$defaultFn(() => false)
			.notNull(),
		image: text('image'),
		createdAt: timestamp('created_at')
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp('updated_at')
			.$defaultFn(() => new Date())
			.notNull()
	},
	(table) => [index('users_email_idx').on(table.email)]
);

export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		token: text('token').notNull().unique(),
		expiresAt: timestamp('expires_at').notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at')
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp('updated_at')
			.$defaultFn(() => new Date())
			.notNull()
	},
	(table) => [
		index('sessions_user_id_idx').on(table.userId),
		index('sessions_token_idx').on(table.token)
	]
);

export const accounts = pgTable(
	'accounts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		password: text('password'),
		scope: text('scope'),
		idToken: text('id_token'),
		accessToken: text('access_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshToken: text('refresh_token'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		createdAt: timestamp('created_at')
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp('updated_at')
			.$defaultFn(() => new Date())
			.notNull()
	},
	(table) => [index('accounts_user_id_idx').on(table.userId)]
);

export const verifications = pgTable(
	'verifications',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at')
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp('updated_at')
			.$defaultFn(() => new Date())
			.notNull()
	},
	(table) => [index('verifications_identifier_idx').on(table.identifier)]
);

export const projectStatus = pgEnum('project_status', ['submitted', 'streaming', 'ready', 'error']);

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	streamId: uuid('stream_id').default(sql`null`),
	status: projectStatus('status').notNull().default('submitted'),
	title: varchar('title', { length: 255 }).notNull().default('Untitled Project'),
	lastMessageAt: timestamp('last_message_at')
		.$defaultFn(() => new Date())
		.notNull(),
	createdAt: timestamp('created_at')
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp('updated_at')
		.$defaultFn(() => new Date())
		.notNull()
});

export const role = pgEnum('role', ['user', 'assistant', 'system']);

export const messages = pgTable('messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.references(() => projects.id, { onDelete: 'cascade' })
		.notNull(),
	role: role('role').notNull(),
	parts: jsonb('parts').$type<MessagePart[]>().notNull().default([]),
	metadata: jsonb('metadata').$type<MessageMetadata>().notNull().default({
		mode: 'image'
	}),
	createdAt: timestamp('created_at')
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp('updated_at')
		.$defaultFn(() => new Date())
		.notNull()
});

export const mediaFiles = pgTable(
	'media_files',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		projectId: uuid('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull(),
		type: varchar('type', { length: 10 }).notNull(),
		contentType: text('content_type').notNull(),
		url: text('url').notNull(),
		createdAt: timestamp('created_at')
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp('updated_at')
			.$defaultFn(() => new Date())
			.notNull()
	},
	(table) => [
		index('media_files_project_id_idx').on(table.projectId),
		index('media_files_user_id_idx').on(table.userId),
		index('media_files_created_at_idx').on(table.createdAt)
	]
);
