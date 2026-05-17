import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FileUploadField from '../components/FileUploadField';
import { usePageTitle, getStoredLogo, saveStoredLogo, removeStoredLogo } from '../utils';

export default function LogoUploadPage() {
  usePageTitle('上传 Logo');
  const [selectedLogo, setSelectedLogo] = useState(getStoredLogo());
  const [logoFileName, setLogoFileName] = useState(getStoredLogo() ? '已读取本站保存的 Logo' : '未选择任何文件');
  const [label, setLabel] = useState(getStoredLogo() ? '已恢复本站保存的 Logo' : '尚未选择图片');
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState(getStoredLogo() ? '已读取本地保存的 Logo。' : '上传一张图片后点击保存，即可让跳转页复用这个 Logo。');

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
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
