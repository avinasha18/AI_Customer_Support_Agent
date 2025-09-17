# ViralLens Chatbot Backend

A production-ready TypeScript backend for an AI-powered customer support chat application using OpenRouter for LLM integration.

## Features

- 🔐 **Authentication**: JWT-based authentication with bcrypt password hashing
- 🤖 **AI Integration**: OpenRouter API integration with multiple model support
- 💬 **Chat Management**: Conversation history, message storage, and streaming support
- 🛡️ **Security**: Rate limiting, input validation, CORS, and helmet protection
- 📊 **Monitoring**: Structured logging, health checks, and error tracking
- 🐳 **Docker**: Complete Docker setup with MongoDB
- 🧪 **Testing**: Comprehensive unit and integration tests
- 📝 **TypeScript**: Full type safety with strict mode

## Tech Stack

- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **AI Provider**: OpenRouter API
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose
- **Logging**: Pino
- **Validation**: Zod

## Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- MongoDB (or use Docker)
- OpenRouter API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB** (if not using Docker):
   ```bash
   # Using MongoDB locally
   mongod
   ```

4. **Run the application**:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

### Using Docker

1. **Start with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

2. **Access the services**:
   - API: http://localhost:5000
   - MongoDB Express: http://localhost:8081 (admin/admin123)

## Environment Configuration

Copy `env.example` to `.env` and configure:

```env
# Required
MONGO_URI=mongodb://localhost:27017/virallens_chatbot
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/users/me` - Get user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/me/password` - Change password

### Chat

- `POST /api/chat/send` - Send message (supports streaming)
- `GET /api/chat/history` - Get conversation history
- `GET /api/chat/:id` - Get specific conversation
- `DELETE /api/chat/:id` - Delete conversation
- `PUT /api/chat/:id/rename` - Rename conversation
- `POST /api/chat/:id/clear` - Clear conversation messages
- `GET /api/chat/stats` - Get conversation statistics
- `GET /api/models` - Get available AI models

### System

- `GET /api/health` - Health check
- `GET /` - API information

## OpenRouter Integration

The application integrates with OpenRouter API for AI responses:

### Supported Models

- **Free Models**:
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `meta-llama/llama-3.1-8b-instruct:free`
  - `google/gemini-flash-1.5:free`

- **Paid Models**:
  - `anthropic/claude-3.5-sonnet`
  - `openai/gpt-4o-mini`

### Usage Example

```typescript
import axios from 'axios';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

export async function callOpenRouter(model: string, messages: Array<{ role: string; content: string }>) {
  const payload = { model, messages };
  const headers = { Authorization: `Bearer ${OPENROUTER_KEY}` };
  const res = await axios.post(`${OPENROUTER_BASE}/chat/completions`, payload, { headers, timeout: 60000 });
  return res.data;
}
```

## Streaming Support

The chat endpoint supports Server-Sent Events (SSE) for real-time streaming:

```javascript
// Enable streaming
const response = await fetch('/api/chat/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello!',
    stream: true
  })
});

// Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'content') {
        console.log('AI:', data.content);
      }
    }
  }
}
```

## Development

### Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start            # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run type-check   # Check TypeScript types
```

### Project Structure

```
server/
├── src/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/         # Database models
│   ├── middlewares/    # Express middlewares
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration
│   ├── types/          # TypeScript types
│   ├── routes.ts       # Route definitions
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── tests/              # Test files
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
└── README.md          # This file
```

## Testing

The application includes comprehensive tests:

- **Unit Tests**: Service and utility functions
- **Integration Tests**: API endpoints with database
- **Mocked Dependencies**: OpenRouter API calls

Run tests:
```bash
npm test
npm run test:coverage
```

## Security Features

- **Authentication**: JWT tokens with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Configurable per endpoint
- **Input Validation**: Zod schema validation
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Input Sanitization**: XSS protection

## Production Deployment

### Environment Variables

Ensure all required environment variables are set:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-production-secret-key
OPENROUTER_API_KEY=your-production-key
```

### Docker Deployment

```bash
# Build and run
docker-compose -f docker-compose.yml up --build -d

# View logs
docker-compose logs -f app

# Scale
docker-compose up --scale app=3
```

### Health Checks

The application provides health check endpoints:

- `GET /api/health` - Basic health check
- Docker health checks configured
- Graceful shutdown handling

## Monitoring and Logging

- **Structured Logging**: JSON format with Pino
- **Request Tracking**: Unique request IDs
- **Error Tracking**: Comprehensive error handling
- **Performance**: Response time logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

ISC License - see package.json for details.

## Support

For issues and questions:
1. Check the documentation
2. Review the test files for usage examples
3. Open an issue with detailed information

## Changelog

### v1.0.0
- Initial release
- Complete authentication system
- OpenRouter AI integration
- Chat management with streaming
- Docker support
- Comprehensive testing
- Production-ready configuration
