import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FileUploadField from '../components/FileUploadField';
import { usePageTitle, getStoredLogo, resolveXhsLink, renderQrToCanvas } from '../utils';

const SAMPLE_URL = 'https://xhslink.com/m/AZybE6hgByh';

export default function QrGeneratorPage() {
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
    if (!file) return;
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
      if (!canvas) throw new Error('二维码画布未准备好');
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
