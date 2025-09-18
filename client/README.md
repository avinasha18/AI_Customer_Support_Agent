# ViralLens Chatbot Frontend

A modern React frontend for the ViralLens AI Customer Support Chatbot, built with TypeScript, Vite, and Tailwind CSS.

## ✨ Features

- 🔐 **Authentication**: Login, signup, and profile management
- 💬 **Real-time Chat**: Streaming AI responses with Server-Sent Events
- 🎨 **Modern UI**: Responsive design with dark/light theme toggle
- 📱 **Mobile Ready**: Optimized for desktop and mobile devices
- 🚀 **Performance**: Fast loading with Vite and optimized builds
- 🛡️ **Type Safety**: Full TypeScript support with strict mode

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** for API communication
- **React Context** for state management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- Backend server running (see main README.md)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your API URL
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3001/api

## 🔧 Environment Configuration

Create `.env` from `env.example`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
```

## 📁 Project Structure

```
client/
├── src/
│   ├── components/         # React components
│   │   ├── Auth/          # Authentication components
│   │   ├── Chat/          # Chat interface components
│   │   └── UI/            # Reusable UI components
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ChatContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/          # API services
│   │   └── api.ts
│   ├── styles/            # CSS and themes
│   │   └── theme.css
│   └── utils/             # Utility functions
├── public/                # Static assets
├── Dockerfile            # Docker configuration
└── nginx.conf            # Nginx configuration
```

## 🎨 UI Components

### Authentication
- **Login**: User login form with validation
- **Signup**: User registration with first/last name
- **Profile**: User profile management

### Chat Interface
- **ChatInterface**: Main chat container
- **MessageList**: Message display with welcome page
- **Message**: Individual message component
- **MessageInput**: Message input with send button
- **TypingIndicator**: AI typing animation
- **Sidebar**: Conversation list and management

### UI Components
- **Modal**: Reusable modal dialog
- **ConfirmationModal**: Confirmation dialogs
- **Toast**: Toast notifications

## 🎯 Key Features

### Real-time Chat
- Streaming AI responses with Server-Sent Events
- Typing indicators for better UX
- Message persistence and history
- Conversation management (create, delete, rename)

### Authentication
- JWT-based authentication
- Automatic token validation
- Secure logout
- Profile management

### Theme System
- Dark/light theme toggle
- CSS variables for consistent theming
- Professional styling with Tailwind CSS

### Responsive Design
- Mobile-first approach
- Optimized for desktop and mobile
- Touch-friendly interactions

## 🚀 Build and Deployment

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production Build
```bash
npm run build
# Output: dist/ directory
```

### Docker
```bash
# Build Docker image
docker build -t virallens-frontend .

# Run container
docker run -p 3000:80 virallens-frontend
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check `VITE_API_URL` in `.env`
   - Ensure backend server is running
   - Verify CORS configuration

2. **Authentication Issues**
   - Check token storage in localStorage
   - Verify JWT_SECRET in backend
   - Clear browser cache and localStorage

3. **Build Errors**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Clear node_modules and reinstall

### Debug Mode

```bash
# Enable debug logging
VITE_LOG_LEVEL=debug npm run dev
```

## 📊 Performance Features

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **Caching**: Efficient browser caching
- **Lazy Loading**: Component lazy loading

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: Dynamic theme support
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Automatic theme switching
- **Professional UI**: Clean, modern interface

## 🔐 Security Features

- **Input Validation**: Client-side validation
- **XSS Protection**: Sanitized inputs
- **Secure Storage**: Token management
- **CORS**: Cross-origin request security

---

## 📚 Documentation

For complete setup instructions and backend configuration, see the main [README.md](../README.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License - see package.json for details.
