import type { SupportedLocale } from './context';

export interface Translations {
  // Navigation & Shell
  brandSubtitle: string;
  tools: string;
  toolbox: string;
  about: string;
  privacy: string;
  contact: string;
  favorites: string;
  searchPlaceholder: string;
  openToolbox: string;
  tryDieCalc: string;
  shareCalculation: string;
  linkCopied: string;
  printPdfReport: string;
  footerDisclaimer: string;
  openTool: string;
  newBadge: string;
  reset: string;
  copyResult: string;
  copied: string;

  // Categories
  catWaferDie: string;
  catYieldQuality: string;
  catMetrologyLayout: string;
  catThinFilmDeposition: string;
  catThermalDiffusion: string;
  catLithographyEtch: string;
  catRFSignal: string;
  catUnitConversion: string;
  catMarkTraceability: string;

  // Common UI
  inputs: string;
  results: string;
  notesAssumptions: string;
  formulaMethod: string;
  relatedTools: string;
  faq: string;
}

export const DICTIONARY: Record<SupportedLocale, Translations> = {
  en: {
    brandSubtitle: 'Semiconductor engineering tools',
    tools: 'Tools',
    toolbox: 'Toolbox',
    about: 'About',
    privacy: 'Privacy',
    contact: 'Contact',
    favorites: 'Favorites',
    searchPlaceholder: 'Search tools, formulas, units...',
    openToolbox: 'Open the toolbox',
    tryDieCalc: 'Try the die calculator',
    shareCalculation: 'Share calculation',
    linkCopied: 'Link copied',
    printPdfReport: 'Print / PDF Report',
    footerDisclaimer: 'SemiTools — semiconductor engineering tools, made clear. Every calculation runs in your browser; results are generic estimates unless a tool states otherwise.',
    openTool: 'Open tool',
    newBadge: 'New',
    reset: 'Reset',
    copyResult: 'Copy result',
    copied: 'Copied',

    catWaferDie: 'Wafer & Die',
    catYieldQuality: 'Yield & Quality',
    catMetrologyLayout: 'Metrology & Layout',
    catThinFilmDeposition: 'Thin Film & Deposition',
    catThermalDiffusion: 'Thermal & Diffusion',
    catLithographyEtch: 'Lithography & Etch',
    catRFSignal: 'RF & Signal',
    catUnitConversion: 'Unit Conversion',
    catMarkTraceability: 'Mark & Traceability',

    inputs: 'Inputs',
    results: 'Results',
    notesAssumptions: 'Notes and assumptions',
    formulaMethod: 'Formula and method',
    relatedTools: 'Related tools',
    faq: 'FAQ',
  },

  'zh-CN': {
    brandSubtitle: '半导体工程专业计算工具箱',
    tools: '计算工具',
    toolbox: '全部工具',
    about: '关于我们',
    privacy: '隐私协议',
    contact: '联系与反馈',
    favorites: '我的收藏',
    searchPlaceholder: '搜索计算工具、公式、物理单位...',
    openToolbox: '进入工具箱',
    tryDieCalc: '体验晶圆出芯数计算器',
    shareCalculation: '分享计算',
    linkCopied: '链接已复制',
    printPdfReport: '打印 / 导出 PDF 报告',
    footerDisclaimer: 'SemiTools — 纯前端本地运行的半导体工程工具箱。所有计算均在浏览器端完成，不上传机密工艺数据。',
    openTool: '打开工具',
    newBadge: '新功能',
    reset: '重置参数',
    copyResult: '复制计算结果',
    copied: '已复制',

    catWaferDie: '晶圆与芯片布局',
    catYieldQuality: '良率与质量可靠性',
    catMetrologyLayout: '量测与器件物理',
    catThinFilmDeposition: '薄膜与沉积工艺',
    catThermalDiffusion: '热处理与热设计',
    catLithographyEtch: '光刻与刻蚀工艺',
    catRFSignal: '射频与微波信号',
    catUnitConversion: '半导体常用单位换算',
    catMarkTraceability: '晶圆标刻与追溯',

    inputs: '输入参数',
    results: '计算结果',
    notesAssumptions: '计算说明与模型假设',
    formulaMethod: '计算公式与物理推导',
    relatedTools: '相关工程工具',
    faq: '常见问题与答疑',
  },

  'zh-TW': {
    brandSubtitle: '半導體工程專業計算工具箱',
    tools: '計算工具',
    toolbox: '全部工具',
    about: '關於我們',
    privacy: '隱私權政策',
    contact: '聯絡與反饋',
    favorites: '我的最愛',
    searchPlaceholder: '搜尋計算工具、公式、物理單位...',
    openToolbox: '進入工具箱',
    tryDieCalc: '體驗晶圓出芯數計算器',
    shareCalculation: '分享計算',
    linkCopied: '連結已複製',
    printPdfReport: '列印 / 匯出 PDF 報告',
    footerDisclaimer: 'SemiTools — 純前端本地運行的半導體工程工具箱。所有計算均在瀏覽器端完成，不傳輸機密製造數據。',
    openTool: '開啟工具',
    newBadge: '新功能',
    reset: '重設參數',
    copyResult: '複製計算結果',
    copied: '已複製',

    catWaferDie: '晶圓與晶粒佈局',
    catYieldQuality: '良率與品質可靠度',
    catMetrologyLayout: '量測與元件物理',
    catThinFilmDeposition: '薄膜與沉積製程',
    catThermalDiffusion: '熱處理與散熱設計',
    catLithographyEtch: '微影與蝕刻製程',
    catRFSignal: '射頻與微波訊號',
    catUnitConversion: '半導體常用單位轉換',
    catMarkTraceability: '晶圓標刻與生產追溯',

    inputs: '輸入參數',
    results: '計算結果',
    notesAssumptions: '計算說明與物理假設',
    formulaMethod: '計算公式與數學推導',
    relatedTools: '相關工程工具',
    faq: '常見問題與解答',
  },

  ko: {
    brandSubtitle: '반도체 엔지니어링 계산기 모음',
    tools: '엔지니어링 툴',
    toolbox: '전체 툴박스',
    about: '소개',
    privacy: '개인정보 보호',
    contact: '문의 및 제안',
    favorites: '즐겨찾기',
    searchPlaceholder: '계산기, 공식, 반도체 단위 검색...',
    openToolbox: '툴박스 둘러보기',
    tryDieCalc: '웨이퍼 다이 계산기',
    shareCalculation: '계산 공유',
    linkCopied: '링크 복사됨',
    printPdfReport: '보고서 인쇄 / PDF 저장',
    footerDisclaimer: 'SemiTools — 브라우저 내에서 안전하게 작동하는 반도체 엔지니어링 계산기입니다. 입력 데이터는 서버로 전송되지 않습니다.',
    openTool: '도구 열기',
    newBadge: '신규',
    reset: '초기화',
    copyResult: '결과 복사',
    copied: '복사 완료',

    catWaferDie: '웨이퍼 및 다이',
    catYieldQuality: '수율 및 품질 신뢰성',
    catMetrologyLayout: '계측 및 소자 물리',
    catThinFilmDeposition: '박막 및 증착 공정',
    catThermalDiffusion: '열공정 및 확산',
    catLithographyEtch: '포토리소그래피 및 식각',
    catRFSignal: 'RF 및 고주파 신호',
    catUnitConversion: '반도체 단위 변환',
    catMarkTraceability: '마킹 및 웨이퍼 추적',

    inputs: '입력 조건',
    results: '계산 결과',
    notesAssumptions: '참고 사항 및 가정',
    formulaMethod: '수식 및 방법론',
    relatedTools: '관련 엔지니어링 툴',
    faq: '자주 묻는 질문',
  },

  ja: {
    brandSubtitle: '半導体エンジニアリング計算ツール',
    tools: '計算ツール',
    toolbox: '全ツール一覧',
    about: 'SemiToolsについて',
    privacy: 'プライバシーポリシー',
    contact: 'お問い合わせ・報告',
    favorites: 'お気に入り',
    searchPlaceholder: 'ツール名、計算式、単位を検索...',
    openToolbox: 'ツールボックスを開く',
    tryDieCalc: 'ダイ取得数計算を試す',
    shareCalculation: '計算結果を共有',
    linkCopied: 'リンクをコピーしました',
    printPdfReport: '印刷 / PDFレポート出力',
    footerDisclaimer: 'SemiTools — ブラウザ上で完結する半導体エンジニア向け計算ツール。機密データがサーバーへ送信されることはありません。',
    openTool: 'ツールを開く',
    newBadge: '新着',
    reset: 'リセット',
    copyResult: '結果をコピー',
    copied: 'コピー完了',

    catWaferDie: 'ウェーハ＆ダイ設計',
    catYieldQuality: '歩留まり・信頼性品質',
    catMetrologyLayout: '計測・デバイス物理',
    catThinFilmDeposition: '薄膜・成膜プロセス',
    catThermalDiffusion: '熱処理・熱設計',
    catLithographyEtch: '露光・エッチング技術',
    catRFSignal: '高周波・RF信号伝送',
    catUnitConversion: '半導体単位変換',
    catMarkTraceability: 'レーザーマーキング・追跡',

    inputs: '入力パラメータ',
    results: '計算結果',
    notesAssumptions: '前提条件および注意点',
    formulaMethod: '計算式および理論',
    relatedTools: '関連ツール',
    faq: 'よくある質問',
  },
};

export function getTranslation(locale: SupportedLocale): Translations {
  return DICTIONARY[locale] ?? DICTIONARY.en;
}

export function translateCategory(categoryName: string, locale: SupportedLocale): string {
  const t = getTranslation(locale);
  switch (categoryName) {
    case 'Wafer & Die':
      return t.catWaferDie;
    case 'Yield & Quality':
      return t.catYieldQuality;
    case 'Metrology & Layout':
      return t.catMetrologyLayout;
    case 'Thin Film & Deposition':
      return t.catThinFilmDeposition;
    case 'Thermal & Diffusion':
      return t.catThermalDiffusion;
    case 'Lithography & Etch':
      return t.catLithographyEtch;
    case 'RF & Signal':
      return t.catRFSignal;
    case 'Unit Conversion':
      return t.catUnitConversion;
    case 'Mark & Traceability':
      return t.catMarkTraceability;
    default:
      return categoryName;
  }
}
