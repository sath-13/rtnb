import express from 'express';
import { fetchPortfolioData, processChatMessage } from '../controllers/portfoliochatcontroller.js';

const portfoliochatrouter = express.Router();

portfoliochatrouter.get('/fetch-portfolio-data', fetchPortfolioData);
portfoliochatrouter.post('/chat', processChatMessage);

export default portfoliochatrouter;