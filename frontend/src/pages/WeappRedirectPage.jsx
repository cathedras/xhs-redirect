import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePageTitle, resolveXhsLink, renderQrToCanvas, getStoredLogo, writeText, isWechat, isIOS, isAndroid } from '../utils';

const SAMPLE_URL = 'https://xhslink.com/m/AZybE6hgByh';

export default function WeappRedirectPage() {
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
      if (!active) return;
      setResolvedUrl(url);
      const canvas = document.createElement('canvas');
      void renderQrToCanvas(canvas, url, logoParam).then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      });
    });
    return () => { active = false; };
  }, [targetParam, logoParam]);

  const displayUrl = resolvedUrl || targetParam;

  async function handleCopy() {
    if (!displayUrl) return;
    try {
      await writeText(displayUrl);
      setCopyLabel('已复制');
      window.setTimeout(() => setCopyLabel('复制链接'), 1400);
    } catch {
      setMessage('复制失败，请手动复制显示的链接。');
    }
  }

  function handleOpen() {
    if (isWechat()) setMessage('微信内建议先点右上角“在浏览器打开”，再点击打开按钮。');
    if (isIOS()) window.location.href = 'xhsdiscover://';
    else if (isAndroid()) window.location.href = 'intent://xiaohongshu.com#Intent;package=com.xingin.xhs;scheme=xhs;end;';
    else window.location.href = 'xhs://';
    window.setTimeout(() => { window.location.href = displayUrl; }, 1800);
  }

  return (
    <main className="page-grid split-layout">
      <section className="hero-card action-card">
        <div className="eyebrow">微信小程序页</div>
        <h1>打开小红书</h1>
        <p className="hero-copy">这个页面适合在微信里分享，支持自定义 Logo、目标链接二维码和复制链接。</p>

        <div className="logo-badge">{logoParam ? <img src={logoParam} alt="自定义 Logo" /> : <span>📕</span>}</div>

        <div className="qr-preview-box">{qrDataUrl ? <img className="qr-image large" src={qrDataUrl} alt="目标链接二维码" /> : <div className="empty-preview">二维码生成中...</div>}</div>

        <div className="actions-row">
          <button className="primary-btn" type="button" onClick={handleOpen}>打开小红书</button>
          <button className="secondary-btn" type="button" onClick={handleCopy}>{copyLabel}</button>
        </div>

        <div className="tip-box"><strong>微信提示</strong><p>微信内如果无法直接唤起，请使用右上角菜单选择“在浏览器打开”。</p></div>
      </section>

      <aside className="side-stack">
        <section className="info-card"><div className="section-head compact"><h2>目标链接</h2></div><p className="break-all">{displayUrl || '等待解析结果'}</p></section>
        <section className="info-card"><div className="section-head compact"><h2>快捷入口</h2></div><div className="mini-links"><Link to="/logo/">Logo 页</Link><Link to="/qr/">二维码页</Link><Link to="/scan/">扫描页</Link></div></section>
      </aside>
    </main>
  );
}
