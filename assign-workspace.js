// Simple script to assign workspace to super admin
import mongoose from 'mongoose';
import Admin from './models/SuperAdmin-model.js';
import config from './config.js';

async function assignWorkspaceToSuperAdmin() {
  try {
    // Connect to database
    await mongoose.connect(config.MONGO_URI, {
      dbName: config.MONGODB_NAME,
    });
    console.log('✅ Connected to MongoDB');

    // Find the super admin user
    const superAdmin = await Admin.findOne({ role: 'superadmin' });
    
    if (!superAdmin) {
      console.log('❌ No super admin found');
      process.exit(1);
    }

    console.log('👤 Found super admin:', {
      id: superAdmin._id,
      email: superAdmin.email,
      currentWorkspaces: superAdmin.workspaceName
    });

    // Assign saheel workspace if not already assigned
    if (!superAdmin.workspaceName.includes('saheel')) {
      superAdmin.workspaceName.push('saheel');
      await superAdmin.save();
      console.log('✅ Assigned saheel workspace to super admin');
    } else {
      console.log('ℹ️ Super admin already has saheel workspace');
    }

    console.log('👤 Updated super admin workspaces:', superAdmin.workspaceName);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

assignWorkspaceToSuperAdmin();
