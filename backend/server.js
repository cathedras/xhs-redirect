const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const os = require('os');

// Data directory for QR content. Can be overridden by QR_DATA_DIR env.
const defaultDataDir = process.env.QR_DATA_DIR || path.join(__dirname, '../data');
try {
  if (!fs.existsSync(defaultDataDir)) {
    fs.mkdirSync(defaultDataDir, { recursive: true });
  }
} catch (e) {
  console.warn('无法创建数据目录', defaultDataDir, e && e.message);
}

const defaultQrPath = path.join(defaultDataDir, 'qrcodecont.json');
const qrDataFilePath = process.env.QR_DATA_PATH || defaultQrPath;

// Serve data directory as static under /data
app.use('/data', express.static(defaultDataDir));

app.use(express.json());
app.set('trust proxy', true);

const canonicalPagePaths = new Set(['/redirect', '/qr', '/scan', '/logo', '/weapp']);

function shouldServeSpaFallback(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }

  if (req.path.startsWith('/api/')) {
    return false;
  }

  if (req.path.startsWith('/assets/')) {
    return false;
  }

  if (path.extname(req.path)) {
    return false;
  }

  const acceptHeader = req.headers.accept || '';
  const isCanonicalPageRoute = canonicalPagePaths.has(req.path) || canonicalPagePaths.has(req.path.replace(/\/$/, ''));

  return acceptHeader.includes('text/html') || req.path === '/' || isCanonicalPageRoute;
}

app.use((req, res, next) => {
  if (!canonicalPagePaths.has(req.path)) {
    return next();
  }

  return res.redirect(302, `${req.path}/${req.url.slice(req.path.length)}`);
});

app.use(express.static(frontendDistPath));

function readQrData() {
  try {
    const candidates = [process.env.QR_DATA_PATH, qrDataFilePath, path.join(os.tmpdir(), 'xhs-qrcodecont.json')].filter(Boolean);

    let raw = null;
    let parsed = null;

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          raw = fs.readFileSync(p, 'utf8');
          parsed = JSON.parse(raw);
          break;
        }
      } catch (e) {
        console.error('读取候选 qrcodecont 路径失败:', p, e && e.message);
      }
    }

    if (!parsed) {
      return { updatedAt: null, items: [] };
    }

    return {
      updatedAt: parsed.updatedAt || null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (error) {
    console.error('读取 qrcodecont.json 失败:', error);
    return { updatedAt: null, items: [] };
  }
}

function writeQrData(nextData) {
  try {
    const payload = {
      updatedAt: new Date().toISOString(),
      items: Array.isArray(nextData.items) ? nextData.items.slice(0, 100) : [],
    };
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;

    // Candidate primary paths: env override, project file
    const primaryCandidates = [process.env.QR_DATA_PATH, qrDataFilePath].filter(Boolean);

    // Try to find a writable candidate directory
    for (const candidate of primaryCandidates) {
      const dir = path.dirname(candidate);
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.accessSync(dir, fs.constants.W_OK);

        // Write atomically in this directory
        const tmpName = `.qrcodecont.${process.pid}.${Date.now()}.tmp`;
        const tmpPath = path.join(dir, tmpName);
        fs.writeFileSync(tmpPath, serialized, { encoding: 'utf8', mode: 0o644 });
        fs.renameSync(tmpPath, candidate);
        return payload;
      } catch (writeErr) {
        console.warn('无法在候选路径写入:', candidate, writeErr && writeErr.message);
        // try next candidate
      }
    }

    // If no candidate was writable, fall back to OS tempdir
    const fallbackPath = path.join(os.tmpdir(), 'xhs-qrcodecont.json');
    try {
      const fallbackTmp = `${fallbackPath}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(fallbackTmp, serialized, { encoding: 'utf8', mode: 0o644 });
      fs.renameSync(fallbackTmp, fallbackPath);
      payload._savePath = fallbackPath;
      console.warn('qrcodecont persisted to fallback path:', fallbackPath);
      return payload;
    } catch (fallbackErr) {
      console.error('fallback write also failed:', fallbackErr);
      throw fallbackErr;
    }
  } catch (err) {
    console.error('写入 qrcodecont.json 失败:', err);
    throw err;
  }
}

function getSiteBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');

  return `${proto}://${host}`;
}

function getSiteLinks(req) {
  const baseUrl = getSiteBaseUrl(req);

  return [
    {
      label: '首页快链',
      path: '/',
      url: `${baseUrl}/`,
      description: '站点首页，显示所有功能入口。',
    },
    {
      label: '小红书跳转页',
      path: '/redirect/',
      url: `${baseUrl}/redirect/?param=https://xhslink.com/m/AZybE6hgByh`,
      description: '默认跳转页，支持短链解析。',
    },
    {
      label: '二维码生成页',
      path: '/qr/',
      url: `${baseUrl}/qr/`,
      description: '生成并下载二维码。',
    },
    {
      label: '二维码扫描页',
      path: '/scan/',
      url: `${baseUrl}/scan/`,
      description: '上传二维码图片并生成本站参数链接。',
    },
    {
      label: 'Logo 上传页',
      path: '/logo/',
      url: `${baseUrl}/logo/`,
      description: '保存并复用 Logo。',
    },
    {
      label: '微信小程序页',
      path: '/weapp/',
      url: `${baseUrl}/weapp/`,
      description: '微信场景下的独立页面。',
    },
    {
      label: '短链解析接口',
      path: '/api/resolve',
      url: `${baseUrl}/api/resolve?url=https://xhslink.com/m/AZybE6hgByh`,
      description: '查看短链最终解析地址。',
    },
    {
      label: '二维码数据接口',
      path: '/api/qrcodecont',
      url: `${baseUrl}/api/qrcodecont`,
      description: '读取本地 qrcodecont.json。',
    },
  ];
}

async function resolveXhsLink(shortUrl) {
  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    return response.url || shortUrl;
  } catch (error) {
    console.error('解析短链失败:', error);
    return shortUrl;
  }
}

app.get('/api/resolve', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: '请提供 url 参数' });
  }

  try {
    const realUrl = await resolveXhsLink(url);

    return res.json({
      success: true,
      shortUrl: url,
      realUrl,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/site-links', (req, res) => {
  return res.json({
    success: true,
    updatedAt: new Date().toISOString(),
    links: getSiteLinks(req),
  });
});

app.get('/api/qrcodecont', (req, res) => {
  return res.json({
    success: true,
    ...readQrData(),
  });
});

app.post('/api/qrcodecont', (req, res) => {
  const { content, siteLink, sourceName } = req.body || {};

  if (!content || !siteLink) {
    return res.status(400).json({
      success: false,
      error: '请提供 content 和 siteLink',
    });
  }

  const current = readQrData();
  const nextItem = {
    content,
    siteLink,
    sourceName: sourceName || '',
    createdAt: new Date().toISOString(),
  };

  const remainingItems = current.items.filter((item) => item.content !== content || item.siteLink !== siteLink);
  try {
    const saved = writeQrData({
      ...current,
      items: [nextItem, ...remainingItems],
    });

    return res.json({
      success: true,
      item: nextItem,
      ...saved,
    });
  } catch (error) {
    console.error('POST /api/qrcodecont 保存失败:', error);
    return res.status(500).json({
      success: false,
      error: '保存二维码数据时发生错误',
      detail: (error && error.message) ? error.message : String(error),
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  if (!shouldServeSpaFallback(req)) {
    return next();
  }

  if (fs.existsSync(frontendIndexPath)) {
    return res.sendFile(frontendIndexPath);
  }

  return res.status(500).send('Frontend build not found. Run npm run build first.');
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
🚀 xhs-redirect React 服务已启动

访问地址:
  本地: http://localhost:${PORT}

默认首页:
  http://localhost:${PORT}/

示例跳转:
  http://localhost:${PORT}/redirect?param=https://xhslink.com/m/AZybE6hgByh

API 接口:
  GET /api/resolve?url=短链地址
  GET /api/site-links
  GET /api/qrcodecont
  POST /api/qrcodecont
  GET /health
    `);
  });
}