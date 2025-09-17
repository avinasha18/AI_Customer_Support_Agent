import { Request, Response } from 'express';
import { chatService } from '@/services/chat.service';
import { IAuthenticatedRequest, IApiResponse } from '@/types';
import { asyncHandler, createError } from '@/middlewares/error.middleware';
import { logger } from '@/utils/logger';
import { isValidConversationId } from '@/utils/idGenerator';

/**
 * Create a new conversation
 */
export const createConversation = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { model } = req.body;

  logger.info('Creating new conversation', {
    userId: req.user._id,
    model: model || 'default'
  });

  const conversation = await chatService.createConversation(req.user._id, model);

  const response: IApiResponse = {
    success: true,
    data: conversation,
    message: 'Conversation created successfully',
  };

  res.status(201).json(response);
});

/**
 * Send a chat message
 */
export const sendMessage = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { message, conversationId, model, stream } = req.body;
  
      // Validate conversation ID format if provided
      if (conversationId && !isValidConversationId(conversationId)) {
        logger.error('Invalid conversation ID format', {
          conversationId,
          userId: req.user._id,
          requestId: req.headers['x-request-id']
        });
        throw createError(`Invalid conversation ID format: ${conversationId}`, 400);
      }

  if (stream) {
    try {
      logger.info('Starting streaming request', {
        userId: req.user._id,
        conversationId,
        model,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        requestId: req.headers['x-request-id']
      });

      // Handle streaming response
      const result = await chatService.streamMessage(req.user._id, {
        message,
        conversationId,
        model,
        stream: true,
      });

      logger.info('Streaming service call successful', {
        userId: req.user._id,
        conversationId: result.conversationId,
        model: result.model,
        requestId: req.headers['x-request-id']
      });

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Send initial data
      res.write(`data: ${JSON.stringify({
        type: 'conversation',
        conversationId: result.conversationId,
        model: result.model,
      })}\n\n`);

      // Stream the AI response
      const reader = result.stream.getReader();
      let chunkCount = 0;
      let aiResponseContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            logger.info('Streaming completed successfully', {
              userId: req.user._id,
              conversationId: result.conversationId,
              chunkCount,
              aiResponseLength: aiResponseContent.length,
              requestId: req.headers['x-request-id']
            });
            
            // Save the AI response to the conversation
            if (aiResponseContent.trim()) {
              try {
                await chatService.addMessageToConversation(
                  req.user._id,
                  result.conversationId,
                  'assistant',
                  aiResponseContent
                );
                logger.info('AI response saved to conversation', {
                  userId: req.user._id,
                  conversationId: result.conversationId,
                  responseLength: aiResponseContent.length
                });
              } catch (saveError) {
                logger.error('Failed to save AI response to conversation', {
                  userId: req.user._id,
                  conversationId: result.conversationId,
                  error: saveError instanceof Error ? saveError.message : 'Unknown error',
                  responseLength: aiResponseContent.length
                });
              }
            }
            break;
          }

          // The value is now a parsed IOpenRouterStreamChunk object
          if (value && typeof value === 'object') {
            try {
              if (value.choices?.[0]?.delta?.content) {
                chunkCount++;
                const content = value.choices[0].delta.content;
                aiResponseContent += content;
                
                res.write(`data: ${JSON.stringify({
                  type: 'content',
                  content: content,
                })}\n\n`);
              }
            } catch (processError) {
              logger.warn('Failed to process streaming chunk', { 
                value, 
                error: processError instanceof Error ? processError.message : 'Unknown error',
                stack: processError instanceof Error ? processError.stack : undefined,
                userId: req.user?._id,
                conversationId: result.conversationId,
                requestId: req.headers['x-request-id']
              });
            }
          } else {
            logger.warn('Invalid stream chunk received', { 
              valueType: typeof value,
              value: value,
              userId: req.user?._id,
              conversationId: result.conversationId
            });
          }
        }
      } catch (streamError) {
        logger.error('Error during stream processing', { 
          error: streamError instanceof Error ? streamError.message : 'Unknown error',
          stack: streamError instanceof Error ? streamError.stack : undefined,
          userId: req.user?._id,
          conversationId: req.body.conversationId,
          message: req.body.message,
          chunkCount,
          requestId: req.headers['x-request-id']
        });
        
        // Save the AI response even if there was an error
        if (aiResponseContent.trim()) {
          try {
            await chatService.addMessageToConversation(
              req.user._id,
              result.conversationId,
              'assistant',
              aiResponseContent
            );
            logger.info('AI response saved to conversation after stream error', {
              userId: req.user._id,
              conversationId: result.conversationId,
              responseLength: aiResponseContent.length
            });
          } catch (saveError) {
            logger.error('Failed to save AI response to conversation after stream error', {
              userId: req.user._id,
              conversationId: result.conversationId,
              error: saveError instanceof Error ? saveError.message : 'Unknown error',
              responseLength: aiResponseContent.length
            });
          }
        }
        
        // Send error to client
        try {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: `Stream processing failed: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`,
          })}\n\n`);
        } catch (writeError) {
          logger.error('Failed to write error to response', {
            writeError: writeError instanceof Error ? writeError.message : 'Unknown error',
            originalError: streamError instanceof Error ? streamError.message : 'Unknown error'
          });
        }
      } finally {
        try {
          res.end();
        } catch (endError) {
          logger.error('Failed to end response', {
            endError: endError instanceof Error ? endError.message : 'Unknown error'
          });
        }
      }
    } catch (serviceError) {
      logger.error('Streaming service error', { 
        error: serviceError instanceof Error ? serviceError.message : 'Unknown error',
        stack: serviceError instanceof Error ? serviceError.stack : undefined,
        userId: req.user?._id,
        conversationId: req.body.conversationId,
        message: req.body.message,
        requestId: req.headers['x-request-id']
      });
      
      // Set headers for error response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: `Service error: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`,
      })}\n\n`);
      res.end();
    }
  } else {
    // Handle regular response
    const result = await chatService.sendMessage(req.user._id, {
      message,
      conversationId,
      model,
    });

    const response: IApiResponse = {
      success: true,
      data: result,
      message: 'Message sent successfully',
    };

    res.status(200).json(response);
  }
});

/**
 * Get conversation history
 */
export const getConversationHistory = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;

  logger.info('getConversationHistory controller called', {
    userId: req.user._id,
    page,
    limit,
    query: req.query
  });

  // Validate pagination parameters
  if (page < 1) {
    throw createError('Page must be greater than 0', 400);
  }
  if (limit < 1 || limit > 100) {
    throw createError('Limit must be between 1 and 100', 400);
  }

  try {
    const result = await chatService.getConversationHistory(req.user._id, page, limit);
    
    logger.info('getConversationHistory service result', {
      userId: req.user._id,
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : 'null',
      result: result
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('getConversationHistory controller error', {
      userId: req.user._id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
});

/**
 * Get a specific conversation
 */
export const getConversation = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { conversationId } = req.params;

  // Validate conversation ID format
  if (!conversationId || !isValidConversationId(conversationId)) {
    logger.error('Invalid conversation ID format in get request', {
      conversationId,
      userId: req.user._id,
      requestId: req.headers['x-request-id']
    });
    throw createError(`Invalid conversation ID format: ${conversationId}`, 400);
  }

  const conversation = await chatService.getConversation(req.user!._id, conversationId);

  const response: IApiResponse = {
    success: true,
    data: conversation,
  };

  res.status(200).json(response);
});

/**
 * Delete a conversation
 */
export const deleteConversation = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { conversationId } = req.params;

  // Validate conversation ID format
  if (!conversationId || !isValidConversationId(conversationId)) {
    logger.error('Invalid conversation ID format in delete request', {
      conversationId,
      userId: req.user._id,
      requestId: req.headers['x-request-id']
    });
    throw createError(`Invalid conversation ID format: ${conversationId}`, 400);
  }

  await chatService.deleteConversation(req.user!._id, conversationId);

  const response: IApiResponse = {
    success: true,
    message: 'Conversation deleted successfully',
  };

  res.status(200).json(response);
});

/**
 * Rename a conversation
 */
export const renameConversation = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { conversationId } = req.params;
  const { title } = req.body;

  // Validate conversation ID format
  if (!conversationId || !isValidConversationId(conversationId)) {
    logger.error('Invalid conversation ID format in rename request', {
      conversationId,
      userId: req.user._id,
      title,
      requestId: req.headers['x-request-id']
    });
    throw createError(`Invalid conversation ID format: ${conversationId}`, 400);
  }

  const conversation = await chatService.renameConversation(req.user!._id, conversationId, title);

  const response: IApiResponse = {
    success: true,
    data: conversation,
    message: 'Conversation renamed successfully',
  };

  res.status(200).json(response);
});

/**
 * Clear conversation messages
 */
export const clearConversation = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { conversationId } = req.params;

  // Validate conversation ID format
  if (!conversationId || !isValidConversationId(conversationId)) {
    logger.error('Invalid conversation ID format in clear request', {
      conversationId,
      userId: req.user._id,
      requestId: req.headers['x-request-id']
    });
    throw createError(`Invalid conversation ID format: ${conversationId}`, 400);
  }

  const conversation = await chatService.clearConversation(req.user!._id, conversationId);

  const response: IApiResponse = {
    success: true,
    data: conversation,
    message: 'Conversation cleared successfully',
  };

  res.status(200).json(response);
});

/**
 * Get available AI models
 */
export const getModels = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Getting available models');
    const models = chatService.getAvailableModels();
    
    logger.info('Models retrieved', {
      count: models.length,
      models: models.map(m => ({ id: m.id, name: m.name }))
    });

    const response: IApiResponse = {
      success: true,
      data: models,
      message: 'Models retrieved successfully - DEBUG: Server is running updated code',
    };

    logger.info('Sending models response', {
      success: response.success,
      dataCount: Array.isArray(response.data) ? response.data.length : 0,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      fullResponse: response
    });

    logger.info('About to send JSON response', {
      responseType: typeof response,
      responseKeys: Object.keys(response),
      responseStringified: JSON.stringify(response)
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get models', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
});

/**
 * Get conversation statistics
 */
export const getConversationStats = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const stats = await chatService.getConversationStats(req.user._id);

  const response: IApiResponse = {
    success: true,
    data: stats,
  };

  res.status(200).json(response);
});

/**
 * Delete empty conversations
 */
export const deleteEmptyConversations = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  await chatService.deleteEmptyConversations(req.user._id);

  const response: IApiResponse = {
    success: true,
    message: 'Empty conversations deleted successfully',
  };

  res.status(200).json(response);
});

/**
 * Health check for chat service
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  // Test AI service connection
  const aiServiceHealthy = await chatService.getAvailableModels().length > 0;

  const health = {
    status: aiServiceHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date(),
    services: {
      ai: aiServiceHealthy,
    },
  };

  const response: IApiResponse = {
    success: true,
    data: health,
  };

  res.status(200).json(response);
});
