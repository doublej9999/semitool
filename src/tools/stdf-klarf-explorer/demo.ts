/**
 * Demo data generator for the STDF / KLARF Explorer.
 *
 * `generateSyntheticStdfV4` emits a valid STDF V4 stream but only PRR part
 * records — real datalogs also carry PTR parametric records. This helper
 * appends a deterministic set of PTR records (one per part per test) so the
 * explorer's per-test Cpk / trend view is demoable without a file.
 */

import { generateSyntheticStdfV4 } from '@/lib/stdf-parser';

interface DemoTestDef {
  testNumber: number;
  testText: string;
  units: string;
  nominal: number;
  noise: number;
  lowLimit?: number;
  highLimit?: number;
}

const DEMO_TESTS: DemoTestDef[] = [
  { testNumber: 1100, testText: 'VDD_CORE', units: 'V', nominal: 0.75, noise: 0.012, lowLimit: 0.7, highLimit: 0.8 },
  { testNumber: 1200, testText: 'FREQ_MAX', units: 'MHz', nominal: 815, noise: 15, lowLimit: 750, highLimit: 880 },
  { testNumber: 1300, testText: 'LEAKAGE', units: 'uA', nominal: 2.2, noise: 0.9, highLimit: 5 },
  { testNumber: 1400, testText: 'CONT_RSPEC', units: 'ohm', nominal: 42, noise: 3.5, lowLimit: 30, highLimit: 55 },
];

/** Deterministic mulberry32 PRNG so the demo lot looks the same every load. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds one STDF V4 PTR (15, 10) record — little-endian wire format:
 * TEST_NUM U4, HEAD_NUM U1, SITE_NUM U1, TEST_FLG U1, PARM_FLG U1,
 * RESULT R4, TEST_TXT Cn, ALARM_ID Cn, OPT_FLAG U1, RES_SCAL I1,
 * LLM_SCAL I1, HLM_SCAL I1, LOW_LIMIT R4, HIGH_LIMIT R4, UNITS Cn.
 */
function buildPtrRecord(test: {
  testNumber: number;
  siteNum: number;
  result: number;
  testText: string;
  lowLimit?: number;
  highLimit?: number;
  units: string;
  passed: boolean;
}): Uint8Array {
  const payload: number[] = [];

  const u4 = (value: number) => {
    payload.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >>> 24) & 0xff);
  };
  const u1 = (value: number) => payload.push(value & 0xff);
  const r4 = (value: number) => {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, value, true);
    payload.push(...new Uint8Array(buffer));
  };
  const cn = (value: string) => {
    payload.push(value.length);
    for (let i = 0; i < value.length; i++) payload.push(value.charCodeAt(i) & 0xff);
  };

  // OPT_FLAG bit 6 (0x40) = no low limit, bit 7 (0x80) = no high limit.
  let optFlag = 0x00;
  if (test.lowLimit === undefined) optFlag |= 0x40;
  if (test.highLimit === undefined) optFlag |= 0x80;

  u4(test.testNumber);
  u1(1); // HEAD_NUM
  u1(test.siteNum);
  u1(test.passed ? 0x00 : 0x40); // TEST_FLG: bit 6/7 set = failed
  u1(0x00); // PARM_FLG
  r4(test.result);
  cn(test.testText);
  cn(''); // ALARM_ID
  u1(optFlag);
  u1(0); // RES_SCAL
  u1(0); // LLM_SCAL
  u1(0); // HLM_SCAL
  r4(test.lowLimit ?? 0);
  r4(test.highLimit ?? 0);
  cn(test.units);

  const record = new Uint8Array(4 + payload.length);
  record[0] = payload.length & 0xff;
  record[1] = (payload.length >> 8) & 0xff;
  record[2] = 15; // REC_TYP
  record[3] = 10; // REC_SUB
  record.set(payload, 4);
  return record;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((accumulator, chunk) => accumulator + chunk.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Generates a synthetic but realistic STDF V4 datalog: 120 parts with bin
 * data plus 4 parametric tests (one deliberately near-spec so Cpk < 2 and a
 * few results fall out of spec).
 */
export function buildDemoStdf(): Uint8Array {
  const dieCount = 120;
  const random = mulberry32(20260913);

  const base = generateSyntheticStdfV4({
    lotId: 'LOT-DEMO-0913',
    waferId: 'WF-DEMO-07',
    dieCount,
    yieldPercent: 92,
  });

  const ptrChunks: Uint8Array[] = [];
  for (let die = 0; die < dieCount; die++) {
    for (const test of DEMO_TESTS) {
      // Mild per-die drift plus noise; uniform in [-noise, +noise].
      const drift = Math.sin(die / 9) * test.noise * 0.35;
      const result = test.nominal + drift + (random() - 0.5) * 2 * test.noise;
      const passed =
        (test.lowLimit === undefined || result >= test.lowLimit) &&
        (test.highLimit === undefined || result <= test.highLimit);

      ptrChunks.push(
        buildPtrRecord({
          testNumber: test.testNumber,
          siteNum: (die % 4) + 1,
          result,
          testText: test.testText,
          lowLimit: test.lowLimit,
          highLimit: test.highLimit,
          units: test.units,
          passed,
        }),
      );
    }
  }

  return concatBytes([base, concatBytes(ptrChunks)]);
}
