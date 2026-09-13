import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './error';

function makeError(message: string, digest?: string): Error & { digest?: string } {
  const error: Error & { digest?: string } = new Error(message);
  if (digest) error.digest = digest;
  return error;
}

describe('app error boundary', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the fallback heading and the error digest, and logs the error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = makeError('boom', 'digest-abc123');

    render(<ErrorBoundary error={error} reset={() => {}} />);

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeDefined();
    expect(screen.getByText('digest-abc123')).toBeDefined();
    expect(errorSpy).toHaveBeenCalledWith(error);
  });

  it('omits the digest line when the error has no digest', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ErrorBoundary error={makeError('boom')} reset={() => {}} />);

    expect(screen.queryByText(/Error ID:/)).toBeNull();
  });

  it('calls reset when the "Try again" button is clicked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorBoundary error={makeError('boom')} reset={reset} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('links back to the homepage', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ErrorBoundary error={makeError('boom')} reset={() => {}} />);

    const home = screen.getByRole('link', { name: 'Go home' });
    expect(home.getAttribute('href')).toBe('/');
  });
});
