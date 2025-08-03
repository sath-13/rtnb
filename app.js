import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import compression from 'compression';

// Import Models
import User from './models/user-model.js';

// Import Middlewares
import authMiddleware from "./middlewares/authMiddleware.js";
import requireAdminOrSuperAdmin from "./middlewares/requireAdminOrSuperAdmin.js";

// Import Route Files
import workspaceRoutes from "./routes/workspace.route.js";
import userRoutes from "./routes/users.route.js";
import authRoutes from "./routes/authRoutes.js";
import teamRoutes from "./routes/team.routes.js";
import streamRoutes from "./routes/stream.routes.js";
import subStreamRoutes from "./routes/substream.route.js";
import passwordResetRoutes from "./routes/passwordresetRoutes.js";
import notifyRoutes from "./routes/notifyUser.routes.js";
import actionRoutes from "./routes/action.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { notifyUsersAboutSurveyLaunch } from "./service/notification.service.js";
import commentsRoutes from "./routes/comment.routes.js";
import historyRoutes from "./routes/history.routes.js";
import clientRouter from "./routes/clientRouter.js";
import featureRouter from "./routes/featureRouter.js";
import projectteamrouter from "./routes/projectTeamRouter.js";
import portfoliochatrouter from "./routes/portfoliochatrouter.js";
import reviewsRoutes from "./routes/reviewsRoutes.js";
import techstackrouter from "./routes/techStackRoute.js";
import projectrouter from "./routes/projectRoutes.js";
import importRouter from "./routes/importRoute.js";
import companyRoutes from "./routes/companyRoutes.js";
import badgeRoutes from "./routes/badgeRoutes.js";
import feedbackRoutes from "./routes/feedback_Routes.js";
import postRoutes from "./routes/post-routes.js";
import anniverseryRoutes from "./routes/anniverseryRoutes.js";
import emailRoutes from './routes/emailRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import bookingRoutes from './routes/ResourceAllocationRoutes.js';
import typeOfWorkRoutes from './routes/TypeOfWorkRoutes.js';
import internalNodeRoutes from "./routes/internalNodeRoutes.js";
import productRoutes from "./routes/product.routes.js";
import assignedproductRoutes from "./routes/assignedProduct.routes.js";
import domainRoutes from "./routes/domainRoutes.js";
import companyroleRoutes from "./routes/CompanyRolesRoutes.js";
import roleAccessRoutes from './routes/roleAccessRoutes.js';
import assetAcknowledgementRoutes from "./routes/assetAknowledgementRoutes.js";
import reminderRoutes from "./routes/Reminderroutes.js";
import eventRouter from "./routes/eventRoute.js";
import taskRouter from "./routes/todoListRoute.js";
import hiringRoutes from "./routes/hiringRoutes.js";
import analyticsRoutes from "./routes/analytics.js";
import surveyResponseRoutes from "./routes/surveyResponseRoutes.js";
import complianceRoutes from "./routes/compliance_routes.js";
import importUserProfileRouter from "./routes/importUserProfileRoute.js";
import accessMatrixHistoryRoutes from './routes/accessMatrixHistory.js';
import wfhRoutes from './routes/wfh.routes.js';
import surveyRoutes from './routes/survey.routes.js';
import adminReplyRoutes from './routes/adminReply.routes.js';
import geminiRoutes from './routes/gemini.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
// WARNING: For development only.
app.use(cors());
// Proper CORS setup
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       process.env.CLIENT_URL,
//       "https://accounts.google.com"
//     ];
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-token-expiry', 'x-user-id'],
//   exposedHeaders: ["x-token-expiry"],
//   credentials: true,
// }));

// Remove COOP headers to fix postMessage issue
app.use((req, res, next) => {
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  next();
});

app.use(compression());

// Attach Socket.IO
import { Server } from "socket.io";
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ userId }) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {});
});

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(morgan("tiny"));

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get("/", (req, res) => {
  console.log(req.ip);
  res.send("Api is running....");
});

// Define routes
app.use("/api/workspace", workspaceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/sub-streams", subStreamRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/notify-users", notifyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/import", importRouter);
app.use("/api/clients", clientRouter);
app.use("/api/features", featureRouter);
app.use("/api/project-team", projectteamrouter);
app.use("/api/chatbot", portfoliochatrouter);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/techStacks", techstackrouter);
app.use("/api/projects", projectrouter);
app.use("/api/company", companyRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/anniversaries", anniverseryRoutes);
app.use("/api/event", eventRouter);
app.use("/api/task", taskRouter);
app.use("/api/hiring-request", hiringRoutes);
app.use('/api/email', emailRoutes);
app.use("/api/internal-node", internalNodeRoutes);
app.use('/api/domain', domainRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/product', productRoutes);
app.use('/api/assigned-product', assignedproductRoutes);
app.use('/api/company-specific-roles', companyroleRoutes);
app.use('/api/role-access', roleAccessRoutes);
app.use("/api/asset-acknowledgement", assetAcknowledgementRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/type-of-work', typeOfWorkRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/api/survey-responses", surveyResponseRoutes);
app.use("/api/compliance", complianceRoutes);
app.use('/api/role-access-history', accessMatrixHistoryRoutes);
app.use("/api/import-user-profiles", importUserProfileRouter);
app.use("/api/wfh", wfhRoutes);

// Survey-related routes - matching original URL patterns
app.use("/survey", surveyRoutes);     // Handles /survey/* routes  
app.use("/surveys", surveyRoutes);    // Handles /surveys/* routes
app.use("/admin-replies", adminReplyRoutes);
app.use("/api", geminiRoutes);


//----------------ALL SURVEY RELATED HANDLING MOVED TO MVC STRUCTURE-----------------
// Survey routes have been moved to:
// - /routes/survey.routes.js
// - /routes/adminReply.routes.js  
// - /routes/gemini.routes.js
// Controllers:
// - /controllers/surveyController.js
// - /controllers/adminReplyController.js
// - /controllers/geminiController.js

export default server;
export { io };
