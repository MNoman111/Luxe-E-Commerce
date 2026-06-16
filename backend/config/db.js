import mongoose from "mongoose";

// Cache the connection across serverless invocations (and local restarts via HMR).
let cached = global._luxeMongoose;
if (!cached) cached = global._luxeMongoose = { conn: null, promise: null };

const connectDB = async () => {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/luxe";
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}`);
        return m;
      });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next request
    throw err;
  }
  return cached.conn;
};

export default connectDB;
