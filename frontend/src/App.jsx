import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const SAMPLE_URL = 'https://xhslink.com/m/AZybE6hgByh';
const CUSTOM_LOGO_STORAGE_KEY = 'xhs-custom-logo';

const quickLinks = [
  {
    title: '首页快链',
    description: '默认访问的入口页，集中管理各页面链接。',
    to: '/',
    badge: 'index',
    accent: '#ff2442',
  },
  {
    title: '小红书跳转页',
    description: '输入 param 参数后，尝试唤起小红书并回退到原始链接。',
    to: `/redirect?param=${encodeURIComponent(SAMPLE_URL)}`,
    badge: 'redirect',
    accent: '#ff6b7a',
  },
  {
    title: '二维码生成页',
    description: '把链接生成可下载的二维码，支持叠加 Logo。',
    to: '/qr/',
    badge: 'qr',
    accent: '#5b7cfa',
  },
  {
    title: '二维码扫描页',
    description: '上传二维码图片，识别内容后生成本站参数链接。',
    to: '/scan/',
    badge: 'scan',
    accent: '#0ea5e9',
  },
  {
    title: 'Logo 上传页',
    description: '保存一个本站 Logo，供跳转页和小程序页复用。',
    to: '/logo/',
    badge: 'logo',
    accent: '#f59e0b',
  },
  {
    title: '短链解析接口',
    description: '直接查看短链解析结果，便于调试。',
    to: `/api/resolve?url=${encodeURIComponent(SAMPLE_URL)}`,
    badge: 'api',
    accent: '#a855f7',
    external: true,
  },
];

const pageLinks = [
  { label: '首页', to: '/' },
  { label: '跳转页', to: `/redirect/?param=${encodeURIComponent(SAMPLE_URL)}` },
  { label: '二维码', to: '/qr/' },
  { label: '扫描', to: '/scan/' },
  { label: 'Logo', to: '/logo/' },
];

function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function isWechat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isXiaohongshu() {
  return /xhs/i.test(navigator.userAgent) || /xiaohongshu/i.test(navigator.userAgent);
}

function getStoredLogo() {
  try {
    return localStorage.getItem(CUSTOM_LOGO_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveStoredLogo(value) {
  try {
    localStorage.setItem(CUSTOM_LOGO_STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

function removeStoredLogo() {
  try {
    localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

async function resolveXhsLink(shortUrl) {
  if (!shortUrl) {
    return '';
  }

  try {
    const response = await fetch(`/api/resolve?url=${encodeURIComponent(shortUrl)}`);
    const data = await response.json();

    if (data.success && data.realUrl) {
      return data.realUrl;
    }
  } catch {
    // keep original url
  }

  return shortUrl;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = source;
  });
}

async function writeText(text) {
  if (!navigator.clipboard) {
    throw new Error('当前浏览器不支持剪贴板');
  }

  await navigator.clipboard.writeText(text);
}

async function renderQrToCanvas(canvas, text, logoSource) {
  await QRCode.toCanvas(canvas, text, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  });

  if (!logoSource) {
    return canvas.toDataURL('image/png');
  }

  try {
    const image = await loadImage(logoSource);
    const context = canvas.getContext('2d');

    if (context) {
      const logoSize = Math.round(canvas.width * 0.2);
      const x = Math.round((canvas.width - logoSize) / 2);
      const y = Math.round((canvas.height - logoSize) / 2);

      context.fillStyle = '#ffffff';
      context.fillRect(x - 10, y - 10, logoSize + 20, logoSize + 20);
      context.drawImage(image, x, y, logoSize, logoSize);
    }
  } catch {
    // If a remote logo cannot be drawn because of CORS or image errors,
    // keep the QR code itself usable.
  }

  return canvas.toDataURL('image/png');
}

function FileUploadField({ id, label, fileName, placeholder = '未选择任何文件', onChange }) {
  return (
    <div className="field upload-field">
      <span>{label}</span>
      <div className="upload-control">
        <input id={id} className="upload-input" type="file" accept="image/*" onChange={onChange} />
        <label className="upload-button" htmlFor={id}>
          选择文件
        </label>
        <span className={`upload-filename ${fileName ? '' : 'is-empty'}`}>{fileName || placeholder}</span>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="返回首页">
          <span className="brand-mark">📕</span>
          <span>
            <strong>xhs-redirect</strong>
            <small>React + Express</small>
          </span>
        </Link>

        <nav className="topnav" aria-label="页面导航">
          {pageLinks.map((item) => (
            <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/redirect/*" element={<RedirectPage />} />
        <Route path="/qr/*" element={<QrGeneratorPage />} />
        <Route path="/scan/*" element={<QrScanPage />} />
        <Route path="/logo/*" element={<LogoUploadPage />} />
        <Route path="/weapp/*" element={<WeappRedirectPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </div>
  );
}

function HomePage() {
  usePageTitle('index 快链');
  const [siteLinks, setSiteLinks] = useState([]);
  const [siteLinksStatus, setSiteLinksStatus] = useState('正在加载本站可访问的链接地址...');

  useEffect(() => {
    let active = true;

    fetch('/api/site-links')
      .then((response) => response.json())
      .then((data) => {
        if (!active) {
          return;
        }

        if (data.success && Array.isArray(data.links)) {
          setSiteLinks(data.links);
          setSiteLinksStatus('');
        } else {
          setSiteLinksStatus('暂时无法读取本站链接地址。');
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setSiteLinksStatus('暂时无法读取本站链接地址。');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-grid">
      <section className="hero-card">
        <div className="eyebrow">默认访问 index 快链</div>
        <h1>页面访问入口</h1>
        <p className="hero-copy">
          这个项目现在已经改成 React 前端 + Express 后端的结构。首页只负责导航，各页面直接打开就能用，部署后访问根路径会优先看到这个快链页。
        </p>

        <div className="hero-stats">
          <span>前端：`frontend/`</span>
          <span>后端：`backend/`</span>
          <span>部署：`npm start` / Vercel</span>
        </div>
      </section>

      <section className="content-card">
        <div className="section-head">
          <h2>常用页面</h2>
          <p>点击即可进入对应功能页或接口。</p>
        </div>

        <div className="link-grid">
          {quickLinks.map((item) => {
            const card = (
              <article className="link-card" style={{ '--accent': item.accent }}>
                <div className="link-card-top">
                  <span className="badge">{item.badge}</span>
                  <span className="chevron">↗</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="link-path">{item.to}</span>
              </article>
            );

            if (item.external) {
              return (
                <a key={item.to} href={item.to} className="card-link" target="_blank" rel="noreferrer">
                  {card}
                </a>
              );
            }

            return (
              <Link key={item.to} to={item.to} className="card-link">
                {card}
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="side-stack">
        <section className="content-card site-links-card">
          <div className="section-head">
            <h2>本站可访问的链接地址</h2>
            <p>接口会自动返回当前环境下的完整访问地址，便于复制和分享。</p>
          </div>

          {siteLinksStatus ? <div className="status-box">{siteLinksStatus}</div> : null}

          <div className="site-links-grid">
            {siteLinks.map((item) => (
              <article key={item.path} className="site-link-item">
                <div className="site-link-head">
                  <div>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="site-link-badge">{item.path}</span>
                </div>
                <a href={item.url} target={item.url.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">
                  {item.url}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>部署说明</h2>
          </div>
          <p>
            生产环境只需要 `npm install` 后执行 `npm start`，后端会先构建前端，再挂起 Express 服务。Vercel 也会走同样的前端构建流程。
          </p>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>默认入口</h2>
          </div>
          <p>根路径 `/` 就是这个 index 快链页，适合作为分享入口和导航首页。</p>
        </section>
      </aside>
    </main>
  );
}

function RedirectPage() {
  usePageTitle('打开小红书');

  const [searchParams] = useSearchParams();
  const targetParam = searchParams.get('param') || '';
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [loading, setLoading] = useState(Boolean(targetParam));
  const [error, setError] = useState('');
  const [copyLabel, setCopyLabel] = useState('复制链接');

  useEffect(() => {
    let active = true;

    if (!targetParam) {
      setError('请先提供 param 参数，例如 /redirect?param=https://xhslink.com/m/AZybE6hgByh');
      setLoading(false);
      return undefined;
    }

    setError('');
    setLoading(true);

    void resolveXhsLink(targetParam).then((url) => {
      if (!active) {
        return;
      }

      setResolvedUrl(url);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [targetParam]);

  const displayUrl = resolvedUrl || targetParam;

  async function handleCopy() {
    if (!displayUrl) {
      return;
    }

    try {
      await writeText(displayUrl);
      setCopyLabel('已复制');
      window.setTimeout(() => setCopyLabel('复制链接'), 1400);
    } catch {
      setError('复制失败，请手动复制下方链接。');
    }
  }

  function handleOpenApp() {
    if (!displayUrl) {
      setError('请先提供有效链接参数。');
      return;
    }

    if (isWechat()) {
      setError('微信内请使用右上角“在浏览器打开”，或先复制链接后在浏览器中打开。');
    }

    if (isIOS()) {
      window.location.href = 'xhsdiscover://';
    } else if (isAndroid()) {
      window.location.href = 'intent://xiaohongshu.com#Intent;package=com.xingin.xhs;scheme=xhs;end;';
    } else {
      window.location.href = 'xhs://';
    }

    window.setTimeout(() => {
      window.location.href = displayUrl;
    }, 1800);
  }

  function handleOpenInBrowser() {
    if (!displayUrl) {
      return;
    }

    window.open(displayUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="page-grid split-layout">
      <section className="hero-card action-card">
        <div className="eyebrow">跳转页</div>
        <h1>打开小红书</h1>
        <p className="hero-copy">输入一个短链参数后，这个页面会先解析真实地址，再提供唤起 APP、在浏览器打开和复制链接三种操作。</p>

        <div className="value-box">
          <span className="label">目标链接</span>
          <span className="value">{targetParam || '未提供参数'}</span>
        </div>

        <div className="actions-row">
          <button className="primary-btn" type="button" onClick={handleOpenApp} disabled={loading || !targetParam}>
            {loading ? '解析中...' : '打开小红书 APP'}
          </button>
          <button className="secondary-btn" type="button" onClick={handleOpenInBrowser} disabled={!displayUrl}>
            在浏览器中打开
          </button>
          <button className="ghost-btn" type="button" onClick={handleCopy} disabled={!displayUrl}>
            {copyLabel}
          </button>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="tip-box">
          <strong>提示</strong>
          <p>如果在微信内打开，建议先点击右上角菜单，再选择“在浏览器打开”。</p>
        </div>
      </section>

      <aside className="side-stack">
        <section className="info-card">
          <div className="section-head compact">
            <h2>当前解析结果</h2>
          </div>
          <p className="break-all">{displayUrl || '等待解析结果'}</p>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>快捷入口</h2>
          </div>
          <div className="mini-links">
            <Link to="/qr/">二维码页</Link>
            <Link to="/scan/">扫描页</Link>
            <Link to="/logo/">Logo 页</Link>
          </div>
        </section>
      </aside>
    </main>
  );
}

function QrGeneratorPage() {
  usePageTitle('二维码生成器');

  const canvasRef = useRef(null);
  const [sourceUrl, setSourceUrl] = useState(SAMPLE_URL);
  const [logoSource, setLogoSource] = useState(getStoredLogo());
  const [logoInput, setLogoInput] = useState('');
  const [logoFileName, setLogoFileName] = useState(getStoredLogo() ? '已读取本站保存的 Logo' : '未选择任何文件');
  const [logoLabel, setLogoLabel] = useState(getStoredLogo() ? '已读取本站保存的 Logo' : '未设置 Logo');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [status, setStatus] = useState('输入链接后点击生成，即可得到二维码。');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoPreview, setLogoPreview] = useState(getStoredLogo());

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = String(loadEvent.target?.result || '');
      setLogoInput('');
      setLogoFileName(`${file.name} · ${Math.round(file.size / 1024)} KB`);
      setLogoSource(dataUrl);
      setLogoPreview(dataUrl);
      setLogoLabel(`${file.name} · ${Math.round(file.size / 1024)} KB`);
    };
    reader.readAsDataURL(file);
  }

  function handleLogoInputChange(event) {
    const value = event.target.value;
    const trimmedValue = value.trim();

    setLogoInput(value);

    if (trimmedValue) {
      setLogoSource(trimmedValue);
      setLogoPreview(trimmedValue);
      setLogoLabel('已使用图片地址');
      return;
    }

    const storedLogo = getStoredLogo();
    setLogoSource(storedLogo);
    setLogoPreview(storedLogo);
    setLogoLabel(storedLogo ? '已读取本站保存的 Logo' : '未设置 Logo');
  }

  async function handleGenerate() {
    if (!sourceUrl.trim()) {
      setStatus('请输入一个跳转链接。');
      return;
    }

    setIsGenerating(true);
    setStatus('正在生成二维码...');

    try {
      const resolvedUrl = await resolveXhsLink(sourceUrl.trim());
      const canvas = canvasRef.current;

      if (!canvas) {
        throw new Error('二维码画布未准备好');
      }

      const dataUrl = await renderQrToCanvas(canvas, resolvedUrl, logoSource);
      setResultUrl(resolvedUrl);
      setDownloadUrl(dataUrl);
      setStatus(`二维码已生成，内容为 ${resolvedUrl}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '二维码生成失败');
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    void handleGenerate();
  }, []);

  return (
    <main className="page-grid split-layout">
      <section className="content-card form-card">
        <div className="section-head">
          <h2>二维码生成</h2>
          <p>支持短链解析、Logo 叠加和二维码下载。</p>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>跳转链接</span>
            <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="输入 xhslink 或本站 redirect 链接" />
          </label>

          <label className="field">
            <span>Logo 图片地址</span>
            <input value={logoInput} onChange={handleLogoInputChange} placeholder="可粘贴 data URL 或图片地址" />
          </label>

          <FileUploadField id="qr-logo-upload" label="上传 Logo" fileName={logoFileName} onChange={handleFileChange} />
        </div>

        <div className="actions-row">
          <button className="primary-btn" type="button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? '生成中...' : '生成二维码'}
          </button>
          <a className={`secondary-btn ${downloadUrl ? '' : 'disabled'}`} href={downloadUrl || '#'} download="qrcode.png" onClick={(event) => (!downloadUrl ? event.preventDefault() : undefined)}>
            下载二维码
          </a>
        </div>

        <div className="preview-block">
          <div className="preview-box qr-preview">
            <canvas ref={canvasRef} width="320" height="320" aria-label="二维码画布" />
          </div>
          <div className="status-box">{logoLabel}</div>
          <div className="status-box">{status}</div>
        </div>
      </section>

      <aside className="side-stack">
        <section className="info-card">
          <div className="section-head compact">
            <h2>当前内容</h2>
          </div>
          <p className="break-all">{resultUrl || '等待生成'}</p>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>Logo 预览</h2>
          </div>
          {logoPreview ? <img className="logo-preview-image" src={logoPreview} alt="Logo 预览" /> : <p>尚未设置 Logo。</p>}
        </section>
      </aside>
    </main>
  );
}

function QrScanPage() {
  usePageTitle('二维码扫描器');

  const canvasRef = useRef(null);
  const [previewSource, setPreviewSource] = useState('');
  const [previewLabel, setPreviewLabel] = useState('尚未选择图片');
  const [qrFileName, setQrFileName] = useState('未选择任何文件');
  const [decodedPayload, setDecodedPayload] = useState('');
  const [siteLink, setSiteLink] = useState('');
  const [siteQrUrl, setSiteQrUrl] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('上传一张二维码图片，识别后会自动生成本站参数链接。');
  const [copyLabel, setCopyLabel] = useState('复制本站链接');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = String(loadEvent.target?.result || '');
      setPreviewSource(dataUrl);
      setQrFileName(`${file.name} · ${Math.round(file.size / 1024)} KB`);
      setPreviewLabel(`${file.name} · ${Math.round(file.size / 1024)} KB`);
      setStatus('图片已加载，点击识别即可。');
      setError('');
      setDecodedPayload('');
      setSiteLink('');
      setSiteQrUrl('');
    };
    reader.readAsDataURL(file);
  }

  function resetAll() {
    setPreviewSource('');
    setPreviewLabel('尚未选择图片');
    setQrFileName('未选择任何文件');
    setDecodedPayload('');
    setSiteLink('');
    setSiteQrUrl('');
    setError('');
    setStatus('上传一张二维码图片，识别后会自动生成本站参数链接。');
    setCopyLabel('复制本站链接');
    if (canvasRef.current) {
      canvasRef.current.width = 1;
      canvasRef.current.height = 1;
    }
  }

  function decodeQrFromImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;

        if (!canvas) {
          reject(new Error('识别画布未准备好'));
          return;
        }

        const maxEdge = 1600;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          reject(new Error('无法创建识别上下文'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (!result || !result.data) {
          reject(new Error('未识别到二维码内容，请换一张更清晰的图片。'));
          return;
        }

        resolve(result.data);
      };

      image.onerror = () => reject(new Error('图片加载失败，请重新选择文件。'));
      image.src = source;
    });
  }

  async function handleScan() {
    if (!previewSource) {
      setError('请先上传二维码图片。');
      return;
    }

    setStatus('正在识别二维码...');
    setError('');

    try {
      const payload = await decodeQrFromImage(previewSource);
      const generatedLink = `${window.location.origin}/redirect?param=${encodeURIComponent(payload)}`;
      const qrDataUrl = await QRCode.toDataURL(generatedLink, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: 'H',
      });

      try {
        await fetch('/api/qrcodecont', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: payload,
            siteLink: generatedLink,
            sourceName: previewLabel,
          }),
        });
      } catch {
        // ignore save errors and still show the generated link
      }

      setDecodedPayload(payload);
      setSiteLink(generatedLink);
      setSiteQrUrl(qrDataUrl);
      setStatus('识别成功，已生成本站参数链接，并尝试保存到 qrcodecont.json。');
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : '识别失败，请检查图片是否包含二维码。');
      setStatus('识别失败。');
      setDecodedPayload('');
      setSiteLink('');
      setSiteQrUrl('');
    }
  }

  async function handleCopyLink() {
    if (!siteLink) {
      return;
    }

    try {
      await writeText(siteLink);
      setCopyLabel('已复制');
      window.setTimeout(() => setCopyLabel('复制本站链接'), 1400);
    } catch {
      setError('复制失败，请手动复制本站链接。');
    }
  }

  return (
    <main className="page-grid split-layout">
      <section className="content-card form-card">
        <div className="section-head">
          <h2>二维码扫描</h2>
          <p>上传二维码图片后，会自动识别内容并生成本站的 redirect 参数链接。</p>
        </div>

        <div className="field-grid">
          <FileUploadField id="qr-scan-upload" label="上传二维码图片" fileName={qrFileName} onChange={handleFileChange} />
        </div>

        <div className="actions-row">
          <button className="primary-btn" type="button" onClick={handleScan} disabled={!previewSource}>
            识别二维码并生成本站参数
          </button>
          <button className="secondary-btn" type="button" onClick={handleCopyLink} disabled={!siteLink}>
            {copyLabel}
          </button>
          <button className="ghost-btn" type="button" onClick={resetAll}>
            重新上传
          </button>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="preview-block">
          {previewSource ? <img className="image-preview" src={previewSource} alt="二维码图片预览" /> : null}
          <div className="status-box">{previewLabel}</div>
          <div className="status-box">{status}</div>
        </div>
      </section>

      <aside className="side-stack">
        <section className="info-card">
          <div className="section-head compact">
            <h2>识别结果</h2>
          </div>
          <p className="break-all">{decodedPayload || '等待识别结果'}</p>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>本站链接</h2>
          </div>
          <p className="break-all">{siteLink || '识别成功后会显示 /redirect?param=... 链接。'}</p>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>参数二维码</h2>
          </div>
          {siteQrUrl ? <img className="qr-image" src={siteQrUrl} alt="本站参数二维码" /> : <p>识别成功后会生成二维码。</p>}
        </section>
      </aside>
    </main>
  );
}

function LogoUploadPage() {
  usePageTitle('上传 Logo');

  const [selectedLogo, setSelectedLogo] = useState(getStoredLogo());
  const [logoFileName, setLogoFileName] = useState(getStoredLogo() ? '已读取本站保存的 Logo' : '未选择任何文件');
  const [label, setLabel] = useState(getStoredLogo() ? '已恢复本站保存的 Logo' : '尚未选择图片');
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState(getStoredLogo() ? '已读取本地保存的 Logo。' : '上传一张图片后点击保存，即可让跳转页复用这个 Logo。');

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = String(loadEvent.target?.result || '');
      setSelectedLogo(dataUrl);
      setLogoFileName(`${file.name} · ${Math.round(file.size / 1024)} KB`);
      setLabel(`${file.name} · ${Math.round(file.size / 1024)} KB`);
      setStatus('图片已加载，点击保存后会写入本站存储。');
    };
    reader.readAsDataURL(file);
  }

  function handleUrlChange(event) {
    const value = event.target.value.trim();
    setUrlInput(value);

    if (value) {
      setSelectedLogo(value);
      setLabel('已填写图片地址');
    }
  }

  function handleSave() {
    if (!selectedLogo) {
      setStatus('请先上传图片或填写图片地址。');
      return;
    }

    if (saveStoredLogo(selectedLogo)) {
      setStatus('Logo 已保存到本站。打开 /weapp/ 或 /redirect/ 时可以继续使用。');
    } else {
      setStatus('保存失败，浏览器可能禁止了本站存储。');
    }
  }

  function handleClear() {
    removeStoredLogo();
    setSelectedLogo('');
    setUrlInput('');
    setLabel('尚未选择图片');
    setStatus('本站 Logo 已清除。');
  }

  return (
    <main className="page-grid split-layout">
      <section className="content-card form-card">
        <div className="section-head">
          <h2>上传 Logo</h2>
          <p>Logo 会保存到当前浏览器的本站存储中，跳转页和微信页会自动读取。</p>
        </div>

        <div className="field-grid">
          <FileUploadField id="logo-upload" label="本地图片" fileName={logoFileName} onChange={handleFileChange} />

          <label className="field">
            <span>图片地址</span>
            <input value={urlInput} onChange={handleUrlChange} placeholder="https://example.com/logo.png" />
          </label>
        </div>

        <div className="actions-row">
          <button className="primary-btn" type="button" onClick={handleSave}>
            保存到本站
          </button>
          <Link className="secondary-btn" to="/weapp/">
            打开跳转页
          </Link>
          <button className="ghost-btn" type="button" onClick={handleClear}>
            清除本站 Logo
          </button>
        </div>

        <div className="preview-block">
          {selectedLogo ? <img className="logo-preview-image" src={selectedLogo} alt="Logo 预览" /> : <div className="empty-preview">尚未选择图片</div>}
          <div className="status-box">{label}</div>
          <div className="status-box">{status}</div>
        </div>
      </section>

      <aside className="side-stack">
        <section className="info-card">
          <div className="section-head compact">
            <h2>使用说明</h2>
          </div>
          <p>上传后点击保存，本站存储会记住这个 Logo。后面的二维码生成页、微信页都可以复用。</p>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>快捷入口</h2>
          </div>
          <div className="mini-links">
            <Link to="/weapp/">微信页</Link>
            <Link to="/qr/">二维码页</Link>
            <Link to="/scan/">扫描页</Link>
          </div>
        </section>
      </aside>
    </main>
  );
}

function WeappRedirectPage() {
  usePageTitle('微信小程序跳转页');

  const [searchParams] = useSearchParams();
  const targetParam = searchParams.get('param') || SAMPLE_URL;
  const logoParam = searchParams.get('logo') || getStoredLogo();
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [message, setMessage] = useState('点击按钮即可尝试打开小红书。');
  const [copyLabel, setCopyLabel] = useState('复制链接');

  useEffect(() => {
    let active = true;

    void resolveXhsLink(targetParam).then((url) => {
      if (!active) {
        return;
      }

      setResolvedUrl(url);

      const canvas = document.createElement('canvas');

      void renderQrToCanvas(canvas, url, logoParam).then((dataUrl) => {
        if (active) {
          setQrDataUrl(dataUrl);
        }
      });
    });

    return () => {
      active = false;
    };
  }, [targetParam, logoParam]);

  const displayUrl = resolvedUrl || targetParam;

  async function handleCopy() {
    if (!displayUrl) {
      return;
    }

    try {
      await writeText(displayUrl);
      setCopyLabel('已复制');
      window.setTimeout(() => setCopyLabel('复制链接'), 1400);
    } catch {
      setMessage('复制失败，请手动复制显示的链接。');
    }
  }

  function handleOpen() {
    if (isWechat()) {
      setMessage('微信内建议先点右上角“在浏览器打开”，再点击打开按钮。');
    }

    if (isIOS()) {
      window.location.href = 'xhsdiscover://';
    } else if (isAndroid()) {
      window.location.href = 'intent://xiaohongshu.com#Intent;package=com.xingin.xhs;scheme=xhs;end;';
    } else {
      window.location.href = 'xhs://';
    }

    window.setTimeout(() => {
      window.location.href = displayUrl;
    }, 1800);
  }

  return (
    <main className="page-grid split-layout">
      <section className="hero-card action-card">
        <div className="eyebrow">微信小程序页</div>
        <h1>打开小红书</h1>
        <p className="hero-copy">这个页面适合在微信里分享，支持自定义 Logo、目标链接二维码和复制链接。</p>

        <div className="logo-badge">
          {logoParam ? <img src={logoParam} alt="自定义 Logo" /> : <span>📕</span>}
        </div>

        <div className="qr-preview-box">
          {qrDataUrl ? <img className="qr-image large" src={qrDataUrl} alt="目标链接二维码" /> : <div className="empty-preview">二维码生成中...</div>}
        </div>

        <div className="actions-row">
          <button className="primary-btn" type="button" onClick={handleOpen}>
            打开小红书
          </button>
          <button className="secondary-btn" type="button" onClick={handleCopy}>
            {copyLabel}
          </button>
        </div>

        <div className="tip-box">
          <strong>微信提示</strong>
          <p>微信内如果无法直接唤起，请使用右上角菜单选择“在浏览器打开”。</p>
        </div>
      </section>

      <aside className="side-stack">
        <section className="info-card">
          <div className="section-head compact">
            <h2>目标链接</h2>
          </div>
          <p className="break-all">{displayUrl || '等待解析结果'}</p>
        </section>

        <section className="info-card">
          <div className="section-head compact">
            <h2>快捷入口</h2>
          </div>
          <div className="mini-links">
            <Link to="/logo/">Logo 页</Link>
            <Link to="/qr/">二维码页</Link>
            <Link to="/scan/">扫描页</Link>
          </div>
        </section>
      </aside>
    </main>
  );
}

export default App;