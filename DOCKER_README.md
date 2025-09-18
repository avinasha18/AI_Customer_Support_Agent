# Docker Setup for ViralLens Chatbot

This guide will help you run the ViralLens Chatbot application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- MongoDB Atlas account (for database)
- OpenRouter API key

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd virallens-chatbot
```

### 2. Set Up Environment Variables
Copy the example environment file and update with your values:
```bash
cp docker.env .env
```

Edit `.env` with your actual values:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/virallens-chatbot?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

### 3. Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Production Deployment

### Using Docker Compose (Production)
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up --build -d
```

### Deploy to Render

1. **Connect your GitHub repository to Render**
2. **Create two web services:**

   **Backend Service:**
   - Type: Web Service
   - Environment: Docker
   - Dockerfile Path: `./server/Dockerfile`
   - Docker Context: `./server`
   - Plan: Starter (or higher)
   - Health Check Path: `/health`

   **Frontend Service:**
   - Type: Web Service
   - Environment: Docker
   - Dockerfile Path: `./client/Dockerfile`
   - Docker Context: `./client`
   - Plan: Starter (or higher)
   - Health Check Path: `/`

3. **Set Environment Variables in Render:**

   **Backend Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-jwt-secret
   OPENROUTER_API_KEY=your-openrouter-api-key
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

   **Frontend Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

## Docker Commands

### Build Images
```bash
# Build backend only
docker build -t virallens-backend ./server

# Build frontend only
docker build -t virallens-frontend ./client

# Build all services
docker-compose build
```

### Run Containers
```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Start specific service
docker-compose up backend
docker-compose up frontend
```

### Stop and Cleanup
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f backend
```

### Health Checks
```bash
# Check service health
docker-compose ps

# Check backend health
curl http://localhost:3001/health

# Check frontend health
curl http://localhost:3000
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :3001
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **MongoDB Connection Issues**
   - Verify your MongoDB Atlas URI
   - Check if your IP is whitelisted in MongoDB Atlas
   - Ensure the database name is correct

3. **Build Failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Environment Variables Not Loading**
   - Ensure `.env` file exists in the root directory
   - Check that variable names match exactly
   - Restart containers after changing environment variables

### Debugging

```bash
# Enter running container
docker-compose exec backend sh
docker-compose exec frontend sh

# Check container logs
docker logs virallens-backend
docker logs virallens-frontend

# Check container status
docker ps -a
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MongoDB       │
│   (React +      │◄──►│   (Node.js +    │◄──►│   Atlas         │
│   Nginx)        │    │   Express)      │    │   (External)    │
│   Port: 3000    │    │   Port: 3001    │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Regularly update Docker images for security patches
- Use HTTPS in production (handled by Render)
- Implement proper CORS policies

## Performance Optimization

- Frontend uses Nginx for serving static files
- Gzip compression enabled
- Static assets cached for 1 year
- Health checks ensure service availability
- Multi-stage Docker builds reduce image size
