#!/bin/bash

echo "🔧 修复Jekyll网站样式问题..."

# 1. 安装依赖
echo "📦 安装Ruby依赖..."
bundle install

# 2. 清理缓存
echo "🧹 清理Jekyll缓存..."
bundle exec jekyll clean

# 3. 重新构建
echo "🏗️ 重新构建网站..."
bundle exec jekyll build

# 4. 检查构建结果
echo "✅ 检查构建结果..."
if [ -d "_site" ]; then
    echo "✅ 构建成功！"
    echo "📁 生成的文件在 _site/ 目录"
    
    # 检查CSS文件
    if [ -f "_site/assets/css/main.css" ]; then
        echo "✅ CSS文件生成成功"
    else
        echo "❌ CSS文件缺失"
    fi
    
    # 检查publications页面
    if [ -f "_site/publications/index.html" ]; then
        echo "✅ Publications页面生成成功"
    else
        echo "❌ Publications页面缺失"
    fi
else
    echo "❌ 构建失败"
    exit 1
fi

echo "🎉 修复完成！"
echo "💡 运行 'bundle exec jekyll serve' 来本地预览" 