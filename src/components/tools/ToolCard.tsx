'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { getTool } from '@/tools';

/**
 * Tool card used on the home page, the toolbox page and the related-tool list.
 *
 * It takes a `path` instead of a tool object on purpose: the registry entries
 * carry a lucide icon component, and functions cannot cross a server -> client
 * boundary. The card resolves the entry itself, so server components can render
 * it while only serializable props travel over the wire.
 *
 * The whole card is a link; the favorite toggle is a nested button that stops
 * event propagation so it never triggers navigation.
 */
export default function ToolCard({ path }: { path: string }) {
  const tool = getTool(path);

  if (!tool) {
    return null;
  }

  const Icon = tool.icon;

  return (
    <article className="tool-card">
      <div className="tool-card-head">
        <span className="tool-card-icon" aria-hidden="true">
          <Icon size={19} />
        </span>

        <span className="tool-card-actions">
          {tool.isNew ? <span className="badge-new">New</span> : null}
          <FavoriteButton tool={tool} compact />
        </span>
      </div>

      <h3>
        <Link href={tool.path} className="tool-card-link">
          {tool.name}
        </Link>
      </h3>

      <p>{tool.description}</p>

      <div className="tool-card-foot">
        <span className="tool-card-category">{tool.category}</span>
        <Link href={tool.path} className="tool-card-cta" aria-label={`Open ${tool.name}`}>
          Open tool <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
