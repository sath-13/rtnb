import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

async function handleIndexes() {
  try {
    const usersCollection = mongoose.connection.collection('users');
    
    // List all indexes
    const indexes = await usersCollection.indexes();
    
    // Drop any existing problematic indexes
    const indexesToDrop = ['email_1', 'email_1_workspaceName_1'];
    for (const indexName of indexesToDrop) {
      if (indexes.some(index => index.name === indexName)) {
        await usersCollection.dropIndex(indexName);
        logger.info(`Dropped index: ${indexName}`);
      }
    }

    // Create new compound index that works with workspaceName array
    await usersCollection.createIndex(
      { 
        "email": 1,
        "workspaceName": 1
      },
      { 
        unique: true,
        sparse: true,  // Only index documents where the fields exist
        background: true, // Non-blocking index creation
        partialFilterExpression: {
          "workspaceName": { "$exists": true, "$ne": [] }  // Only apply to non-empty workspace arrays
        }
      }
    );
    logger.info('Created new compound index for email and workspaceName');

  } catch (error) {
    logger.error('Error handling indexes:', error);
    throw error; // Rethrow to handle it in connectDB
  }
}

export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle indexes after connection
    await handleIndexes();
    
  } catch (error) {
    logger.error('Error connecting to database:', error);
    process.exit(1);
  }
} 