import mongoose from "mongoose";
import config from "../config.js";

async function handleIndexes() {
  try {
    console.log('Checking and updating indexes...');
    const usersCollection = mongoose.connection.collection('users');
    
    // List all indexes
    const indexes = await usersCollection.indexes();
    const indexNames = indexes
      .filter(index => index.name !== '_id_')
      .map(index => index.name);
    
    // Drop old indexes if they exist
    for (const indexName of indexNames) {
      if (indexName !== 'username_1' && indexName !== 'email_1_workspaceName_1') {
        await usersCollection.dropIndex(indexName);
        console.log(`Dropped old index: ${indexName}`);
      }
    }

    // Ensure compound email-workspace index exists
    if (!indexes.some(index => index.name === 'email_1_workspaceName_1')) {
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
      console.log('Created compound email-workspace index');
    }

    // Ensure username index exists
    if (!indexes.some(index => index.name === 'username_1')) {
      await usersCollection.createIndex(
        { "username": 1 },
        { unique: true, background: true }
      );
      console.log('Created username index');
    }

    console.log('Index management completed');
  } catch (error) {
    console.error('Error managing indexes:', error);
    // Don't throw the error - we want the application to start even if index management fails
  }
}

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(config.MONGO_URI, {
      dbName: config.MONGODB_NAME,
    });
    console.log(`MongoDb Connected ${conn.connection.host}`);

    // Handle indexes after connection
    await handleIndexes();
  } catch (error) {
    console.error(`Error ${error.message}`, config.MONGO_URI, config.MONGODB_NAME);
    process.exit(1);
  }
};

export default connectDb;
