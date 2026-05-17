# 小红书短链跳转服务 - 任务总结

## 目标
实现一个服务，访问 `http://test.com?param=小红书短链` 时，能够解析短链并跳转到小红书 APP。

## 关键实现

### 1. 服务架构
```
用户访问 /redirect?param=短链
    ↓
服务端解析短链（跟随重定向）
    ↓
返回精美跳转页面
    ↓
用户点击"打开小红书 APP"
    ↓
唤起小红书 APP 或跳转浏览器
```

### 2. 核心文件

| 文件 | 说明 |
|------|------|
| `server.js` | Express 服务端，提供跳转页面和 API |
| `package.json` | Node.js 项目配置 |
| `index.html` | 纯前端版本（无需服务器） |
| `redirect.html` | 增强版前端页面 |
| `test.html` | 测试页面 |
| `README.md` | 使用文档 |

### 3. API 接口

- **GET /redirect?param=URL** - 跳转页面
- **GET /api/resolve?url=URL** - 解析短链 API
- **GET /health** - 健康检查

### 4. 短链解析结果

输入：`https://xhslink.com/m/AZybE6hgByh`

输出：
```json
{
  "success": true,
  "shortUrl": "https://xhslink.com/m/AZybE6hgByh",
  "realUrl": "https://www.xiaohongshu.com/miniapp/qrcode?background_transparent=true&disableNativeLoading=yes&fullscreen=true&i=6945577745f0d800019e4a33&k=16&s=SKB000003&p=pages%2Fcompose%2Findex%3FxhsMpBizQuery%3Dscene%253DSKB000003"
}
```

### 5. 部署方式

- **本地测试**：`npm install && npm start`
- **Vercel 部署**：`vercel --prod`
- **Docker 部署**：提供 Dockerfile

## 使用示例

```
http://localhost:3000/redirect?param=https://xhslink.com/m/AZybE6hgByh
```

## 注意事项

1. 需要安装小红书 APP 才能唤起
2. iOS 和 Android 使用不同的唤起方式
3. 微信内需要「在浏览器打开」
4. 短链解析使用 fetch 跟随重定向

## 文件位置

所有文件位于：`/Users/chenpeng/.qclaw/workspace/xhs-redirect/`
