---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

## 📚 出版物统计

**总论文数**: 17篇 (2016-2024)  
**最近5年论文数**: 12篇  
**高影响因子期刊论文数**: 8篇  
**主要研究领域**: GNSS-R/-RO技术、电离层建模、大气掩星观测

### 🔬 研究领域分布
- **COSMIC掩星**: 4篇
- **IRI模型**: 4篇  
- **GNSS技术**: 3篇
- **电离层研究**: 1篇
- **大气观测**: 2篇

### 📅 按年份分布
- **2025年**: 1篇 (GNSS掩星精度分析)
- **2024年**: 1篇 (赤道等离子体气泡动态特征)
- **2023年**: 2篇 (GPS/PWV分析、TJU#01卫星任务)
- **2022年**: 3篇 (ZTD评估、磁暴期间电离层变化、海面风速反演)
- **2020年**: 5篇 (GNSS观测、大气掩星、IRI模型改进等)
- **2019年**: 2篇 (Abel反演方法、电离层同化)
- **2018年**: 1篇 (IRI模型改进)
- **2016年**: 2篇 (LEO-LEO掩星、电离层尺度高度建模)

### ⭐ 高影响因子期刊论文
- **Journal of Geophysical Research: Space Physics**: 5篇
- **Remote Sensing**: 1篇
- **IEEE Transactions on Geoscience and Remote Sensing**: 1篇
- **Radio Science**: 1篇

{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
