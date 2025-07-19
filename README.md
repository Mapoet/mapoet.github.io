# 🌍 掩星预报系统 (Occultation Prediction System)

付乃锋 (Naifeng Fu) 的学术个人网站与掩星预报系统，理学博士，天津大学博士后，GNSS-R/-RO技术设备研制及数据应用专家。

## 🚀 系统概述

本项目是一个集成的掩星事件预报系统，结合了学术个人网站和实时掩星事件可视化功能。系统能够：

- **实时掩星预报**：基于TLE数据计算未来6小时的掩星事件
- **3D可视化**：使用Cesium.js提供交互式地球可视化
- **多类型掩星**：支持电离层掩星和大气掩星事件
- **高精度计算**：使用GAST（格林尼治视恒星时）进行精确的ECI到ECEF转换
- **自动更新**：GitHub Actions自动更新掩星预报数据

## 🎯 核心功能

### 📡 掩星事件预报
- **时间范围**：未来6小时
- **卫星类型**：支持GNSS导航卫星和低轨卫星
- **掩星类型**：
  - 电离层掩星（高度 > 60km）
  - 大气掩星（-50km < 高度 ≤ 60km）
  - 深海掩星（高度 ≤ -50km）

### 🌐 3D可视化
- **交互式地球**：基于Cesium.js的3D地球可视化
- **实时轨迹**：显示掩星事件轨迹和卫星轨道
- **时间控制**：支持时间轴控制和动画播放
- **昼夜效果**：自动昼夜交替显示
- **快捷键支持**：丰富的键盘快捷键操作

### 🔧 技术特性
- **高精度坐标转换**：使用astropy库计算GAST
- **并行计算**：多进程并行处理卫星轨道计算
- **自动数据更新**：GitHub Actions定时更新
- **响应式设计**：支持多种设备和屏幕尺寸

## 🛠️ 技术栈

### 后端技术
- **Python 3.8+**：核心计算语言
- **SGP4**：卫星轨道传播算法
- **astropy**：天文时间计算（GAST）
- **pyproj**：坐标系统转换
- **scipy**：数值计算和插值
- **numpy**：数值数组处理

### 前端技术
- **Cesium.js**：3D地球可视化
- **JavaScript ES6+**：交互逻辑
- **HTML5/CSS3**：页面布局和样式
- **Jekyll**：静态网站生成

### 部署和自动化
- **GitHub Actions**：CI/CD自动化
- **GitHub Pages**：静态网站托管
- **Docker**：容器化部署（可选）

## 📁 项目结构

```
├── scripts/                          # Python脚本
│   ├── occultation_predict.py       # 掩星预报主程序
│   ├── Rx-YY_*.tle                  # TLE数据文件
│   └── requirements.txt             # Python依赖
├── assets/                          # 前端资源
│   ├── js/
│   │   └── occultation-visualization.js  # Cesium可视化
│   ├── traj/                        # 生成的轨迹数据
│   │   ├── occultation_events.json  # 掩星事件数据
│   │   └── satellite_orbits.json    # 卫星轨道数据
│   └── css/                         # 样式文件
├── .github/workflows/               # GitHub Actions
│   └── occultation_update.yml       # 自动更新工作流
├── _config.yml                      # Jekyll配置
├── _pages/                          # 静态页面
├── _posts/                          # 博客文章
├── _publications/                   # 学术论文
└── README.md                        # 项目说明
```

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 14+
- Git

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/mapoet/mapoet.github.io.git
cd mapoet.github.io
```

2. **安装Python依赖**
```bash
pip install -r scripts/requirements.txt
```

3. **运行掩星预报**
```bash
python scripts/occultation_predict.py
```

4. **启动本地服务器**
```bash
# 使用Python内置服务器
python -m http.server 8000

# 或使用Jekyll（需要Ruby环境）
bundle install
bundle exec jekyll serve
```

5. **访问系统**
打开浏览器访问 `http://localhost:8000`

## 🎮 使用指南

### 掩星可视化操作

#### 鼠标操作
- **拖拽**：旋转地球视角
- **滚轮**：缩放地球
- **双击**：定位到点击位置

#### 键盘快捷键
| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `F` | 全屏切换 | 进入/退出全屏模式 |
| `H` | 主页视角 | 回到默认地球视角 |
| `R` | 重置相机 | 重置相机位置 |
| `T` | 地形大气 | 切换地形大气显示 |
| `L` | 光照切换 | 切换光照效果 |
| `S` | 阴影切换 | 切换阴影效果 |
| `1` | 显示标签 | 显示所有事件标签 |
| `0` | 隐藏标签 | 隐藏所有事件标签 |
| `K` | 图例切换 | 显示/隐藏图例 |
| `D` | 昼夜测试 | 测试昼夜切换效果 |
| `I` | 高度信息 | 显示高度信息 |
| `W` | 时间暂停 | 暂停/恢复时间动画 |
| `A` | 调试模式 | 显示所有数据 |
| `ESC` | 退出全屏 | 退出全屏模式 |

### 数据格式

#### 掩星事件数据格式
```json
{
  "type": "iono|atm",
  "nav": "G01",
  "leo": "FY3E", 
  "time": "2025-07-19T04:50:07.515613+00:00",
  "points": [
    {
      "time": "2025-07-19T04:49:52.515613+00:00",
      "lon": -3.202627885840189,
      "lat": -4.075054119560208,
      "alt": -40.35875517386757,
      "elev": -28.393873308710752
    }
  ]
}
```

#### 卫星轨道数据格式
```json
{
  "metadata": {
    "start_time": "2025-07-19T01:50:07.515613+00:00",
    "end_time": "2025-07-19T07:50:07.515613+00:00",
    "time_step": 30,
    "total_satellites": 115,
    "nav_satellites": 105,
    "leo_satellites": 10
  },
  "satellites": {
    "G01": {
      "type": "GNSS",
      "positions": [
        {
          "time": "2025-07-19T01:50:07.515613+00:00",
          "lon": 120.5,
          "lat": 30.2,
          "alt": 20200.0
        }
      ]
    }
  }
}
```

## 🔧 技术细节

### ECI到ECEF转换改进

系统使用GAST（格林尼治视恒星时）进行高精度的ECI到ECEF坐标转换：

```python
def eci_to_ecef(eci_pos: np.ndarray, times: List[datetime]) -> np.ndarray:
    """使用GAST进行ECI->ECEF转换（考虑岁差、章动等效应）"""
    for i, r in enumerate(eci_pos):
        # 使用astropy计算GAST（格林尼治视恒星时）
        t = Time(times[i], scale='utc')
        gast = t.sidereal_time('apparent', 'greenwich')
        theta = gast.to(u.radian).value
        
        # 使用GAST进行坐标转换
        x_ecef = x * np.cos(theta) + y * np.sin(theta)
        y_ecef = -x * np.sin(theta) + y * np.cos(theta)
```

### 掩星事件标签格式

系统生成标准的掩星事件标签格式：

- **电离层掩星**：`ionPrf_leoName.year.ddd.hh.mm.gnssName_0001.0001_nc`
- **大气掩星**：`atmPrf_leoName.year.ddd.hh.mm.gnssName_0001.0001_nc`

示例：`ionPrf_C2E1.2024.364.00.01.R08_0001.0001_nc`

## 🤖 自动化部署

### GitHub Actions工作流

系统使用GitHub Actions自动更新掩星预报数据：

```yaml
name: 掩星预报自动更新
on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时运行一次
  push:
    paths:
      - scripts/occultation_predict.py
      - scripts/Rx-YY_*.tle
      - requirements.txt
```

### 自动更新流程

1. **定时触发**：每6小时自动运行
2. **依赖安装**：安装Python依赖包
3. **数据验证**：验证astropy库和GAST计算
4. **掩星预报**：运行预报脚本
5. **数据生成**：生成JSON格式的轨迹数据
6. **自动提交**：提交更新的数据文件

## 📊 性能指标

- **计算效率**：支持105个导航卫星 + 10个低轨卫星并行计算
- **数据量**：生成约7.7MB轨道数据和18.9MB掩星事件数据
- **精度提升**：ECI到ECEF转换精度提升约10km
- **响应时间**：3D可视化加载时间 < 3秒

## 🔬 学术应用

### 研究领域
- **GNSS掩星技术**：全球导航卫星系统掩星观测
- **大气探测**：利用掩星事件进行大气参数反演
- **电离层监测**：电离层电子密度廓线探测
- **气候变化**：长期掩星数据用于气候变化研究

### 技术贡献
- **高精度坐标转换**：改进的ECI到ECEF转换算法
- **实时预报系统**：基于TLE的实时掩星事件预报
- **可视化平台**：交互式3D掩星事件可视化
- **自动化流程**：端到端的自动化数据处理流程
## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进系统：

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- **Cesium.js**：提供优秀的3D地球可视化库
- **astropy**：提供精确的天文时间计算功能
- **SGP4**：提供可靠的卫星轨道传播算法
- **GitHub Actions**：提供强大的自动化部署平台

## 📞 联系方式

- **个人网站**：https://mapoet.github.io
- **GitHub**：https://github.com/mapoet

---

**项目维护者**：付乃锋 (Naifeng Fu)  
**最后更新**：2025年1月  
**版本**：v2.0.0
