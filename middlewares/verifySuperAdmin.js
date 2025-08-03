// backend/middlewares/verifySuperAdmin.js
import Admin from "../models/SuperAdmin-model.js";

export const verifySuperAdmin = async (req, res, next) => {
  try {
    // Pehle check karo ke req.user hai ya nahi
    if (!req.user || !req.user.id) {
      return res.status(403).json({ msg: "Access forbidden: No User ID" });
    }

    // User ID se database mein search karo
    const admin = await Admin.findById(req.user.id);

    // Agar user nahi mila ya role `superadmin` nahi hai to access deny karo
    if (!admin || admin.role !== "superadmin") {
      return res.status(403).json({ msg: "Access forbidden: Super Admins only" });
    }

    // Agar sab kuch sahi hai to aage jaane do
    next();
  } catch (err) {
    console.error("Middleware error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
