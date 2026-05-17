/**
 * 小红书短链跳转服务
 * 
 * 使用方法:
 * 1. 访问 /redirect?param=小红书短链URL
 * 2. 页面会自动解析并尝试跳转小红书
 * 
 * 示例:
 * http://localhost:3000/redirect?param=https://xhslink.com/m/AZybE6hgByh
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));



// 解析小红书短链
async function resolveXhsLink(shortUrl) {
    try {
        // 使用 fetch 跟随重定向
        const response = await fetch(shortUrl, {
            method: 'GET',
            redirect: 'follow'
        });
        
        // 返回最终 URL
        return response.url || shortUrl;
    } catch (error) {
        console.error('解析短链失败:', error);
        return shortUrl;
    }
}

// 跳转页面
app.get('/redirect', async (req, res) => {
    const paramUrl = req.query.param;
    
    if (!paramUrl) {
        return res.status(400).send(`
            <h1>参数错误</h1>
            <p>请提供 param 参数，例如：</p>
            <code>/redirect?param=https://xhslink.com/m/AZybE6hgByh</code>
        `);
    }
    
    // 解析短链获取真实地址
    const realUrl = await resolveXhsLink(paramUrl);
    
    // 返回跳转页面
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>打开小红书</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ff2442 0%, #ff6b7a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ff2442, #ff6b7a);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
        }
        h1 { font-size: 24px; color: #333; margin-bottom: 8px; }
        .desc { color: #999; font-size: 14px; margin-bottom: 30px; }
        .url-box {
            background: #f8f8f8;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #666;
            word-break: break-all;
            text-align: left;
        }
        .url-box .label { font-size: 12px; color: #999; margin-bottom: 4px; }
        .btn {
            display: block;
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #ff2442, #ff6b7a);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            margin-bottom: 12px;
        }
        .btn:active { transform: scale(0.98); opacity: 0.9; }
        .btn-outline {
            background: transparent;
            border: 1px solid #ddd;
            color: #666;
        }
        .tips {
            margin-top: 20px;
            padding: 12px;
            background: #fff5f5;
            border-radius: 8px;
            font-size: 12px;
            color: #888;
            line-height: 1.6;
        }
        .loading {
            display: none;
        }
        .loading.active {
            display: block;
        }
        .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #ff2442;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">📕</div>
        <h1>小红书</h1>
        <p class="desc">发现真实、向上、多元的世界</p>
        
        <div class="url-box">
            <div class="label">目标链接：</div>
            <div>${displayUrl}</div>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p style="color: #999; font-size: 14px;">正在跳转...</p>
        </div>
        
        <button class="btn" id="btnOpen" onclick="openApp()">
            打开小红书 APP
        </button>
        
        <button class="btn btn-outline" onclick="openInBrowser()">
            在浏览器中打开
        </button>
        
        <div class="tips">
            💡 如果无法自动打开，请确保已安装小红书 APP，或选择在浏览器中打开
        </div>
    </div>

    <script>
        // 判断环境
        function isWechat() {
            return /MicroMessenger/i.test(navigator.userAgent);
        }
        
        function isIOS() {
            return /iPhone|iPad|iPod/i.test(navigator.userAgent);
        }
        
        function isAndroid() {
            return /Android/i.test(navigator.userAgent);
        }
        
        // 目标链接（解析后的真实 URL）
        const targetUrl = '${realUrl}';
        const shortUrl = '${decodeURIComponent(paramUrl)}';
        
        // 打开 APP
        function openApp() {
            const loading = document.getElementById('loading');
            const btn = document.getElementById('btnOpen');
            
            loading.classList.add('active');
            btn.style.display = 'none';
            
            // 尝试打开小红书 APP
            if (isIOS()) {
                // iOS URL Scheme
                window.location.href = 'xhs://';
            } else if (isAndroid()) {
                // Android Intent
                window.location.href = 'intent://xiaohongshu.com#Intent;package=com.xingin.xhs;scheme=xhs;end;';
            } else {
                // 其他平台
                window.location.href = 'xhs://';
            }
            
            // 延迟后跳转原链接
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 2000);
        }
        
        // 在浏览器中打开
        function openInBrowser() {
            window.open(targetUrl, '_blank');
        }
        
        // 如果在微信内，显示提示
        if (isWechat()) {
            document.querySelector('.tips').innerHTML = 
                '💡 在微信内请点击右上角「在浏览器打开」以获得最佳体验';
        }
        
        // 自动尝试打开（可选）
        // setTimeout(openApp, 1000);
    </script>
</body>
</html>
    `);
});

// API 接口：解析短链
app.get('/api/resolve', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: '请提供 url 参数' });
    }
    
    try {
        const realUrl = await resolveXhsLink(url);
        res.json({
            success: true,
            shortUrl: url,
            realUrl: realUrl
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vercel 无服务器适配 - 导出 app
module.exports = app;

// 本地开发时启动服务器
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
🚀 小红书短链跳转服务已启动

访问地址:
  本地: http://localhost:${PORT}
  
使用示例:
  http://localhost:${PORT}/redirect?param=https://xhslink.com/m/AZybE6hgByh
  
API 接口:
  GET /api/resolve?url=短链地址
  GET /health
        `);
    });
}
