import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';

const router = Router();

router.use(requireAuth);

router.get('/', listBudgets);
router.post('/', createBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;