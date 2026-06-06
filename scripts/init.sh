#!/bin/bash

# Complete project initialization script

set -e

echo "🚀 Initializing academic website project..."

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo "❌ Ruby is not installed. Please install Ruby first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "📋 Ruby version: $(ruby --version)"
echo "📋 Node.js version: $(node --version)"

# Install bundler if not present
if ! command -v bundle &> /dev/null; then
    echo "📦 Installing bundler..."
    gem install bundler
fi

# Install Ruby dependencies
echo "📦 Installing Ruby dependencies..."
bundle install

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Test build
echo "🔨 Testing site build..."
if bundle exec jekyll build --quiet; then
    echo "✅ Site builds successfully"
else
    echo "❌ Site build failed"
    exit 1
fi

echo ""
echo "🎉 Project initialization completed!"
echo ""
echo "Next steps:"
echo "  • Run './scripts/dev.sh' to start development server"
echo "  • Run 'make serve' to start development server with Make"
echo "  • Run 'docker-compose up' to start with Docker"
echo ""
echo "Development server will be available at: http://localhost:4000" 