import Domain from "../models/Domain-Model.js";

// Create a new company
export const createCompany = async (req, res) => {
  const { companyName, domain } = req.body;

  // Check if companyName or domain is missing
  if (!companyName || !domain) {
    return res.status(400).json({ message: "Both company name and domain are required." });
  }

  try {
    // Check if the company already exists in the database
    const existingDomain = await Domain.findOne({ companyName });
    if (existingDomain) {
      return res.status(400).json({ message: "Company name already exists." });
    }

    // Create a new domain entry
    const newDomain = new Domain({
      companyName,
      domain,
    });

    // Save the new domain to the database
    await newDomain.save();

    return res.status(201).json({ message: "Company created successfully!" });
  } catch (error) {
    console.error("Error creating company:", error);
    return res.status(500).json({ message: "Something went wrong while creating the company." });
  }
};

// Check if a company name already exists
export const checkCompanyName = async (req, res) => {
  const { companyName } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: "Company name is required." });
  }

  try {
    // Check if the company name already exists
    const existingDomain = await Domain.findOne({ companyName });
    if (existingDomain) {
      return res.status(400).json({ message: "Company name already exists." });
    }

    return res.status(200).json({ message: "Company name is available." });
  } catch (error) {
    console.error("Error checking company name:", error);
    return res.status(500).json({ message: "Error checking the company name." });
  }
};






export const fetchCompanyDetail = async (req, res) => {
  try {
    const companies = await Domain.find({}, "_id companyName domain"); // Fetch only needed fields
    res.status(200).json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Failed to fetch company details" });
  }
};
