# GitHub Actions 工作流说明

## 掩星预报数据更新工作流

### 文件位置
- 工作流文件：`.github/workflows/occultation_update.yml`
- 依赖文件：`requirements.txt`

### 功能说明

这个工作流会自动每隔两小时运行一次 `scripts/occultation_predict.py` 脚本，生成最新的掩星预报数据。

#### 触发条件
1. **定时触发**：每隔两小时自动运行（cron: "0 */2 * * *"）
2. **手动触发**：在 GitHub Actions 页面手动触发
3. **代码推送**：当 `occultation_predict.py` 或 TLE 文件更新时触发

#### 执行步骤
1. **环境准备**
   - 拉取代码仓库
   - 设置 Python 3.10 环境
   - 安装系统依赖（gcc, g++, libproj-dev 等）
   - 安装 Python 依赖（numpy, sgp4, pyproj, scipy）

2. **文件检查**
   - 验证 `occultation_predict.py` 脚本存在
   - 检查 TLE 文件是否存在
   - 创建输出目录

3. **数据生成**
   - 运行掩星预报脚本
   - 生成 `occultation_events.json` 和 `satellite_orbits.json`

4. **质量检查**
   - 验证输出文件是否存在
   - 检查文件大小和行数
   - 验证 JSON 格式正确性

5. **自动提交**
   - 将生成的文件提交到仓库
   - 推送更新到远程仓库

### 输出文件

工作流会生成以下文件：
- `assets/traj/occultation_events.json`：掩星事件数据
- `assets/traj/satellite_orbits.json`：卫星轨道数据

### 依赖说明

#### 系统依赖
- `gcc`, `g++`：C/C++ 编译器
- `libproj-dev`：PROJ 库开发文件
- `proj-data`, `proj-bin`：PROJ 数据和工具
- `build-essential`：构建工具

#### Python 依赖
- `numpy>=1.21.0`：数值计算
- `scipy>=1.7.0`：科学计算
- `sgp4>=2.21`：卫星轨道计算
- `pyproj>=3.3.0`：坐标转换

### 监控和调试

#### 查看运行状态
1. 访问 GitHub 仓库的 Actions 页面
2. 查看 "掩星预报数据更新" 工作流
3. 点击具体的运行记录查看详细日志

#### 常见问题
1. **依赖安装失败**：检查网络连接和包版本兼容性
2. **脚本执行失败**：查看 Python 错误日志
3. **文件生成失败**：检查 TLE 文件格式和脚本逻辑
4. **提交失败**：检查 Git 权限和网络连接

#### 手动测试
可以在本地运行以下命令测试：
```bash
# 安装依赖
pip install -r requirements.txt

# 运行脚本
cd scripts
python occultation_predict.py
```

### 注意事项

1. **超时设置**：工作流设置了 30 分钟超时，避免长时间运行
2. **错误处理**：每个步骤都有详细的错误检查和日志输出
3. **文件验证**：生成的文件会进行格式验证
4. **自动提交**：只有文件有变更时才会提交，避免空提交

### 自定义配置

如需修改运行频率，可以调整 cron 表达式：
- 每小时：`"0 * * * *"`
- 每两小时：`"0 */2 * * *"`
- 每天：`"0 0 * * *"`
- 每周：`"0 0 * * 0"` 