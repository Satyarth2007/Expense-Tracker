import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { exportReport } from '../controllers/reportController.js';

const router = Router();

router.use(requireAuth);

router.get('/export', exportReport);

export default router;