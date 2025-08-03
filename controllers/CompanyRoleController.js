import CompanyRole from '../models/CompanyRole-model.js'; // Import the CompanyRole model

export const createRole = async (req, res) => {
  const { companyId, roleName, description } = req.body;

  if (!companyId || !roleName || !description) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Create the new job role only (no access matrix entries)
    const newRole = new CompanyRole({ companyId, roleName, description });
    await newRole.save();

    return res.status(201).json({
      success: true,
      message: 'Job role created successfully',
      data: newRole
    });
  } catch (error) {
    console.error('Error in createRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create role. Please try again later.'
    });
  }
};





export const getRolesByCompanyId = async (req, res) => {
  const { companyId } = req.query;  // Company ID from query params

  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: 'Company ID is required',
    });
  }

  try {
    // Fetch only the roleName for the given companyId
    const roles = await CompanyRole.find({ companyId }).sort({ createdAt: -1 }).select('roleName'); // Only select roleName field

    // Send the response with the list of role names
    res.json({
      success: true,
      roles: roles.map(role => role.roleName),  // Return only role names
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles from the database',
    });
  }
};


