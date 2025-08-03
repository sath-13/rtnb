import jwt from "jsonwebtoken";


const authMiddleware = (req, res, next) => {
  // Extract token from the Authorization header
  const token = req.header("Authorization")?.split(" ")[1];

  // Check if token is missing
  if (!token) {
    return res.status(401).json({ msg: "Access Denied! No Token Provided" });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Save decoded user data in request
    req.user = decoded;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // Log error if token verification fails
    console.error("Token Verification Error:", err); // Debugging line
    return res.status(401).json({ msg: "Invalid Token" });
  }
};

export default authMiddleware;
