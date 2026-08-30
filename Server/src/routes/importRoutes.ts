import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { uploadCsv } from '../middleware/uploadMiddleware.js';
import {
  uploadImportFile,
  confirmMapping,
  getImportSessionHandler,
  updateStagedRow,
  commitImport,
  discardImport,
} from '../controllers/importController.js';

const router = Router();

router.use(requireAuth);

router.post('/upload', uploadCsv.single('file'), uploadImportFile);
router.post('/:sessionId/confirm-mapping', confirmMapping);
router.get('/:sessionId', getImportSessionHandler);
router.patch('/:sessionId/rows/:rowId', updateStagedRow);
router.post('/:sessionId/commit', commitImport);
router.delete('/:sessionId', discardImport);

export default router;