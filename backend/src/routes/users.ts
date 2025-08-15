import express, { Response } from 'express';
import User from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { IAuthRequest } from '../types';

const router = express.Router();

// GET /api/users/stats - Get user statistics
router.get('/stats', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const user = req.user!;

  const stats = {
    documentsUploaded: user.documentsUploaded,
    storageUsed: user.storageUsed,
    storageLimit: user.getStorageLimit(),
    documentLimit: user.getDocumentLimit(),
    subscription: user.subscription,
    remainingDocuments: user.remainingDocuments,
    remainingStorage: user.remainingStorage,
    storageUsagePercentage: user.storageUsagePercentage
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

export default router; 