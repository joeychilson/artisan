import { SQL } from 'bun';

import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate as migrateDrizzle } from 'drizzle-orm/bun-sql/migrator';

import * as userSchema from '../src/lib/server/schema';

const client = new SQL(process.env.DATABASE_URL ?? '');

const db = drizzle({ client, schema: { ...userSchema } });

async function migrate() {
	console.log('⏳ Migrating...');

	const start = Date.now();

	await migrateDrizzle(db, { migrationsFolder: './migrations' });

	const end = Date.now();
	console.log(`✅ Migrations completed in ${end - start}ms`);
	console.log('');
	process.exit(0);
}

migrate().catch((err) => {
	console.error('❌ Migration failed');
	console.error(err);
	process.exit(1);
});
