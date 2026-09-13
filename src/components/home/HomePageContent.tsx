'use client';

import Link from 'next/link';
import { ArrowRight, Keyboard, Layers, MonitorSmartphone } from 'lucide-react';
import FavoritesSection from '@/components/tools/FavoritesSection';
import ToolFinder from '@/components/home/ToolFinder';
import ToolCard from '@/components/tools/ToolCard';
import { tools, toolsByCategory } from '@/tools';
import { LENGTH_UNITS } from '@/lib/units';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation, translateCategory } from '@/lib/i18n/translations';

export default function HomePageContent() {
  const locale = useLocale();
  const t = getTranslation(locale);
  const newTools = tools.filter((tool) => tool.isNew);

  const homeFaq = [
    { question: t.homeFaq1Q, answer: t.homeFaq1A },
    { question: t.homeFaq2Q, answer: t.homeFaq2A },
    { question: t.homeFaq3Q, answer: t.homeFaq3A },
  ];

  return (
    <div className="page">
      <header className="page-hero">
        <p className="kicker">{t.heroKicker}</p>
        <h1>{t.heroTitle}</h1>
        <p className="lead">{t.heroLead}</p>
        <div className="hero-actions">
          <Link className="button primary" href="/tools">
            {t.openToolbox} <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link className="button secondary" href="/tools/wafer-die-calculator">
            {t.tryDieCalc}
          </Link>
        </div>
        <div className="hero-stats">
          <div>
            <strong>{tools.length}</strong>
            <span>{t.statTools}</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>{t.statClientSide}</span>
          </div>
          <div>
            <strong>{LENGTH_UNITS.length}</strong>
            <span>{t.statLengthUnits}</span>
          </div>
          <div>
            <strong>0</strong>
            <span>{t.statZeroLogins}</span>
          </div>
        </div>
      </header>

      <ToolFinder />

      <section className="section" aria-labelledby="favorites-heading">
        <div className="section-head">
          <div>
            <h2 id="favorites-heading">{t.favoritesTitle}</h2>
            <p>{t.favoritesSubtitle}</p>
          </div>
        </div>
        <FavoritesSection />
      </section>

      {newTools.length > 0 ? (
        <section className="section" aria-labelledby="new-heading">
          <div className="section-head">
            <div>
              <h2 id="new-heading">{t.newToolsTitle}</h2>
              <p>{t.newToolsSubtitle}</p>
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
            <h2 id="all-tools-heading">{t.allToolsTitle}</h2>
            <p>{t.allToolsSubtitle}</p>
          </div>
          <Link className="tool-card-cta" href="/tools">
            {t.toolboxView} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {toolsByCategory.map((group) => (
          <div className="category-section" key={group.name}>
            <h3>{translateCategory(group.name, locale)}</h3>
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
            <h2 id="principles-heading">{t.principlesTitle}</h2>
            <p>{t.principlesSubtitle}</p>
          </div>
        </div>
        <div className="tool-grid">
          <article className="tool-card">
            <div className="tool-card-head">
              <span className="tool-card-icon">
                <Layers size={18} aria-hidden="true" />
              </span>
            </div>
            <h3>{t.principle1Title}</h3>
            <p>{t.principle1Desc}</p>
          </article>
          <article className="tool-card">
            <div className="tool-card-head">
              <span className="tool-card-icon">
                <Keyboard size={18} aria-hidden="true" />
              </span>
            </div>
            <h3>{t.principle2Title}</h3>
            <p>{t.principle2Desc}</p>
          </article>
          <article className="tool-card">
            <div className="tool-card-head">
              <span className="tool-card-icon">
                <MonitorSmartphone size={18} aria-hidden="true" />
              </span>
            </div>
            <h3>{t.principle3Title}</h3>
            <p>{t.principle3Desc}</p>
          </article>
        </div>
      </section>

      <section className="section faq faq-max" aria-labelledby="home-faq-heading">
        <h2 id="home-faq-heading">{t.homeFaqTitle}</h2>
        {homeFaq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
