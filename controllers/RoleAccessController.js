// controllers/roleAccessController.js
import RoleAccess from '../models/RoleAccess-Model.js';
import mongoose from 'mongoose';
import Company from '../models/Company-Model.js'; // Added import for Company


export const getRoleAccessMatrix = async (req, res) => {
  const { companyId } = req.params;
  

  try {
    const objectId = new mongoose.Types.ObjectId(companyId);
    const accessData = await RoleAccess.find({ companyId: objectId });
   
    res.status(200).json({ success: true, data: accessData });
  } catch (error) {
    console.error('Error fetching access matrix:', error);
    res.status(500).json({ success: false, message: "Error fetching access matrix" });
  }
};


export const bulkUpdateRoleAccess = async (req, res) => {
    const updates = req.body;
  
    try {
      const updatePromises = updates.map(entry => 
        RoleAccess.updateOne(
          { companyId: entry.companyId, roleName: entry.roleName, moduleName: entry.moduleName },
          { $set: { access: entry.access } },
          { upsert: true } // create if not exists
        )
      );
      await Promise.all(updatePromises);
      res.status(200).json({ success: true, message: 'Access matrix updated.' });
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({ success: false, message: 'Bulk update failed' });
    }
  };
  



  export const getModuleAccess = async (req, res) => {
    const { companyId, role } = req.query;
    
    if (!companyId || !role) {
      return res.status(400).json({ message: "companyId and role are required" });
    }
  
    try {
      // ✅ Case 1: If role exists and it's "superadmin", "admin", etc. → give full access
      if (role && (role.toLowerCase() === "superadmin" || role.toLowerCase() === "admin")) {
        const allModules = [
          "Home",
          "My Organization",
          "System & Accessories",
          "Actions",
          "Domain Setup",
          "Portfolio",
          "Project Calendar",
          "Events",
          "Hiring",
          "Inbox"
        ];
        const accessMap = {};
        allModules.forEach(mod => {
          accessMap[mod] = 1;
        });
        return res.json(accessMap);
      }
  
      // ✅ Case 2: Else fetch based on role (not jobRole or roleName)
      const accessList = await RoleAccess.find({ companyId, roleName: role });
      const accessMap = {};
      accessList.forEach(item => {
        accessMap[item.moduleName.trim()] = item.access;  // trim() ensures no trailing spaces
      });
  
      return res.json(accessMap);
    } catch (err) {
      console.error("Access Fetch Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
  

export const getAllRoles = async (req, res) => {
  const { companyId } = req.query;
  
  if (!companyId) {
    return res.status(400).json({ success: false, message: 'Company ID is required' });
  }

  try {
    const roles = await RoleAccess.distinct('roleName', { companyId });
    res.status(200).json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Error fetching roles' });
  }
};


export const createSystemRole = async (req, res) => {
  const { roleName, description, companyId } = req.body;

  if (!roleName || !description || !companyId) {
    return res.status(400).json({ success: false, message: 'Role name, description, and company ID are required' });
  }

  try {
    // Check if role already exists for this specific company
    const existingRole = await RoleAccess.findOne({ roleName, companyId });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role already exists for this company' });
    }

    const modules = ['Home', 'My Organization', 'System & Accessories', 'Actions', 'Domain Setup', 'Portfolio', 'Project Calendar', 'Events', 'Hiring', 'Inbox'];
    
    const accessEntries = [];
    
    // Create access entries only for the specific company
    for (const moduleName of modules) {
      accessEntries.push({
        companyId: companyId,
        roleName: roleName,
        moduleName: moduleName,
        access: 0, // default to no access
      });
    }

    if (accessEntries.length > 0) {
      await RoleAccess.insertMany(accessEntries);
    }

    return res.status(201).json({
      success: true,
      message: 'System role created successfully for this company',
      roleName: roleName
    });
  } catch (error) {
    console.error('Error creating system role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create system role. Please try again later.'
    });
  }
};
  
