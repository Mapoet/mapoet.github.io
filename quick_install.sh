#!/bin/bash

echo "🚀 快速安装Ruby和Jekyll环境..."

# 检查是否已安装Ruby
if command -v ruby &> /dev/null; then
    echo "✅ Ruby已安装: $(ruby --version)"
else
    echo "📦 安装Ruby..."
    sudo apt-get update
    sudo apt-get install -y ruby-full build-essential zlib1g-dev
fi

# 检查是否已安装Bundler
if command -v bundle &> /dev/null; then
    echo "✅ Bundler已安装: $(bundle --version)"
else
    echo "📦 安装Bundler..."
    sudo gem install bundler
fi

# 验证安装
echo "✅ 验证安装..."
ruby --version
gem --version
bundle --version

echo "🎉 环境安装完成！"
echo "💡 现在运行: bundle install" 