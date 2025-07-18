#!/bin/bash
# 1. 生成统计markdown
python3 scripts/publication_stats.py > docs/publication_stats.md

# 2. （可选）插入到about.md指定位置
awk '/<!-- PUB_STATS_START -->/{print; system("cat docs/publication_stats.md"); next}1' about.md > about_tmp.md && mv about_tmp.md about.md

# 3. git add/commit/push
git add docs/publication_stats.md about.md
git commit -m "Update publication stats"
git push