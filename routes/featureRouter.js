import express from 'express';
import {
    createFeature, 
    getAllFeatures, 
    updateFeature,
    deleteFeature,
    addProjectFeature,
    removeProjectFeature
} from '../controllers/featureController.js';
import authenticateUser from '../middlewares/login.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const featureRouter = express.Router();

featureRouter.post('/',authMiddleware,createFeature);
featureRouter.get('/',authMiddleware,getAllFeatures);
featureRouter.put('/:id',authMiddleware, updateFeature);
featureRouter.delete('/:id', authMiddleware,deleteFeature);
featureRouter.post('/projects/features', authMiddleware,addProjectFeature);
featureRouter.delete('/projects/features/:project_id/:feature_id', removeProjectFeature);

export default featureRouter;