#!/bin/bash

echo "🚀 安装Ruby和Jekyll环境..."

# 检查系统类型
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 检测到Linux系统，使用apt安装..."
    
    # 更新包管理器
    sudo apt-get update
    
    # 安装Ruby和相关依赖
    echo "📦 安装Ruby和相关依赖..."
    sudo apt-get install -y ruby-full build-essential zlib1g-dev
    
    # 安装Bundler
    echo "📦 安装Bundler..."
    sudo gem install bundler
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 检测到macOS系统，使用Homebrew安装..."
    
    # 检查是否安装了Homebrew
    if ! command -v brew &> /dev/null; then
        echo "📦 安装Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # 安装Ruby
    echo "📦 安装Ruby..."
    brew install ruby
    
    # 添加到PATH
    echo 'export PATH="/usr/local/opt/ruby/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    
    # 安装Bundler
    echo "📦 安装Bundler..."
    gem install bundler
    
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 验证安装
echo "✅ 验证安装..."
ruby --version
gem --version
bundle --version

echo "🎉 Ruby和Jekyll环境安装完成！"
echo "💡 现在可以运行: bundle install" 