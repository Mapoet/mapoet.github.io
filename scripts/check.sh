#!/bin/bash

# Project status check script

echo "🔍 Checking project status..."

# Check Ruby version
echo "📋 Ruby version:"
ruby --version

# Check Node.js version
echo "📋 Node.js version:"
node --version

# Check if dependencies are installed
echo "📦 Checking dependencies..."

if [ -d "vendor" ]; then
    echo "✅ Ruby dependencies installed"
else
    echo "❌ Ruby dependencies not installed (run 'bundle install')"
fi

if [ -d "node_modules" ]; then
    echo "✅ Node.js dependencies installed"
else
    echo "❌ Node.js dependencies not installed (run 'npm install')"
fi

# Check Jekyll installation
if command -v bundle &> /dev/null; then
    echo "✅ Bundler installed"
else
    echo "❌ Bundler not installed (run 'gem install bundler')"
fi

# Check if site builds
echo "🔨 Testing site build..."
if bundle exec jekyll build --quiet; then
    echo "✅ Site builds successfully"
else
    echo "❌ Site build failed"
fi

echo "✅ Status check completed!" 