'use client';
import { useState } from 'react';
import { Check, Link2, Printer } from 'lucide-react';
import EngineeringTravelerModal from '@/components/common/EngineeringTravelerModal';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';

export default function ToolPageActions({ toolName }: { toolName: string }) {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();
  const t = getTranslation(locale);
  const shareLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  };

  const printReport = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="tool-actions-bar">
      <button
        type="button"
        className="button secondary tool-action-btn"
        onClick={shareLink}
        title={t.shareCalculation}
      >
        {copied ? (
          <>
            <Check size={14} aria-hidden="true" color="var(--teal)" />
            <span>{t.linkCopied}</span>
          </>
        ) : (
          <>
            <Link2 size={14} aria-hidden="true" />
            <span>{t.shareCalculation}</span>
          </>
        )}
      </button>

      <button
        type="button"
        className="button secondary tool-action-btn"
        onClick={printReport}
        title={t.printPdfReport}
      >
        <Printer size={14} aria-hidden="true" />
        <span>{t.printPdfReport}</span>
      </button>

      <EngineeringTravelerModal toolName={toolName} />
    </div>
  );
}
