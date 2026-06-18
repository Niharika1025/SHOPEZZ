import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log(`URI: ${process.env.MONGODB_URI}`);
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopez', {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log(`SUCCESS: Connected to database host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    await mongoose.disconnect();
    console.log('SUCCESS: Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error(`FAILURE: Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

testConnection();
