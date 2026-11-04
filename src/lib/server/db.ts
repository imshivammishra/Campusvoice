import mongoose from 'mongoose';

/**
 * A single, cached Mongoose connection for the whole Next.js server process.
 * Next.js hot-reloads modules in development, so the connection is stored on
 * `globalThis` to avoid opening a new pool on every reload.
 */
const globalForMongoose = globalThis as unknown as {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cached;

export function getMongoUri(): string | undefined {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    (process.env.NODE_ENV === 'development' ? 'mongodb://127.0.0.1:27017/campusvoice' : undefined)
  );
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not configured. Add it to .env.local to enable the database.',
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'campusvoice',
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 20,
    });
  }

  try {
    cached.conn = await cached.promise;
    await syncIndexes();
    const { ensureSeedData } = await import('./seed');
    await ensureSeedData();
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}

/**
 * Reconciles MongoDB indexes with the schemas in `models.ts`.
 *
 * This app can run against a database created by the previous NestJS backend,
 * which left obsolete unique indexes behind (for example `ballotId_1` and
 * `escalationId_1`). Those indexes make every insert after the first one fail
 * with a duplicate-key error because the new documents do not populate the old
 * fields. `syncIndexes()` drops stale indexes and creates the current ones.
 */
async function syncIndexes() {
  if (process.env.SYNC_DB_INDEXES === 'false') return;
  const models = await import('./models');
  const results = await Promise.allSettled(
    Object.values(models).map((model: any) =>
      typeof model?.syncIndexes === 'function' ? model.syncIndexes() : Promise.resolve(),
    ),
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn('[db] index sync failed:', result.reason?.message || result.reason);
    }
  }
}

export function isDbConfigured(): boolean {
  return Boolean(getMongoUri());
}
