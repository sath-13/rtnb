// routes/stream.routes.js

import express from 'express';
import { createSubStream, deleteSubStreamInStream, getSubStreamInStream, updateSubStream } from '../controllers/substream.controller.js';

const router = express.Router();

router.post('/', createSubStream);
// router.get('/:streamTitle',getSubStreamInStream);
router.get("/", getSubStreamInStream);

router.delete('/:id',deleteSubStreamInStream);
router.put('/:id',updateSubStream);


export default router;