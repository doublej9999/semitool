import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Keyboard, Layers, MonitorSmartphone } from 'lucide-react';
import FavoritesSection from '@/components/tools/FavoritesSection';
import ToolCard from '@/components/tools/ToolCard';
import { tools, toolsByCategory } from '@/tools';
import { LENGTH_UNITS } from '@/lib/units';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const HOME_FAQ = [
  {
    question: 'Where does the calculation run?',
    answer:
      'Every calculator runs in your browser. Inputs are never posted to a server, which is why no account, cookie banner or database is needed.',
  },
  {
    question: 'Are these results fab standards?',
    answer:
      'No. Each tool documents its formula and assumptions and states plainly where a result is a generic estimate. Always verify against your own controlled process documentation before using a number in production.',
  },
  {
    question: 'Which units are used?',
    answer:
      'Every field carries its unit. Lengths can be entered in ångström, nanometres, micrometres, mils, millimetres, centimetres, inches or metres and are converted exactly, so a result cannot be misread. Pressure, gas flow and temperature have dedicated converters that state their reference conditions. Die counts are integers, and percentages are computed from the counts and shown with the exact denominator.',
  },
];

export default function HomePage() {
  const newTools = tools.filter((tool) => tool.isNew);

  return (
    <div className="page">
      <header className="page-hero">
        <p className="kicker">Semiconductor engineering tools</p>
        <h1>Wafer tools that show their work.</h1>
        <p className="lead">
          Wafer marks, gross die estimates, interactive wafer maps, yield, capability, throughput, cost, films, layout,
          lithography, etch, thin films, diffusion, power, RF, matching, yield and unit conversion:
          focused tools with explicit units, the formula on the page and no server round trip. Nothing is uploaded, and no
          result is dressed up as an industry standard it is not.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/tools">
            Open the toolbox <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link className="button secondary" href="/tools/wafer-die-calculator">
            Try the die calculator
          </Link>
        </div>
        <div className="hero-stats">
          <div>
            <strong>{tools.length}</strong>
            <span>tools</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>client-side</span>
          </div>
          <div>
            <strong>{LENGTH_UNITS.length}</strong>
            <span>length units, Å to m</span>
          </div>
          <div>
            <strong>0</strong>
            <span>logins required</span>
          </div>
        </div>
      </header>

      <section className="section" aria-labelledby="favorites-heading">
        <div className="section-head">
          <div>
            <h2 id="favorites-heading">Your favorites</h2>
            <p>Starred tools are stored in this browser only.</p>
          </div>
        </div>
        <FavoritesSection />
      </section>

      {newTools.length > 0 ? (
        <section className="section" aria-labelledby="new-heading">
          <div className="section-head">
            <div>
              <h2 id="new-heading">New in this release</h2>
              <p>The newest additions to the toolbox.</p>
            </div>
          </div>
          <div className="tool-grid">
            {newTools.map((tool) => (
              <ToolCard key={tool.path} path={tool.path} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="all-tools-heading">
        <div className="section-head">
          <div>
            <h2 id="all-tools-heading">All tools</h2>
            <p>Grouped by the part of the flow they support.</p>
          </div>
          <Link className="tool-card-cta" href="/tools">
            Toolbox view <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {toolsByCategory.map((group) => (
          <div className="category-section" key={group.name}>
            <h3>{group.name}</h3>
            <div className="tool-grid">
              {group.components.map((tool) => (
                <ToolCard key={tool.path} path={tool.path} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section" aria-labelledby="principles-heading">
        <div className="section-head">
          <div>
            <h2 id="principles-heading">How these tools are built</h2>
            <p>Three rules that decide what ships.</p>
          </div>
        </div>
        <div className="tool-grid">
          <article className="tool-card">
            <div className="tool-card-head">
              <span className="tool-card-icon">
                <Layers size={18} aria-hidden="true" />
              </span>
            </div>
            <h3>Units or it does not ship</h3>
            <p>
              Every input and output carries its unit — length, pressure, flow, temperature, percentage, die count — and a
              length can be typed in ångström through to metres, so a result cannot be misread by whoever picks it up next.
            </p>
          </article>
          <article className="tool-card">
            <div className="tool-card-head">
              <span className="tool-card-icon">
                <Keyboard size={18} aria-hidden="true" />
              </span>
            </div>
            <h3>Keyboard first</h3>
            <p>
              Press <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> to jump to any tool, arrow keys to move through results
              and Enter to open. Forms are labelled, focus-visible and screen-reader friendly.
            </p>
          </article>
          <article className="tool-card">
            <div className="tool-card-head">
              <span className="tool-card-icon">
                <MonitorSmartphone size={18} aria-hidden="true" />
              </span>
            </div>
            <h3>Readable on the line</h3>
            <p>
              Mobile-first layouts, no giant hero, no animation for its own sake. It works on a tablet held next to a
              tool and on a desktop used for review.
            </p>
          </article>
        </div>
      </section>

      <section className="section faq faq-max" aria-labelledby="home-faq-heading">
        <h2 id="home-faq-heading">Frequently asked</h2>
        {HOME_FAQ.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
