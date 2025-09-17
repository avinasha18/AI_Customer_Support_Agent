import { Types } from 'mongoose';
import { Conversation } from '@/models/conversation.model';
import { aiService } from './ai.service';
import { models } from '@/config';
import { isValidConversationId } from '@/utils/idGenerator';
import {
  IConversationResponse,
  IChatRequest,
  IChatResponse,
  IOpenRouterMessage,
  IOpenRouterStreamChunk,
  IPaginatedResponse,
} from '@/types';
import { logger } from '@/utils/logger';

export class ChatService {
  /**
   * Convert string userId to ObjectId for database queries
   */
  private convertUserId(userId: string): Types.ObjectId {
    try {
      return new Types.ObjectId(userId);
    } catch (error) {
      logger.error('Invalid userId format', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error(`Invalid user ID format: ${userId}`);
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, model?: string): Promise<IConversationResponse> {
    try {
      logger.info('Creating new conversation', {
        userId,
        model: model || 'default'
      });

      const conversation = Conversation.createConversation(
        userId,
        undefined,
        model || aiService.getDefaultModel()
      );
      await (conversation as any).save();

      logger.info('Conversation created successfully', {
        userId,
        conversationId: conversation.customId,
        model: conversation.model,
        title: conversation.title
      });

      return {
        id: conversation.customId,
        title: conversation.title,
        messages: conversation.messages,
        model: conversation.model,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      logger.error('Create conversation failed', {
        userId,
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    userId: string,
    chatRequest: IChatRequest
  ): Promise<IChatResponse> {
    try {
      let conversation;

      logger.info('Starting send message', {
        userId,
        conversationId: chatRequest.conversationId,
        model: chatRequest.model,
        messageLength: chatRequest.message.length
      });

      // Convert userId to ObjectId
      const userIdObjectId = this.convertUserId(userId);

      // Get or create conversation
      if (chatRequest.conversationId) {
        // Validate custom ID format
        if (!isValidConversationId(chatRequest.conversationId)) {
          throw new Error(`Invalid conversation ID format: ${chatRequest.conversationId}`);
        }
        
        conversation = await Conversation.findOne({
          customId: chatRequest.conversationId,
          userId: userIdObjectId
        });
        if (!conversation) {
          logger.error('Conversation not found for sendMessage', {
            userId,
            conversationId: chatRequest.conversationId,
            searchQuery: { customId: chatRequest.conversationId, userId: userIdObjectId }
          });
          throw new Error(`Conversation not found or access denied. ID: ${chatRequest.conversationId}, User: ${userId}`);
        }
        
        logger.info('Found existing conversation for sendMessage', {
          userId,
          conversationId: conversation.customId,
          messageCount: conversation.messages.length,
          title: conversation.title
        });
      } else {
        conversation = Conversation.createConversation(
          userIdObjectId.toString(),
          undefined,
          chatRequest.model || aiService.getDefaultModel()
        );
        await (conversation as any).save();
        
        logger.info('Created new conversation for sendMessage', {
          userId,
          conversationId: conversation.customId,
          model: conversation.model,
          title: conversation.title
        });
      }

      // Add user message
      conversation.addMessage('user', chatRequest.message);
      
      // Save the conversation with the user message
      await (conversation as any).save();
      
      logger.info('Added user message to conversation', {
        userId,
        conversationId: conversation.customId,
        messageCount: conversation.messages.length
      });

      // Prepare messages for AI
      const messages: IOpenRouterMessage[] = conversation.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get AI response
      const aiResponse = await aiService.sendMessage(
        conversation.model,
        messages,
        {
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      const aiMessage = aiService.extractContent(aiResponse);
      const usage = aiService.extractUsage(aiResponse);

      // Add AI message to conversation
      conversation.addMessage('assistant', aiMessage);
      await (conversation as any).save();

      logger.info('Message sent successfully', {
        userId,
        conversationId: conversation.customId,
        model: conversation.model,
        usage,
        finalMessageCount: conversation.messages.length
      });

      return {
        message: aiMessage,
        conversationId: conversation.customId,
        model: conversation.model,
        ...(usage && { usage }),
      };
    } catch (error) {
      logger.error('Send message failed', {
        userId,
        conversationId: chatRequest.conversationId,
        message: chatRequest.message,
        model: chatRequest.model,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Stream a message and get AI response
   */
  async streamMessage(
    userId: string,
    chatRequest: IChatRequest
  ): Promise<{
    conversationId: string;
    model: string;
    stream: ReadableStream<IOpenRouterStreamChunk>;
  }> {
    try {
      let conversation;

      logger.info('Starting stream message', {
        userId,
        conversationId: chatRequest.conversationId,
        model: chatRequest.model,
        messageLength: chatRequest.message.length
      });

      // Get or create conversation
      if (chatRequest.conversationId) {
        // Validate custom ID format
        if (!isValidConversationId(chatRequest.conversationId)) {
          throw new Error(`Invalid conversation ID format: ${chatRequest.conversationId}`);
        }
        
        conversation = await Conversation.findByCustomIdAndUser(
          chatRequest.conversationId,
          userId
        );
        if (!conversation) {
          // Create conversation with the provided ID if it doesn't exist
          logger.info('Conversation not found, creating new one with provided ID', {
            userId,
            conversationId: chatRequest.conversationId
          });
          conversation = (Conversation as any).createConversation(
            userId,
            undefined,
            chatRequest.model || aiService.getDefaultModel()
          );
          // Override the generated ID with the provided one
          conversation.customId = chatRequest.conversationId;
          await (conversation as any).save();
          
          logger.info('Created new conversation with provided ID', {
            userId,
            conversationId: conversation.customId,
            model: conversation.model,
            title: conversation.title
          });
        }
        
        logger.info('Found existing conversation', {
          userId,
          conversationId: conversation.customId,
          messageCount: conversation.messages.length,
          title: conversation.title
        });
      } else {
        conversation = Conversation.createConversation(
          userId,
          undefined,
          chatRequest.model || aiService.getDefaultModel()
        );
        await (conversation as any).save();
        
        logger.info('Created new conversation', {
          userId,
          conversationId: conversation.customId,
          model: conversation.model,
          title: conversation.title
        });
      }

      // Add user message
      conversation.addMessage('user', chatRequest.message);
      
      // Save the conversation with the user message
      await (conversation as any).save();
      
      logger.info('Added user message to conversation', {
        userId,
        conversationId: conversation.customId,
        messageCount: conversation.messages.length
      });

      // Prepare messages for AI
      const messages: IOpenRouterMessage[] = conversation.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get streaming AI response
      const stream = await aiService.streamMessage(conversation.model, messages, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      logger.info('Streaming message started', {
        userId,
        conversationId: conversation.customId,
        model: conversation.model,
        messageCount: messages.length
      });

      return {
        conversationId: conversation.customId,
        model: conversation.model,
        stream: stream as any,
      };
    } catch (error) {
      logger.error('Stream message failed', {
        userId,
        conversationId: chatRequest.conversationId,
        message: chatRequest.message,
        model: chatRequest.model,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IPaginatedResponse<IConversationResponse>> {
    try {
      logger.info('Getting conversation history', {
        userId,
        page,
        limit,
        userIdType: typeof userId
      });

      // Convert userId to ObjectId
      const userIdObjectId = this.convertUserId(userId);
      
      // First, let's check if there are any conversations at all
      const allConversations = await Conversation.find({}).lean();
      logger.info('All conversations in database', {
        totalConversations: allConversations.length,
        conversations: allConversations.map(conv => ({
          _id: conv._id,
          customId: conv.customId,
          userId: conv.userId,
          title: conv.title,
          messageCount: conv.messages.length
        }))
      });

      // Check conversations for this specific user
      const userConversations = await Conversation.find({ userId: userIdObjectId }).lean();
      logger.info('User conversations from DB', {
        userId,
        userConversationsCount: userConversations.length,
        userConversations: userConversations.map(conv => ({
          _id: conv._id,
          customId: conv.customId,
          userId: conv.userId,
          title: conv.title,
          messageCount: conv.messages.length
        }))
      });

      const skip = (page - 1) * limit;
      const conversations = await Conversation.find({ userId: userIdObjectId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Conversation.countDocuments({ userId: userIdObjectId });
      const totalPages = Math.ceil(total / limit);

      logger.info('Raw conversations from DB after pagination', {
        userId,
        conversationsCount: conversations.length,
        total,
        totalPages,
        skip,
        limit,
        conversations: conversations.map(conv => ({
          customId: conv.customId,
          title: conv.title,
          messageCount: conv.messages.length,
          userId: conv.userId,
          createdAt: conv.createdAt
        }))
      });

      const formattedConversations: IConversationResponse[] = conversations.map(conv => ({
        id: conv.customId,
        title: conv.title,
        messages: conv.messages,
        model: conv.model,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      logger.info('Conversation history retrieved', {
        userId,
        page,
        limit,
        total,
        returnedCount: conversations.length,
        formattedCount: formattedConversations.length,
        finalResult: {
          success: true,
          dataLength: formattedConversations.length,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          }
        }
      });

      return {
        success: true,
        data: formattedConversations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Get conversation history failed', {
        userId,
        page,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Get a specific conversation
   */
  async getConversation(
    userId: string,
    conversationId: string
  ): Promise<IConversationResponse> {
    try {
      // Validate custom ID format
      if (!isValidConversationId(conversationId)) {
        throw new Error(`Invalid conversation ID format: ${conversationId}`);
      }

      const conversation = await Conversation.findByCustomIdAndUser(
        conversationId,
        userId
      );

      if (!conversation) {
        throw new Error(`Conversation not found or access denied. ID: ${conversationId}, User: ${userId}`);
      }

      logger.info('Conversation retrieved', {
        userId,
        conversationId,
        messageCount: conversation.messages.length,
      });

      return {
        id: conversation.customId,
        title: conversation.title,
        messages: conversation.messages,
        model: conversation.model,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      logger.error('Get conversation failed', {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    userId: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Validate custom ID format
      if (!isValidConversationId(conversationId)) {
        throw new Error(`Invalid conversation ID format: ${conversationId}`);
      }

      const conversation = await Conversation.findByCustomIdAndUser(
        conversationId,
        userId
      );

      if (!conversation) {
        throw new Error(`Conversation not found or access denied. ID: ${conversationId}, User: ${userId}`);
      }

      await Conversation.findByIdAndDelete(conversation._id);

      logger.info('Conversation deleted', {
        userId,
        conversationId,
      });
    } catch (error) {
      logger.error('Delete conversation failed', {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Rename a conversation
   */
  async renameConversation(
    userId: string,
    conversationId: string,
    newTitle: string
  ): Promise<IConversationResponse> {
    try {
      // Validate custom ID format
      if (!isValidConversationId(conversationId)) {
        throw new Error(`Invalid conversation ID format: ${conversationId}`);
      }

      if (!newTitle || newTitle.trim().length === 0) {
        throw new Error('Title cannot be empty');
      }

      if (newTitle.length > 200) {
        throw new Error('Title cannot exceed 200 characters');
      }

      const conversation = await Conversation.findByCustomIdAndUser(
        conversationId,
        userId
      );

      if (!conversation) {
        throw new Error(`Conversation not found or access denied. ID: ${conversationId}, User: ${userId}`);
      }

      conversation.title = newTitle.trim();
      await (conversation as any).save();

      logger.info('Conversation renamed', {
        userId,
        conversationId,
        newTitle,
      });

      return {
        id: conversation.customId,
        title: conversation.title,
        messages: conversation.messages,
        model: conversation.model,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      logger.error('Rename conversation failed', {
        userId,
        conversationId,
        newTitle,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clear conversation messages
   */
  async clearConversation(
    userId: string,
    conversationId: string
  ): Promise<IConversationResponse> {
    try {
      // Validate custom ID format
      if (!isValidConversationId(conversationId)) {
        throw new Error(`Invalid conversation ID format: ${conversationId}`);
      }

      const conversation = await Conversation.findByCustomIdAndUser(
        conversationId,
        userId
      );

      if (!conversation) {
        throw new Error(`Conversation not found or access denied. ID: ${conversationId}, User: ${userId}`);
      }

      conversation.clearMessages();
      await (conversation as any).save();

      logger.info('Conversation cleared', {
        userId,
        conversationId,
      });

      return {
        id: conversation.customId,
        title: conversation.title,
        messages: conversation.messages,
        model: conversation.model,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      logger.error('Clear conversation failed', {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): typeof models {
    try {
      logger.info('Getting available models from config', {
        modelsCount: models.length,
        modelsType: typeof models,
        isArray: Array.isArray(models)
      });
      
      logger.debug('Models details', {
        models: models.map(m => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          maxTokens: m.maxTokens
        })),
        debugInfo: 'DEBUG: This is from the updated server code'
      });
      
      return models;
    } catch (error) {
      logger.error('Failed to get available models', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Validate conversation ownership
   */
  async validateOwnership(
    userId: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      const conversation = await Conversation.findByCustomIdAndUser(
        conversationId,
        userId
      );
      return conversation !== null;
    } catch (error) {
      logger.error('Validate ownership failed', {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Add a message to an existing conversation
   */
  async addMessageToConversation(
    userId: string,
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<void> {
    try {
      // Validate custom ID format
      if (!isValidConversationId(conversationId)) {
        throw new Error(`Invalid conversation ID format: ${conversationId}`);
      }

      const conversation = await Conversation.findByCustomIdAndUser(
        conversationId,
        userId
      );

      if (!conversation) {
        throw new Error(`Conversation not found or access denied. ID: ${conversationId}, User: ${userId}`);
      }

      // Add the message
      conversation.addMessage(role, content);
      await (conversation as any).save();

      logger.info('Message added to conversation', {
        userId,
        conversationId,
        role,
        contentLength: content.length,
        messageCount: conversation.messages.length,
      });
    } catch (error) {
      logger.error('Add message to conversation failed', {
        userId,
        conversationId,
        role,
        contentLength: content.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Delete empty conversations (conversations with no messages)
   */
  async deleteEmptyConversations(userId: string): Promise<void> {
    try {
      logger.info('Deleting empty conversations', { userId });

      const result = await Conversation.deleteMany({
        userId: this.convertUserId(userId),
        'messages.0': { $exists: false } // No messages array or empty messages array
      });

      logger.info('Empty conversations deleted', {
        userId,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      logger.error('Delete empty conversations failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get conversation statistics for a user
   */
  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastActivity: Date | null;
  }> {
    try {
      const conversations = await Conversation.find({ userId }).lean();
      
      const totalConversations = conversations.length;
      const totalMessages = conversations.reduce(
        (sum, conv) => sum + conv.messages.length,
        0
      );
      const lastActivity = conversations.length > 0 
        ? new Date(Math.max(...conversations.map(conv => conv.updatedAt.getTime())))
        : null;

      return {
        totalConversations,
        totalMessages,
        lastActivity,
      };
    } catch (error) {
      logger.error('Get conversation stats failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
