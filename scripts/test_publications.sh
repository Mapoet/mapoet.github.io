#!/bin/bash

echo "🔍 测试出版物链接..."

# 检查_publications目录中的所有文件
echo "📁 检查出版物文件..."
for file in _publications/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .md)
        echo "✅ $filename"
        
        # 检查文件内容是否完整
        if grep -q "title:" "$file" && grep -q "date:" "$file"; then
            echo "   📝 内容完整"
        else
            echo "   ⚠️  内容可能不完整"
        fi
    fi
done

echo ""
echo "🔗 检查出版物页面..."
if [ -f "_pages/publications.md" ]; then
    echo "✅ publications.md 存在"
else
    echo "❌ publications.md 不存在"
fi

echo ""
echo "📊 统计信息..."
total_pubs=$(ls _publications/*.md 2>/dev/null | wc -l)
echo "总出版物数量: $total_pubs"

# 按年份统计
echo ""
echo "📅 按年份分布:"
for year in {2016..2024}; do
    count=$(grep -l "date: $year" _publications/*.md 2>/dev/null | wc -l)
    if [ "$count" -gt 0 ]; then
        echo "   $year年: $count篇"
    fi
done

echo ""
echo "✅ 出版物链接测试完成！"
echo ""
echo "💡 如果仍有404错误，请尝试："
echo "   1. 清除浏览器缓存"
echo "   2. 重新启动Jekyll服务器"
echo "   3. 检查URL是否正确" 