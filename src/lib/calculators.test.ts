import { describe, expect, it } from 'vitest';
import { calculateYield } from './yield';
import { estimateDies, generateWaferMap } from './wafer';
import { generateMark } from './marking';

describe('marking', () => {
  it('pads and formats dates', () => expect(generateMark({lotId:'abc',waferNumber:'7',productId:'x',layer:'m5',date:'2026-09-10',digits:2,dateFormat:'YYMMDD',separator:'-',uppercase:true}).mark).toBe('ABC-07-260910-M5'));
  it('rejects illegal values', () => expect(generateMark({lotId:'a/',waferNumber:'',productId:'x',layer:'m',date:'bad',digits:2,dateFormat:'YYMM',separator:'-',uppercase:false}).errors.length).toBeGreaterThan(0));
});
describe('wafer', () => {
  it('counts centers in a circle', () => expect(estimateDies(300,10,10,.1,3).estimatedUsable).toBeGreaterThan(0));
  it('supports different wafer sizes', () => expect(estimateDies(150,10,10,0,3).estimatedUsable!).toBeLessThan(estimateDies(300,10,10,0,3).estimatedUsable!));
  it('generates map metadata', () => expect(generateWaferMap(300,3,10,10,10.1,10.1,0,0)[0]).toMatchObject({row:expect.any(Number),column:expect.any(Number),status:expect.any(String)}));
});
describe('yield', () => {
  it('calculates yield and reject rate', () => { const result=calculateYield(720,697,23); expect(result.yield).toBeDefined(); expect(result.rejectRate).toBeDefined(); expect(result.yield!).toBeCloseTo(96.80555555555556,10); expect(result.rejectRate!).toBeCloseTo(3.1944444444444446,10); });
  it('rejects invalid input', () => expect(calculateYield(0,1,0).errors.length).toBeGreaterThan(0));
});
