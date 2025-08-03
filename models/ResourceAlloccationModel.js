import mongoose from 'mongoose';
import { employeeModel_ROLES, resourceCoordinatorModel_ROLES } from '../constants/enums.js';

const bookingSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Domain',
    default: '681b18d5050493c575c33985'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project'
  },
  employeeId: [
    { 
      type: mongoose.Schema.Types.ObjectId,    
      refPath: "employeeModel",
    }
  ],
  employeeModel: {
        type: [String],
        required: true,
        enum: Object.values(employeeModel_ROLES), 
      },
  resourceCoordinatorId: {
    type: mongoose.Schema.Types.ObjectId,    
      refPath: "resourceCoordinatorModel",
  },
  resourceCoordinatorModel: {
    type: String,
    required: true,
    enum: Object.values(resourceCoordinatorModel_ROLES), 
  },
  typeOfWork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TypeOfWork',   
    required: true
  },
  typeOfWorkName: {
    type: String,
    required: true
  },  
  dateAndTime: {
    type: Date,
    default: Date.now
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  taskDescription: {
    type: String,
    required: true
  },
});

const Booking = mongoose.model('ResourceAllocation', bookingSchema);
export default Booking;
