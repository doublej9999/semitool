'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, DownloadCloud, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } catch {
      // Ignored
    }
  };

  return (
    <div
      className="pwa-status-container"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.78rem',
      }}
    >
      {/* Install Button if browser emits beforeinstallprompt */}
      {installPrompt && !isInstalled && (
        <button
          type="button"
          className="button secondary pwa-install-btn"
          onClick={handleInstallClick}
          title="Install SemiTools to desktop or mobile for offline cleanroom access"
          style={{
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            height: '28px',
            borderColor: 'var(--teal, #0d9488)',
            color: 'var(--teal, #0d9488)',
          }}
        >
          <DownloadCloud size={13} aria-hidden="true" />
          <span>Install PWA</span>
        </button>
      )}

      {/* Online / Offline status indicator */}
      {!isOnline ? (
        <div
          title="Offline cleanroom mode: SemiTools is cached and running entirely client-side"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            color: '#b45309',
            fontWeight: 500,
            fontSize: '0.72rem',
          }}
        >
          <WifiOff size={12} />
          <span>Offline</span>
        </div>
      ) : (
        <div
          title="SemiTools is offline-ready via client-side Service Worker cache"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(13, 148, 136, 0.08)',
            color: 'var(--teal, #0d9488)',
            fontWeight: 500,
            fontSize: '0.72rem',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
            }}
          />
          <span>Offline Ready</span>
        </div>
      )}
    </div>
  );
}
