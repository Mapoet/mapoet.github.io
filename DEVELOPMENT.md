# Development Guide

This document provides instructions for setting up and developing the academic personal website.

## Prerequisites

- **Ruby** (>= 2.6.0)
- **Node.js** (>= 14.0.0)
- **Git**

## Quick Start

### Option 1: Using Make (Recommended)

```bash
# Install dependencies and start development server
make dev

# Or run commands individually
make install  # Install dependencies
make serve    # Start development server
make build    # Build for production
make clean    # Clean build artifacts
```

### Option 2: Using Docker

```bash
# Start development server with Docker
docker-compose up

# Build static files
docker-compose --profile build up build
```

### Option 3: Manual Setup

1. **Install Ruby dependencies:**
   ```bash
   bundle install
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   bundle exec jekyll serve --config _config.yml,_config.dev.yml --livereload
   ```

## Development Workflow

### File Structure

```
├── _config.yml          # Main configuration
├── _config.dev.yml      # Development overrides
├── _data/               # Site data files
├── _includes/           # Jekyll includes
├── _layouts/            # Jekyll layouts
├── _pages/              # Static pages
├── _posts/              # Blog posts
├── _publications/       # Publication entries
├── _talks/              # Talk entries
├── _portfolio/          # Portfolio items
├── _teaching/           # Teaching entries
├── assets/              # CSS, JS, images
├── images/              # Site images
└── files/               # Public files
```

### Adding Content

1. **Blog Posts:** Add markdown files to `_posts/` with YAML front matter
2. **Publications:** Add entries to `_publications/` or use the markdown generator
3. **Talks:** Add entries to `_talks/` or use the markdown generator
4. **Pages:** Add markdown files to `_pages/`

### Using the Markdown Generator

The `markdown_generator/` directory contains tools for generating content from TSV files:

```bash
# Generate publications from TSV
python markdown_generator/publication_generator.py

# Generate talks from TSV
python markdown_generator/talk_generator.py
```

### Customization

1. **Site Configuration:** Edit `_config.yml`
2. **Styling:** Modify files in `_sass/` and `assets/css/`
3. **Layouts:** Customize files in `_layouts/`
4. **Includes:** Modify files in `_includes/`

## Build and Deploy

### Local Build

```bash
# Build for production
make build

# Or manually
bundle exec jekyll build
npm run build:js
```

### GitHub Pages Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment

```bash
# Build the site
make build

# Deploy to GitHub Pages
git add .
git commit -m "Update site"
git push origin main
```

## Troubleshooting

### Common Issues

1. **Bundle install fails:**
   ```bash
   # Delete Gemfile.lock and try again
   rm Gemfile.lock
   bundle install
   ```

2. **Jekyll serve fails:**
   ```bash
   # Check Jekyll installation
   bundle exec jekyll doctor
   ```

3. **Node.js dependencies issues:**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Development Tips

1. **Live Reload:** The development server includes live reload for automatic browser refresh
2. **Drafts:** Use `_drafts/` directory for unpublished posts
3. **Future Posts:** Set `future: true` in `_config.dev.yml` to see scheduled posts
4. **Analytics:** Disabled in development mode to avoid tracking local development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `make serve`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 