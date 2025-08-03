import mongoose from 'mongoose';

const companyRoleSchema = new mongoose.Schema({
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Domain',  // Reference to the company model
        required: true
    },
    roleName: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const CompanyRole = mongoose.model('CompanyRole', companyRoleSchema);

export default  CompanyRole;


