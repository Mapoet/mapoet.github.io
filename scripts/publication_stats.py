#!/usr/bin/env python
# coding: utf-8

"""
出版物统计分析脚本
分析付乃锋博士的出版物信息
"""

import os
import re
from collections import defaultdict, Counter
from datetime import datetime

def analyze_publications():
    """分析出版物目录中的论文信息"""
    
    publications_dir = "_publications"
    publications = []
    
    # 读取所有出版物文件
    for filename in os.listdir(publications_dir):
        if filename.endswith('.md'):
            filepath = os.path.join(publications_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 解析YAML front matter
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 2:
                    yaml_content = parts[1]
                    
                    # 提取信息
                    title_match = re.search(r'title:\s*"([^"]+)"', yaml_content)
                    date_match = re.search(r'date:\s*(\d{4}-\d{2}-\d{2})', yaml_content)
                    venue_match = re.search(r'venue:\s*\'([^\']+)\'', yaml_content)
                    citation_match = re.search(r'citation:\s*\'([^\']+)\'', yaml_content)
                    
                    if title_match and date_match:
                        year = int(date_match.group(1).split('-')[0])
                        publications.append({
                            'title': title_match.group(1),
                            'year': year,
                            'venue': venue_match.group(1) if venue_match else 'Unknown',
                            'citation': citation_match.group(1) if citation_match else '',
                            'filename': filename
                        })
    
    return publications

def generate_stats(publications):
    """生成统计信息"""
    
    print("=" * 60)
    print("付乃锋博士出版物统计分析")
    print("=" * 60)
    
    # 按年份统计
    year_stats = Counter(pub['year'] for pub in publications)
    print(f"\n📊 按年份统计 (总计: {len(publications)}篇)")
    print("-" * 40)
    for year in sorted(year_stats.keys()):
        print(f"{year}年: {year_stats[year]}篇")
    
    # 按期刊统计
    venue_stats = Counter(pub['venue'] for pub in publications)
    print(f"\n📚 按期刊统计")
    print("-" * 40)
    for venue, count in venue_stats.most_common():
        print(f"{venue}: {count}篇")
    
    # 研究领域分析
    print(f"\n🔬 研究领域分析")
    print("-" * 40)
    
    keywords = {
        'GNSS': 0,
        '电离层': 0,
        '掩星': 0,
        'COSMIC': 0,
        'IRI': 0,
        '同化': 0,
        '大气': 0,
        '等离子体': 0,
        '反射': 0,
        '卫星': 0
    }
    
    for pub in publications:
        title = pub['title'].lower()
        for keyword in keywords:
            if keyword.lower() in title:
                keywords[keyword] += 1
    
    for keyword, count in sorted(keywords.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            print(f"{keyword}: {count}篇")
    
    # 最新论文
    print(f"\n📅 最新论文 (最近5年)")
    print("-" * 40)
    recent_pubs = [p for p in publications if p['year'] >= 2020]
    for pub in sorted(recent_pubs, key=lambda x: x['year'], reverse=True):
        print(f"{pub['year']}: {pub['title'][:50]}...")
    
    # 高影响因子期刊
    high_impact_journals = [
        'Journal of Geophysical Research: Space Physics',
        'Remote Sensing',
        'IEEE Transactions on Geoscience and Remote Sensing',
        'Radio Science'
    ]
    
    print(f"\n⭐ 高影响因子期刊论文")
    print("-" * 40)
    high_impact_pubs = [p for p in publications if p['venue'] in high_impact_journals]
    for pub in sorted(high_impact_pubs, key=lambda x: x['year'], reverse=True):
        print(f"{pub['year']}: {pub['title'][:50]}... ({pub['venue']})")
    
    return {
        'total': len(publications),
        'year_stats': dict(year_stats),
        'venue_stats': dict(venue_stats),
        'recent_count': len(recent_pubs),
        'high_impact_count': len(high_impact_pubs)
    }

def generate_publication_list(publications):
    """生成出版物列表"""
    
    print(f"\n📋 完整出版物列表")
    print("=" * 60)
    
    for pub in sorted(publications, key=lambda x: x['year'], reverse=True):
        print(f"\n{pub['year']} - {pub['venue']}")
        print(f"标题: {pub['title']}")
        if pub['citation']:
            # 提取作者信息
            citation = pub['citation']
            if '**Naifeng Fu**' in citation or '**付乃锋**' in citation:
                print("👤 第一作者/通讯作者")
        print("-" * 40)

if __name__ == "__main__":
    publications = analyze_publications()
    stats = generate_stats(publications)
    generate_publication_list(publications)
    
    print(f"\n🎯 总结")
    print("=" * 60)
    print(f"总论文数: {stats['total']}篇")
    print(f"最近5年论文数: {stats['recent_count']}篇")
    print(f"高影响因子期刊论文数: {stats['high_impact_count']}篇")
    print(f"研究跨度: {min(stats['year_stats'].keys())}年 - {max(stats['year_stats'].keys())}年") 