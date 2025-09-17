import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '@/config';
import { authenticateToken } from '@/middlewares/auth.middleware';
import { validate, validationSchemas, sanitizeInput } from '@/middlewares/validate.middleware';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  checkEmailAvailability,
} from '@/controllers/auth.controller';
import {
  createConversation,
  sendMessage,
  getConversationHistory,
  getConversation,
  deleteConversation,
  renameConversation,
  clearConversation,
  deleteEmptyConversations,
  getModels,
  getConversationStats,
  healthCheck,
} from '@/controllers/chat.controller';

const router = Router();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: 5, // More restrictive for auth
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for chat endpoints
const chatRateLimit = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: rateLimitConfig.message,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply sanitization to all routes
router.use(sanitizeInput);

// Health check endpoint (no auth required)
router.get('/health', healthCheck);

// Public routes
router.get('/models', getModels);

// Auth routes
router.post('/auth/signup', 
  authRateLimit,
  validate(validationSchemas.register),
  register
);

router.post('/auth/login',
  authRateLimit,
  validate(validationSchemas.login),
  login
);

router.post('/auth/refresh',
  authRateLimit,
  validate(validationSchemas.refreshToken),
  refreshToken
);

router.get('/auth/check-email',
  validate(validationSchemas.pagination), // Reuse pagination schema for query validation
  checkEmailAvailability
);

// Protected routes (require authentication)
router.use(authenticateToken);

// User profile routes
router.get('/users/me', getProfile);
router.put('/users/me',
  validate(validationSchemas.updateProfile),
  updateProfile
);
router.put('/users/me/password',
  validate(validationSchemas.changePassword),
  changePassword
);
router.post('/auth/logout', logout);

// Chat routes
router.post('/chat/conversation',
  chatRateLimit,
  createConversation
);

router.post('/chat/send',
  chatRateLimit,
  validate(validationSchemas.chatMessage),
  sendMessage
);

router.get('/chat/history',
  validate(validationSchemas.pagination),
  getConversationHistory
);

router.get('/chat/stats', getConversationStats);

router.get('/chat/:conversationId',
  validate(validationSchemas.conversationId),
  getConversation
);

router.delete('/chat/:conversationId',
  validate(validationSchemas.conversationId),
  deleteConversation
);

router.put('/chat/:conversationId/rename',
  validate(validationSchemas.renameConversation),
  renameConversation
);

router.post('/chat/:conversationId/clear',
  validate(validationSchemas.conversationId),
  clearConversation
);

router.delete('/chat/cleanup/empty',
  deleteEmptyConversations
);

export default router;
