# 🎨 Jekyll网站样式修复指南

## 问题诊断

你的网站 [https://gnss.ac.cn/publications/](https://gnss.ac.cn/publications/) 出现样式错乱问题，主要原因：

1. **主题配置缺失**：Gemfile中没有正确配置minimal-mistakes-jekyll主题
2. **CSS文件未生成**：由于主题配置问题，CSS样式文件无法正确生成
3. **布局模板问题**：可能缺少必要的布局文件

## 🔧 修复步骤

### 步骤1：更新Gemfile
已添加主题配置：
```ruby
gem "minimal-mistakes-jekyll"
```

### 步骤2：更新_config.yml
已添加主题配置：
```yaml
theme: "minimal-mistakes-jekyll"
```

### 步骤3：安装依赖
```bash
# 安装Ruby依赖
bundle install

# 如果遇到权限问题，使用：
sudo bundle install
```

### 步骤4：清理和重建
```bash
# 清理Jekyll缓存
bundle exec jekyll clean

# 重新构建网站
bundle exec jekyll build
```

### 步骤5：本地预览
```bash
# 启动本地服务器
bundle exec jekyll serve

# 访问 http://localhost:4000/publications/
```

### 步骤6：推送到远程
```bash
# 提交更改
git add .
git commit -m "Fix Jekyll theme configuration and style issues"

# 推送到远程
git push origin master
```

## 🎯 预期修复效果

修复后，你的网站应该：

1. **正常显示样式**：页面布局美观，字体、颜色、间距正确
2. **响应式设计**：在不同设备上正常显示
3. **完整功能**：导航、搜索、分页等功能正常
4. **Publications页面**：正确显示论文列表和详细信息

## 🔍 验证修复

### 检查CSS文件
```bash
# 检查CSS文件是否生成
ls -la _site/assets/css/

# 应该看到 main.css 文件
```

### 检查Publications页面
```bash
# 检查页面是否生成
ls -la _site/publications/

# 应该看到 index.html 文件
```

### 检查主题文件
```bash
# 检查主题文件是否存在
ls -la _layouts/
ls -la _includes/
ls -la _sass/
```

## 🚨 常见问题解决

### 问题1：Bundle安装失败
```bash
# 更新Ruby版本
sudo apt-get update
sudo apt-get install ruby-full

# 或者使用rbenv
rbenv install 3.0.0
rbenv global 3.0.0
```

### 问题2：Jekyll构建失败
```bash
# 检查错误信息
bundle exec jekyll build --verbose

# 清理缓存后重试
bundle exec jekyll clean
bundle exec jekyll build
```

### 问题3：样式仍然不正确
```bash
# 强制重新生成CSS
rm -rf _site
bundle exec jekyll build

# 检查CSS文件内容
head -20 _site/assets/css/main.css
```

## 📞 获取帮助

如果修复后仍有问题：

1. 检查浏览器控制台错误信息
2. 查看Jekyll构建日志
3. 确认所有依赖文件存在
4. 验证_config.yml配置正确

## 🎉 完成

修复完成后，你的网站应该恢复正常显示，Publications页面将正确显示所有论文信息。 