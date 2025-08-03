import mongoose from 'mongoose';

// Domain Table for storing domain and company name
const domainSchema = new mongoose.Schema({
    companyName: { 
        type: String, 
        required: true,
        unique: true // Ensure unique company names
    },
    domain: { 
        type: String,  
        required: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    }
});

const Domain = mongoose.model('Domain', domainSchema);
export default Domain;
