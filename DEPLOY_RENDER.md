# Render + GitHub Pages 部署说明

## 1. 部署后端到 Render
1. 打开 Render -> New -> Blueprint。
2. 选择 GitHub 仓库：`norahyyw223-netizen/dog-breeds-science-site`。
3. Render 会读取 `render.yaml`，创建 `dog-breeds-api` 服务。
4. 首次部署完成后，记下后端地址，例如：
   `https://dog-breeds-api.onrender.com`
5. 打开：
   `https://dog-breeds-api.onrender.com/api/health`
   返回 `{"ok":true}` 表示后端成功。

## 2. 前端改为公网 API
1. 编辑仓库中的 `api-config.js`：

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://dog-breeds-api.onrender.com"
};
```

2. 提交并推送到 GitHub：

```bash
git add api-config.js
git commit -m "chore: use render api base url"
git push
```

## 3. 部署前端到 GitHub Pages
1. GitHub 仓库 -> Settings -> Pages。
2. Source 选 `Deploy from a branch`。
3. Branch 选 `main`，Folder 选 `/ (root)`。
4. 访问：
   `https://norahyyw223-netizen.github.io/dog-breeds-science-site/`

## 4. 验证落表
在网页提交建议后，Render 日志中会看到 `POST /api/suggestions 201`。
数据库文件位置：`/var/data/suggestions.db`（Render 持久化磁盘）。
