import { z } from 'zod';
import { IConfig, IModelConfig } from '@/types';

// Environment validation schema
const envSchema = z.object({
  PORT: z.string().transform(Number).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MongoDB URI is required'),
  JWT_SECRET: z.string().min(6, 'JWT secret must be at least 6 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('30'),
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
const parseEnv = (): z.infer<typeof envSchema> => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
};

// Available AI models configuration
const MODELS: IModelConfig[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct (Free)',
    provider: 'Meta',
    maxTokens: 4096,
    description: 'High-quality free model for general conversations',
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct (Free)',
    provider: 'Meta',
    maxTokens: 4096,
    description: 'Fast and efficient free model',
  },
  {
    id: 'google/gemini-flash-1.5:free',
    name: 'Gemini Flash 1.5 (Free)',
    provider: 'Google',
    maxTokens: 8192,
    description: 'Google\'s fast and capable model',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    maxTokens: 8192,
    costPerToken: 0.003,
    description: 'High-quality model for complex tasks',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    maxTokens: 16384,
    costPerToken: 0.00015,
    description: 'Cost-effective OpenAI model',
  },
];

// Create configuration object
const createConfig = (): IConfig => {
  const env = parseEnv();
  // console.log(env);
  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    mongoUri: env.MONGO_URI,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    openRouterApiKey: env.OPENROUTER_API_KEY,
    openRouterBaseUrl: env.OPENROUTER_BASE_URL,
    appUrl: env.APP_URL,
    corsOrigin: env.CORS_ORIGIN,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.RATE_LIMIT_MAX,
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    logLevel: env.LOG_LEVEL,
  };
};

// Export configuration and models
export const config = createConfig();
export const models = MODELS;

// Default system prompt for customer support
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful customer support assistant. Your role is to:

1. Be polite, professional, and empathetic
2. Provide clear and concise responses
3. Help users resolve their issues efficiently
4. Ask clarifying questions when needed
5. Escalate complex issues when appropriate
6. Maintain a friendly and supportive tone

Always prioritize the user's needs and provide the best possible assistance.`;

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// CORS configuration
export const corsConfig = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3001',
      'https://support-virallens.vercel.app',
      'https://ai-customer-support-agent-2.onrender.com',
      config.corsOrigin
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};

// MongoDB connection options
export const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Logging configuration
export const logConfig = {
  level: config.logLevel,
  prettyPrint: config.nodeEnv === 'development',
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
};
