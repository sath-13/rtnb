import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the existing .env file
dotenv.config();

async function dropAndRecreateIndexes() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGODB_NAME
    });
    console.log(`Connected to MongoDB at ${conn.connection.host}`);

    const usersCollection = mongoose.connection.collection('users');
    
    // List all current indexes
    console.log('\nCurrent indexes:');
    const indexes = await usersCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop all existing indexes except _id
    const indexNames = indexes
      .filter(index => index.name !== '_id_')
      .map(index => index.name);
    
    if (indexNames.length > 0) {
      console.log('\nDropping indexes:', indexNames);
      for (const indexName of indexNames) {
        await usersCollection.dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
      }
    } else {
      console.log('\nNo indexes to drop except _id');
    }

    // Create new compound index
    console.log('\nCreating new compound index...');
    await usersCollection.createIndex(
      { 
        "email": 1,
        "workspaceName": 1
      },
      { 
        unique: true,
        background: true
      }
    );
    console.log('Created new compound index successfully');

    // Create username index
    console.log('\nCreating username index...');
    await usersCollection.createIndex(
      { "username": 1 },
      { unique: true, background: true }
    );
    console.log('Created username index successfully');

    // Verify final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await usersCollection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('\nIndex operations completed successfully');
  } catch (error) {
    console.error('\nError:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

dropAndRecreateIndexes(); 