import request from 'supertest';
import app from '../src/app';
import { authService } from '../src/services/auth.service';
import { chatService } from '../src/services/chat.service';

// Mock the AI service
jest.mock('../src/services/ai.service', () => ({
  aiService: {
    sendMessage: jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'Hello! How can I help you today?' } }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      },
    }),
    extractContent: jest.fn().mockReturnValue('Hello! How can I help you today?'),
    extractUsage: jest.fn().mockReturnValue({
      promptTokens: 10,
      completionTokens: 15,
      totalTokens: 25,
    }),
    getDefaultModel: jest.fn().mockReturnValue('meta-llama/llama-3.3-70b-instruct:free'),
  },
}));

describe('Chat', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create and login a test user
    await authService.register({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });

    const loginResult = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    authToken = loginResult.token;
    userId = loginResult.user._id;
  });

  describe('POST /api/chat/send', () => {
    it('should send a message and get AI response', async () => {
      const messageData = {
        message: 'Hello, how are you?',
      };

      const response = await request(app)
        .post('/api/chat/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Hello! How can I help you today?');
      expect(response.body.data.conversationId).toBeDefined();
      expect(response.body.data.model).toBeDefined();
      expect(response.body.data.usage).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const messageData = {
        message: 'Hello, how are you?',
      };

      const response = await request(app)
        .post('/api/chat/send')
        .send(messageData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });

    it('should fail with empty message', async () => {
      const messageData = {
        message: '',
      };

      const response = await request(app)
        .post('/api/chat/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with message too long', async () => {
      const messageData = {
        message: 'a'.repeat(10001),
      };

      const response = await request(app)
        .post('/api/chat/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/chat/history', () => {
    beforeEach(async () => {
      // Create some test conversations
      await chatService.sendMessage(userId, {
        message: 'First message',
      });

      await chatService.sendMessage(userId, {
        message: 'Second message',
      });
    });

    it('should get conversation history', async () => {
      const response = await request(app)
        .get('/api/chat/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/chat/history?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/chat/:conversationId', () => {
    let conversationId: string;

    beforeEach(async () => {
      const result = await chatService.sendMessage(userId, {
        message: 'Test message',
      });
      conversationId = result.conversationId;
    });

    it('should get a specific conversation', async () => {
      const response = await request(app)
        .get(`/api/chat/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(conversationId);
      expect(response.body.data.messages).toBeInstanceOf(Array);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
    });

    it('should fail with invalid conversation ID', async () => {
      const response = await request(app)
        .get('/api/chat/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/chat/:conversationId', () => {
    let conversationId: string;

    beforeEach(async () => {
      const result = await chatService.sendMessage(userId, {
        message: 'Test message',
      });
      conversationId = result.conversationId;
    });

    it('should delete a conversation', async () => {
      const response = await request(app)
        .delete(`/api/chat/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify conversation is deleted
      const getResponse = await request(app)
        .get(`/api/chat/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });
  });

  describe('PUT /api/chat/:conversationId/rename', () => {
    let conversationId: string;

    beforeEach(async () => {
      const result = await chatService.sendMessage(userId, {
        message: 'Test message',
      });
      conversationId = result.conversationId;
    });

    it('should rename a conversation', async () => {
      const newTitle = 'New Conversation Title';

      const response = await request(app)
        .put(`/api/chat/${conversationId}/rename`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: newTitle })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newTitle);
    });

    it('should fail with empty title', async () => {
      const response = await request(app)
        .put(`/api/chat/${conversationId}/rename`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/models', () => {
    it('should get available models', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/chat/stats', () => {
    beforeEach(async () => {
      // Create some test conversations
      await chatService.sendMessage(userId, {
        message: 'First message',
      });

      await chatService.sendMessage(userId, {
        message: 'Second message',
      });
    });

    it('should get conversation statistics', async () => {
      const response = await request(app)
        .get('/api/chat/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalConversations).toBeGreaterThan(0);
      expect(response.body.data.totalMessages).toBeGreaterThan(0);
    });
  });
});
