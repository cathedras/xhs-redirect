# 小红书短链跳转服务

将小红书短链转换为可跳转的页面，支持自动唤起小红书 APP。

## 快速开始

### 1. 安装依赖

```bash
cd xhs-redirect
npm install
```

### 2. 启动服务

```bash
npm start
```

服务将在 http://localhost:3000 启动

## 使用方法

### 方式 1：直接访问跳转页面

```
http://localhost:3000/redirect?param=https://xhslink.com/m/AZybE6hgByh
```

### 方式 2：使用 API 解析短链

```bash
curl "http://localhost:3000/api/resolve?url=https://xhslink.com/m/AZybE6hgByh"
```

返回：
```json
{
  "success": true,
  "shortUrl": "https://xhslink.com/m/AZybE6hgByh",
  "realUrl": "https://www.xiaohongshu.com/miniapp/qrcode?..."
}
```

## 部署到生产环境

### 使用 Vercel 部署（推荐）

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 部署
```bash
vercel --prod
```

### 使用 Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

构建并运行：
```bash
docker build -t xhs-redirect .
docker run -p 3000:3000 xhs-redirect
```

## 功能特性

- ✅ 解析小红书短链
- ✅ 自动唤起小红书 APP（iOS/Android）
- ✅ 微信内跳转提示
- ✅ 浏览器中打开选项
- ✅ RESTful API 接口

## 文件说明

| 文件 | 说明 |
|------|------|
| `server.js` | 服务端主程序 |
| `index.html` | 纯前端版本（无需服务器） |
| `redirect.html` | 增强版前端页面 |
| `package.json` | 项目配置 |

## 注意事项

1. 小红书 APP 需要安装才能唤起
2. iOS 和 Android 的唤起方式不同
3. 微信内需要使用「在浏览器打开」功能

## 自定义配置

修改 `server.js` 中的配置：

```javascript
const CONFIG = {
    // 小红书 APP 的 URL Scheme
    xhsScheme: 'xhs://',
    
    // Android Intent
    androidIntent: 'intent://xiaohongshu.com#Intent;package=com.xingin.xhs;scheme=xhs;end;',
    
    // 服务端口
    port: process.env.PORT || 3000
};
```
