'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { setThemeSetting, useThemeSetting, type ThemeSetting } from '@/lib/preferences';

const CYCLE_ORDER: ThemeSetting[] = ['light', 'dark', 'system'];

/**
 * Toolbar icon button cycling the color theme: light → dark → system.
 * Shows the icon for the CURRENT setting; the label comes from the i18n
 * dictionaries (themeLight / themeDark / themeSystem).
 */
export default function ThemeToggle() {
  const themeSetting = useThemeSetting();
  const locale = useLocale();
  const t = getTranslation(locale);

  const label =
    themeSetting === 'dark' ? t.themeDark : themeSetting === 'system' ? t.themeSystem : t.themeLight;

  const icon =
    themeSetting === 'dark' ? (
      <Moon size={18} aria-hidden="true" />
    ) : themeSetting === 'system' ? (
      <Monitor size={18} aria-hidden="true" />
    ) : (
      <Sun size={18} aria-hidden="true" />
    );

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = CYCLE_ORDER[(CYCLE_ORDER.indexOf(themeSetting) + 1) % CYCLE_ORDER.length];
        setThemeSetting(next);
      }}
    >
      {icon}
    </button>
  );
}
