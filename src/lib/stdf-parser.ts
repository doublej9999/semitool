/**
 * Standard Test Data Format (STDF) V4 Binary Parser and Analyzer
 *
 * Implements the SEMI / Teradyne STDF Specification Version 4:
 * - Pure binary parsing of ArrayBuffer / Uint8Array client-side (Zero-exfiltration)
 * - Automatic endianness detection via File Attributes Record (FAR)
 * - Record decoders:
 *   - FAR (0, 10): File Attributes
 *   - MIR (1, 10): Master Information Record (Lot ID, Part Type, Operator, Tester)
 *   - MRR (1, 20): Master Results Record (Finish Time, Disposition)
 *   - WIR (2, 10): Wafer Information Record
 *   - WRR (2, 20): Wafer Results Record (Yield, Part count, Good count)
 *   - WCR (2, 30): Wafer Configuration Record (Dimensions, Die pitch)
 *   - HBR (1, 40): Hard Bin Record
 *   - SBR (1, 50): Soft Bin Record
 *   - PRR (5, 20): Part Results Record (X/Y coordinates, Hard/Soft Bin, Pass/Fail)
 *   - PTR (15, 10): Parametric Test Record (Test number, limits, result, Cpk)
 * - Synthesizer utility to generate valid synthetic STDF V4 binary streams for verification
 *
 * PTR retention cap: to bound memory on huge datalogs, `parseStdfV4` keeps at
 * most `DEFAULT_PTR_LIMIT` (5,000) PTR records in `summary.parametricTests`
 * (bin/yield data from PRR is never capped). The limit is configurable via
 * the optional `options.ptrLimit` parameter — e.g. the STDF/KLARF explorer's
 * Web Worker (stdf-klarf-explorer/stdf-worker.ts) passes 200,000 — while the
 * default keeps existing call sites (wafer-map-generator) unchanged. The
 * returned `StdfParseSummary` is plain JSON-safe data (no class instances or
 * functions), so it is structured-cloneable and safe to postMessage from a
 * worker or store in IndexedDB.
 */

/** Default maximum number of PTR records retained by `parseStdfV4`. */
export const DEFAULT_PTR_LIMIT = 5000;

export interface ParseStdfV4Options {
  /**
   * Maximum number of PTR (15,10) records retained in
   * `summary.parametricTests`. Defaults to `DEFAULT_PTR_LIMIT` (5,000).
   * Records beyond the cap are still counted in `recordCounts` but not
   * retained; PRR part/bin data is always retained in full.
   */
  ptrLimit?: number;
}

export interface StdfHeader {
  recLen: number;
  recTyp: number;
  recSub: number;
}

export interface StdfFarRecord {
  cpuType: number;
  stdfVersion: number;
  isLittleEndian: boolean;
}

export interface StdfMirRecord {
  setupTime: number;
  startTime: number;
  statNum: number;
  modeCode: string;
  lotId: string;
  partType: string;
  nodeName: string;
  testerType: string;
  jobName: string;
  operatorName: string;
  sublotId: string;
  execType: string;
  testCode: string;
  temperature: string;
  packageType: string;
  facilityId: string;
}

export interface StdfMrrRecord {
  finishTime: number;
  dispCode: string;
  userDescription: string;
}

export interface StdfWrrRecord {
  finishTime: number;
  partCount: number;
  retestCount: number;
  abortCount: number;
  goodCount: number;
  waferId: string;
  fabWaferId: string;
}

export interface StdfWcrRecord {
  waferSizeMm: number;
  dieHeightMm: number;
  dieWidthMm: number;
  flatOrientation: string;
  posX: string;
  posY: string;
}

export interface StdfBinSummary {
  binNumber: number;
  binName: string;
  count: number;
  passFail: 'PASS' | 'FAIL';
}

export interface StdfPartRecord {
  headNum: number;
  siteNum: number;
  passed: boolean;
  hardBin: number;
  softBin: number;
  xCoord: number;
  yCoord: number;
  testTimeMs: number;
  partId: string;
}

export interface StdfParametricTestRecord {
  testNumber: number;
  headNum: number;
  siteNum: number;
  result: number;
  testText: string;
  lowLimit?: number;
  highLimit?: number;
  units: string;
  passed: boolean;
}

export interface StdfParseSummary {
  isLittleEndian: boolean;
  version: number;
  mir?: StdfMirRecord;
  mrr?: StdfMrrRecord;
  wrr?: StdfWrrRecord;
  wcr?: StdfWcrRecord;
  totalParts: number;
  goodParts: number;
  failedParts: number;
  yieldPercent: number;
  hardBins: Record<number, number>;
  softBins: Record<number, number>;
  parts: StdfPartRecord[];
  parametricTests: StdfParametricTestRecord[];
  recordCounts: Record<string, number>;
}

/**
 * Binary stream reader supporting dynamic endianness and STDF variable-length types.
 */
export class StdfBinaryReader {
  private view: DataView;
  private offset = 0;
  public isLittleEndian = true;

  constructor(buffer: ArrayBuffer | Uint8Array) {
    if (buffer instanceof Uint8Array) {
      this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      this.view = new DataView(buffer);
    }
  }

  get remaining(): number {
    return this.view.byteLength - this.offset;
  }

  get currentOffset(): number {
    return this.offset;
  }

  seek(position: number): void {
    this.offset = Math.max(0, Math.min(this.view.byteLength, position));
  }

  skip(bytes: number): void {
    this.offset = Math.min(this.view.byteLength, this.offset + bytes);
  }

  readU1(): number {
    if (this.offset >= this.view.byteLength) return 0;
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readU2(): number {
    if (this.offset + 2 > this.view.byteLength) return 0;
    const val = this.view.getUint16(this.offset, this.isLittleEndian);
    this.offset += 2;
    return val;
  }

  readU4(): number {
    if (this.offset + 4 > this.view.byteLength) return 0;
    const val = this.view.getUint32(this.offset, this.isLittleEndian);
    this.offset += 4;
    return val;
  }

  readI1(): number {
    if (this.offset >= this.view.byteLength) return 0;
    const val = this.view.getInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readI2(): number {
    if (this.offset + 2 > this.view.byteLength) return 0;
    const val = this.view.getInt16(this.offset, this.isLittleEndian);
    this.offset += 2;
    return val;
  }

  readI4(): number {
    if (this.offset + 4 > this.view.byteLength) return 0;
    const val = this.view.getInt32(this.offset, this.isLittleEndian);
    this.offset += 4;
    return val;
  }

  readR4(): number {
    if (this.offset + 4 > this.view.byteLength) return 0;
    const val = this.view.getFloat32(this.offset, this.isLittleEndian);
    this.offset += 4;
    return val;
  }

  /**
   * Reads STDF C*n variable-length ASCII string (1-byte length prefix)
   */
  readCn(): string {
    if (this.offset >= this.view.byteLength) return '';
    const len = this.readU1();
    if (len === 0) return '';
    const actualLen = Math.min(len, this.remaining);
    let str = '';
    for (let i = 0; i < actualLen; i++) {
      str += String.fromCharCode(this.view.getUint8(this.offset + i));
    }
    this.offset += actualLen;
    return str;
  }

  /**
   * Reads fixed-length ASCII string of len bytes
   */
  readC(len: number): string {
    const actualLen = Math.min(len, this.remaining);
    let str = '';
    for (let i = 0; i < actualLen; i++) {
      str += String.fromCharCode(this.view.getUint8(this.offset + i));
    }
    this.offset += actualLen;
    return str.trim();
  }
}

/**
 * Parses STDF V4 ArrayBuffer or Uint8Array.
 *
 * `options.ptrLimit` caps how many PTR records are retained (default
 * `DEFAULT_PTR_LIMIT`, 5,000); raise it when parsing off the main thread.
 */
export function parseStdfV4(data: ArrayBuffer | Uint8Array, options: ParseStdfV4Options = {}): StdfParseSummary {
  const ptrLimit = options.ptrLimit ?? DEFAULT_PTR_LIMIT;
  const reader = new StdfBinaryReader(data);

  const summary: StdfParseSummary = {
    isLittleEndian: true,
    version: 4,
    totalParts: 0,
    goodParts: 0,
    failedParts: 0,
    yieldPercent: 0,
    hardBins: {},
    softBins: {},
    parts: [],
    parametricTests: [],
    recordCounts: {},
  };

  while (reader.remaining >= 4) {
    // STDF standard 4-byte header: REC_LEN (U*2), REC_TYP (U*1), REC_SUB (U*1)
    const recLen = reader.readU2();
    const recTyp = reader.readU1();
    const recSub = reader.readU1();
    const recEndOffset = reader.currentOffset + recLen;

    const recKey = `${recTyp}_${recSub}`;
    summary.recordCounts[recKey] = (summary.recordCounts[recKey] || 0) + 1;

    // Record 0, 10: FAR (File Attributes Record)
    if (recTyp === 0 && recSub === 10) {
      const cpuType = reader.readU1();
      const stdfVersion = reader.readU1();
      // In STDF V4, cpuType 1 = Sun/Solaris/BigEndian, 2 = DEC/LittleEndian, 0 = x86/LittleEndian
      const isLittle = cpuType !== 1;
      reader.isLittleEndian = isLittle;
      summary.isLittleEndian = isLittle;
      summary.version = stdfVersion;
    }
    // Record 1, 10: MIR (Master Information Record)
    else if (recTyp === 1 && recSub === 10) {
      const setupTime = reader.readU4();
      const startTime = reader.readU4();
      const statNum = reader.readU1();
      const modeCode = reader.readC(1);
      reader.readC(1); // RTST_COD
      reader.readC(1); // PROT_COD
      reader.readU2(); // BURN_TIM
      reader.readC(1); // CMOD_COD

      const lotId = reader.readCn();
      const partType = reader.readCn();
      const nodeName = reader.readCn();
      const testerType = reader.readCn();
      const jobName = reader.readCn();
      reader.readCn(); // JOB_REV
      const sublotId = reader.readCn();
      const operatorName = reader.readCn();
      const execType = reader.readCn();
      reader.readCn(); // EXEC_VER
      const testCode = reader.readCn();
      const temperature = reader.readCn();
      reader.readCn(); // USER_TXT
      reader.readCn(); // AUX_FILE
      const packageType = reader.readCn();
      reader.readCn(); // FAMLY_ID
      reader.readCn(); // DATE_COD
      const facilityId = reader.readCn();

      summary.mir = {
        setupTime,
        startTime,
        statNum,
        modeCode,
        lotId,
        partType,
        nodeName,
        testerType,
        jobName,
        operatorName,
        sublotId,
        execType,
        testCode,
        temperature,
        packageType,
        facilityId,
      };
    }
    // Record 1, 20: MRR (Master Results Record)
    else if (recTyp === 1 && recSub === 20) {
      const finishTime = reader.readU4();
      const dispCode = reader.readC(1);
      const userDescription = reader.readCn();
      summary.mrr = {
        finishTime,
        dispCode,
        userDescription,
      };
    }
    // Record 2, 20: WRR (Wafer Results Record)
    else if (recTyp === 2 && recSub === 20) {
      reader.readU1(); // HEAD_NUM
      reader.readU1(); // SITE_GRP
      const finishTime = reader.readU4();
      const partCount = reader.readU4();
      const retestCount = reader.readU4();
      const abortCount = reader.readU4();
      const goodCount = reader.readU4();
      const waferId = reader.readCn();
      const fabWaferId = reader.readCn();

      summary.wrr = {
        finishTime,
        partCount,
        retestCount,
        abortCount,
        goodCount,
        waferId,
        fabWaferId,
      };
    }
    // Record 2, 30: WCR (Wafer Configuration Record)
    else if (recTyp === 2 && recSub === 30) {
      const waferSizeMm = reader.readR4();
      const dieHeightMm = reader.readR4();
      const dieWidthMm = reader.readR4();
      reader.readU1(); // WF_UNITS
      const flatOrientation = reader.readC(1);
      reader.readI2(); // CENTER_X
      reader.readI2(); // CENTER_Y
      const posX = reader.readC(1);
      const posY = reader.readC(1);

      summary.wcr = {
        waferSizeMm,
        dieHeightMm,
        dieWidthMm,
        flatOrientation,
        posX,
        posY,
      };
    }
    // Record 5, 20: PRR (Part Results Record)
    else if (recTyp === 5 && recSub === 20) {
      const headNum = reader.readU1();
      const siteNum = reader.readU1();
      const partFlg = reader.readU1(); // bit 3 = 1 -> Part failed, bit 3 = 0 -> Part passed
      reader.readU2(); // NUM_TEST
      const hardBin = reader.readU2();
      const softBin = reader.readU2();
      const xCoord = reader.readI2();
      const yCoord = reader.readI2();
      const testTimeMs = reader.readU4();
      const partId = reader.readCn();

      // Check pass/fail (Bit 3 set = fail)
      const passed = (partFlg & 0x08) === 0;

      summary.totalParts++;
      if (passed) {
        summary.goodParts++;
      } else {
        summary.failedParts++;
      }

      summary.hardBins[hardBin] = (summary.hardBins[hardBin] || 0) + 1;
      summary.softBins[softBin] = (summary.softBins[softBin] || 0) + 1;

      summary.parts.push({
        headNum,
        siteNum,
        passed,
        hardBin,
        softBin,
        xCoord,
        yCoord,
        testTimeMs,
        partId,
      });
    }
    // Record 15, 10: PTR (Parametric Test Record)
    else if (recTyp === 15 && recSub === 10) {
      const testNumber = reader.readU4();
      const headNum = reader.readU1();
      const siteNum = reader.readU1();
      const testFlg = reader.readU1();
      reader.readU1(); // PARM_FLG
      const result = reader.readR4();
      const testText = reader.readCn();
      reader.readCn(); // ALARM_ID
      const optFlag = reader.readU1();
      reader.readI1(); // RES_SCAL
      reader.readI1(); // LLM_SCAL
      reader.readI1(); // HLM_SCAL
      const lowLimit = reader.readR4();
      const highLimit = reader.readR4();
      const units = reader.readCn();

      const passed = (testFlg & 0xC0) === 0;

      // Cap retained PTR records to bound memory on huge files (configurable).
      if (summary.parametricTests.length < ptrLimit) {
        summary.parametricTests.push({
          testNumber,
          headNum,
          siteNum,
          result,
          testText,
          lowLimit: (optFlag & 0x40) === 0 ? lowLimit : undefined,
          highLimit: (optFlag & 0x80) === 0 ? highLimit : undefined,
          units,
          passed,
        });
      }
    }

    // Advance reader cleanly to record end
    reader.seek(recEndOffset);
  }

  summary.yieldPercent =
    summary.totalParts > 0
      ? (summary.goodParts / summary.totalParts) * 100
      : 0;

  return summary;
}

/**
 * Generator for synthetic standard STDF V4 binary data.
 * Ideal for end-to-end testing, training, and verifying ATE data pipelines.
 */
export function generateSyntheticStdfV4(options: {
  lotId?: string;
  waferId?: string;
  dieCount?: number;
  yieldPercent?: number;
  waferDiameterMm?: number;
}): Uint8Array {
  const lotId = options.lotId ?? 'LOT-2025-A1';
  const waferId = options.waferId ?? 'WF-07';
  const dieCount = options.dieCount ?? 120;
  const targetYield = (options.yieldPercent ?? 92.5) / 100;
  const waferDiameter = options.waferDiameterMm ?? 300;

  const chunks: Uint8Array[] = [];

  const writeRecord = (recTyp: number, recSub: number, payload: number[]) => {
    const len = payload.length;
    const header = [len & 0xff, (len >> 8) & 0xff, recTyp, recSub];
    chunks.push(new Uint8Array(header.concat(payload)));
  };

  const writeCn = (str: string): number[] => {
    const bytes = [str.length];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
  };

  const writeU4 = (val: number): number[] => [
    val & 0xff,
    (val >> 8) & 0xff,
    (val >> 16) & 0xff,
    (val >> 24) & 0xff,
  ];

  const writeR4 = (val: number): number[] => {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setFloat32(0, val, true);
    return Array.from(new Uint8Array(buf));
  };

  // 1. FAR record (0, 10)
  writeRecord(0, 10, [2, 4]); // CPU_TYPE=2 (x86 little endian), STDF_VER=4

  // 2. MIR record (1, 10)
  const now = Math.floor(Date.now() / 1000);
  const mirPayload: number[] = [
    ...writeU4(now - 3600), // SETUP_T
    ...writeU4(now - 3500), // START_T
    1,                      // STAT_NUM
    'P'.charCodeAt(0),      // MODE_COD = Production
    ' '.charCodeAt(0),      // RTST_COD
    ' '.charCodeAt(0),      // PROT_COD
    0, 0,                   // BURN_TIM
    ' '.charCodeAt(0),      // CMOD_COD
    ...writeCn(lotId),
    ...writeCn('SOC-5NM-DIE'), // PART_TYP
    ...writeCn('TESTER-TERADYNE-03'),
    ...writeCn('ULTRAFLEX-HD'),
    ...writeCn('TESTPROG_REV_3'),
    ...writeCn('1.0'),
    ...writeCn('SUBLOT-A'),
    ...writeCn('OP-CHENG'),
    ...writeCn('IG-XL'),
    ...writeCn('10.40'),
    ...writeCn('WS_ROOM_1'),
    ...writeCn('25C'),
    ...writeCn('BGA-484'),
    ...writeCn('WUXI-FAB-1'),
  ];
  writeRecord(1, 10, mirPayload);

  // 3. WCR record (2, 30)
  const wcrPayload: number[] = [
    ...writeR4(waferDiameter),
    ...writeR4(12.5), // DIE_HT
    ...writeR4(10.0), // DIE_WID
    1,                // WF_UNITS = mm
    'N'.charCodeAt(0),// Flat orientation notch
    0, 0,             // CENTER_X
    0, 0,             // CENTER_Y
    'R'.charCodeAt(0),// POS_X
    'U'.charCodeAt(0),// POS_Y
  ];
  writeRecord(2, 30, wcrPayload);

  // 4. PRR parts records
  const searchR = Math.ceil(Math.sqrt(dieCount)) + 6;
  const candidates: { x: number; y: number; r2: number }[] = [];
  for (let x = -searchR; x <= searchR; x++) {
    for (let y = -searchR; y <= searchR; y++) {
      candidates.push({ x, y, r2: x * x + y * y });
    }
  }
  candidates.sort((a, b) => a.r2 - b.r2);
  const selectedCoords = candidates.slice(0, dieCount);

  let createdParts = 0;
  let goodParts = 0;

  for (const { x, y } of selectedCoords) {
    const isGood = Math.random() < targetYield;
    const hardBin = isGood ? 1 : Math.floor(Math.random() * 4) + 2;
    const softBin = isGood ? 100 : hardBin * 10;
    if (isGood) goodParts++;

    const partFlg = isGood ? 0x00 : 0x08; // Bit 3 set if fail

    const prrPayload: number[] = [
      1,                         // HEAD_NUM
      1,                         // SITE_NUM
      partFlg,                   // PART_FLG
      120, 0,                    // NUM_TEST
      hardBin & 0xff, (hardBin >> 8) & 0xff, // HARD_BIN
      softBin & 0xff, (softBin >> 8) & 0xff, // SOFT_BIN
      x & 0xff, (x >> 8) & 0xff, // X_COORD
      y & 0xff, (y >> 8) & 0xff, // Y_COORD
      ...writeU4(150),           // TEST_T ms
      ...writeCn(`DIE_${x}_${y}`),
    ];
    writeRecord(5, 20, prrPayload);
    createdParts++;
  }

  // 5. WRR record (2, 20)
  const wrrPayload: number[] = [
    1, // HEAD_NUM
    1, // SITE_GRP
    ...writeU4(now),
    ...writeU4(createdParts),
    ...writeU4(0),
    ...writeU4(0),
    ...writeU4(goodParts),
    ...writeCn(waferId),
    ...writeCn(`FAB-${waferId}`),
  ];
  writeRecord(2, 20, wrrPayload);

  // 6. MRR record (1, 20)
  const mrrPayload: number[] = [
    ...writeU4(now),
    'P'.charCodeAt(0), // PASS
    ...writeCn('Automated wafer probe completed normally'),
  ];
  writeRecord(1, 20, mrrPayload);

  // Combine chunks into single Uint8Array
  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const out = new Uint8Array(totalLength);
  let off = 0;
  for (const chunk of chunks) {
    out.set(chunk, off);
    off += chunk.byteLength;
  }

  return out;
}
