import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModalShell from './ModalShell';

function renderModal(open: boolean, onClose = vi.fn()) {
  return render(
    <ModalShell open={open} onClose={onClose} ariaLabel="Test dialog">
      <button type="button">first</button>
      <button type="button">second</button>
    </ModalShell>,
  );
}

describe('ModalShell', () => {
  afterEach(() => {
    cleanup();
    // @ts-expect-error restore the jsdom default (undefined getter)
    delete HTMLElement.prototype.offsetParent;
  });

  it('renders nothing when closed and the dialog when open', () => {
    const { rerender } = renderModal(false);
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(
      <ModalShell open onClose={vi.fn()} ariaLabel="Test dialog">
        <button type="button">first</button>
      </ModalShell>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Test dialog');
    expect(screen.getByText('first')).toBeTruthy();
  });

  it('closes on Escape and on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(true, onClose);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    const overlay = screen.getByRole('presentation');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('traps Tab focus inside the panel', async () => {
    // jsdom has no layout engine: offsetParent is always null, which would make
    // the trap's hidden-element filter drop every focusable. Simulate layout.
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get() {
        return document.body;
      },
    });
    const user = userEvent.setup();
    renderModal(true);

    const first = screen.getByText('first');
    const second = screen.getByText('second');
    first.focus();
    await user.tab(); // first -> second
    expect(document.activeElement).toBe(second);
    await user.tab(); // second -> wraps to first
    expect(document.activeElement).toBe(first);
    await user.tab({ shift: true }); // first -> wraps back to second
    expect(document.activeElement).toBe(second);
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = renderModal(true);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <ModalShell open={false} onClose={vi.fn()} ariaLabel="Test dialog">
        <button type="button">first</button>
      </ModalShell>,
    );
    expect(document.body.style.overflow).toBe('');
  });
});
