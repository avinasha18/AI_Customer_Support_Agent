@echo off
REM Deployment script for ViralLens Chatbot

echo 🚀 Starting ViralLens Chatbot deployment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from docker.env...
    copy docker.env .env
    echo 📝 Please edit .env file with your actual values before running again.
    exit /b 1
)

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up --build -d

REM Wait for services to be healthy
echo ⏳ Waiting for services to be healthy...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service health...

REM Check backend health
curl -f http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
    docker-compose logs backend
    exit /b 1
)

REM Check frontend health
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
    docker-compose logs frontend
    exit /b 1
)

echo 🎉 Deployment successful!
echo.
echo 📱 Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo    Health:   http://localhost:3001/health
echo.
echo 📊 To view logs:
echo    docker-compose logs -f
echo.
echo 🛑 To stop services:
echo    docker-compose down
