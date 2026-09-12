'use client';

import { useState } from 'react';
import { Check, Link2, Printer } from 'lucide-react';

export default function ToolPageActions({ toolName }: { toolName: string }) {
  const [copied, setCopied] = useState(false);

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
        title={`Copy direct link to this ${toolName} calculation`}
      >
        {copied ? (
          <>
            <Check size={14} aria-hidden="true" color="var(--teal)" />
            <span>Link copied</span>
          </>
        ) : (
          <>
            <Link2 size={14} aria-hidden="true" />
            <span>Share calculation</span>
          </>
        )}
      </button>

      <button
        type="button"
        className="button secondary tool-action-btn"
        onClick={printReport}
        title="Print or export engineering calculation report as PDF"
      >
        <Printer size={14} aria-hidden="true" />
        <span>Print / PDF Report</span>
      </button>
    </div>
  );
}
