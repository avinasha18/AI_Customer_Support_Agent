import { Request } from 'express';
import { Document, Types, Model } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  createUser(userData: IUserCreate): Promise<IUser>;
  findByEmailWithPassword(email: string): Promise<IUser | null>;
}

export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserResponse {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface IMessage {
  id: string; // Custom ID for client communication
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

// Conversation Types
export interface IConversation {
  _id: Types.ObjectId;
  customId: string; // Custom ID for client communication
  userId: Types.ObjectId;
  title: string;
  messages: IMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
  addMessage(role: 'user' | 'assistant' | 'system', content: string): void;
  getLastMessage(): IMessage | null;
  getMessageCount(): number;
  clearMessages(): void;
}

export interface IConversationModel extends Model<IConversation> {
  createConversation(userId: string, title?: string, model?: string): IConversation;
  findByUser(userId: string, page?: number, limit?: number): Promise<IConversation[]>;
  countByUser(userId: string): Promise<number>;
  findByIdAndUser(conversationId: string, userId: string): Promise<IConversation | null>;
  findByCustomIdAndUser(customId: string, userId: string): Promise<IConversation | null>;
}

export interface IConversationCreate {
  userId: string;
  title: string;
  model?: string;
}

export interface IConversationResponse {
  id: string; // Custom ID for client
  title: string;
  messages: IMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Request/Response Types
export interface IChatRequest {
  message: string;
  conversationId?: string;
  model?: string;
  stream?: boolean;
}

export interface IChatResponse {
  message: string;
  conversationId: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// OpenRouter Types
export interface IOpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface IOpenRouterRequest {
  model: string;
  messages: IOpenRouterMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  extra_headers?: Record<string, string>;
  extra_body?: Record<string, unknown>;
}

export interface IOpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface IOpenRouterStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

// JWT Types
export interface IJwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Express Request Extension
export interface IAuthenticatedRequest extends Request {
  user?: IUserResponse;
}

// API Response Types
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface IAppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Configuration Types
export interface IConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  appUrl: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  bcryptSaltRounds: number;
  logLevel: string;
}

// Model Configuration
export interface IModelConfig {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPerToken?: number;
  description?: string;
}

// Health Check Types
export interface IHealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connected: boolean;
    latency?: number;
  };
  services: {
    openRouter: boolean;
  };
}
