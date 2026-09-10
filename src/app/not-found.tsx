import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="prose-page">
      <p className="eyebrow">404</p>
      <h1>This page is not part of SemiTools</h1>
      <p>
        The address you followed does not match any tool. Tools live under <code>/tools/&lt;tool-name&gt;</code> — the toolbox
        page lists every one of them.
      </p>
      <p>
        <Link className="button primary" href="/tools">
          Browse all tools <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}
