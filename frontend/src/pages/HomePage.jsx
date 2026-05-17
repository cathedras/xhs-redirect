import React, { useEffect, useState } from 'react';
import { usePageTitle } from '../utils';

export default function HomePage() {
  usePageTitle('index 快链');
  const [scanHistory, setScanHistory] = useState([]);
  const [scanHistoryStatus, setScanHistoryStatus] = useState('正在加载历史扫码链接...');

  useEffect(() => {
    let active = true;

    fetch('/api/qrcodecont')
      .then((response) => response.json())
      .then((scanHistoryData) => {
        if (!active) return;
        if (scanHistoryData.success && Array.isArray(scanHistoryData.items)) {
          setScanHistory(scanHistoryData.items);
          setScanHistoryStatus('');
        } else {
          setScanHistoryStatus('暂时没有历史扫码记录。');
        }
      })
      .catch(() => {
        if (!active) return;
        setScanHistoryStatus('暂时无法读取历史扫码记录。');
      });

    return () => {
      active = false;
    };
  }, []);

  function formatTimestamp(value) {
    if (!value) return '未知时间';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未知时间';
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <main className="page-grid">
      <section className="hero-card">
        <div className="eyebrow">默认访问 index 快链</div>
        <h1>页面访问入口</h1>
        <p className="hero-copy">这个项目现在已经改成 React 前端 + Express 后端的结构。首页只负责导航，各页面直接打开就能用，部署后访问根路径会优先看到这个快链页。</p>

        <div className="hero-stats">
          <span>前端：`frontend/`</span>
          <span>后端：`backend/`</span>
          <span>部署：`npm start` / Vercel</span>
        </div>
      </section>

      <section className="content-card scan-history-card">
        <div className="section-head">
          <h2>历史扫码链接</h2>
          <p>这里会显示最近通过二维码扫描生成过的地址链接，点击即可直接打开。</p>
        </div>

        {scanHistoryStatus ? <div className="status-box">{scanHistoryStatus}</div> : null}

        <div className="history-list">
          {scanHistory.map((item) => (
            <article key={`${item.siteLink}-${item.createdAt}`} className="history-item">
              <div className="history-item-head">
                <div>
                  <h3>{item.sourceName || '扫描记录'}</h3>
                  <p>{item.content}</p>
                </div>
                <span className="history-item-badge">{formatTimestamp(item.createdAt)}</span>
              </div>

              <a className="history-item-link" href={item.siteLink} target="_blank" rel="noreferrer">
                {item.siteLink}
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
