import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  listRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
} from '../controllers/recurringController.js';

const router = Router();

router.use(requireAuth);

router.get('/', listRecurringRules);
router.post('/', createRecurringRule);
router.patch('/:id', updateRecurringRule);
router.delete('/:id', deleteRecurringRule);

export default router;