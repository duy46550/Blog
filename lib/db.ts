import mongoose from "mongoose";
import { env } from "@/lib/env";

// Cache connection trên `globalThis` để tránh tạo connection mới mỗi lần
// Next.js hot-reload module trong dev (ngăn "MongoNetworkError: connections >= maxPoolSize").
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.__mongoose ?? { conn: null, promise: null };
if (!globalWithMongoose.__mongoose) {
  globalWithMongoose.__mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export { mongoose };
