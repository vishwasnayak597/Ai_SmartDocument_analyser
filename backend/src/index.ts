import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import analysisRoutes from './routes/analysis';
import userRoutes from './routes/users';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

/**
 * Express application setup with comprehensive middleware and security
 */
class Application {
  public app: express.Application;
  public server: any;
  public io: Server;
  private PORT: number;

  constructor() {
    this.app = express();
    this.PORT = parseInt(process.env.PORT || '5000', 10);
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocket();
  }

  /**
   * Initialize all middleware for security, parsing, and logging
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    this.app.use(cookieParser());

    // Logging
    this.app.use(morgan('combined'));

    // Static files for uploads
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  }

  /**
   * Initialize all application routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/documents', authMiddleware, documentRoutes);
    this.app.use('/api/analysis', authMiddleware, analysisRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);

    // 404 handler for unknown routes
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    });
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Initialize Socket.IO for real-time features
   */
  private initializeSocket(): void {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join user to their personal room for notifications
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Handle document processing updates
      socket.on('document-processing', (data) => {
        console.log('Document processing event:', data);
        // Broadcast processing status to user's room
        socket.to(`user-${data.userId}`).emit('processing-update', data);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Connect to MongoDB database
   */
  private async connectToDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-documents';
      await mongoose.connect(mongoUri);
      console.log('📊 Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      await this.connectToDatabase();
      
      this.server.listen(this.PORT, () => {
        console.log(`🚀 Server running on port ${this.PORT}`);
        console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new Application();
app.start().catch((error) => {
  console.error('💥 Application startup failed:', error);
  process.exit(1);
});

export default app; 