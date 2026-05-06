@echo off
REM Pulse Chat Backend Setup Script for Windows

echo.
echo ======================================
echo Pulse Chat Backend Setup
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo x Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo + Node.js version: %NODE_VERSION%
echo.

REM Install dependencies
echo Downloading and installing dependencies...
call npm install

if errorlevel 1 (
    echo x Failed to install dependencies
    exit /b 1
)

echo + Dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo + .env file created. Please update it with your configuration.
) else (
    echo + .env file already exists
)

echo.

REM Create directories
if not exist uploads mkdir uploads
if not exist logs mkdir logs

echo + Setup complete!
echo.
echo ======================================
echo Next Steps:
echo ======================================
echo.
echo 1. Update .env file with your configuration
echo    - MONGODB_URI: Your MongoDB connection string
echo    - JWT_SECRET: A secure random string
echo    - FRONTEND_URL: Your frontend URL
echo.
echo 2. Start development server:
echo    npm run dev
echo.
echo 3. Server will be available at:
echo    http://localhost:5000
echo.
echo ======================================
echo.

pause
