import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document';
import { asyncHandler } from '../middleware/errorHandler';
import { IAuthRequest } from '../types';
import AIService from '../services/aiService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

// GET /api/documents - Get user's documents
router.get('/', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { page = '1', limit = '10', status, fileType } = req.query;
  const query: any = { userId: req.user!._id };

  if (status) query.processingStatus = status;
  if (fileType) query.fileType = fileType;

  const documents = await Document.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string) * 1)
    .skip((parseInt(page as string) - 1) * parseInt(limit as string));

  const total = await Document.countDocuments(query);

  res.json({
    success: true,
    data: { documents },
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// GET /api/documents/search - Search documents
router.get('/search', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { q, page = '1', limit = '10' } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Search query is required' 
    });
  }

  try {
    // Use the textSearch method from Document model
    const documents = await Document.textSearch(req.user!._id, q as string, {
      limit: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    });

    // Get total count for pagination
    const total = await Document.countDocuments({
      userId: req.user!._id,
      $text: { $search: q as string }
    });

    res.json({
      success: true,
      data: { 
        documents, 
        pagination: { 
          page: parseInt(page as string), 
          limit: parseInt(limit as string), 
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
          query: q
        } 
      }
    });
  } catch (error) {
    // If no text index exists or search fails, return empty results
    res.json({
      success: true,
      data: { 
        documents: [], 
        pagination: { 
          page: parseInt(page as string), 
          limit: parseInt(limit as string), 
          total: 0,
          pages: 0,
          query: q
        } 
      }
    });
  }
}));

// POST /api/documents/upload - Upload document
router.post('/upload', upload.single('file'), asyncHandler(async (req: IAuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const { title } = req.body;
  const fileType = path.extname(req.file.originalname).toLowerCase().slice(1);

  // Extract text from uploaded file
  let extractedText = '';
  try {
    extractedText = await AIService.extractText(req.file.path, fileType);
  } catch (error) {
    console.error('Text extraction failed:', error);
    extractedText = `Failed to extract text from ${req.file.originalname}`;
  }

  const document = new Document({
    userId: req.user!._id,
    title: title || req.file.originalname,
    originalFileName: req.file.originalname,
    filePath: req.file.path,
    fileType,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    extractedText: extractedText,
    wordCount: extractedText.split(/\s+/).length,
    processingStatus: 'pending'
  });

  await document.save();

  // Update user stats
  req.user!.documentsUploaded += 1;
  req.user!.storageUsed += req.file.size;
  await req.user!.save();

  // Start AI processing in background (non-blocking)
  processDocumentAI(document._id.toString(), extractedText, req.file.originalname);

  res.status(201).json({
    success: true,
    data: { document },
    message: 'Document uploaded successfully and AI processing started'
  });
}));

// GET /api/documents/:id - Get specific document
router.get('/:id', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user!._id
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  res.json({
    success: true,
    data: { document }
  });
}));

// DELETE /api/documents/:id - Delete document
router.delete('/:id', asyncHandler(async (req: IAuthRequest, res: Response) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user!._id
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Delete file from filesystem
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  // Update user stats
  req.user!.documentsUploaded -= 1;
  req.user!.storageUsed -= document.fileSize;
  await req.user!.save();

  await Document.findByIdAndDelete(document._id);

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
}));

/**
 * Background function to process document with AI
 * @param documentId - Document ID to process
 * @param text - Extracted text content
 * @param fileName - Original file name
 */
async function processDocumentAI(documentId: string, text: string, fileName: string): Promise<void> {
  try {
    console.log(`🤖 Starting AI processing for document: ${documentId}`);
    
    // Update status to processing
    await Document.findByIdAndUpdate(documentId, { 
      processingStatus: 'processing' 
    });

    // Perform AI analysis
    const analysis = await AIService.analyzeDocument(text, fileName);
    
    // Generate embeddings for semantic search
    const embeddings = await AIService.generateEmbeddings(text);

    // Update document with AI analysis results
    await Document.findByIdAndUpdate(documentId, {
      processingStatus: 'completed',
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      keywords: analysis.keywords,
      topics: analysis.topics,
      entities: analysis.entities,
      embeddings: embeddings,
      readingTime: analysis.readingTime,
      metadata: {
        complexity: analysis.complexity,
        language: analysis.language,
        processedAt: new Date()
      }
    });

    console.log(`✅ AI processing completed for document: ${documentId}`);
  } catch (error) {
    console.error(`❌ AI processing failed for document: ${documentId}`, error);
    
    // Update status to failed
    await Document.findByIdAndUpdate(documentId, { 
      processingStatus: 'failed' 
    });
  }
}

export default router; 