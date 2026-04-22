import { MongoClient, type MongoClientOptions } from "mongodb";
import { env } from "@/lib/env";

// MongoClient riêng cho @auth/mongodb-adapter (adapter không dùng Mongoose).
// Cache promise trên globalThis trong dev để tránh tạo nhiều client khi HMR.
const options: MongoClientOptions = {};

const globalWithMongo = globalThis as typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo.__mongoClientPromise) {
    globalWithMongo.__mongoClientPromise = new MongoClient(env.MONGODB_URI, options).connect();
  }
  clientPromise = globalWithMongo.__mongoClientPromise;
} else {
  clientPromise = new MongoClient(env.MONGODB_URI, options).connect();
}

export default clientPromise;
