import { env } from '$env/dynamic/private';

import { SQL } from 'bun';

import { drizzle } from 'drizzle-orm/bun-sql';

import * as schema from './schema';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = new SQL(env.DATABASE_URL);

export const db = drizzle({ client, schema });
