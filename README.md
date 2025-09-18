# 🤖 ViralLens AI Customer Support Chatbot

A production-ready, full-stack AI-powered customer support chatbot built with React, Node.js, and OpenRouter API integration. Features real-time streaming chat, user authentication, conversation management, and multiple AI model support.

## ✨ Features

- 🔐 **Secure Authentication**: JWT-based auth with bcrypt password hashing
- 🤖 **AI Integration**: OpenRouter API with multiple model support (Llama, Gemini, Claude, GPT)
- 💬 **Real-time Chat**: Server-Sent Events (SSE) for streaming AI responses
- 📱 **Modern UI**: Responsive React interface with dark/light theme toggle
- 🗄️ **Data Persistence**: MongoDB with conversation history and user management
- 🐳 **Docker Ready**: Complete containerization with Docker Compose
- 🚀 **Production Ready**: Deployed on Render with proper CI/CD
- 🛡️ **Security**: Rate limiting, CORS, input validation, and helmet protection

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React +      │◄──►│   (Node.js +    │◄──►│   Services      │
│   Nginx)        │    │   Express)      │    │   (OpenRouter + │
│   Port: 3000    │    │   Port: 3001    │    │   MongoDB)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS)
- **Docker Desktop** (for containerized setup)
- **MongoDB Atlas** account (free tier available)
- **OpenRouter API key** (get from [openrouter.ai](https://openrouter.ai/))

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd virallens-chatbot
   ```

2. **Set up environment variables**:
   ```bash
   cp docker.env .env
   # Edit .env with your MongoDB Atlas URI and OpenRouter API key
   ```

3. **Start the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

### Option 2: Manual Setup

1. **Backend Setup**:
   ```bash
   cd server
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd client
   npm install
   cp env.example .env
   # Edit .env with API URL
   npm run dev
   ```

## 🔧 Environment Configuration

### Backend Environment Variables

Create `server/.env` from `server/env.example`:

```env
# Required
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/virallens-chatbot
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### Frontend Environment Variables

Create `client/.env` from `client/env.example`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
```

### Docker Environment Variables

Create `.env` from `docker.env`:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/virallens-chatbot

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=60d
JWT_REFRESH_EXPIRES_IN=7d

# AI Integration
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# URLs
VITE_API_URL=http://localhost:3001/api
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

## 🎯 Key Features

### Authentication System
- User registration with first/last name
- Secure login with JWT tokens
- Automatic token validation and refresh
- Profile management
- Secure logout

### AI Chat Interface
- Real-time AI conversations with streaming
- Multiple AI model selection (free & paid)
- Conversation history and management
- Message persistence
- Dark/light theme toggle
- Typing indicators

### AI Model Support
- **Free Models**: Llama 3.3 70B, Llama 3.1 8B, Gemini Flash 1.5
- **Paid Models**: Claude 3.5 Sonnet, GPT-4o Mini
- Streaming responses with Server-Sent Events
- Error handling and retries

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/users/me` - Get user profile

### Chat
- `POST /api/chat/send` - Send message (with streaming)
- `GET /api/chat/history` - Get conversation history
- `GET /api/chat/:id` - Get specific conversation
- `DELETE /api/chat/:id` - Delete conversation
- `PUT /api/chat/:id/rename` - Rename conversation
- `GET /api/models` - Get available AI models

### System
- `GET /api/health` - Health check

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** for API calls
- **React Context** for state management

### Backend
- **Node.js 18+** with TypeScript
- **Express.js** framework
- **MongoDB** with Mongoose
- **JWT** authentication
- **bcrypt** password hashing
- **Zod** schema validation
- **Pino** logging

### AI Integration
- **OpenRouter API** for LLM access
- **Server-Sent Events** for streaming
- **Multiple model support**

### DevOps
- **Docker** containerization
- **Docker Compose** orchestration
- **Render** deployment platform
- **MongoDB Atlas** cloud database

## 🧪 Testing the Application

### 1. Test Authentication
1. Open http://localhost:3000
2. Create a new account
3. Login with credentials
4. Verify profile shows correctly

### 2. Test Chat
1. Start a new conversation
2. Send a message
3. Verify AI response streams in real-time
4. Check conversation appears in sidebar

### 3. Test Data Persistence
1. Refresh the page
2. Verify conversations are still there
3. Check user remains logged in

## 🚀 Production Deployment

### Render Deployment

The application is configured for Render deployment with:

1. **Backend Service**:
   - Docker environment
   - Health check endpoint
   - Environment variables from `render.yaml`

2. **Frontend Service**:
   - Docker environment
   - Static file serving with Nginx
   - API proxy configuration

### Environment Variables for Production

Set these in your Render dashboard:

**Backend**:
```
NODE_ENV=production
PORT=3001
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=your-production-jwt-secret
OPENROUTER_API_KEY=your-openrouter-api-key
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

**Frontend**:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` in backend matches frontend URL
   - Check `VITE_API_URL` in frontend

2. **Authentication Issues**
   - Verify JWT_SECRET is set in backend
   - Check token storage in browser localStorage

3. **OpenRouter API Issues**
   - Verify OPENROUTER_API_KEY is valid
   - Check API key has sufficient credits

4. **Database Connection**
   - Ensure MongoDB Atlas URI is correct
   - Check IP whitelist in MongoDB Atlas

### Debug Mode

```bash
# Backend debug
LOG_LEVEL=debug npm run dev

# Frontend debug
# Check browser console for API errors
```

## 📁 Project Structure

```
virallens-chatbot/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/        # API services
│   │   └── styles/         # CSS and themes
│   ├── Dockerfile          # Frontend Docker config
│   └── nginx.conf          # Nginx configuration
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── middlewares/    # Express middlewares
│   │   └── config/         # Configuration
│   └── Dockerfile          # Backend Docker config
├── docker-compose.yml      # Docker Compose setup
├── render.yaml            # Render deployment config
└── README.md              # This file
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schema validation
- **Rate Limiting**: API endpoint protection
- **CORS**: Cross-origin request security
- **Helmet**: Security headers
- **XSS Protection**: Input sanitization

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Theme**: Toggle between themes
- **Professional Styling**: Modern, clean interface
- **Loading States**: User feedback during operations
- **Error Handling**: Graceful error messages
- **Toast Notifications**: User-friendly feedback
- **Modal Dialogs**: Confirmation dialogs

## 📊 Performance Features

- **Streaming**: Real-time AI responses
- **Caching**: Conversation data caching
- **Optimization**: Efficient re-renders
- **Error Handling**: Graceful error recovery
- **Loading States**: User feedback during operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License - see package.json for details.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review the environment configuration
3. Open an issue with detailed information

---

## 🎉 Ready to Use!

This application is **production-ready** and fully functional. Start the system and enjoy your AI-powered customer support chat application! 🚀

**Live Demo**: [Frontend](https://support-virallens.vercel.app/) | [Backend API](https://ai-customer-support-agent-1.onrender.com/)
