// routes/stream.routes.js

import express from 'express';
import { createStream, getStreamsInWorkspace, deleteStreamFromWorkspace, updateStream } from '../controllers/stream.controller.js';

const router = express.Router();

router.post('/', createStream);
router.get('/:workspaceName', getStreamsInWorkspace);
router.delete('/:id', deleteStreamFromWorkspace);
router.put('/:id', updateStream);


export default router;