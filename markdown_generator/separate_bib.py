#!/usr/bin/env python
# coding: utf-8

"""
分离BibTeX文件中的会议论文和期刊论文
并提取摘要信息
"""

from pybtex.database.input import bibtex
import re

def separate_bibtex_files():
    """分离会议论文和期刊论文到不同的BibTeX文件"""
    
    # 解析BibTeX文件
    parser = bibtex.Parser()
    bibdata = parser.parse_file('pubs.bib')
    
    # 分离不同类型的条目
    articles = {}
    proceedings = {}
    
    for bib_id, entry in bibdata.entries.items():
        entry_type = entry.type
        
        if entry_type == 'inproceedings':
            proceedings[bib_id] = entry
        elif entry_type == 'article':
            articles[bib_id] = entry
        else:
            # 其他类型也归为文章
            articles[bib_id] = entry
    
    # 创建期刊论文BibTeX文件
    with open('pubs_articles.bib', 'w', encoding='utf-8') as f:
        f.write("% Journal Articles\n")
        f.write("% Generated from pubs.bib\n\n")
        
        for bib_id, entry in articles.items():
            f.write(f"@{entry.type}{{{bib_id},\n")
            for field_name, field_value in entry.fields.items():
                if isinstance(field_value, str):
                    # 处理特殊字符
                    field_value = field_value.replace('\\', '\\\\')
                    f.write(f"  {field_name} = {{{field_value}}},\n")
            f.write("}\n\n")
    
    # 创建会议论文BibTeX文件
    with open('pubs_talks.bib', 'w', encoding='utf-8') as f:
        f.write("% Conference Proceedings\n")
        f.write("% Generated from pubs.bib\n\n")
        
        for bib_id, entry in proceedings.items():
            f.write(f"@{entry.type}{{{bib_id},\n")
            for field_name, field_value in entry.fields.items():
                if isinstance(field_value, str):
                    # 处理特殊字符
                    field_value = field_value.replace('\\', '\\\\')
                    f.write(f"  {field_name} = {{{field_value}}},\n")
            f.write("}\n\n")
    
    print(f"✅ 分离完成:")
    print(f"   期刊论文: {len(articles)}篇")
    print(f"   会议论文: {len(proceedings)}篇")
    
    return articles, proceedings

def extract_abstracts():
    """提取所有论文的摘要信息"""
    
    parser = bibtex.Parser()
    bibdata = parser.parse_file('pubs.bib')
    
    abstracts = {}
    
    for bib_id, entry in bibdata.entries.items():
        if 'abstract' in entry.fields:
            abstracts[bib_id] = entry.fields['abstract']
    
    print(f"📝 找到 {len(abstracts)} 篇包含摘要的论文")
    
    # 保存摘要到文件
    with open('abstracts.txt', 'w', encoding='utf-8') as f:
        for bib_id, abstract in abstracts.items():
            f.write(f"=== {bib_id} ===\n")
            f.write(f"{abstract}\n\n")
    
    return abstracts

if __name__ == "__main__":
    print("🔍 分离BibTeX文件...")
    articles, proceedings = separate_bibtex_files()
    
    print("\n📝 提取摘要信息...")
    abstracts = extract_abstracts()
    
    print("\n✅ 处理完成！")
    print("生成的文件:")
    print("  - pubs_articles.bib (期刊论文)")
    print("  - pubs_talks.bib (会议论文)")
    print("  - abstracts.txt (摘要信息)") 