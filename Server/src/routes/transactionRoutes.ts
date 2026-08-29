import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';

const router = Router();

router.use(requireAuth);

router.get('/', listTransactions);
router.post('/', createTransaction);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;