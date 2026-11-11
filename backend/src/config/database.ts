import mongoose from 'mongoose';
import { env } from './environment.js';

let isConnecting = false;

export const connectDatabase = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  isConnecting = true;

  try {
    console.log(`[Database] Connecting to MongoDB at ${env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}...`);
    
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });

    console.log('[Database] MongoDB Connected Successfully.');
    isConnecting = false;
    return true;
  } catch (error: any) {
    console.warn(`[Database] MongoDB connection attempt failed: ${error.message}`);
    console.warn('[Database] The server will continue running. Ensure MongoDB is running locally on port 27017 or provide a valid MONGODB_URI.');
    isConnecting = false;
    return false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB connection error:', err.message);
});

export const getDatabaseStatus = () => {
  const states: Record<number, string> = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING'
  };
  return {
    state: states[mongoose.connection.readyState] || 'UNKNOWN',
    isConnected: mongoose.connection.readyState === 1,
    host: mongoose.connection.host || 'none',
    database: mongoose.connection.name || 'none'
  };
};

