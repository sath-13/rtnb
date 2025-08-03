import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import * as locale from "../locale/index.js";
import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";
import config from "../config.js";

export const userActions = {
  login: { maxAttempts: 500, mins: 60, message: locale.LOGIN_MANY_ATTEMPT },
  register: { maxAttempts: 500, mins: 60, message: locale.SIGNUP_MANY_ATTEMPT },
  forgotPassword: {
    maxAttempts: 500,
    mins: 60,
    message: locale.FORGOTPASS_MANY_ATTEMPT,
  },
};

export const actionLimitter = (action) =>
  rateLimit({
    windowMs: 1000 * 60 * action.mins,
    max: action.maxAttempts,
    message: action.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) =>
      res.status(options.statusCode).send({ errorMessage: options.message }),
  });

function validateToken(token) {
  return typeof token === "string" && token.trim() !== "";
}

export const authorizeUserAction = (resourceUser, reqUser) => {
  if (reqUser.role === "superadmin") return true;
  if (resourceUser.toString() === reqUser._id.toString()) return true;
  return false;
};

async function findUserById(userId) {
  const user = await User.findOne({ _id: userId });
  if (user) return user;
  return await Admin.findOne({ _id: userId });
}

// Middleware function to validate header tokens
async function authenticateUser(req, res, next) {
  try {

    if (!req.headers["authorization"]) {
      return res.status(401).json({ error: "No authorization headers sent" });
    }

    const token = req.headers["authorization"].split(" ")[1];
    if (!token || !validateToken(token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const decodedToken = jwt.verify(token, config.JWT_SECRET, {
      ignoreExpiration: true,
    });
    const curTime = new Date().getTime() / 1000;

    if (decodedToken.exp < curTime) {
      res.setHeader("x-token-expiry", "true");
      return res.status(401).json({ error: "Token expired" });
    }

    const user = await findUserById(decodedToken.userId);
    if (user && user._id) {
      req.user = user;
    } else {
      return res.status(404).json({ error: "User not found" });
    }
    next();
  } catch (e) {
    return res.status(500).json({
      error: "Error occurred while validating authentication token",
      message: e.message,
    });
  }
}

export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    if (!validateToken(token)) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const decodedToken = jwt.verify(token, config.JWT_SECRET, {
      ignoreExpiration: true,
    });
    const curTime = new Date().getTime() / 1000;
    if (decodedToken.exp < curTime) {
      return next(new Error("Authentication error: Token expired"));
    }

    const user = await findUserById(decodedToken.userId);
    if (user && user._id) {
      socket.user = decodedToken;
      next();
    } else {
      return next(new Error("Authentication error: User not found"));
    }
  } catch (e) {
    console.error("authenticateSocket ~ e:", e);
    return next(new Error("Authentication error: " + e.message));
  }
}

export default authenticateUser;
