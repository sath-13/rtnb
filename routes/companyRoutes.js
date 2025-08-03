import  express from  'express';
import  { saveOrUpdateCompanyDetails ,getCompanyById, getAllBranches , getCompanyDetails  } from "../controllers/companyController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/details", authMiddleware, saveOrUpdateCompanyDetails);
router.get("/branches", getAllBranches);
router.get("/details", getCompanyDetails);
router.get('/:id', getCompanyById);

export default  router;
