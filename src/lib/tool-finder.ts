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
 * localized tool dictionaries. Organized by registry category; every target
 * must be findable in at least one tool's localized fields (enforced by the
 * tool-finder test suite). Exported so tests can verify coverage.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  // ===========================================================================
  // Wafer & Die
  // ===========================================================================

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

  // --- Wafer map / bin layout ------------------------------------------------
  'wafer map': ['wafer map', 'die map', 'binning', '晶圆图', '웨이퍼 맵', 'ウェーハマップ'],
  'defect map': ['wafer map', 'binning', 'defect inspection', '결함 검사', '欠陥検査'],
  'pass fail die map': ['wafer map', 'die map', 'binning', '晶圆图', '다이 맵'],

  // --- Usable wafer area / edge exclusion --------------------------------------
  'usable wafer area': ['wafer area', 'usable area', 'surface area', '有效面积'],
  'wafer flat and notch': ['wafer area', 'flat', 'notch', 'usable area', 'オリフラ', '플랫존'],
  '晶圆有效面积': ['wafer area', '有效面积', '晶圆面积', '平边', '缺口'],
  '웨이퍼 유효 면적': ['wafer area', '유효 면적', '노치', '에지 제외'],

  // ===========================================================================
  // Mark & Traceability
  // ===========================================================================

  // --- Wafer laser mark / SEMI M12-M13 ----------------------------------------
  'wafer laser mark id': ['semi mark', 'wafer id', 'laser mark', 'checksum'],
  'semi m12 checksum': ['semi m12', 'semi m13', 'checksum', 'traceability'],
  '晶圆激光打标编号': ['wafer id', 'laser mark', '晶圆打标', '激光打标', '校验码'],
  '웨이퍼 레이저 마킹': ['wafer id', 'laser mark', '웨이퍼 마킹', '레이저 마킹', '체크섬'],
  'ウェーハ刻印チェック': ['semi mark', 'wafer id', 'レーザーマーク', 'チェックサム'],

  // ===========================================================================
  // Yield & Quality
  // ===========================================================================

  // --- Yield -----------------------------------------------------------------
  'my wafer yield': ['yield', 'pass rate', 'good die', 'fab yield', '晶圆良率', '웨이퍼 수율'],
  'wafer yield': ['yield', 'pass rate', 'good die', 'fab yield', '晶圆良率', '웨이퍼 수율'],
  'yield is low': ['yield', 'pass rate', 'good die', 'fab yield', 'yield loss', '良率损失'],
  'low yield': ['yield', 'pass rate', 'good die', 'fab yield', 'yield loss', '良率损失', '歩留まり低下'],
  '晶圆良率': ['yield', 'pass rate', '晶圆良率', '成品率'],
  '良率低': ['yield', '晶圆良率', '成品率', '良率损失'],
  '良率': ['yield', '晶圆良率', '成品率', '良率计算'],
  '歩留まりが低い': ['yield', '歩留まり', '良品率', '欠陥密度'],
  '歩留まり': ['yield', '歩留まり', '良品率', 'pass rate'],
  '웨이퍼 수율': ['yield', '웨이퍼 수율', '수율 계산', '양품률', 'pass rate'],
  '수율을 계산': ['yield', '수율 계산', '웨이퍼 수율', '양품률'],

  // --- Yield models (Murphy / Poisson / Seeds) ---------------------------------
  'murphy model comparison': ['yield model', 'murphy', 'seeds', 'bose einstein'],
  '良率模型对比': ['yield model', '良率模型', '墨菲模型', '泊松模型'],
  '歩留まりモデル比較': ['yield model', '歩留まりモデル', 'ポアソンモデル', 'マーフィーモデル'],
  '수율 모델 비교': ['yield model', '수율 모델', '포아송 모델', '머피 모델'],

  // --- Yield confidence on small samples ----------------------------------------
  'how confident is my yield': ['confidence interval', 'wilson score', 'clopper pearson', 'yield confidence'],

  // --- Yield ↔ DPPM ----------------------------------------------------------------
  'yield to dppm conversion': ['dppm', 'parts per million', 'defect rate', 'quality level'],

  // --- Wafer sort / binning ----------------------------------------------------------
  'wafer sort bin distribution': ['bin yield', 'wafer sort', 'binning statistics', 'multi bin'],

  // --- Split lot / DOE ------------------------------------------------------------------
  'split lot doe wafers': ['split lot', 'doe', 'design of experiments', 'recipe overlay'],
  '分批实验配方对比': ['split lot', 'doe', '分批实验', '实验设计', '配方对比'],

  // --- Solder joint thermal fatigue --------------------------------------------------------
  'solder joints cracking temperature cycling': [
    'coffin manson',
    'norris landzberg',
    'thermal fatigue',
    'solder joint',
    'temperature cycling',
  ],
  '焊点温度循环寿命': ['coffin manson', '热疲劳', '焊点寿命', '温度循环'],
  'はんだ接合の温度サイクル': ['coffin manson', '熱疲労', 'はんだ寿命', '温度サイクル試験'],
  '솔더 온도 사이클 수명': ['coffin manson', '열피로', '솔더 수명', '온도 사이클'],

  // --- Process capability / SPC -------------------------------------------------
  'process is capable': ['cpk', 'process capability', 'six sigma', 'specification limit', '制程能力'],
  'process capable': ['cpk', 'process capability', 'six sigma'],
  capable: ['cpk', 'process capability', 'six sigma', 'spc'],
  capability: ['process capability', 'cpk'],
  cpk: ['cpk', 'process capability', 'six sigma'],
  'sigma level': ['six sigma', 'process capability', 'cpk'],
  'control chart': ['spc control chart', 'control limits', 'nelson rules', 'xbar r', '控制图', '管理図', '관리도'],
  'in control': ['spc control chart', 'control limits', 'xbar r', 'nelson rules'],
  'out of control': ['spc', 'control chart', 'nelson rules', 'xbar r'],
  'western electric': ['spc', 'control chart', 'nelson rules'],
  'control limits': ['spc control chart', 'control limits', 'ucl', 'lcl'],
  '控制图': ['spc control chart', '控制图', '控制限', '过程受控'],
  '管理図': ['spc', '管理図', '管理限界', '控制图'],
  '관리도': ['spc control chart', '관리도', '관리한계'],

  // --- Throughput / OEE -----------------------------------------------------------
  'wafers per hour': ['wafers per hour', 'wph', 'throughput', '机台产能', '時間あたりウェーハ数', '시간당 생산량'],
  throughput: ['throughput', 'wph', 'tact time', 'equipment capacity'],
  oee: ['throughput', 'wph', '机台产能', '장비 생산성', 'スループット'],
  '产能': ['throughput', 'wph', '机台产能', '设备生产率'],
  'スループット': ['throughput', 'スループット', 'タクトタイム'],
  '스루풋': ['throughput', 'wph', '스루풋', '택트 타임'],

  // --- Reliability ------------------------------------------------------------------
  mtbf: ['mtbf', 'failure rate', 'fit', 'reliability', '平均无故障时间', '평균 무고장 시간'],
  'failure rate': ['failure rate', 'fit', 'mtbf', 'reliability', '失效率', '故障率', '고장률'],
  weibull: ['weibull', 'shape parameter', 'characteristic life', 'mttf', '威布尔分析', 'ワイブル解析', '와이블 분석'],

  // --- Sampling ------------------------------------------------------------------------
  'sample size': ['sample size', 'acceptance sampling', 'oc curve', 'sampling plan', 'サンプルサイズ', '샘플 크기'],
  'how many units to test': ['sample size', 'acceptance sampling', 'oc curve', 'sampling plan', '置信区间'],
  'acceptance sampling': ['acceptance sampling', 'oc curve', 'aql', 'lot acceptance', '抽样检验', '抜取検査', '샘플링 검사'],

  // ===========================================================================
  // Metrology & Layout
  // ===========================================================================

  // --- Sheet resistance / four point probe -----------------------------------------
  'sheet resistance': ['sheet resistance', 'four point probe', 'resistivity', 'ohms per square', '方阻', 'シート抵抗', '면저항'],
  'ohms per square': ['sheet resistance', 'ohms per square'],
  'four point probe': ['four point probe', 'sheet resistance', 'resistivity', '四探针', '四探針', '4탐침'],
  '方阻': ['sheet resistance', '方阻', '方块电阻', '四探针'],

  // --- Design rules / DRC -------------------------------------------------------------
  'design rule check before tapeout': ['drc', 'design rules', 'minimum width', 'minimum spacing'],
  '版图设计规则检查': ['drc', '设计规则', '版图检查', '线宽', '间距'],
  '設計ルールをチェック': ['drc', '設計ルール', 'レイアウトチェック', 'テープアウト'],
  'drc 설계 규칙 검사': ['drc', '설계 규칙', '레이아웃 검사', '테이프아웃'],

  // --- Layout parasitics / RC delay -------------------------------------------------------
  'rc delay and ir drop': ['layout parasitics', 'interconnect resistance', 'rc delay', 'ir drop', 'wire capacitance'],
  '版图寄生参数': ['layout parasitics', '寄生参数', 'rc延迟', '压降'],

  // --- MOSFET threshold -----------------------------------------------------------------
  'mosfet threshold voltage': ['threshold voltage', 'vth', 'flatband voltage', 'oxide capacitance'],
  '阈值电压': ['threshold voltage', 'vth', '阈值电压', '平带电压'],

  // --- Wafer test data (STDF / KLARF) ---------------------------------------------------
  'parse klarf wafer test data': ['stdf', 'klarf', 'ate datalog', 'wafer test'],
  'klarfファイル解析': ['stdf', 'klarf', 'テストデータ', 'ate データログ'],

  // --- Reticle field / stepper ------------------------------------------------------------
  'reticle field dies per shot': ['reticle field', 'stepper field', 'exposure field', 'die per shot'],
  'ステッパーの露光フィールド': ['reticle field', 'レチクル', '露光フィールド', 'ステッパー'],

  // --- Junction leakage / depletion -----------------------------------------------------
  'leakage current': ['depletion width', 'reverse bias', 'pn junction', 'junction capacitance', 'built in potential', '耗尽层宽度', 'pn结'],
  'reduce leaks': ['depletion width', 'reverse bias', 'pn junction', 'junction capacitance', 'built in potential'],
  leaky: ['depletion width', 'reverse bias', 'pn junction', 'built in potential'],
  '漏电流': ['depletion width', 'reverse bias', 'pn结', '耗尽层宽度'],
  '降低漏电': ['depletion width', 'reverse bias', 'pn结', '耗尽层宽度'],

  // --- Wire bonding -----------------------------------------------------------------------
  'wire bond': ['wire bonding', 'ball shear', 'wire pull', 'loop height', '引线键合', 'ワイヤボンディング', '와이어 본딩'],
  'fusing current': ['wire bonding', 'wire length', 'packaging'],

  // ===========================================================================
  // Lithography & Etch
  // ===========================================================================

  // --- Resolution / DoF --------------------------------------------------------------
  'smallest feature': ['resolution', 'rayleigh', 'numerical aperture', 'critical dimension', 'k1'],
  resolution: ['resolution', 'rayleigh', 'numerical aperture', 'depth of focus', '光刻分辨率', '解像度'],
  'depth of focus': ['depth of focus', 'dof', 'resolution', '焦深', '焦点深度'],
  'numerical aperture': ['numerical aperture', 'na', 'rayleigh', 'resolution'],

  // --- Etch rate / selectivity ---------------------------------------------------------
  'etch rate': ['etch rate', 'selectivity', 'wet etch', '刻蚀速率', 'エッチングレート', '식각율'],
  'etching rate': ['etch rate', 'selectivity', 'wet etch', '刻蚀速率', 'エッチングレート'],
  selectivity: ['etch rate', 'selectivity', '选择比', '選択比'],
  '刻蚀速率': ['etch rate', '刻蚀速率', '选择比'],
  'エッチングレート': ['etch rate', 'エッチングレート', '選択比'],
  '식각율': ['etch rate', '식각율', '선택비'],

  // --- ARDE / RIE lag / microloading ------------------------------------------------------
  'rie lag in deep trenches': ['arde', 'rie lag', 'microloading', 'aspect ratio'],
  '深孔刻蚀微负载': ['arde', '微负载效应', '深宽比', 'rie滞后'],
  'rieラグとマイクロローディング': ['arde', 'rieラグ', 'マイクロローディング', 'アスペクト比'],
  'rie 래그 마이크로로딩': ['arde', 'rie 래그', '마이크로로딩', '종횡비'],

  // --- CD uniformity ------------------------------------------------------------------------
  'cd uniformity across the wafer': ['cd uniformity', 'critical dimension', '3 sigma'],
  '线宽均匀性': ['cd uniformity', '线宽均匀性', '关键尺寸', '片内均一性'],
  'cd均一性を調べたい': ['cd uniformity', 'cd均一性', '線幅均一性', '面内ばらつき'],
  'cd 균일도 분석': ['cd uniformity', 'cd 균일도', '임계 선폭', '면내 균일도'],

  // --- Film thickness uniformity ---------------------------------------------------------------
  'film thickness uniformity': ['film uniformity', 'half range', 'thickness variation', 'ellipsometry'],
  '条纹均匀性': ['film uniformity', '膜厚均匀性', '薄膜均匀度', '椭偏仪'],
  '膜厚の面内均一性': ['film uniformity', '膜厚均一性', '面内均一性', 'ハーフレンジ'],

  // --- Plasma chamber etching -----------------------------------------------------------------
  'plasma etching in my chamber': ['plasma etch', 'plasma sheath', 'rie etch', 'icp plasma'],
  'etching silicon nitride': ['plasma etch', 'wet etch', 'selectivity', 'rie etch'],

  // --- Debye length / sheath -------------------------------------------------------------------
  'debye length': ['plasma sheath', 'debye length', 'bohm velocity', '德拜长度', 'デバイ長', '드바이 길이'],
  'plasma sheath': ['plasma sheath', 'debye length', 'child langmuir', '等离子体鞘层', 'プラズマシース', '플라즈마 시스'],

  // --- Wet clean chemistry (shared with Wet Process & Clean) ------------------------------------
  'rca clean': ['rca clean', 'sc1 clean', 'sc2 clean', 'piranha', 'rca清洗', 'rca洗浄', 'rca 세정'],
  'dilute hf': ['dilute hf', 'dhf', 'boe', 'buffered oxide etch', '氢氟酸', 'フッ酸', '불산'],
  'chemical dilution': ['chemical dilution', 'c1v1 c2v2', 'rca clean', '化学配比', '薬液希釈', '케미컬 희석'],

  // ===========================================================================
  // Thin Film & Deposition
  // ===========================================================================

  // --- Film / oxide color --------------------------------------------------
  'film color': ['film color', 'oxide thickness color', 'sio2 color', 'thin film interference', '薄膜颜色', '干涉色', '干渉色', '박막 색상'],
  'what color': ['film color', 'oxide thickness color', 'sio2 color', 'thin film interference', '薄膜颜色', '干涉色', '酸化膜色', '간섭색'],
  'oxide color': ['film color', 'oxide thickness color', 'sio2 color', '干涉色', '氧化层颜色'],
  'color of oxide': ['film color', 'oxide thickness color', 'sio2 color', '氧化层颜色'],
  'chromium color': ['film color', 'oxide thickness color', 'sio2 color', 'thin film interference'],
  'wafer color': ['film color', 'oxide thickness color', '干涉色', '酸化膜色'],
  '薄膜颜色': ['film color', 'oxide thickness color', '薄膜颜色', '干涉色', 'sio2颜色'],
  '薄膜是什么颜色': ['film color', 'oxide thickness color', '薄膜颜色', '干涉色'],
  '氧化层颜色': ['film color', 'oxide thickness color', '氧化层颜色', '干涉色'],
  '웨이퍼 색깔': ['film color', '간섭색', '산화막 색상표'],
  'ウェーハの色': ['film color', '干渉色', '薄膜色', '酸化膜色'],
  'ウェーハ色': ['film color', '干渉色', '薄膜色', '酸化膜色'],
  '薄膜の色': ['film color', '干渉色', '薄膜色', '酸化膜色'],
  '박막 색상': ['film color', '박막 색상', '간섭색', '산화막 색상표'],
  '산화막 색': ['film color', '간섭색', '산화막 색상표'],

  // --- Wafer warp / film stress -------------------------------------------
  'wafer warpage': ['wafer warp', 'wafer bow', 'film stress', 'curvature', '晶圆翘曲', '웨이퍼 와프', 'ウェーハワープ'],
  'wafer is bent': ['wafer warp', 'wafer bow', 'film stress', 'curvature', 'stoney', '晶圆翘曲', '晶圆弯曲'],
  'wafer bent': ['wafer warp', 'wafer bow', 'film stress', 'curvature', '晶圆弯曲'],
  'bent wafer': ['wafer warp', 'wafer bow', 'curvature', '晶圆弯曲'],
  warped: ['wafer warp', 'wafer bow', 'curvature', '晶圆翘曲'],
  bowed: ['wafer bow', 'wafer warp', 'curvature', '曲率半径'],
  'wafer warp': ['wafer warp', 'wafer bow', 'film stress', 'curvature'],
  'film stress': ['film stress', 'stoney', 'biaxial modulus', 'radius of curvature', '薄膜应力', '薄膜応力', '박막 응력'],
  'stress of my film': ['film stress', 'stoney', 'biaxial modulus', '薄膜应力'],
  'wafers keep slipping at the chuck': ['wafer warp', 'wafer bow', 'curvature'],
  '晶圆翘曲': ['wafer warp', 'wafer bow', '晶圆翘曲', '晶圆弯曲', '薄膜应力'],
  '晶圆弯曲': ['wafer warp', 'film stress', '晶圆弯曲', '晶圆翘曲', '曲率半径'],
  'ウェーハの反り': ['wafer warp', 'ウェーハワープ', 'ウェーハボウ', '薄膜応力'],
  'ウェーハが反る': ['wafer warp', 'ウェーハワープ', '薄膜応力', '曲率半径'],
  '박막 응력': ['film stress', '박막 응력', '인장 응력', '곡률 반경'],
  '웨이퍼 휨': ['wafer warp', '웨이퍼 와프', '웨이퍼 보우', '박막 응력'],

  // --- CMP removal rate ------------------------------------------------------
  'slurry remove rate': ['preston equation', 'removal rate', 'cmp', 'polishing rate', '材料去除率'],
  'slurry removal rate': ['preston equation', 'removal rate', 'cmp', 'polishing rate', '材料去除率'],
  'cmp removal rate': ['preston equation', 'removal rate', 'cmp'],
  'polishing rate': ['preston equation', 'removal rate', 'cmp', '化学机械抛光'],
  'polish rate': ['preston equation', 'removal rate', 'cmp'],
  '化学机械抛光': ['cmp', 'removal rate', '化学机械抛光', '材料去除率'],
  '去除率': ['cmp', 'removal rate', '材料去除率', '研磨速度'],
  '研磨レート': ['cmp', 'removal rate', '研磨速度', '化学機械研磨'],
  '제거율': ['cmp', 'removal rate', '제거율'],

  // --- CMP endpoint / pad life ---------------------------------------------------
  'cmp endpoint detection': ['cmp', 'endpoint', 'pad life', 'optical fringe', '终点检测'],
  '抛光终点检测': ['cmp', 'endpoint', '终点检测', '研磨垫寿命'],
  'cmp終点検出とパッド寿命': ['cmp', '終点検出', 'パッド寿命', 'コンディショニング'],
  'cmp 종말점 패드 수명': ['cmp', '종말점', '패드 수명', 'epd'],

  // --- Thermal budget / diffusion --------------------------------------------
  'temperature budget': ['thermal budget', 'drive in', 'diffusivity', '热预算', 'サーマルバジェット'],
  'thermal budget': ['thermal budget', 'drive in', 'junction depth', '热预算', 'サーマルバジェット', '열 예산'],
  '热预算': ['thermal budget', '热预算', 'drive in', '杂质扩散'],
  '温度预算': ['thermal budget', '热预算', 'drive in'],
  'サーマルバジェット': ['thermal budget', 'サーマルバジェット', '熱拡散'],

  // --- Oxide growth / thickness -------------------------------------------------------
  'grow oxide': ['thermal oxide', 'deal grove', 'silicon oxidation', 'oxide growth', '热氧化', '熱酸化'],
  'oxide growth': ['thermal oxide', 'deal grove', 'silicon oxidation', 'oxide growth'],
  'oxidation time': ['thermal oxide', 'deal grove', 'silicon oxidation', '氧化层厚度'],
  'oxide thickness': ['oxide thickness', 'thermal oxide', 'film thickness', '氧化层厚度', '酸化膜厚'],
  'wet oxidation steam': ['thermal oxide', 'wet h2o', 'dry o2', 'silicon oxidation'],
  '湿氧氧化厚度': ['thermal oxide', '湿氧氧化', '干氧氧化', '热氧化'],
  '氧化层厚度': ['thermal oxide', 'silicon oxidation', '氧化层厚度'],

  // --- Defects / yield models ----------------------------------------------------------
  'defect density': ['defect density', 'd0', 'poisson', 'killer defect', '缺陷密度', '欠陥密度', '결함 밀도'],
  'cost per die': ['cost per good die', 'die cost', 'wafer cost', '芯片成本', 'チップ原価', '다이 원가'],
  'die cost': ['cost per good die', 'die cost', 'wafer cost'],
  'how much does a die cost': ['cost per good die', 'die cost', 'wafer cost', '芯片成本'],
  'wafer cost': ['wafer cost', 'cost per good die', 'die cost', '晶圆成本'],

  // --- ALD ---------------------------------------------------------------------------------
  'ald cycle': ['ald cycle', 'atomic layer deposition', 'gpc', 'growth per cycle', 'ald周期', 'aldサイクル', 'ald 사이클'],
  'atomic layer deposition': ['atomic layer deposition', 'ald cycle', 'gpc', 'precursor exposure'],
  'ald purge and pulse timing': ['ald cycle', 'purge time', 'pulse time', 'precursor exposure'],
  '原子层沉积吹扫时间': ['ald cycle', '原子层沉积', '吹扫时间', '脉冲时间'],

  // --- CVD / epitaxy ------------------------------------------------------------------------
  'deposition rate': ['growth rate', 'cvd', 'mass transfer', '外延生长速率', '成長速度'],
  epitaxy: ['epitaxy', 'epi', 'growth rate', 'cvd', '外延'],
  'silane cvd growth rate': ['cvd', 'silane', 'growth rate', 'lpcvd', 'teos'],
  '硅烷外延沉积': ['cvd', '硅烷', '外延生长速率', '化学气相沉积'],
  'シランガスの成長速度': ['cvd', '成長速度', 'シラン', '化学気相成長'],

  // --- Copper plating / damascene ---------------------------------------------------------------
  'copper plating': ['copper plating', 'electroplating', 'damascene', 'current density', '电镀', '전기도금'],
  electroplating: ['electroplating', 'copper plating', 'faraday law', 'damascene'],
  'damascene trench superfill void': ['copper plating', 'superfilling', 'damascene', 'terminal effect'],
  '铜电镀填孔': ['copper plating', '电镀', '超充填', '大马士革'],
  'ダマシンのスーパーフィリング': ['copper plating', 'ダマシン', 'スーパーフィリング', '電解めっき'],

  // ===========================================================================
  // Thermal & Diffusion
  // ===========================================================================

  // --- Ion implant / doping ----------------------------------------------------------------
  'ion implant': ['ion implantation', 'projected range', 'straggle', 'doping profile', '离子注入', 'イオン注入', '이온 주입'],
  'implant dose': ['ion implantation', 'projected range', 'straggle', '注入剂量'],
  'how deep does the implant go': ['ion implantation', 'projected range', 'straggle', 'doping profile'],
  'junction depth after drive in': ['junction depth', 'xj', 'drive in', 'predeposition'],

  // --- Diffusion length ------------------------------------------------------------------------
  'diffusion length after anneal': ['diffusion length', 'diffusivity', 'fick law'],
  '拡散長を計算': ['diffusion length', '拡散長', '不純物拡散', 'アニール'],

  // --- Arrhenius / activation energy --------------------------------------------------------------
  'activation energy from two temperatures': ['activation energy', 'arrhenius', 'reaction rate', 'prefactor'],
  '活化能计算': ['activation energy', 'arrhenius', '活化能', '指前因子'],

  // --- Curve fitting / parameter extraction ----------------------------------------------------------
  'fit oxidation data to a curve': ['curve fitting', 'linear regression', 'parameter extraction', 'kinetics'],
  '数据拟合提取参数': ['curve fitting', '曲线拟合', '线性回归', '参数拟合'],

  // --- Carrier mobility ------------------------------------------------------------------------------
  'carrier mobility vs doping': ['carrier mobility', 'electron mobility', 'drift velocity', 'hole mobility'],
  '캐리어 이동도': ['carrier mobility', '캐리어 이동도', '전자 이동도', '드리프트 속도'],

  // --- Package thermal resistance ----------------------------------------------------------------------
  'junction temperature too hot': ['thermal resistance', 'junction temperature', 'theta jc', 'heat dissipation'],
  '结温热阻': ['thermal resistance', '热阻', '结温计算', '散热设计'],
  '접합 온도 열저항': ['thermal resistance', '열저항', '접합 온도', '방열 설계'],

  // ===========================================================================
  // RF & Signal
  // ===========================================================================

  // --- Impedance matching / VSWR --------------------------------------------------
  'match impedance': ['impedance match', 'vswr', 'return loss', 'matching network', 'reflection coefficient', '阻抗匹配', 'インピーダンス整合', '임피던스 매칭'],
  'impedance 50 ohm': ['impedance match', 'vswr', 'return loss'],
  'impedance matching': ['impedance match', 'l section', 'rf matching', '阻抗匹配'],
  'return loss': ['return loss', 'vswr', 'reflection coefficient', 's11', '回波损耗', '반사손실'],
  vswr: ['return loss', 'vswr', 'reflection coefficient', 's11', '驻波比', '정재파비'],
  'standing wave': ['return loss', 'vswr', 's11', '定在波比', '驻波比'],
  'smith chart l network': ['smith chart', 'l section', 'rf matching'],
  '驻波比': ['return loss', 'vswr', '驻波比', '反射系数'],
  '回波损耗': ['return loss', 'vswr', '回波损耗', '反射系数'],
  '임피던스 매칭': ['impedance match', '임피던스 매칭', '매처', '반사손실'],
  'インピーダンス整合': ['impedance match', 'インピーダンス整合', 'マッチャー', 'リターンロス'],

  // --- RF power / reflected power -------------------------------------------------------
  'too much reflected power': ['reflected power', 'forward power', 'absorbed power'],
  '反射功率太大': ['reflected power', '反射功率', '前向功率', '吸收功率'],

  // --- Microstrip / transmission lines ------------------------------------------------------
  'microstrip trace width': ['microstrip', 'characteristic impedance', 'z0', 'dielectric constant'],
  '微带线阻抗': ['microstrip', '微带线', '特性阻抗', '介电常数'],
  '마이크로스트립 임피던스': ['microstrip', '마이크로스트립', '특성 임피던스', '전송선로'],
  'single stub tuner': ['stub tuner', 'single stub', 'quarter wave', 'transmission line'],
  'シングルスタブ整合': ['stub tuner', 'シングルスタブ', 'スタブ整合', '伝送線路'],

  // ===========================================================================
  // Unit Conversion
  // ===========================================================================

  // --- Pressure / temperature / flow ------------------------------------------------
  'torr to mbar': ['pressure converter', 'torr', 'mbar', 'mtorr', '真空度'],
  'mtorr to pascal': ['pressure converter', 'mtorr', 'pascal', 'torr', '真空度'],
  'celsius to fahrenheit': ['temperature', 'celsius', 'fahrenheit', '温度换算'],
  kelvin: ['kelvin', 'celsius', 'temperature', '开尔文', 'ケルビン', '켈빈'],
  sccm: ['sccm', 'slm', 'mass flow controller', 'mfc'],
  'mfc sccm standard conditions': ['mass flow controller', 'mfc', 'sccm', 'slm', '气体流量'],

  // --- Thickness / power / time constant ---------------------------------------------
  'angstrom to nanometer': ['angstrom', 'nanometer', 'film thickness'],
  '옹스트롬 나노미터': ['angstrom', 'nanometer', '옹스트롬', '나노미터', '두께 변환'],
  'dbm to watts': ['dbm', 'watts', 'vpp'],
  'rc time constant': ['time constant', 'rc circuit', 'rise time', 'cutoff frequency'],
  '時定数を計算': ['time constant', '時定数', 'rc回路', '立ち上がり時間'],

  // --- Cleanroom ---------------------------------------------------------------------------
  'cleanroom class': ['cleanroom', 'iso class', 'particle count', 'airborne particulate', '洁净室等级', 'クリーンルーム', '클린룸 등급'],
  'iso 5': ['iso class', 'particle count', 'cleanroom'],

  // ===========================================================================
  // Wet Process & Clean
  // ===========================================================================

  // --- Bath lifetime / chemical spike --------------------------------------------
  'hydrofluoric bath lifetime': ['bath life', 'etch bath', 'chemical spike', 'wet bench'],
  'chemical spike after bath reload': ['chemical spike', 'bath life', 'spm', 'etch bath'],
  '药液槽寿命': ['bath life', '槽寿命', '药液补加', '刻蚀槽'],
  'フッ酸バスの寿命': ['bath life', 'バス寿命', '薬液補充', 'エッチング槽'],
  '불산 배스 수명': ['bath life', '배스 수명', '약액 보충', '식각조'],
  '웨이퍼 오염 제거': ['약액 보충', '배스 수명', '식각조', '웨트 벤치'],

  // --- Piranha ----------------------------------------------------------------------
  piranha: ['piranha', 'spm', 'rca clean', '皮拉尼亚', 'ピラニア洗浄', '피라냐'],
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
