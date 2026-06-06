#!/bin/bash

echo "🧹 清理Jekyll缓存和构建文件..."

# 删除可能的缓存目录
rm -rf _site
rm -rf .jekyll-cache
rm -rf .sass-cache
rm -rf .bundle
rm -rf node_modules/.cache

# 删除可能的临时文件
find . -name "*.tmp" -delete
find . -name "*.temp" -delete

# 清理Gem缓存（如果存在）
if command -v bundle &> /dev/null; then
    echo "📦 清理Bundler缓存..."
    bundle clean --force 2>/dev/null || true
fi

# 清理npm缓存（如果存在）
if command -v npm &> /dev/null; then
    echo "📦 清理npm缓存..."
    npm cache clean --force 2>/dev/null || true
fi

echo "✅ 缓存清理完成！"
echo ""
echo "🔄 建议重新启动Jekyll服务器："
echo "   bundle exec jekyll serve --livereload"
echo ""
echo "或者使用开发脚本："
echo "   ./scripts/dev.sh" 