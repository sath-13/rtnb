import express from "express";
//import authenticateUser from "../middlewares/login.js";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByTeam,
  getProjectsByClient,
  getProjectByProjectId,
  searchByAllFields,
  uploadProjectImage,
  deleteProjectImage
} from "../controllers/projectController.js";

import multer from "multer";
import authMiddleware from "../middlewares/authMiddleware.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "docs/");
  },
  filename: (req, file, cb) => {
    const uniqueFilename = file.originalname;
    cb(null, uniqueFilename);
  },
});

const projectRouter = express.Router();
const upload = multer({ storage: storage });

projectRouter.get('/project/:id', authMiddleware, getProjectByProjectId);
projectRouter.get("/", authMiddleware, getAllProjects);
projectRouter.get("/client/:id", authMiddleware, getProjectById);
projectRouter.post("/", authMiddleware, createProject);
projectRouter.put("/:id", authMiddleware, updateProject);
projectRouter.delete("/:id", authMiddleware, deleteProject);
projectRouter.get('/team/:teamId', authMiddleware, getProjectsByTeam);
projectRouter.get('/client/:clientId', authMiddleware, getProjectsByClient);
projectRouter.get('/search/', authMiddleware, searchByAllFields);
projectRouter.post("/upload-image/:id", authMiddleware, upload.single("image"), uploadProjectImage);
projectRouter.delete("/delete-image/:id", authMiddleware, deleteProjectImage);

export default projectRouter;
