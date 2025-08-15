import express, { Response } from 'express';
import Document from '../models/Document';
import Topic from '../models/Topic';
import { asyncHandler } from '../middleware/errorHandler';
import { IAuthRequest } from '../types';

const router = express.Router();

// POST /api/analysis/process/:documentId - Process document with AI
router.post('/process/:documentId', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const document = await Document.findOne({
    _id: req.params.documentId,
    userId: req.user!._id
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Update status to processing
  document.processingStatus = 'processing';
  await document.save();

  // In a real implementation, this would trigger background processing
  // For now, we'll simulate processing completion
  setTimeout(async () => {
    document.processingStatus = 'completed';
    document.summary = {
      short: 'This is a short summary placeholder.',
      medium: 'This is a medium length summary placeholder with more details.',
      detailed: 'This is a detailed summary placeholder with comprehensive analysis and insights.'
    };
    document.sentiment = {
      score: 0.1,
      label: 'positive',
      confidence: 0.85
    };
    document.keywords = ['sample', 'document', 'analysis'];
    document.topics = ['General'];
    await document.save();
  }, 2000);

  res.json({
    success: true,
    message: 'Document processing started',
    data: { document }
  });
}));

// POST /api/analysis/compare - Compare two documents
router.post('/compare', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { document1Id, document2Id } = req.body;

  if (!document1Id || !document2Id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both document IDs are required' 
    });
  }

  const [doc1, doc2] = await Promise.all([
    Document.findOne({ _id: document1Id, userId: req.user!._id }),
    Document.findOne({ _id: document2Id, userId: req.user!._id })
  ]);

  if (!doc1 || !doc2) {
    return res.status(404).json({ 
      success: false, 
      message: 'One or both documents not found' 
    });
  }

  // Simple comparison logic (in real implementation, use AI)
  const similarity = Math.random() * 0.5 + 0.3; // Random similarity between 0.3-0.8
  
  const comparison = {
    document1Id,
    document2Id,
    similarity,
    differences: {
      added: ['new content', 'additional analysis'],
      removed: ['outdated information'],
      modified: ['updated statistics']
    },
    sentiment: {
      document1: doc1.sentiment.score,
      document2: doc2.sentiment.score,
      change: doc2.sentiment.score - doc1.sentiment.score
    },
    keywordChanges: {
      added: ['innovation', 'technology'],
      removed: ['legacy'],
      frequency: {}
    }
  };

  res.json({
    success: true,
    data: { comparison }
  });
}));

// GET /api/analysis/trends - Get trending topics
router.get('/trends', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const trends = await Topic.findByUser(req.user!._id, true)
    .limit(10);

  res.json({
    success: true,
    data: { trends }
  });
}));

// GET /api/analysis/analytics - Get user analytics
router.get('/analytics', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const analytics = await Document.getUserAnalytics(req.user!._id);

  res.json({
    success: true,
    data: { analytics }
  });
}));

export default router; 