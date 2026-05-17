import QRCode from 'qrcode';

export function usePageTitle(title) {
  // lightweight hook replacement (call inside components)
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

export function isWechat() {
  return typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);
}

export function isIOS() {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

export function isXiaohongshu() {
  return typeof navigator !== 'undefined' && (/xhs/i.test(navigator.userAgent) || /xiaohongshu/i.test(navigator.userAgent));
}

const CUSTOM_LOGO_STORAGE_KEY = 'xhs-custom-logo';

export function getStoredLogo() {
  try {
    return localStorage.getItem(CUSTOM_LOGO_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredLogo(value) {
  try {
    localStorage.setItem(CUSTOM_LOGO_STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStoredLogo() {
  try {
    localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function resolveXhsLink(shortUrl) {
  if (!shortUrl) return '';
  try {
    const response = await fetch(`/api/resolve?url=${encodeURIComponent(shortUrl)}`);
    const data = await response.json();
    if (data.success && data.realUrl) return data.realUrl;
  } catch {}
  return shortUrl;
}

export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = source;
  });
}

export async function writeText(text) {
  if (!navigator.clipboard) throw new Error('当前浏览器不支持剪贴板');
  await navigator.clipboard.writeText(text);
}

export async function renderQrToCanvas(canvas, text, logoSource) {
  await QRCode.toCanvas(canvas, text, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#111827', light: '#ffffff' },
  });

  if (!logoSource) return canvas.toDataURL('image/png');

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
  } catch {}

  return canvas.toDataURL('image/png');
}

export default {
  usePageTitle,
  isWechat,
  isIOS,
  isAndroid,
  isXiaohongshu,
  getStoredLogo,
  saveStoredLogo,
  removeStoredLogo,
  resolveXhsLink,
  loadImage,
  writeText,
  renderQrToCanvas,
};
