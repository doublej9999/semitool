'use client';

import { useState, useEffect } from 'react';
import { WifiOff, DownloadCloud, RefreshCw } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  // The storage-estimate value is tracked for future display; only the setter
  // is consumed by the effect below, so the value slot is intentionally elided.
  const [, setCacheSizeMb] = useState<number | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const locale = useLocale();
  const t = getTranslation(locale);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Deferred out of the effect body (react-hooks/set-state-in-effect)
    queueMicrotask(() => setIsOnline(navigator.onLine));

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

    // ServiceWorker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setHasUpdate(true);
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setHasUpdate(true);
              }
            });
          }
        });
      });
    }

    // Storage estimate
    if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.usage) {
          setCacheSizeMb(Math.round((est.usage / (1024 * 1024)) * 10) / 10);
        }
      }).catch(() => {});
    }

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
  const handleUpdateClick = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
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
          title={t.installPwaTitle}
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
          <span>{t.installPwa}</span>
        </button>
      )}
      {/* Update Prompt if Service Worker detected a new version */}
      {hasUpdate && (
        <button
          type="button"
          className="button primary pwa-update-btn"
          onClick={handleUpdateClick}
          title="A new version of SemiTools is ready. Click to reload and apply."
          style={{
            padding: '0.25rem 0.6rem',
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            height: '28px',
            backgroundColor: 'var(--amber, #d97706)',
            borderColor: 'var(--amber, #d97706)',
            color: '#ffffff',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={12} className="spin-slow" />
          <span>Update Ready</span>
        </button>
      )}

      {/* Online / Offline status indicator */}
      {!isOnline ? (
        <div
          title={t.offlineTooltip}
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
          <span>{t.offlineStatus}</span>
        </div>
      ) : (
        <div
          title={t.onlineReadyTooltip}
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
          <span>{t.offlineReady}</span>
        </div>
      )}
    </div>
  );
}
