#!/bin/bash

# Development startup script for the academic website

set -e

echo "🚀 Starting development environment..."

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

# Check if bundle is installed
if ! command -v bundle &> /dev/null; then
    echo "📦 Installing bundler..."
    gem install bundler
fi

# Install dependencies if they don't exist
if [ ! -d "vendor" ] || [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bundle install
    npm install
fi

# Start development server
echo "🌐 Starting Jekyll development server..."
echo "📍 Site will be available at: http://localhost:4000"
echo "🔄 Live reload is enabled"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

bundle exec jekyll serve --config _config.yml,_config.dev.yml --livereload 