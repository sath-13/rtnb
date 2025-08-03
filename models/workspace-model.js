import mongoose from 'mongoose';
export const UserRole = {
  SUPER_ADMIN: 'superadmin',
};
const workspaceSchema = new mongoose.Schema(
    {
      workspacename: {
        type: String,
        unique:false,
        required: true,
      },
      // New field to store the creator's details:
      createdBy: {
        adminId: { type: String, required: true }
      },
      logo: { type: String, default: null },
  },
  { timestamps: true }
);

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
