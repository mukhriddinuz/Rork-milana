import { Platform } from 'react-native';

export function registerServiceWorker(): void {
  if (Platform.OS !== 'web') return;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.log('[PWA] Service worker registered:', registration.scope);

      registration.update().catch(() => {});

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version installed, activating...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    } catch (error) {
      console.log('[PWA] Service worker registration failed:', error);
    }
  });
}

export function injectManifestLink(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;

  const existing = document.querySelector('link[rel="manifest"]');
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/manifest.json';
  document.head.appendChild(link);

  const themeColor = document.createElement('meta');
  themeColor.name = 'theme-color';
  themeColor.content = '#CB11AB';
  document.head.appendChild(themeColor);

  const appleCapable = document.createElement('meta');
  appleCapable.name = 'apple-mobile-web-app-capable';
  appleCapable.content = 'yes';
  document.head.appendChild(appleCapable);

  const appleStatusBar = document.createElement('meta');
  appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
  appleStatusBar.content = 'default';
  document.head.appendChild(appleStatusBar);

  const appleTitle = document.createElement('meta');
  appleTitle.name = 'apple-mobile-web-app-title';
  appleTitle.content = 'Milana';
  document.head.appendChild(appleTitle);

  console.log('[PWA] Manifest and meta tags injected');
}
