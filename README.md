# 付乃锋 (Naifeng Fu) - 学术个人网站

付乃锋的学术个人网站，理学博士，天津大学博士后，GNSS-R/-RO技术设备研制及数据应用专家。

## 🚀 Quick Start

### Prerequisites
- Ruby (>= 2.6.0)
- Node.js (>= 14.0.0)
- Git

### Development Setup

**Option 1: Using Make (Recommended)**
```bash
make dev
```

**Option 2: Using Docker**
```bash
docker-compose up
```

**Option 3: Manual Setup**
```bash
# Install dependencies
bundle install
npm install

# Start development server
bundle exec jekyll serve --config _config.yml,_config.dev.yml --livereload
```

## 📁 Project Structure

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
├── files/               # Public files
├── scripts/             # Development scripts
└── markdown_generator/  # Content generation tools
```

## 🛠️ Available Commands

```bash
make help      # Show all available commands
make install   # Install dependencies
make serve     # Start development server
make build     # Build for production
make clean     # Clean build artifacts
make test      # Run tests and checks
```

## 📝 Content Management

### Adding Publications
Use the markdown generator or add files directly to `_publications/`:
```bash
python markdown_generator/publication_generator.py
```

### Adding Talks
Use the markdown generator or add files directly to `_talks/`:
```bash
python markdown_generator/talk_generator.py
```

### Adding Blog Posts
Create markdown files in `_posts/` with YAML front matter.

## 🌐 Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch.

For manual deployment:
```bash
make build
git add .
git commit -m "Update site"
git push origin main
```

## 🔧 Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This site is based on the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/) by Michael Rose, which is released under the MIT License.

---

**Original Template Credit:** This was forked (then detached) by [Stuart Geiger](https://github.com/staeiou) from the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/), which is © 2016 Michael Rose and released under the MIT License.
