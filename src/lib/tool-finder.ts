import type { SupportedLocale } from '@/lib/i18n/context';
import type { Tool } from '@/tools/tools.types';
import { getTranslatedTool } from '@/lib/i18n/tool-translations';

/**
 * "AI Semiconductor Assistant" — a fully local natural-language tool finder.
 *
 * Given a free-text task description ("how many dies fit on a 300mm wafer"),
 * it scores every registry tool against the localized name, description and
 * keywords (via getTranslatedTool) plus a hand-built synonym/intent map.
 * Everything runs synchronously in the browser: no API calls, no randomness,
 * no clock — the same query always yields the same ranked list.
 */

/** A single ranked result. */
export interface ToolMatch {
  tool: Tool;
  score: number;
  /** Query terms (literal or synonym-expanded) that matched this tool. */
  matchedTerms: string[];
}

/** Point weights for each kind of hit, per matched term. */
export const MATCH_WEIGHTS = {
  /** Term found in one of the tool's localized keywords. */
  keyword: 3,
  /** Term found in the localized tool name. */
  name: 2,
  /** Term found in the localized description. */
  description: 1,
  /** Term was inferred through the synonym map rather than typed literally. */
  synonym: 2,
} as const;

/**
 * Intent phrase → registry search terms. Keys are normalized (lowercase,
 * punctuation-free) phrases in English, Chinese, Japanese and Korean; values
 * are lowercase terms that exist in the registry's English keywords and/or the
 * localized tool dictionaries. Exported so tests can verify coverage.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  // --- Die counting / wafer utilization -----------------------------------
  'how many dies fit': ['gross die', 'die per wafer', 'die count', 'dpw', '出芯数', '芯片数', 'ダイ取得数', '다이 수율'],
  'dies per wafer': ['gross die', 'die per wafer', 'dpw', '出芯数', 'チップ数'],
  'chips per wafer': ['gross die', 'die per wafer', 'dpw', '芯片数', 'チップ数'],
  'die count': ['gross die', 'die per wafer', 'dpw', '出芯数'],
  'how many die': ['gross die', 'die per wafer', 'dpw', '出芯数'],
  '晶圆能切多少颗': ['gross die', 'die per wafer', 'die count', '出芯数', '芯片数', 'チップ数', '다이 수율'],
  '能切多少颗': ['gross die', 'die per wafer', '出芯数', '芯片数'],
  'ウェーハにいくつ': ['gross die', 'die per wafer', 'ダイ取得数', 'チップ数'],
  '몇 개의 다이': ['gross die', 'die per wafer', '다이 수율'],

  // --- Film / oxide color --------------------------------------------------
  'film color': ['film color', 'oxide color chart', 'sio2 color', 'optical interference', '薄膜颜色', '干涉色', '干渉色', '박막 색상'],
  'what color': ['film color', 'oxide color chart', 'sio2 color', 'optical interference', '薄膜颜色', '干涉色', '酸化膜色', '간섭색'],
  'oxide color': ['film color', 'oxide color chart', 'sio2 color', '干涉色', '氧化层颜色'],
  'color of oxide': ['film color', 'oxide color chart', 'sio2 color', '氧化层颜色'],
  'chromium color': ['film color', 'oxide color chart', 'sio2 color', 'optical interference'],
  'wafer color': ['film color', 'oxide color chart', '干涉色', '酸化膜色'],
  '薄膜颜色': ['film color', 'oxide color chart', '薄膜颜色', '干涉色', 'sio2颜色'],
  '薄膜是什么颜色': ['film color', 'oxide color chart', '薄膜颜色', '干涉色'],
  '氧化层颜色': ['film color', 'oxide color chart', '氧化层颜色', '干涉色'],
  'ウェーハの色': ['film color', 'oxide color chart', '干渉色', '薄膜色', '酸化膜色'],
  'ウェーハ色': ['film color', 'oxide color chart', '干渉色', '薄膜色', '酸化膜色'],
  '薄膜の色': ['film color', '干渉色', '薄膜色', '酸化膜色'],
  '박막 색상': ['film color', 'oxide color chart', '박막 색상', '간섭색', '산화막 색상표'],
  '산화막 색': ['film color', '간섭색', '산화막 색상표'],

  // --- Wafer warp / film stress -------------------------------------------
  'wafer warpage': ['wafer warp', 'wafer bow', 'film stress', 'curvature', '晶圆翘曲', '晶圆弯曲', 'ウェーハワープ', '웨이퍼 와프'],
  'wafer is bent': ['wafer warp', 'wafer bow', 'film stress', 'curvature', 'stoney', '晶圆翘曲', '晶圆弯曲'],
  'wafer bent': ['wafer warp', 'wafer bow', 'film stress', 'curvature', '晶圆弯曲'],
  'bent wafer': ['wafer warp', 'wafer bow', 'curvature', '晶圆弯曲'],
  warped: ['wafer warp', 'wafer bow', 'curvature', '晶圆翘曲'],
  bowed: ['wafer bow', 'wafer warp', 'curvature', '曲率半径'],
  'wafer warp': ['wafer warp', 'wafer bow', 'film stress', 'curvature'],
  'film stress': ['film stress', 'stoney', 'biaxial modulus', 'wafer curvature', '薄膜应力', '薄膜応力', '박막 응력'],
  'stress of my film': ['film stress', 'stoney', 'biaxial modulus', '薄膜应力'],
  '晶圆翘曲': ['wafer warp', 'wafer bow', '晶圆翘曲', '晶圆弯曲', '薄膜应力'],
  '晶圆弯曲': ['wafer warp', 'film stress', '晶圆弯曲', '晶圆翘曲', '曲率半径'],
  'ウェーハの反り': ['wafer warp', 'ウェーハワープ', 'ウェーハボウ', '薄膜応力'],
  'ウェーハが反る': ['wafer warp', 'ウェーハワープ', '薄膜応力', '曲率半径'],
  '박막 응력': ['film stress', '박막 응력', '인장 응력', '곡률 반경'],
  '웨이퍼 휨': ['wafer warp', '웨이퍼 와프', '웨이퍼 보우', '박막 응력'],

  // --- Yield ---------------------------------------------------------------
  'my wafer yield': ['yield', 'reject rate', 'good die', 'first pass yield', '晶圆良率', '웨이퍼 수율'],
  'wafer yield': ['yield', 'reject rate', 'good die', 'first pass yield', '晶圆良率', '웨이퍼 수율'],
  'yield is low': ['yield', 'reject rate', 'good die', 'first pass yield', 'yield loss', '良率损失'],
  'low yield': ['yield', 'reject rate', 'good die', 'first pass yield', 'yield loss', '良率损失', '歩留まり低下'],
  '晶圆良率': ['yield', 'reject rate', '晶圆良率', '成品率'],
  '良率低': ['yield', '晶圆良率', '成品率', '良率损失'],
  '良率': ['yield', '晶圆良率', '成品率', '良率计算'],
  '歩留まりが低い': ['yield', '歩留まり', '良品率', '欠陥密度'],
  '歩留まり': ['yield', '歩留まり', '良品率', 'reject rate'],
  '웨이퍼 수율': ['yield', '웨이퍼 수율', '수율 계산', '양품률', 'reject rate'],
  '수율을 계산': ['yield', '수율 계산', '웨이퍼 수율', '양품률'],

  // --- CMP / polishing -------------------------------------------------------
  'slurry remove rate': ['cmp preston', 'removal rate', 'chemical mechanical polishing', 'preston', '材料去除率'],
  'slurry removal rate': ['cmp preston', 'removal rate', 'chemical mechanical polishing', 'preston', '材料去除率'],
  'cmp removal rate': ['cmp preston', 'removal rate', 'preston'],
  'polishing rate': ['cmp preston', 'removal rate', 'chemical mechanical polishing', '化学机械抛光'],
  'polish rate': ['cmp preston', 'removal rate', 'chemical mechanical polishing'],
  '化学机械抛光': ['cmp preston', 'removal rate', '化学机械抛光', '材料去除率'],
  '去除率': ['cmp preston', 'removal rate', '材料去除率', '研磨速度'],
  '研磨レート': ['cmp preston', 'removal rate', '研磨速度', '化学機械研磨'],
  '제거율': ['cmp preston', 'removal rate', '제거율'],

  // --- Thermal budget / diffusion --------------------------------------------
  'temperature budget': ['thermal budget', 'process thermal budget', 'anneal', 'diffusivity', '热预算', 'サーマルバジェット'],
  'thermal budget': ['thermal budget', 'process thermal budget', 'anneal', '热预算', 'サーマルバジェット', '열 예산'],
  '热预算': ['thermal budget', '热预算', '退火', '杂质扩散'],
  '温度预算': ['thermal budget', '热预算', '退火'],
  'サーマルバジェット': ['thermal budget', 'サーマルバジェット', '熱拡散'],

  // --- Leakage / junction ------------------------------------------------------
  'leakage current': ['depletion width', 'reverse bias', 'pn junction', 'junction capacitance', 'breakdown voltage', '耗尽层宽度', 'pn结'],
  'reduce leaks': ['depletion width', 'reverse bias', 'pn junction', 'junction capacitance', 'breakdown voltage'],
  leaky: ['depletion width', 'reverse bias', 'pn junction', 'breakdown voltage'],
  '漏电流': ['depletion width', 'reverse bias', 'pn结', '耗尽层宽度'],
  '降低漏电': ['depletion width', 'reverse bias', 'pn结', '耗尽层宽度'],

  // --- RF / impedance matching --------------------------------------------------
  'match impedance': ['impedance match', 'vswr', 'return loss', 'matching network', 'reflection coefficient', '阻抗匹配', 'インピーダンス整合', '임피던스 매칭'],
  'impedance 50 ohm': ['impedance match', 'vswr', 'return loss', '50 ohm match'],
  '50 ohm': ['50 ohm match', 'impedance match', 'vswr', '50 ohm'],
  'impedance matching': ['impedance match', 'matching network', 'l network matching', 'rf matching', '阻抗匹配'],
  'return loss': ['return loss', 'vswr', 'reflection coefficient', 'mismatch loss', '回波损耗', '반사손실'],
  vswr: ['return loss', 'vswr', 'reflection coefficient', 'standing wave ratio', '驻波比', '정재파비'],
  'standing wave': ['return loss', 'vswr', 'standing wave ratio', '驻波比'],
  '驻波比': ['return loss', 'vswr', '驻波比', '反射系数'],
  '回波损耗': ['return loss', 'vswr', '回波损耗', '反射系数'],
  '임피던스 매칭': ['impedance match', '임피던스 매칭', '매처', '반사손실'],
  'インピーダンス整合': ['impedance match', 'インピーダンス整合', 'マッチャー', 'リターンロス'],

  // --- Process capability / SPC -------------------------------------------------
  'process is capable': ['cp cpk', 'process capability', 'capability index', 'process sigma', '制程能力'],
  'process capable': ['cp cpk', 'process capability', 'capability index', 'cpk calculator'],
  capable: ['cp cpk', 'process capability', 'capability index', 'cpk calculator', 'cpk'],
  capability: ['process capability', 'capability index', 'cp cpk'],
  cpk: ['cp cpk', 'process capability', 'capability index', 'cpk calculator', 'cpk'],
  'sigma level': ['process sigma', 'sigma level', 'cpk equivalent'],
  'control chart': ['spc control chart', 'control limits', 'western electric rules', 'out of control', '控制图', '管理図', '관리도'],
  'in control': ['spc control chart', 'control limits', 'out of control', 'process stability'],
  'out of control': ['spc control chart', 'out of control', 'control limits', 'western electric rules'],
  'western electric': ['spc control chart', 'western electric rules', 'run rule'],
  'control limits': ['spc control chart', 'control limits', 'ucl lcl'],
  '控制图': ['spc control chart', '控制图', '控制限', '过程受控'],
  '管理図': ['spc control chart', '管理図', '管理限界'],
  '관리도': ['spc control chart', '관리도', '관리한계'],

  // --- Throughput / OEE -----------------------------------------------------------
  'wafers per hour': ['wafers per hour', 'wph', 'throughput', 'oee', '每小时晶圆数', '時間あたりウェーハ数', '시간당 생산량'],
  throughput: ['throughput', 'wph', 'oee', 'utilization'],
  oee: ['oee', 'overall equipment effectiveness', 'throughput', 'availability'],
  '产能': ['throughput', 'wph', '机台产能', '设备生产率'],
  'スループット': ['throughput', 'スループット', 'タクトタイム'],

  // --- Sheet resistance / metrology -----------------------------------------------
  'sheet resistance': ['sheet resistance', 'four point probe', 'resistivity', 'ohms per square', '方阻', 'シート抵抗', '면저항'],
  'ohms per square': ['sheet resistance', 'ohms per square', 'ohm per square'],
  'four point probe': ['four point probe', 'sheet resistance', 'resistivity', '四探针', '四探針', '4탐침'],
  '方阻': ['sheet resistance', '方阻', '方块电阻', '四探针'],

  // --- Etch -------------------------------------------------------------------------
  'etch rate': ['etch rate', 'selectivity', 'overetch', '刻蚀速率', 'エッチングレート', '식각율'],
  'etching rate': ['etch rate', 'selectivity', 'overetch', '刻蚀速率', 'エッチングレート'],
  selectivity: ['etch rate', 'selectivity', '选择比', '選択比'],
  '刻蚀速率': ['etch rate', '刻蚀速率', '选择比'],
  'エッチングレート': ['etch rate', 'エッチングレート', '選択比'],
  '식각율': ['etch rate', '식각율', '선택비'],

  // --- Oxide growth / thickness -------------------------------------------------------
  'grow oxide': ['thermal oxide', 'deal grove', 'oxidation time', 'oxide thickness', '热氧化', '熱酸化'],
  'oxide growth': ['thermal oxide', 'deal grove', 'oxidation time', 'oxide thickness'],
  'oxidation time': ['thermal oxide', 'oxidation time', 'deal grove', '氧化层厚度'],
  'oxide thickness': ['oxide thickness', 'thermal oxide', 'film thickness', '氧化层厚度', '酸化膜厚'],
  '氧化层厚度': ['thermal oxide', '热氧化', '氧化层厚度'],

  // --- Defects / yield models ----------------------------------------------------------
  'defect density': ['defect density', 'd0', 'poisson', 'critical area', '缺陷密度', '欠陥密度', '결함 밀도'],
  'cost per die': ['cost per good die', 'die cost', 'wafer cost', '芯片成本', 'チップ原価', '다이 원가'],
  'die cost': ['cost per good die', 'die cost', 'wafer cost'],
  'how much does a die cost': ['cost per good die', 'die cost', 'wafer cost', '芯片成本'],
  'wafer cost': ['wafer cost', 'cost per good die', 'die cost', '晶圆成本'],

  // --- Lithography ------------------------------------------------------------------------
  'smallest feature': ['resolution', 'rayleigh', 'numerical aperture', 'critical dimension', 'k1'],
  resolution: ['resolution', 'rayleigh', 'numerical aperture', 'depth of focus', '光刻分辨率', '解像度'],
  'depth of focus': ['depth of focus', 'dof', 'resolution', '焦深', '焦点深度'],
  'numerical aperture': ['numerical aperture', 'na', 'rayleigh', 'resolution'],

  // --- Implant / doping ----------------------------------------------------------------------
  'ion implant': ['ion implantation', 'projected range', 'straggle', 'doping profile', '离子注入', 'イオン注入', '이온 주입'],
  'implant dose': ['ion implantation', 'projected range', 'straggle', '注入剂量'],

  // --- Sampling / reliability ------------------------------------------------------------------
  'sample size': ['sample size', 'acceptance sampling', 'oc curve', 'sampling plan', 'サンプルサイズ', '샘플 크기'],
  'how many units to test': ['sample size', 'acceptance sampling', 'oc curve', 'sampling plan', '置信区间'],
  'acceptance sampling': ['acceptance sampling', 'oc curve', 'ltpd', 'aql', '抽样检验', '抜取検査', '샘플링 검사'],
  mtbf: ['mtbf', 'failure rate', 'fit', 'reliability', '平均无故障时间', '평균 무고장 시간'],
  'failure rate': ['failure rate', 'fit', 'mtbf', 'reliability', '失效率', '故障率', '고장률'],
  weibull: ['weibull fit', 'weibull analysis', 'b10 life', '威布尔分析', 'ワイブル解析', '와이블 분석'],

  // --- Unit conversion ---------------------------------------------------------------------------
  'torr to mbar': ['pressure converter', 'torr to mbar', 'mbar to torr', '真空度'],
  'celsius to fahrenheit': ['temperature converter', 'celsius to fahrenheit', 'temperature difference'],
  kelvin: ['kelvin converter', 'temperature converter', 'celsius to kelvin', '开尔文', 'ケルビン', '켈빈'],
  sccm: ['sccm to slm', 'slm to sccm', 'mass flow converter', 'mfc flow'],

  // --- Cleanroom / plasma / wet process / other unit ops ----------------------------
  'cleanroom class': ['cleanroom classification', 'iso 14644-1', 'fed-std-209e', 'air changes per hour', '洁净室等级', 'クリーンルーム', '클린룸 등급'],
  'air changes': ['air changes per hour', 'ach calculator', 'cleanroom airflow'],
  'iso 5': ['cleanroom classification', 'iso 14644-1', 'class 100 to iso 5'],
  'debye length': ['plasma sheath', 'debye length', 'bohm velocity', '德拜长度', 'デバイ長', '드바이 길이'],
  'plasma sheath': ['plasma sheath', 'debye length', 'child langmuir', '等离子体鞘层', 'プラズマシース', '플라즈마 시스'],
  'rca clean': ['rca clean', 'sc1 clean', 'sc2 clean', 'piranha', 'rca清洗', 'rca洗浄', 'rca 세정'],
  piranha: ['piranha', 'spm', 'rca clean', '皮拉尼亚', 'ピラニア洗浄', '피라냐'],
  'dilute hf': ['dilute hf', 'dhf', 'boe', 'buffered oxide etch', '氢氟酸', 'フッ酸', '불산'],
  'chemical dilution': ['chemical dilution', 'c1v1 c2v2', 'rca clean', '化学配比', '薬液希釈', '케미컬 희석'],
  'copper plating': ['copper plating', 'electroplating', 'damascene', 'current density', '电镀', '전기도금'],
  electroplating: ['electroplating', 'copper plating', 'faraday law', 'damascene'],
  'ald cycle': ['ald cycle', 'atomic layer deposition', 'gpc', 'growth per cycle', 'ald周期', 'aldサイクル', 'ald 사이클'],
  'atomic layer deposition': ['atomic layer deposition', 'ald cycle', 'gpc', 'precursor exposure'],
  'deposition rate': ['growth rate', 'cvd', 'mass transport', '外延生长速率', '成長速度'],
  epitaxy: ['epitaxy', 'epi', 'growth rate', 'cvd', '外延'],
  'wire bond': ['wire bonding', 'bond wire inductance', 'preece fusing current', '引线键合', 'ワイヤボンディング', '와이어 본딩'],
  'fusing current': ['preece fusing current', 'wire bonding', 'jedec safe current'],
  'wafer map': ['wafer map', 'die map', 'bin map', '晶圆图', 'ウェーハマップ', '웨이퍼 맵'],
  'defect map': ['defect map', 'wafer map', 'bin map'],
};

/**
 * Ultra-common function words that never carry tool intent. Kept tiny on
 * purpose: anything not in the registry simply scores 0 anyway.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'onto',
  'is', 'are', 'was', 'were', 'be', 'been', 'am', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them',
  'do', 'does', 'did', 'done', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'have', 'has', 'had', 'how', 'what', 'when', 'where', 'which', 'who', 'whom', 'why', 'if', 'then', 'than',
  'so', 'as', 'after', 'before', 'about', 'over', 'under', 'again', 'there', 'here',
  'get', 'got', 'make', 'made', 'want', 'need', 'much', 'many', 'very', 'some', 'any', 'all', 'also',
]);

/** Hiragana, Katakana, CJK ideographs (incl. ext-A + compat) and Hangul. */
const CJK_RUN_G = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u3130-\u318f]+/g;
const CJK_TEST = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u3130-\u318f]/;

/** Lowercase, strip punctuation and collapse whitespace (keeps CJK, letters, digits). */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Naive plural stemmer: 'wafers' → 'wafer', 'dies' → 'die', 'gases' → 'gase' (harmless). */
function stemPlural(token: string): string {
  if (token.length >= 5 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length >= 4 && token.endsWith('s') && !token.endsWith('ss') && !token.endsWith('us')) {
    return token.slice(0, -1);
  }
  return token;
}

interface QueryTerm {
  term: string;
  /** True when the term came from the synonym map rather than the raw query. */
  fromSynonym: boolean;
}

function hasCjk(text: string): boolean {
  return CJK_TEST.test(text);
}

/**
 * Latin/digit query terms. Letter-digit boundaries split ('300mm' → '300' + 'mm'),
 * plurals are stemmed, and both the raw and the stemmed form are kept because
 * registry copy uses both ('dies' appears in descriptions, 'die' in keywords).
 */
function extractLatinTerms(normalized: string): QueryTerm[] {
  const out: QueryTerm[] = [];
  for (const word of normalized.split(' ')) {
    if (!word || hasCjk(word)) continue;
    for (const piece of word.match(/\d+|[a-z]+/g) ?? []) {
      if (piece.length < 2) continue; // skip stray single letters
      out.push({ term: piece, fromSynonym: false });
      const stemmed = stemPlural(piece);
      if (stemmed !== piece && stemmed.length >= 2) {
        out.push({ term: stemmed, fromSynonym: false });
      }
    }
  }
  return out;
}

/**
 * CJK "terms". CJK is not whitespace-segmented, so instead of tokenizing we
 * generate substrings and match them against the localized fields: a full run
 * when it is short enough to be keyword-like ('晶圆翘曲', '수율을') and sliding
 * 3/4-grams over longer runs. 2-grams are only generated for short runs — a
 * stray kana pair like 'ウェ' lifted from a long sentence matches dozens of
 * generic keywords and would drown the synonym/intent signal.
 */
function extractCjkTerms(normalized: string): QueryTerm[] {
  const out: QueryTerm[] = [];
  for (const run of normalized.match(CJK_RUN_G) ?? []) {
    if (run.length <= 4) out.push({ term: run, fromSynonym: false });
    for (let n = 3; n <= 4 && n <= run.length; n += 1) {
      for (let i = 0; i + n <= run.length; i += 1) {
        out.push({ term: run.slice(i, i + n), fromSynonym: false });
      }
    }
    if (run.length <= 3) {
      for (let i = 0; i + 2 <= run.length; i += 1) {
        out.push({ term: run.slice(i, i + 2), fromSynonym: false });
      }
    }
  }
  return out;
}

/** Expand the query through SYNONYM_MAP intent phrases. */
function expandSynonyms(normalized: string): QueryTerm[] {
  const padded = ` ${normalized} `;
  const out: QueryTerm[] = [];
  for (const [phrase, targets] of Object.entries(SYNONYM_MAP)) {
    const hit = hasCjk(phrase) ? normalized.includes(phrase) : padded.includes(` ${phrase} `);
    if (!hit) continue;
    for (const target of targets) {
      out.push({ term: target, fromSynonym: true });
    }
  }
  return out;
}

const WORD_BOUNDARY_CACHE = new Map<string, RegExp>();

/** Does a normalized haystack field contain the term? */
function fieldMatches(field: string, term: string): boolean {
  if (hasCjk(term) || term.includes(' ')) {
    return field.includes(term);
  }
  let boundary = WORD_BOUNDARY_CACHE.get(term);
  if (!boundary) {
    boundary = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    WORD_BOUNDARY_CACHE.set(term, boundary);
  }
  return boundary.test(field);
}

/** Merge term lists, dropping duplicates; a literal query token wins over its synonym twin. */
function dedupeTerms(terms: QueryTerm[]): QueryTerm[] {
  const byTerm = new Map<string, QueryTerm>();
  for (const entry of terms) {
    const existing = byTerm.get(entry.term);
    if (!existing) {
      byTerm.set(entry.term, entry);
    } else if (existing.fromSynonym && !entry.fromSynonym) {
      byTerm.set(entry.term, entry);
    }
  }
  return [...byTerm.values()];
}

/**
 * Match a free-text task description against the tool registry.
 *
 * Scoring per matched term: keyword hit +3, name hit +2, description hit +1
 * (cumulative across fields), plus +2 when the term was synonym-inferred.
 * Results need a positive score, are sorted by score (registry order breaks
 * ties) and capped at `limit`. Deterministic: no randomness, no clock.
 */
export function findToolsForQuery(
  query: string,
  locale: SupportedLocale,
  tools: Tool[],
  limit = 3,
): ToolMatch[] {
  const normalized = normalizeText(query);
  if (normalized.length < 2) return [];

  const literalTerms = [...extractLatinTerms(normalized), ...extractCjkTerms(normalized)].filter(
    (entry) => !STOPWORDS.has(entry.term),
  );
  const allTerms = dedupeTerms([...literalTerms, ...expandSynonyms(normalized)]);
  if (allTerms.length === 0) return [];

  const matches: ToolMatch[] = [];
  tools.forEach((tool) => {
    const { name, description, keywords } = getTranslatedTool(tool, locale);
    const nameLc = normalizeText(name);
    const descriptionLc = normalizeText(description);
    const keywordsLc = keywords.map((keyword) => normalizeText(keyword));

    let score = 0;
    const matchedTerms: string[] = [];
    for (const { term, fromSynonym } of allTerms) {
      const keywordHit = keywordsLc.some((keyword) => fieldMatches(keyword, term));
      const nameHit = fieldMatches(nameLc, term);
      const descriptionHit = fieldMatches(descriptionLc, term);
      if (!keywordHit && !nameHit && !descriptionHit) continue;

      score +=
        (keywordHit ? MATCH_WEIGHTS.keyword : 0) +
        (nameHit ? MATCH_WEIGHTS.name : 0) +
        (descriptionHit ? MATCH_WEIGHTS.description : 0) +
        (fromSynonym ? MATCH_WEIGHTS.synonym : 0);
      matchedTerms.push(term);
    }

    if (score > 0) matches.push({ tool, score, matchedTerms });
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}
