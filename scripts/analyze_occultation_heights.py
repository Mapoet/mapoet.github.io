#!/usr/bin/env python3
"""
掩星事件高度分析脚本
分析 occultation_events.json 中所有事件的高度分布情况
"""

import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import pandas as pd

def load_occultation_data(file_path):
    """加载掩星事件数据"""
    print(f"正在加载数据文件: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"数据加载完成，共 {len(data)} 个事件")
    return data

def analyze_heights(data):
    """分析高度数据"""
    print("\n=== 高度数据分析 ===")
    
    # 收集所有高度数据
    all_heights = []
    event_types = []
    event_info = []
    
    for i, event in enumerate(data):
        if not event.get('points') or len(event['points']) < 2:
            continue
            
        event_type = event.get('type', 'unknown')
        points = event['points']
        
        # 收集该事件的所有高度
        event_heights = [point['alt'] for point in points]
        all_heights.extend(event_heights)
        event_types.extend([event_type] * len(event_heights))
        
        # 记录事件信息
        event_info.append({
            'event_id': i,
            'type': event_type,
            'point_count': len(points),
            'min_height': min(event_heights),
            'max_height': max(event_heights),
            'mean_height': np.mean(event_heights),
            'std_height': np.std(event_heights)
        })
    
    # 转换为numpy数组
    heights = np.array(all_heights)
    types = np.array(event_types)
    
    print(f"总点数: {len(heights)}")
    print(f"高度范围: {heights.min():.2f} - {heights.max():.2f}")
    print(f"平均高度: {heights.mean():.2f}")
    print(f"高度标准差: {heights.std():.2f}")
    
    # 按类型统计
    print("\n按事件类型统计:")
    for event_type in ['iono', 'atm']:
        mask = types == event_type
        if np.any(mask):
            type_heights = heights[mask]
            print(f"{event_type} 事件:")
            print(f"  点数: {len(type_heights)}")
            print(f"  高度范围: {type_heights.min():.2f} - {type_heights.max():.2f}")
            print(f"  平均高度: {type_heights.mean():.2f}")
            print(f"  高度标准差: {type_heights.std():.2f}")
    
    return heights, types, event_info

def plot_height_distribution(heights, types, save_path='height_analysis.png'):
    """绘制高度分布图"""
    print(f"\n正在生成高度分布图: {save_path}")
    
    # 设置中文字体
    plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False
    
    # 创建子图
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('掩星事件高度分布分析', fontsize=16, fontweight='bold')
    
    # 1. 整体高度分布直方图
    axes[0, 0].hist(heights, bins=50, alpha=0.7, color='skyblue', edgecolor='black')
    axes[0, 0].set_title('所有事件高度分布')
    axes[0, 0].set_xlabel('高度')
    axes[0, 0].set_ylabel('频次')
    axes[0, 0].grid(True, alpha=0.3)
    
    # 添加统计信息
    mean_height = heights.mean()
    std_height = heights.std()
    axes[0, 0].axvline(mean_height, color='red', linestyle='--', 
                      label=f'平均值: {mean_height:.2f}')
    axes[0, 0].legend()
    
    # 2. 按类型分组的箱线图
    data_for_box = []
    labels = []
    for event_type in ['iono', 'atm']:
        mask = types == event_type
        if np.any(mask):
            data_for_box.append(heights[mask])
            labels.append(f'{event_type} 事件')
    
    if data_for_box:
        axes[0, 1].boxplot(data_for_box, labels=labels)
        axes[0, 1].set_title('按事件类型的高度分布')
        axes[0, 1].set_ylabel('高度')
        axes[0, 1].grid(True, alpha=0.3)
    
    # 3. 按类型分组的直方图
    for event_type in ['iono', 'atm']:
        mask = types == event_type
        if np.any(mask):
            type_heights = heights[mask]
            axes[1, 0].hist(type_heights, bins=30, alpha=0.6, 
                           label=f'{event_type} 事件', density=True)
    
    axes[1, 0].set_title('按事件类型的高度分布（密度）')
    axes[1, 0].set_xlabel('高度')
    axes[1, 0].set_ylabel('密度')
    axes[1, 0].legend()
    axes[1, 0].grid(True, alpha=0.3)
    
    # 4. 高度范围分析
    height_ranges = [
        (0, 50, '0-50'),
        (50, 100, '50-100'),
        (100, 200, '100-200'),
        (200, 500, '200-500'),
        (500, 1000, '500-1000'),
        (1000, float('inf'), '>1000')
    ]
    
    range_counts = []
    range_labels = []
    
    for min_h, max_h, label in height_ranges:
        if max_h == float('inf'):
            count = np.sum((heights >= min_h))
        else:
            count = np.sum((heights >= min_h) & (heights < max_h))
        range_counts.append(count)
        range_labels.append(label)
    
    axes[1, 1].bar(range_labels, range_counts, alpha=0.7, color='lightcoral')
    axes[1, 1].set_title('高度范围分布')
    axes[1, 1].set_xlabel('高度范围')
    axes[1, 1].set_ylabel('点数')
    axes[1, 1].grid(True, alpha=0.3)
    
    # 在柱状图上添加数值标签
    for i, count in enumerate(range_counts):
        axes[1, 1].text(i, count + max(range_counts) * 0.01, 
                       str(count), ha='center', va='bottom')
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"高度分布图已保存: {save_path}")
    plt.show()

def generate_height_report(event_info, save_path='height_report.txt'):
    """生成高度分析报告"""
    print(f"\n正在生成高度分析报告: {save_path}")
    
    df = pd.DataFrame(event_info)
    
    with open(save_path, 'w', encoding='utf-8') as f:
        f.write("掩星事件高度分析报告\n")
        f.write("=" * 50 + "\n\n")
        
        f.write(f"总事件数: {len(df)}\n")
        f.write(f"总点数: {df['point_count'].sum()}\n\n")
        
        f.write("按事件类型统计:\n")
        f.write("-" * 30 + "\n")
        for event_type in ['iono', 'atm']:
            type_df = df[df['type'] == event_type]
            if not type_df.empty:
                f.write(f"\n{event_type} 事件:\n")
                f.write(f"  事件数: {len(type_df)}\n")
                f.write(f"  总点数: {type_df['point_count'].sum()}\n")
                f.write(f"  平均最小高度: {type_df['min_height'].mean():.2f}\n")
                f.write(f"  平均最大高度: {type_df['max_height'].mean():.2f}\n")
                f.write(f"  平均高度: {type_df['mean_height'].mean():.2f}\n")
        
        f.write("\n\n高度异常事件 (>1000):\n")
        f.write("-" * 30 + "\n")
        high_events = df[df['max_height'] > 1000]
        if not high_events.empty:
            for _, row in high_events.iterrows():
                f.write(f"事件 {row['event_id']} ({row['type']}): "
                       f"高度范围 {row['min_height']:.2f} - {row['max_height']:.2f}\n")
        else:
            f.write("没有发现高度异常事件\n")
        
        f.write("\n\n前20个事件的详细信息:\n")
        f.write("-" * 30 + "\n")
        f.write("事件ID | 类型 | 点数 | 最小高度 | 最大高度 | 平均高度 | 标准差\n")
        f.write("-" * 80 + "\n")
        for _, row in df.head(20).iterrows():
            f.write(f"{row['event_id']:6d} | {row['type']:4s} | {row['point_count']:4d} | "
                   f"{row['min_height']:8.2f} | {row['max_height']:8.2f} | "
                   f"{row['mean_height']:8.2f} | {row['std_height']:6.2f}\n")
    
    print(f"高度分析报告已保存: {save_path}")

def main():
    """主函数"""
    # 数据文件路径
    data_file = Path("../assets/data/occultation_events.json")
    
    if not data_file.exists():
        print(f"错误: 数据文件不存在: {data_file}")
        return
    
    try:
        # 加载数据
        data = load_occultation_data(data_file)
        
        # 分析高度
        heights, types, event_info = analyze_heights(data)
        
        # 生成图表
        plot_height_distribution(heights, types)
        
        # 生成报告
        generate_height_report(event_info)
        
        print("\n分析完成！")
        print("生成的文件:")
        print("- height_analysis.png: 高度分布图表")
        print("- height_report.txt: 详细分析报告")
        
    except Exception as e:
        print(f"分析过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 