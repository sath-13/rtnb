import mongoose from 'mongoose';

const importedUserSchema = new mongoose.Schema(
  {
    timestamp: { type: String },
    emailAddress: { type: String },
    employeeId: { type: String },
    employeeName: { type: String },
    monthAndYear: { type: String }, // Last day of every month
    pom: { type: String },
    dhsPercent: { type: String },
    cultureSession: { type: String },
    pdc: { type: String },
    techPdc: { type: String },
    plannedLeavePl: { type: String },
    unplannedLeaveUl: { type: String },
    restrictedHolidayRh: { type: String },
    noOfWfh: { type: String },
    feedbackInKeka: { type: String },
    noOfAnonymousFeedbackIfAny: { type: String },
    noOfGoodPraisesInKeka: { type: String },
    noOfConcernPraisesInKeka: { type: String },
    // Added new fields below
    missingSwipes: { type: String },
    empMonitorHrs: { type: String },
    missedHoursLog: { type: String },
  },
  { timestamps: true, strict: false } // <-- allow any extra fields from frontend (dynamic columns)
);

const ImportedUserProfile = mongoose.model("ImportedUserProfile", importedUserSchema);
export default ImportedUserProfile;

