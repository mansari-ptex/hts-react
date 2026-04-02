import express from 'express';
import { dataController } from '../controllers/dataController.js';

const router = express.Router();

router.get('/status', dataController.getStatus);
router.get('/search', dataController.searchHTS);
router.get('/code/:code', dataController.getByCode);

export default router;
