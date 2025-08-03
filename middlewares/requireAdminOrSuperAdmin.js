// middlewares/requireAdminOrSuperAdmin.js
export default function requireAdminOrSuperAdmin(req, res, next) {
    if (req.user && (req.user.role === "superadmin" || req.user.role === "admin")) {
      return next();
    }
    return res.status(403).json({ msg: "Access forbidden: Admins only" });
  }
// this middle ware is used to check if the user is an admin or superadmin
// used for analytics and pulsesync feature.
