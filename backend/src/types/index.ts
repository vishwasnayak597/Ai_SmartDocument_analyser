import { Document } from 'mongoose';
import { Request } from 'express';

/**
 * User interface extending Mongoose Document
 */
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  subscription: 'free' | 'pro' | 'enterprise';
  subscriptionExpiry?: Date;
  documentsUploaded: number;
  storageUsed: number; // in bytes
  preferences: {
    defaultSummaryLength: 'short' | 'medium' | 'detailed';
    autoProcessing: boolean;
    emailNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  isSubscriptionActive(): boolean;
  getStorageLimit(): number;
  getDocumentLimit(): number;
  canUploadMore(): boolean;
  hasStorageSpace(fileSize: number): boolean;
  remainingDocuments: number;
  remainingStorage: number;
  storageUsagePercentage: number;
}

/**
 * Document interface extending Mongoose Document
 */
export interface IDocument extends Document {
  _id: string;
  userId: string;
  title: string;
  originalFileName: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'image';
  fileSize: number;
  mimeType: string;
  extractedText: string;
  summary: {
    short: string;
    medium: string;
    detailed: string;
  };
  keywords: string[];
  entities: INamedEntity[];
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  language: string;
  pageCount?: number;
  wordCount: number;
  readingTime: number; // in minutes
  topics: string[];
  embeddings: number[]; // Vector embeddings for semantic search
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  metadata: {
    author?: string;
    creationDate?: Date;
    modificationDate?: Date;
    subject?: string;
    creator?: string;
  };
  tags: string[];
  isPublic: boolean;
  collaborators: string[]; // user IDs
  versions: IDocumentVersion[];
  createdAt: Date;
  updatedAt: Date;
  calculateSimilarity(otherDocument: IDocument): number;
  addVersion(summary: string, changes: string, userId: string): void;
  canUserAccess(userId: string): boolean;
  getProcessingProgress(): number;
}

/**
 * Document version for tracking changes
 */
export interface IDocumentVersion {
  versionNumber: number;
  summary: string;
  changes: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * Named entity interface
 */
export interface INamedEntity {
  text: string;
  label: string; // PERSON, ORG, GPE, etc.
  confidence: number;
  startPos: number;
  endPos: number;
}

/**
 * Topic interface for trend tracking
 */
export interface ITopic extends Document {
  _id: string;
  userId: string;
  name: string;
  description: string;
  keywords: string[];
  documentIds: string[];
  timeline: ITopicTimelineEntry[];
  trendData: {
    frequency: number;
    sentimentTrend: number[];
    popularityScore: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addTimelineEntry(entry: ITopicTimelineEntry): void;
}

/**
 * Topic timeline entry for chronological tracking
 */
export interface ITopicTimelineEntry {
  documentId: string;
  date: Date;
  content: string;
  relevanceScore: number;
  sentiment: number;
  keyQuotes: string[];
}

/**
 * Analysis job interface for background processing
 */
export interface IAnalysisJob extends Document {
  _id: string;
  userId: string;
  documentId: string;
  jobType: 'summarization' | 'entity_extraction' | 'sentiment_analysis' | 'topic_detection' | 'embedding_generation';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Workspace interface for collaborative features
 */
export interface IWorkspace extends Document {
  _id: string;
  name: string;
  description: string;
  ownerId: string;
  members: IWorkspaceMember[];
  documentIds: string[];
  settings: {
    isPublic: boolean;
    allowGuestAccess: boolean;
    defaultPermissions: 'view' | 'edit' | 'admin';
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workspace member interface
 */
export interface IWorkspaceMember {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: Date;
  invitedBy: string;
}

/**
 * Search query interface
 */
export interface ISearchQuery {
  query: string;
  filters: {
    fileType?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    language?: string;
    minWordCount?: number;
    maxWordCount?: number;
  };
  sortBy: 'relevance' | 'date' | 'title' | 'size';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Search result interface
 */
export interface ISearchResult {
  document: IDocument;
  relevanceScore: number;
  matchedSnippets: string[];
  highlightedText: string;
}

/**
 * API response wrapper
 */
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Authentication token payload
 */
export interface ITokenPayload {
  userId: string;
  email: string;
  subscription: string;
  iat: number;
  exp: number;
}

/**
 * File upload configuration
 */
export interface IFileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  destination: string;
}

/**
 * Document comparison result
 */
export interface IDocumentComparison {
  document1Id: string;
  document2Id: string;
  similarity: number;
  differences: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  sentiment: {
    document1: number;
    document2: number;
    change: number;
  };
  keywordChanges: {
    added: string[];
    removed: string[];
    frequency: { [key: string]: { doc1: number; doc2: number } };
  };
}

/**
 * AI processing options
 */
export interface IAIProcessingOptions {
  summaryLength: 'short' | 'medium' | 'detailed';
  extractEntities: boolean;
  analyzeSentiment: boolean;
  detectTopics: boolean;
  generateEmbeddings: boolean;
  extractKeywords: boolean;
  language?: string;
}

/**
 * Analytics data interfaces
 */
export interface IUserAnalytics {
  totalDocuments: number;
  totalWordCount: number;
  avgProcessingTime: number;
  topTopics: { topic: string; count: number }[];
  sentimentDistribution: { positive: number; negative: number; neutral: number };
  uploadTrends: { date: string; count: number }[];
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

/**
 * Express request interface with user
 */
export interface IAuthRequest extends Request {
  user?: IUser;
}

/**
 * Socket event types
 */
export type SocketEventType = 
  | 'document-upload-progress'
  | 'document-processing-start'
  | 'document-processing-progress'
  | 'document-processing-complete'
  | 'document-processing-error'
  | 'analysis-complete'
  | 'trend-update';

/**
 * Socket event data
 */
export interface ISocketEventData {
  type: SocketEventType;
  documentId?: string;
  userId: string;
  progress?: number;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Error types
 */
export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'PROCESSING_ERROR'
  | 'STORAGE_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'DATABASE_ERROR'
  | 'RATE_LIMIT_ERROR';

/**
 * Custom error interface
 */
export interface ICustomError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: any;
} 