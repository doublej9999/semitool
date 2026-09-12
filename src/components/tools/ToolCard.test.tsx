import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ToolCard from './ToolCard';
import { getTool } from '@/tools';

const TOOL_PATH = '/tools/yield-calculator';
// Registry name is "Yield Calculator"; the eagerly-loaded en tool dictionary
// translates the card copy to "Wafer Yield Calculator".
const TRANSLATED_NAME = 'Wafer Yield Calculator';

describe('ToolCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the tool name and links to the tool path', () => {
    // Guard: the registry entry this smoke test is built on must exist.
    expect(getTool(TOOL_PATH)).toBeDefined();

    render(<ToolCard path={TOOL_PATH} />);

    const heading = screen.getByRole('heading', { level: 3, name: TRANSLATED_NAME });
    expect(heading.textContent).toBe(TRANSLATED_NAME);

    // The card title is a link, and so is the "Open tool" CTA.
    const titleLink = screen.getByRole('link', { name: TRANSLATED_NAME });
    expect(titleLink.getAttribute('href')).toBe(TOOL_PATH);

    const ctaLink = screen.getByRole('link', {
      name: `Open tool: ${TRANSLATED_NAME}`,
    });
    expect(ctaLink.getAttribute('href')).toBe(TOOL_PATH);
  });

  it('renders the favorite toggle as an unpressed button', () => {
    render(<ToolCard path={TOOL_PATH} />);

    const favorite = screen.getByRole('button', {
      name: `Add to favorites: ${TRANSLATED_NAME}`,
    });
    expect(favorite.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders nothing for an unknown tool path', () => {
    const { container } = render(<ToolCard path="/tools/does-not-exist" />);

    expect(container.children).toHaveLength(0);
  });
});
