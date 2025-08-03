import express from "express";
import { createTechStack, getAllTechStack, getTechStackById ,UpdateTechStack,deleteTechStack, addProjectTechStack, removeProjectTechStack} from "../controllers/techStackController.js";
import authenticateUser from "../middlewares/login.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const techstackrouter = express.Router();

techstackrouter.post("/", authMiddleware, createTechStack);
techstackrouter.get("/", authMiddleware, getAllTechStack);
techstackrouter.get("/:id",authMiddleware, getTechStackById); // New route to get a tech stack by ID
techstackrouter.put("/",authMiddleware,UpdateTechStack);
techstackrouter.delete("/",authMiddleware,deleteTechStack);

// Add new routes for managing project tech stacks
techstackrouter.put("/project-tech-stack", authMiddleware, addProjectTechStack);
techstackrouter.delete("/project-tech-stack/:project_id/:tech_stack_id", authMiddleware, removeProjectTechStack);
export default techstackrouter;
