# Vercel 部署指南

## 方法 1：使用 Git 部署（推荐）

### 步骤 1：创建 GitHub/GitLab 仓库

1. 访问 https://github.com/new
2. 创建新仓库（如 `xhs-redirect`）
3. **不要**初始化 README

### 步骤 2：推送代码

```bash
cd /Users/chenpeng/.qclaw/workspace/xhs-redirect

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/xhs-redirect.git

# 推送代码
git push -u origin master
```

### 步骤 3：在 Vercel 部署

1. 访问 https://vercel.com/new
2. 使用 GitHub 登录
3. 导入 `xhs-redirect` 仓库
4. 点击 **Deploy**
5. 等待部署完成（约 1-2 分钟）

### 步骤 4：获取域名

部署完成后，Vercel 会提供类似 `xhs-redirect-xxx.vercel.app` 的域名。

## 方法 2：使用 Vercel CLI 部署

### 安装 CLI

```bash
npm install -g vercel
```

### 登录并部署

```bash
cd /Users/chenpeng/.qclaw/workspace/xhs-redirect

# 登录（浏览器会打开授权页面）
vercel login

# 部署
vercel --prod
```

按照提示操作：
- Set up and deploy? **Y**
- Which scope? 选择你的账号
- Link to existing project? **N**
- What's your project name? **xhs-redirect**

## 部署后的使用

### 跳转页面

```
https://你的域名.vercel.app/redirect?param=https://xhslink.com/m/AZybE6hgByh
```

### API 接口

```bash
curl "https://你的域名.vercel.app/api/resolve?url=https://xhslink.com/m/AZybE6hgByh"
```

## 自定义域名（可选）

1. 在 Vercel 控制台进入项目设置
2. 点击 **Domains**
3. 添加你的域名（如 `redirect.yourdomain.com`）
4. 按照提示配置 DNS

## 常见问题

### 1. 部署失败

检查 `vercel.json` 配置是否正确：
```json
{
  "version": 2,
  "builds": [{"src": "server.js", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "server.js"}]
}
```

### 2. 环境变量

如需设置环境变量，在 Vercel 控制台：
Settings → Environment Variables → Add New

### 3. 日志查看

在 Vercel 控制台查看部署日志：
Deployments → 选择部署 → Functions → 查看日志

## 文件说明

| 文件 | 说明 |
|------|------|
| `server.js` | 主服务文件 |
| `vercel.json` | Vercel 配置文件 |
| `package.json` | 依赖配置 |
| `.gitignore` | Git 忽略文件 |

## 技术支持

- Vercel 文档：https://vercel.com/docs
- 项目仓库：https://github.com/browser-use/browser-use
