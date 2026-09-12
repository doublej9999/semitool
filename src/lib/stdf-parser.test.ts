import { describe, it, expect } from 'vitest';
import {
  parseStdfV4,
  generateSyntheticStdfV4,
  StdfBinaryReader,
} from './stdf-parser';

describe('stdf-parser binary reader unit tests', () => {
  it('correctly reads endian types and variable-length strings', () => {
    const buf = new ArrayBuffer(16);
    const view = new DataView(buf);
    view.setUint16(0, 0x1234, true); // U2 little endian
    view.setUint32(2, 0x56789ABC, true); // U4 little endian
    view.setFloat32(6, 12.5, true); // R4 little endian

    // C*n string at offset 10: length 4 + "TEST"
    view.setUint8(10, 4);
    view.setUint8(11, 'T'.charCodeAt(0));
    view.setUint8(12, 'E'.charCodeAt(0));
    view.setUint8(13, 'S'.charCodeAt(0));
    view.setUint8(14, 'T'.charCodeAt(0));

    const reader = new StdfBinaryReader(buf);
    expect(reader.readU2()).toBe(0x1234);
    expect(reader.readU4()).toBe(0x56789ABC);
    expect(reader.readR4()).toBeCloseTo(12.5, 3);
    expect(reader.readCn()).toBe('TEST');
  });
});

describe('stdf-parser end-to-end STDF V4 parsing', () => {
  it('parses synthetic STDF stream and extracts metadata, wafer dimensions, and die bins', () => {
    const binaryData = generateSyntheticStdfV4({
      lotId: 'LOT-DEMO-99',
      waferId: 'WAFER-01',
      dieCount: 45,
      yieldPercent: 88.0,
      waferDiameterMm: 300,
    });

    const parsed = parseStdfV4(binaryData);

    expect(parsed.version).toBe(4);
    expect(parsed.isLittleEndian).toBe(true);

    // Verify MIR
    expect(parsed.mir).toBeDefined();
    expect(parsed.mir?.lotId).toBe('LOT-DEMO-99');
    expect(parsed.mir?.partType).toBe('SOC-5NM-DIE');
    expect(parsed.mir?.operatorName).toBe('OP-CHENG');

    // Verify WCR
    expect(parsed.wcr).toBeDefined();
    expect(parsed.wcr?.waferSizeMm).toBeCloseTo(300, 1);
    expect(parsed.wcr?.dieHeightMm).toBeCloseTo(12.5, 1);
    expect(parsed.wcr?.dieWidthMm).toBeCloseTo(10.0, 1);

    // Verify WRR
    expect(parsed.wrr).toBeDefined();
    expect(parsed.wrr?.waferId).toBe('WAFER-01');
    expect(parsed.wrr?.partCount).toBe(45);

    // Verify MRR
    expect(parsed.mrr).toBeDefined();
    expect(parsed.mrr?.dispCode).toBe('P');

    // Verify Part results
    expect(parsed.totalParts).toBe(45);
    expect(parsed.goodParts + parsed.failedParts).toBe(45);
    expect(parsed.yieldPercent).toBeGreaterThanOrEqual(0);
    expect(parsed.yieldPercent).toBeLessThanOrEqual(100);

    // Verify bins
    expect(parsed.hardBins[1]).toBe(parsed.goodParts);
    expect(parsed.parts.length).toBe(45);
  });
});
