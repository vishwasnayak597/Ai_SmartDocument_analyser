import mongoose, { Schema, Model } from 'mongoose';
import { IDocument, INamedEntity, IDocumentVersion } from '../types';

// Define interface for static methods
interface IDocumentModel extends Model<IDocument> {
  findByUserWithFilters(userId: string, filters?: any): Promise<IDocument[]>;
  textSearch(userId: string, searchTerm: string, options?: any): Promise<IDocument[]>;
  getUserAnalytics(userId: string): Promise<any>;
}

/**
 * Named Entity schema
 */
const namedEntitySchema = new Schema<INamedEntity>({
  text: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true,
    enum: ['PERSON', 'ORG', 'GPE', 'DATE', 'MONEY', 'CARDINAL', 'ORDINAL', 'PERCENT', 'TIME', 'QUANTITY', 'EVENT', 'LAW', 'PRODUCT', 'WORK_OF_ART', 'LANGUAGE', 'FAC', 'LOC', 'NORP']
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  startPos: {
    type: Number,
    required: true,
    min: 0
  },
  endPos: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

/**
 * Document version schema for tracking changes
 */
const documentVersionSchema = new Schema<IDocumentVersion>({
  versionNumber: {
    type: Number,
    required: true,
    min: 1
  },
  summary: {
    type: String,
    required: true,
    maxlength: [500, 'Version summary cannot exceed 500 characters']
  },
  changes: {
    type: String,
    required: true,
    maxlength: [1000, 'Version changes cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * Document metadata schema
 */
const documentMetadataSchema = new Schema({
  author: {
    type: String,
    maxlength: [200, 'Author name cannot exceed 200 characters']
  },
  creationDate: {
    type: Date
  },
  modificationDate: {
    type: Date
  },
  subject: {
    type: String,
    maxlength: [500, 'Subject cannot exceed 500 characters']
  },
  creator: {
    type: String,
    maxlength: [200, 'Creator name cannot exceed 200 characters']
  }
}, { _id: false });

/**
 * Document summary schema
 */
const documentSummarySchema = new Schema({
  short: {
    type: String,
    default: '',
    maxlength: [500, 'Short summary cannot exceed 500 characters']
  },
  medium: {
    type: String,
    default: '',
    maxlength: [1500, 'Medium summary cannot exceed 1500 characters']
  },
  detailed: {
    type: String,
    default: '',
    maxlength: [5000, 'Detailed summary cannot exceed 5000 characters']
  }
}, { _id: false });

/**
 * Document sentiment schema
 */
const documentSentimentSchema = new Schema({
  score: {
    type: Number,
    required: true,
    min: -1,
    max: 1,
    default: 0
  },
  label: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0
  }
}, { _id: false });

/**
 * Main Document schema definition
 */
const documentSchema = new Schema<IDocument>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: 'text'
  },
  originalFileName: {
    type: String,
    required: [true, 'Original file name is required'],
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: ['pdf', 'docx', 'txt', 'image'],
    index: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  extractedText: {
    type: String,
    default: '',
    index: 'text'
  },
  summary: {
    type: documentSummarySchema,
    default: {}
  },
  keywords: {
    type: [String],
    default: [],
    validate: {
      validator: function(keywords: string[]) {
        return keywords.length <= 50;
      },
      message: 'Cannot have more than 50 keywords'
    }
  },
  entities: {
    type: [namedEntitySchema],
    default: []
  },
  sentiment: {
    type: documentSentimentSchema,
    default: {}
  },
  language: {
    type: String,
    default: 'en',
    maxlength: [10, 'Language code cannot exceed 10 characters']
  },
  pageCount: {
    type: Number,
    min: [0, 'Page count cannot be negative'],
    default: 1
  },
  wordCount: {
    type: Number,
    required: [true, 'Word count is required'],
    min: [0, 'Word count cannot be negative'],
    default: 0
  },
  readingTime: {
    type: Number,
    required: [true, 'Reading time is required'],
    min: [0, 'Reading time cannot be negative'],
    default: 0
  },
  topics: {
    type: [String],
    default: [],
    validate: {
      validator: function(topics: string[]) {
        return topics.length <= 20;
      },
      message: 'Cannot have more than 20 topics'
    }
  },
  embeddings: {
    type: [Number],
    default: [],
    select: false // Don't include embeddings in queries by default due to size
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  processingError: {
    type: String,
    maxlength: [1000, 'Processing error cannot exceed 1000 characters']
  },
  metadata: {
    type: documentMetadataSchema,
    default: {}
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 30;
      },
      message: 'Cannot have more than 30 tags'
    }
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  collaborators: {
    type: [String],
    default: [],
    validate: {
      validator: function(collaborators: string[]) {
        return collaborators.length <= 50;
      },
      message: 'Cannot have more than 50 collaborators'
    }
  },
  versions: {
    type: [documentVersionSchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      delete ret.embeddings; // Don't include embeddings in JSON by default
      return ret;
    }
  }
});

/**
 * Index definitions for better query performance
 */
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, processingStatus: 1 });
documentSchema.index({ userId: 1, fileType: 1 });
documentSchema.index({ userId: 1, isPublic: 1 });
documentSchema.index({ keywords: 1 });
documentSchema.index({ topics: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ 'sentiment.label': 1 });
documentSchema.index({ language: 1 });
documentSchema.index({ wordCount: 1 });
documentSchema.index({ createdAt: -1 });

// Text index for full-text search
documentSchema.index({
  title: 'text',
  extractedText: 'text',
  keywords: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    keywords: 5,
    tags: 3,
    extractedText: 1
  }
});

/**
 * Pre-save middleware to calculate reading time
 */
documentSchema.pre('save', function(next) {
  if (this.isModified('wordCount')) {
    // Average reading speed is 200-250 words per minute
    const wordsPerMinute = 225;
    this.readingTime = Math.ceil(this.wordCount / wordsPerMinute);
  }
  next();
});

/**
 * Pre-save middleware to validate file constraints
 */
documentSchema.pre('save', function(next) {
  // Validate embeddings vector size if present
  if (this.embeddings && this.embeddings.length > 0 && this.embeddings.length !== 1536) {
    return next(new Error('Embeddings vector must be exactly 1536 dimensions for OpenAI embeddings'));
  }
  
  next();
});

/**
 * Instance method to calculate similarity with another document
 * @param otherDocument - Document to compare with
 * @returns number - Cosine similarity score (0-1)
 */
documentSchema.methods.calculateSimilarity = function(otherDocument: IDocument): number {
  if (!this.embeddings || !otherDocument.embeddings) {
    return 0;
  }
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < this.embeddings.length; i++) {
    dotProduct += this.embeddings[i] * otherDocument.embeddings[i];
    normA += this.embeddings[i] * this.embeddings[i];
    normB += otherDocument.embeddings[i] * otherDocument.embeddings[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Instance method to add a new version
 * @param summary - Summary of changes
 * @param changes - Detailed changes
 * @param userId - User making the change
 */
documentSchema.methods.addVersion = function(summary: string, changes: string, userId: string) {
  const newVersion: IDocumentVersion = {
    versionNumber: this.versions.length + 1,
    summary,
    changes,
    createdAt: new Date(),
    createdBy: userId
  };
  
  this.versions.push(newVersion);
};

/**
 * Instance method to check if user can access document
 * @param userId - User ID to check access for
 * @returns boolean - True if user has access
 */
documentSchema.methods.canUserAccess = function(userId: string): boolean {
  return this.userId === userId || 
         this.isPublic || 
         this.collaborators.includes(userId);
};

/**
 * Instance method to get processing progress
 * @returns number - Progress percentage (0-100)
 */
documentSchema.methods.getProcessingProgress = function(): number {
  switch (this.processingStatus) {
    case 'pending': return 0;
    case 'processing': return 50;
    case 'completed': return 100;
    case 'failed': return 0;
    default: return 0;
  }
};

/**
 * Static method to find documents by user with filters
 * @param userId - User ID
 * @param filters - Filter options
 * @returns Promise<IDocument[]> - Array of documents
 */
documentSchema.statics.findByUserWithFilters = function(userId: string, filters: any = {}) {
  const query: any = { userId };
  
  if (filters.fileType) {
    query.fileType = { $in: Array.isArray(filters.fileType) ? filters.fileType : [filters.fileType] };
  }
  
  if (filters.processingStatus) {
    query.processingStatus = filters.processingStatus;
  }
  
  if (filters.dateRange) {
    query.createdAt = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }
  
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  if (filters.sentiment) {
    query['sentiment.label'] = filters.sentiment;
  }
  
  if (filters.minWordCount || filters.maxWordCount) {
    query.wordCount = {};
    if (filters.minWordCount) query.wordCount.$gte = filters.minWordCount;
    if (filters.maxWordCount) query.wordCount.$lte = filters.maxWordCount;
  }
  
  return this.find(query);
};

/**
 * Static method for text search
 * @param userId - User ID
 * @param searchTerm - Search term
 * @param options - Search options
 * @returns Promise<IDocument[]> - Array of matching documents
 */
documentSchema.statics.textSearch = function(userId: string, searchTerm: string, options: any = {}) {
  const query: any = {
    userId,
    $text: { $search: searchTerm }
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

/**
 * Static method to get user document analytics
 * @param userId - User ID
 * @returns Promise<any> - Analytics data
 */
documentSchema.statics.getUserAnalytics = async function(userId: string) {
  const analytics = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalWords: { $sum: '$wordCount' },
        totalSize: { $sum: '$fileSize' },
        avgWordsPerDocument: { $avg: '$wordCount' },
        avgReadingTime: { $avg: '$readingTime' },
        fileTypes: { $push: '$fileType' },
        sentiments: { $push: '$sentiment.label' },
        processingStatuses: { $push: '$processingStatus' }
      }
    }
  ]);
  
  const result = analytics[0] || {};
  
  // Count file types
  if (result.fileTypes) {
    const fileTypeCounts: { [key: string]: number } = {};
    result.fileTypes.forEach((type: string) => {
      fileTypeCounts[type] = (fileTypeCounts[type] || 0) + 1;
    });
    result.fileTypeDistribution = fileTypeCounts;
    delete result.fileTypes;
  }
  
  // Count sentiments
  if (result.sentiments) {
    const sentimentCounts: { [key: string]: number } = {};
    result.sentiments.forEach((sentiment: string) => {
      sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
    });
    result.sentimentDistribution = sentimentCounts;
    delete result.sentiments;
  }
  
  // Count processing statuses
  if (result.processingStatuses) {
    const statusCounts: { [key: string]: number } = {};
    result.processingStatuses.forEach((status: string) => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    result.processingStatusDistribution = statusCounts;
    delete result.processingStatuses;
  }
  
  return result;
};

/**
 * Virtual for formatted file size
 */
documentSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

/**
 * Virtual for formatted reading time
 */
documentSchema.virtual('formattedReadingTime').get(function() {
  const minutes = this.readingTime;
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 1 && remainingMinutes === 0) return '1 hour';
  if (remainingMinutes === 0) return `${hours} hours`;
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
});

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

/**
 * Create and export the Document model
 */
const Document = mongoose.model<IDocument, IDocumentModel>('Document', documentSchema);

export default Document; 