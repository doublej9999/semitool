'use client';

/**
 * Thin wrapper around the Virtual Lot Genealogy panel. The heavy UI (branch
 * selector, step timeline, split dialog, MES export) lives in
 * `VirtualGenealogyPanel.tsx`, which is code-split into its own chunk via
 * next/dynamic and only fetched when the modal is opened.
 */

import dynamic from 'next/dynamic';

interface VirtualGenealogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentToolName?: string;
  currentToolPath?: string;
}

const VirtualGenealogyPanel = dynamic(() => import('./VirtualGenealogyPanel'), { ssr: false });

export function VirtualGenealogyModal({
  isOpen,
  onClose,
  currentToolName,
  currentToolPath,
}: VirtualGenealogyModalProps) {
  if (!isOpen) return null;
  return (
    <VirtualGenealogyPanel
      isOpen={isOpen}
      onClose={onClose}
      currentToolName={currentToolName}
      currentToolPath={currentToolPath}
    />
  );
}
export default VirtualGenealogyModal;
