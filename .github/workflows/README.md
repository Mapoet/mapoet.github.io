# GitHub Actions 工作流说明

## Deploy GitHub Pages（`.github/workflows/pages.yml`）

**主部署流程**：在 CI 中生成 traj JSON → Jekyll 构建 → 通过 artifact 部署到 GitHub Pages。  
JSON **不提交**到 Git 仓库（仍由 `.gitignore` 排除），但会出现在线上 `/assets/traj/`。

### 首次启用

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**（不要选 “Deploy from a branch”）
3. 推送本仓库或手动运行 **Deploy GitHub Pages** 工作流

### 触发条件

| 触发 | 行为 |
|------|------|
| 推送到 `master` / `main` | 构建并部署；若 TLE/脚本未变则复用缓存的 JSON |
| 定时 `0 */6 * * *` | 每 6 小时重新生成 JSON 并部署 |
| `workflow_dispatch` | 手动部署；可勾选 **force_regenerate** 强制重算 JSON |

### 执行步骤

1. 安装 Python / Ruby 依赖
2. 运行 `scripts/occultation_predict.py`（按需）
3. 写入 `assets/traj/manifest.json`
4. `bundle exec jekyll build` → `_site/assets/traj/*.json`
5. `upload-pages-artifact` + `deploy-pages`

### 前端数据路径

可视化脚本使用同源路径（无 CORS）：

```javascript
const DATA_BASE = '/assets/traj';
```

---

## 掩星预报 Release 备份（`.github/workflows/occultation_update.yml`）

**可选**：手动生成 JSON 并上传到 Release `occultation-data-latest`，随后触发 Pages 重新部署。  
日常更新由 `pages.yml` 定时任务负责，一般无需运行本工作流。

---

## TLE 更新（`.github/workflows/fetch_gnssro_tle.yml`）

按原有逻辑更新 `assets/traj/Rx-GNSSRO.tle`；TLE 变更后 push 会触发 `pages.yml`，缓存失效并自动重算 JSON。

---

## 本地开发

```bash
pip install -r requirements.txt
cd scripts && python occultation_predict.py
python scripts/generate_traj_manifest.py
bundle exec jekyll serve
```

本地需先生成 `assets/traj/*.json`，可视化页面才能加载数据。
