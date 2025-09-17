import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { config, corsConfig, mongoOptions } from '@/config';
import { logger } from '@/utils/logger';
import { notFoundHandler, errorHandler } from '@/middlewares/error.middleware';
import routes from './routes';

/**
 * Create Express application
 */
const createApp = (): express.Application => {
  const app = express();

  // Trust proxy (for rate limiting and IP detection)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors(corsConfig));

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] as string || 
      Math.random().toString(36).substring(2, 15);
    
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    logger.info('Request received', {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  });

  // API routes
  app.use('/api', routes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'ViralLens Chatbot API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

/**
 * Connect to MongoDB
 */
const connectDatabase = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', config.mongoUri.replace(/\/\/.*@/, '//***@'));
    console.log('MongoDB Options:', mongoOptions);
    
    await mongoose.connect(config.mongoUri, mongoOptions);
    logger.info('Connected to MongoDB', {
      uri: config.mongoUri.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    console.error('MongoDB Connection Error Details:', error);
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (server: any): void => {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    server.close(() => {
      logger.info('HTTP server closed');
      
      mongoose.disconnect().then(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Initialize application
 */
export const initializeApp = async (): Promise<express.Application> => {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    logger.info('Application initialized successfully', {
      nodeEnv: config.nodeEnv,
      port: config.port,
    });

    return app;
  } catch (error) {
    logger.error('Failed to initialize application', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Start server
 */
export const startServer = async (): Promise<void> => {
  try {
    const app = await initializeApp();
    
    const server = app.listen(config.port, () => {
      logger.info('Server started successfully', {
        port: config.port,
        nodeEnv: config.nodeEnv,
        url: `http://localhost:${config.port}`,
      });
    });

    // Setup graceful shutdown
    gracefulShutdown(server);

    return new Promise((resolve) => {
      server.on('listening', () => resolve());
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

export default createApp;
