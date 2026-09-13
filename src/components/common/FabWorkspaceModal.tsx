'use client';

/**
 * Thin wrapper around the Fab Film Stack Workspace panel. The heavy UI (film
 * stack physics, layer editor, fab session linked context) lives in
 * `FabWorkspacePanel.tsx`, which is code-split into its own chunk via
 * next/dynamic and only fetched when the modal is opened.
 */

import dynamic from 'next/dynamic';

interface FabWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FabWorkspacePanel = dynamic(() => import('./FabWorkspacePanel'), { ssr: false });

export default function FabWorkspaceModal({ isOpen, onClose }: FabWorkspaceModalProps) {
  if (!isOpen) return null;
  return <FabWorkspacePanel isOpen={isOpen} onClose={onClose} />;
}
export { FabWorkspaceModal };
