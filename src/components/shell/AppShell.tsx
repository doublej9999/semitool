'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, GitFork, Keyboard, Layers } from 'lucide-react';
import CommandPalette from './CommandPalette';
import EngineeringHandbookModal from '@/components/common/EngineeringHandbookModal';
import FabScratchpadModal from '@/components/common/FabScratchpadModal';
import VirtualGenealogyModal from '@/components/common/VirtualGenealogyModal';
import FabWorkspaceModal from '@/components/common/FabWorkspaceModal';
import PwaStatusIndicator from '@/components/common/PwaStatusIndicator';
import LanguagePicker from './LanguagePicker';
import ToolSidebar from './ToolSidebar';
import { useHydrateLocale, useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { useHydrateFavorites } from '@/lib/favorites';
import { setRailCollapsed, useHydratePreferences, useRailCollapsed } from '@/lib/preferences';
import { REPO_URL, SITE_NAME } from '@/lib/site';

const GLOVE_MODE_STORAGE = 'semitools_glove_mode';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const railCollapsed = useRailCollapsed();
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const [gloveMode, setGloveMode] = useState<boolean>(false);
  const [genealogyOpen, setGenealogyOpen] = useState<boolean>(false);
  const [shortcutsHintOpen, setShortcutsHintOpen] = useState<boolean>(false);
  const [workspaceOpen, setWorkspaceOpen] = useState<boolean>(false);

  const drawerOpen = drawerPath === pathname;
  const locale = useLocale();
  const t = getTranslation(locale);

  useHydrateFavorites();
  useHydratePreferences();
  useHydrateLocale();

  // Initialize Glove Mode from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GLOVE_MODE_STORAGE);
      if (saved === 'true') {
        setGloveMode(true);
        document.body.classList.add('cleanroom-glove-mode');
      }
    }
  }, []);

  const toggleGloveMode = () => {
    const next = !gloveMode;
    setGloveMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GLOVE_MODE_STORAGE, String(next));
      if (next) {
        document.body.classList.add('cleanroom-glove-mode');
      } else {
        document.body.classList.remove('cleanroom-glove-mode');
      }
    }
  };

  // Global Cleanroom Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text inputs or textareas
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // '?' -> show fab shortcuts help modal
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsHintOpen((prev) => !prev);
      }

      // 'Ctrl+H' or 'Cmd+H' -> trigger handbook button
      if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        const handbookBtn = document.querySelector('button[title*="Handbook"], button[title*="手册"]') as HTMLButtonElement | null;
        if (handbookBtn) handbookBtn.click();
      }

      // 'Ctrl+T' or 'Cmd+T' -> trigger traveler run-card
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const travelerBtn = document.querySelector('button[title*="Traveler"], button[title*="随工单"]') as HTMLButtonElement | null;
        if (travelerBtn) travelerBtn.click();
      }

      // 'Ctrl+S' or 'Cmd+S' -> trigger scratchpad or save
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        const scratchpadBtn = document.querySelector('button[title*="Scratchpad"], button[title*="草稿本"]') as HTMLButtonElement | null;
        if (scratchpadBtn) scratchpadBtn.click();
      }

      // 'Ctrl+G' or 'Cmd+G' -> toggle genealogy
      if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setGenealogyOpen((prev) => !prev);
      }

      // 'Ctrl+W' or 'Cmd+W' -> toggle fab workspace
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        setWorkspaceOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }
  }, []);

  const shellClass = ['app-shell', railCollapsed ? 'is-rail-collapsed' : '', drawerOpen ? 'is-drawer-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <a className="skip-link" href="#main-content">
        {t.skipToContent}
      </a>

      <aside className="app-sider" id="tool-navigation" aria-label="Tool navigation">
        <ToolSidebar onNavigate={() => setDrawerPath(null)} />
      </aside>

      <div className="app-main">
        <header className="app-toolbar">
          <button
            type="button"
            className="icon-button drawer-toggle"
            aria-label={drawerOpen ? t.closeToolMenu : t.openToolMenu}
            aria-expanded={drawerOpen}
            aria-controls="tool-navigation"
            onClick={() => setDrawerPath(drawerOpen ? null : pathname)}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="icon-button rail-toggle"
            aria-label={railCollapsed ? t.showToolMenu : t.hideToolMenu}
            aria-expanded={!railCollapsed}
            aria-controls="tool-navigation"
            onClick={() => setRailCollapsed(!railCollapsed)}
          >
            {railCollapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
          </button>

          <Link className="icon-button" href="/" aria-label={`${SITE_NAME} ${t.homeTitle}`}>
            <Home size={18} aria-hidden="true" />
          </Link>

          <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Cleanroom Glove-Friendly Mode Toggle */}
            <button
              type="button"
              className="icon-button"
              onClick={toggleGloveMode}
              aria-label={t.cleanroomMode}
              title={`${t.cleanroomMode} (${gloveMode ? (locale === 'zh-TW' ? '已開啟' : locale === 'zh-CN' ? '已开启' : locale === 'ja' ? 'オン' : locale === 'ko' ? '켜짐' : 'ON') : (locale === 'zh-TW' ? '已關閉' : locale === 'zh-CN' ? '已关闭' : locale === 'ja' ? 'オフ' : locale === 'ko' ? '꺼짐' : 'OFF')})`}
              style={{
                color: gloveMode ? '#ffffff' : 'var(--ink-soft)',
                backgroundColor: gloveMode ? 'var(--teal, #0d7c82)' : 'transparent',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={18} />
            </button>

            {/* Virtual Lot Genealogy Button */}
            <button
              type="button"
              className="icon-button"
              onClick={() => setGenealogyOpen(true)}
              aria-label={`${t.genealogyTitle} (Ctrl+G)`}
              title={`${t.genealogyTitle} (Ctrl+G)`}
            >
              <GitFork size={18} />
            </button>

            {/* Film Stack & Fab Project Workspace */}
            <button
              type="button"
              className="icon-button"
              onClick={() => setWorkspaceOpen(true)}
              aria-label={`${t.workspaceTitle} (Ctrl+W)`}
              title={`${t.workspaceTitle} (Ctrl+W)`}
            >
              <Layers size={18} />
            </button>

            {/* Global Shortcuts Help Button */}
            <button
              type="button"
              className="icon-button"
              onClick={() => setShortcutsHintOpen((prev) => !prev)}
              aria-label={`${t.shortcutsGuide} (?)`}
              title={`${t.shortcutsGuide} (?)`}
            >
              <Keyboard size={17} />
            </button>

            <EngineeringHandbookModal />
            <FabScratchpadModal />
            <PwaStatusIndicator />
            <CommandPalette />
            <LanguagePicker />
          </div>
        </header>

        <main id="main-content" className="app-view">
          {children}
        </main>

        <footer className="app-footer">
          <div>
            <Link href="/tools">{t.toolbox}</Link>
            <Link href="/about">{t.about}</Link>
            <Link href="/privacy">{t.cmdPrivacy}</Link>
            <Link href="/contact">{t.contact}</Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
          <p>
            {SITE_NAME} — {t.footerTagline}
          </p>
        </footer>
      </div>

      {drawerOpen ? (
        <button type="button" className="app-scrim" aria-label={t.closeToolMenu} onClick={() => setDrawerPath(null)} />
      ) : null}

      {/* Lot Genealogy Modal */}
      <VirtualGenealogyModal
        isOpen={genealogyOpen}
        onClose={() => setGenealogyOpen(false)}
      />

      {/* Fab Film Stack Workspace Modal */}
      <FabWorkspaceModal
        isOpen={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
      />

      {/* Cleanroom Keyboard Shortcuts Dialog */}
      {shortcutsHintOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShortcutsHintOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--card, #ffffff)',
              borderRadius: '10px',
              padding: '1.4rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink, #0f172a)' }}>
                {t.shortcutsGuide}
              </div>
              <button
                onClick={() => setShortcutsHintOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--ink-soft)' }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-soft, #475569)' }}>{locale === 'zh-TW' ? '開啟晶圓製造工程手冊' : locale === 'zh-CN' ? '打开晶圆制造工程手册' : locale === 'ja' ? '半導体エンジニアリングハンドブック' : locale === 'ko' ? '엔지니어링 핸드북 열기' : 'Engineering Handbook'}:</span>
                <kbd style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--paper, #f1f5f9)', border: '1px solid var(--line, #cbd5e1)', fontWeight: 600 }}>Ctrl + H</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-soft, #475569)' }}>{locale === 'zh-TW' ? '開啟車間隨工單 / 列印' : locale === 'zh-CN' ? '开启车间随工单 / 打印' : locale === 'ja' ? '工程ランカード・トラベラー / 印刷' : locale === 'ko' ? '런카드 트래블러 열기 / 인쇄' : 'Engineering Run-Card Traveler'}:</span>
                <kbd style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--paper, #f1f5f9)', border: '1px solid var(--line, #cbd5e1)', fontWeight: 600 }}>Ctrl + T</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-soft, #475569)' }}>{locale === 'zh-TW' ? '晶圓批次譜系與分批圖' : locale === 'zh-CN' ? '晶圆批次谱系与分批图' : locale === 'ja' ? 'ロット系譜・スプリット管理' : locale === 'ko' ? '로트 계보 및 분기 맵' : 'Lot Split Genealogy'}:</span>
                <kbd style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--paper, #f1f5f9)', border: '1px solid var(--line, #cbd5e1)', fontWeight: 600 }}>Ctrl + G</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-soft, #475569)' }}>{locale === 'zh-TW' ? '膜層堆疊與晶圓翹曲工作區' : locale === 'zh-CN' ? '膜层堆叠与晶圆翘曲工作区' : locale === 'ja' ? '薄膜積層＆ウェーハ反りワークスペース' : locale === 'ko' ? '박막 스택 및 팹 작업 공간' : 'Film Stack & Warp Workspace'}:</span>
                <kbd style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--paper, #f1f5f9)', border: '1px solid var(--line, #cbd5e1)', fontWeight: 600 }}>Ctrl + W</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-soft, #475569)' }}>{locale === 'zh-TW' ? '快捷工藝草稿本 / 備忘' : locale === 'zh-CN' ? '快捷工艺草稿本 / 备忘' : locale === 'ja' ? 'ファブ簡易メモ・スクラッチパッド' : locale === 'ko' ? '팹 스크래치패드 메모' : 'Fab Scratchpad'}:</span>
                <kbd style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--paper, #f1f5f9)', border: '1px solid var(--line, #cbd5e1)', fontWeight: 600 }}>Ctrl + S</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-soft, #475569)' }}>{locale === 'zh-TW' ? '聚焦指令面板 / 工具搜尋' : locale === 'zh-CN' ? '聚焦指令调色板 / 工具搜索' : locale === 'ja' ? 'コマンドパレット / ツール検索' : locale === 'ko' ? '명령 팔레트 / 도구 검색' : 'Command Palette'}:</span>
                <kbd style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--paper, #f1f5f9)', border: '1px solid var(--line, #cbd5e1)', fontWeight: 600 }}>Ctrl + K</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-soft, #475569)' }}>{locale === 'zh-TW' ? '顯示本快捷鍵說明' : locale === 'zh-CN' ? '显示本快捷键帮助' : locale === 'ja' ? 'ショートカット一覧を表示' : locale === 'ko' ? '단축키 가이드 보기' : 'Show Shortcuts'}:</span>
                <kbd style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--paper, #f1f5f9)', border: '1px solid var(--line, #cbd5e1)', fontWeight: 600 }}>?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
