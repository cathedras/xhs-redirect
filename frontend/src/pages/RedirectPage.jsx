import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePageTitle, resolveXhsLink, writeText, isWechat, isIOS, isAndroid } from '../utils';

export default function RedirectPage() {
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
      if (!active) return;
      setResolvedUrl(url);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [targetParam]);

  const displayUrl = resolvedUrl || targetParam;

  async function handleCopy() {
    if (!displayUrl) return;
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
    if (!displayUrl) return;
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
