import mongoose from 'mongoose';

const roleAccessSchema = new mongoose.Schema({
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Domain',
        required: true
    },
    roleName: { 
        type: String, 
        required: true
    },
    moduleName: { 
        type: String, 
        required: true 
    },
    access: { 
        type: Number, 
        enum: [0, 1], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const RoleAccess = mongoose.model('RoleAccess', roleAccessSchema);
export default RoleAccess;


