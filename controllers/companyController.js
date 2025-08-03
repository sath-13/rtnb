
import { CommonMessages, CompanyMessages } from "../constants/enums.js";
import Company from "../models/Company-Model.js";
// Save or update company details
import CompanyHistory from '../models/CompanyHistoryModel.js';

export const saveOrUpdateCompanyDetails = async (req, res) => {
  try {
    const {
      company_id,
      name,
      url,
      linkedin,
      address,
      branches,
      working_hours,
      working_days,
      working_hours_per_day,
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    let company = await Company.findOne();

    let changes = {};

    if (company) {
      // Check for changes only on specific fields
      if (
        company.working_hours.from !== working_hours.from ||
        company.working_hours.to !== working_hours.to
      ) {
        changes.working_hours = {
          old: company.working_hours,
          new: working_hours,
        };
      }

      if (
        JSON.stringify(company.working_days) !== JSON.stringify(working_days)
      ) {
        changes.working_days = {
          old: company.working_days,
          new: working_days,
        };
      }

      if (company.working_hours_per_day !== working_hours_per_day) {
        changes.working_hours_per_day = {
          old: company.working_hours_per_day,
          new: working_hours_per_day,
        };
      }

      // Update company details
      company.company_id=company_id;
      company.name = name;
      company.url = url;
      company.linkedin = linkedin;
      company.address = address;
      company.branches = branches;
      company.working_hours = working_hours;
      company.working_days = working_days;
      company.working_hours_per_day = working_hours_per_day;

      await company.save();

      // If there are any tracked changes, save history
      if (Object.keys(changes).length > 0) {
        const historyEntry = new CompanyHistory({
          changedBy: userId,
          changedByModel: userRole === 'superadmin' ? 'Admin' : 'User',
          changes,
        });
        await historyEntry.save();
      }
    } else {
      // Create new company details
      company = new Company({
        company_id,
        name,
        url,
        linkedin,
        address,
        branches,
        working_hours,
        working_days,
        working_hours_per_day,
      });
      await company.save();
    }

    res.status(200).json({ message: CompanyMessages.COMPANY_DETAILS_SAVED_SUCC });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: CommonMessages.INTERNAL_SERVER_ERROR });
  }
};



export const getAllBranches = async (req, res) => {
    try {
        const companies = await Company.find({}, "branches"); // Fetch only branches
        const branches = companies.flatMap(company => company.branches); // Flatten branches array
        const uniqueBranches = [...new Set(branches)]; // Remove duplicates if any

        res.status(200).json({ success: true, branches: uniqueBranches });
    } catch (error) {
        console.error("Error fetching branches:", error);
        res.status(500).json({ success: false, message: CompanyMessages.BRANCH_FETCH_ERR });
    }
};



export const getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findOne(); // Fetch existing company details

    if (!company) {
      return res.status(404).json({ message: CompanyMessages.NO_COMPANY_DETAILS_FOUND });
    }

    res.status(200).json(company);
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ message: CommonMessages.INTERNAL_SERVER_ERROR });
  }
};


export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    
    const company = await Company.findOne({ company_id: companyId });

    if (!company) {
      return res.status(404).json({ message: CompanyMessages.NO_COMPANY_DETAILS_FOUND });
    }

    res.status(200).json(company);
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ message: CommonMessages.INTERNAL_SERVER_ERROR });
  }
};
