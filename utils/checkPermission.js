import CustomError from "../errors/index.js";

const checkPermission = (requestedUser, resourceUserId) => {
  if (requestedUser.role === "superadmin" || requestedUser.role === "admin") return;
  if (requestedUser.userId === resourceUserId.toString()) return;

  throw new CustomError.UnauthorizedError("Not authorized to access this route");
};

export default checkPermission;
