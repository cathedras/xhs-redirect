import React from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RedirectPage from './pages/RedirectPage';
import QrGeneratorPage from './pages/QrGeneratorPage';
import QrScanPage from './pages/QrScanPage';
import LogoUploadPage from './pages/LogoUploadPage';
import WeappRedirectPage from './pages/WeappRedirectPage';

const pageLinks = [
  { label: '首页', to: '/' },
  { label: '二维码', to: '/qr/' },
  { label: '扫描', to: '/scan/' },
  { label: 'Logo', to: '/logo/' },
];

export default function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="返回首页">
          <span className="brand-mark">📕</span>
          <span>
            <strong>xhs-redirect</strong>
            <small>Geo文章二维码转换</small>
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
