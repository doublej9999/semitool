import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadCsv, downloadPdf, downloadSvg, downloadXlsx } from './export';

describe('export utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    const g = globalThis as unknown as {
      window?: unknown;
      document?: unknown;
      URL?: unknown;
      XMLSerializer?: unknown;
    };
    delete g.window;
    delete g.document;
    delete g.URL;
    delete g.XMLSerializer;
  });

  it('safely no-ops in SSR / non-browser environment', () => {
    expect(() => downloadCsv('test', ['A'], [['1']])).not.toThrow();
    expect(() => downloadSvg(null as unknown as SVGSVGElement, 'test')).not.toThrow();
  });

  it('resolves without importing jspdf/exceljs in SSR / non-browser environment', async () => {
    await expect(downloadPdf('test', 'Test', () => {})).resolves.toBeUndefined();
    await expect(
      downloadXlsx('test', 'Sheet', ['A'], [['1']]),
    ).resolves.toBeUndefined();
  });

  it('triggers CSV download when browser window/document are defined', () => {
    const clickSpy = vi.fn();
    const linkMock = {
      setAttribute: vi.fn(),
      style: {},
      click: clickSpy,
    };

    const g = globalThis as unknown as {
      window?: unknown;
      document?: unknown;
      URL?: unknown;
      XMLSerializer?: unknown;
    };

    g.window = {};
    g.document = {
      createElement: vi.fn(() => linkMock),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as unknown as Document;
    g.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    } as unknown as typeof URL;

    downloadCsv('my_recipe.csv', ['Header 1', 'Header 2'], [['Val,with,comma', 'Normal']]);

    expect((g.document as Document).createElement).toHaveBeenCalledWith('a');
    expect(linkMock.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    expect(linkMock.setAttribute).toHaveBeenCalledWith('download', 'my_recipe.csv');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('triggers SVG download with XMLSerializer in browser environment', () => {
    const clickSpy = vi.fn();
    const linkMock = {
      setAttribute: vi.fn(),
      style: {},
      click: clickSpy,
    };

    const g = globalThis as unknown as {
      window?: unknown;
      document?: unknown;
      URL?: unknown;
      XMLSerializer?: unknown;
    };

    g.window = {};
    g.document = {
      createElement: vi.fn(() => linkMock),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as unknown as Document;
    g.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-svg-url'),
      revokeObjectURL: vi.fn(),
    } as unknown as typeof URL;
    g.XMLSerializer = class {
      serializeToString() {
        return '<svg viewBox="0 0 100 100"></svg>';
      }
    } as unknown as typeof XMLSerializer;

    downloadSvg({} as SVGSVGElement, 'my_chart');

    expect(linkMock.setAttribute).toHaveBeenCalledWith('download', 'my_chart.svg');
    expect(clickSpy).toHaveBeenCalled();
  });
});
