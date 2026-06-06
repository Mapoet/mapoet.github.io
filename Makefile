.PHONY: help install build serve clean test

# Default target
help:
	@echo "Available commands:"
	@echo "  install  - Install dependencies (Ruby gems and Node.js packages)"
	@echo "  build    - Build the site for production"
	@echo "  serve    - Start development server with live reload"
	@echo "  clean    - Clean build artifacts"
	@echo "  test     - Run tests and checks"

# Install dependencies
install:
	@echo "Installing Ruby dependencies..."
	bundle install
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Dependencies installed successfully!"

# Build for production
build:
	@echo "Building site for production..."
	bundle exec jekyll build
	npm run build:js
	@echo "Build completed!"

# Start development server
serve:
	@echo "Starting development server..."
	bundle exec jekyll serve --config _config.yml,_config.dev.yml --livereload

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf _site/
	rm -rf .sass-cache/
	rm -rf .jekyll-cache/
	rm -rf node_modules/
	rm -rf .bundle/
	@echo "Clean completed!"

# Run tests and checks
test:
	@echo "Running tests and checks..."
	bundle exec jekyll doctor
	@echo "Tests completed!"

# Quick start for development
dev: install serve 