import React, { useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import FileUploadField from '../components/FileUploadField';
import { usePageTitle, writeText } from '../utils';

export default function QrScanPage() {
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
    if (!file) return;
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
        const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
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
      const qrDataUrl = await QRCode.toDataURL(generatedLink, { width: 240, margin: 1, errorCorrectionLevel: 'H' });
      try {
        await fetch('/api/qrcodecont', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: payload, siteLink: generatedLink, sourceName: previewLabel }) });
      } catch {}
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
    if (!siteLink) return;
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

        <canvas ref={canvasRef} className="hidden-canvas" width="1" height="1" aria-hidden="true" />
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
