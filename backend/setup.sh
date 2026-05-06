#!/bin/bash

# Pulse Chat Backend Setup Script

echo "======================================"
echo "Pulse Chat Backend Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if MongoDB is installed or available
if command -v mongosh &> /dev/null; then
    echo "✅ MongoDB is available"
else
    echo "⚠️  MongoDB command not found. Please ensure MongoDB is running."
    echo "   - Local: Install MongoDB Community Edition"
    echo "   - Cloud: Use MongoDB Atlas"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "✅ .env file already exists"
fi

echo ""

# Create upload directory
mkdir -p uploads logs

echo "✅ Setup complete!"
echo ""
echo "======================================"
echo "Next Steps:"
echo "======================================"
echo ""
echo "1. Update .env file with your configuration:"
echo "   - MONGODB_URI: Your MongoDB connection string"
echo "   - JWT_SECRET: A secure random string"
echo "   - FRONTEND_URL: Your frontend URL"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Server will be available at:"
echo "   http://localhost:5000"
echo ""
echo "======================================"
