# 🚀 Ruby和Jekyll安装指南

## 问题诊断

你的系统缺少Ruby和Bundler，这是运行Jekyll网站的必要环境。

## 🔧 安装步骤

### 方法1：使用系统包管理器（推荐）

```bash
# 1. 更新包管理器
sudo apt-get update

# 2. 安装Ruby和相关依赖
sudo apt-get install -y ruby-full build-essential zlib1g-dev

# 3. 安装Bundler
sudo gem install bundler

# 4. 验证安装
ruby --version
gem --version
bundle --version
```

### 方法2：使用rbenv（更灵活）

```bash
# 1. 安装rbenv
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/master/bin/rbenv-installer | bash

# 2. 添加到PATH
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

# 3. 安装Ruby
rbenv install 3.2.2
rbenv global 3.2.2

# 4. 安装Bundler
gem install bundler
```

### 方法3：使用RVM

```bash
# 1. 安装RVM
curl -sSL https://get.rvm.io | bash -s stable

# 2. 重新加载shell
source ~/.rvm/scripts/rvm

# 3. 安装Ruby
rvm install 3.2.2
rvm use 3.2.2 --default

# 4. 安装Bundler
gem install bundler
```

## 📦 安装Jekyll依赖

安装完Ruby和Bundler后：

```bash
# 1. 进入项目目录
cd /mnt/d/works/mapoet.github.io

# 2. 安装项目依赖
bundle install

# 3. 清理缓存
bundle exec jekyll clean

# 4. 构建网站
bundle exec jekyll build

# 5. 本地预览
bundle exec jekyll serve
```

## 🎯 验证安装

### 检查Ruby版本
```bash
ruby --version
# 应该显示类似：ruby 3.2.2p53 (2023-03-30 revision e51014f9c0) [x86_64-linux]
```

### 检查Gem版本
```bash
gem --version
# 应该显示类似：3.4.15
```

### 检查Bundler版本
```bash
bundle --version
# 应该显示类似：Bundler version 2.4.15
```

### 检查Jekyll版本
```bash
bundle exec jekyll --version
# 应该显示类似：jekyll 4.3.2
```

## 🚨 常见问题解决

### 问题1：权限错误
```bash
# 如果遇到权限问题，使用sudo
sudo gem install bundler
```

### 问题2：PATH问题
```bash
# 检查PATH
echo $PATH

# 如果Ruby不在PATH中，手动添加
export PATH="/usr/local/bin:$PATH"
```

### 问题3：依赖冲突
```bash
# 清理并重新安装
bundle clean --force
bundle install
```

### 问题4：WSL特定问题
```bash
# 在WSL中，可能需要安装额外的包
sudo apt-get install -y gcc g++ make
```

## 🎉 完成安装

安装完成后，你可以：

1. **构建网站**：`bundle exec jekyll build`
2. **本地预览**：`bundle exec jekyll serve`
3. **推送到远程**：`git push origin master`

## 📞 获取帮助

如果安装过程中遇到问题：

1. 检查错误信息
2. 确认系统权限
3. 验证网络连接
4. 查看Ruby官方文档

安装完成后，你的Jekyll网站应该能够正常运行并正确显示样式！ 