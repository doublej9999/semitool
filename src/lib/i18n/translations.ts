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
  skipToContent: string;
  closeToolMenu: string;
  openToolMenu: string;
  showToolMenu: string;
  hideToolMenu: string;
  homeTitle: string;
  githubRepo: string;
  footerTagline: string;

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
  valueLabel: string;
  equalTo: string;
  unitColumn: string;
  valueColumn: string;
  copyTable: string;
  noFavorites: string;
  addToFavorites: string;
  removeFromFavorites: string;

  // Command Palette
  cmdPlaceholder: string;
  cmdTools: string;
  cmdQuickLinks: string;
  cmdNavigate: string;
  cmdOpen: string;
  cmdClose: string;
  cmdNoResults: string;
  cmdAllTools: string;
  cmdAllToolsDesc: string;
  cmdAbout: string;
  cmdAboutDesc: string;
  cmdPrivacy: string;
  cmdPrivacyDesc: string;
  cmdContact: string;
  cmdContactDesc: string;
  cmdGithub: string;
  cmdGithubDesc: string;

  // PWA & Status
  installPwa: string;
  installPwaTitle: string;
  offlineStatus: string;
  offlineReady: string;
  offlineTooltip: string;
  onlineReadyTooltip: string;

  // CSV Batch Upload
  csvDropPrompt: string;
  csvLoadedSuccess: string;
  csvUploadBtn: string;
  csvExportBtn: string;
  csvExportTitle: string;
  csvMetricMean: string;
  csvMetricMin: string;
  csvMetricMax: string;
  csvMetricRange: string;
  csvMetricSigma: string;
  csvMetricUniformity: string;

  // Tool Explorer
  filterToolsAria: string;
  noToolMatches: string;
  toolsPageKicker: string;
  toolsPageTitle: string;
  toolsPageLead: string;

  // Home Page
  heroKicker: string;
  heroTitle: string;
  heroLead: string;
  statTools: string;
  statClientSide: string;
  statLengthUnits: string;
  statZeroLogins: string;
  favoritesTitle: string;
  favoritesSubtitle: string;
  newToolsTitle: string;
  newToolsSubtitle: string;
  allToolsTitle: string;
  allToolsSubtitle: string;
  toolboxView: string;
  principlesTitle: string;
  principlesSubtitle: string;
  principle1Title: string;
  principle1Desc: string;
  principle2Title: string;
  principle2Desc: string;
  principle3Title: string;
  principle3Desc: string;
  homeFaqTitle: string;
  homeFaq1Q: string;
  homeFaq1A: string;
  homeFaq2Q: string;
  homeFaq2A: string;
  homeFaq3Q: string;
  homeFaq3A: string;

  // Engineering Traveler
  travelerBtn: string;
  travelerBtnTitle: string;
  travelerModalTitle: string;
  travelerPrintBtn: string;
  travelerCloseBtn: string;
  travelerLotId: string;
  travelerWaferIds: string;
  travelerRecipe: string;
  travelerChamber: string;
  travelerOperator: string;
  travelerTargetSpec: string;
  travelerNotes: string;
  travelerInputsHeading: string;
  travelerResultsHeading: string;
  travelerPreCheck: string;
  travelerProcessRun: string;
  travelerPostMetrology: string;
  travelerSignOff: string;

  // Fab Scratchpad
  scratchpadBtnTitle: string;
  scratchpadTitle: string;
  scratchpadTabConverters: string;
  scratchpadTabNotes: string;
  scratchpadQuickMath: string;
  scratchpadQuickMathPlaceholder: string;
  scratchpadPressureTitle: string;
  scratchpadThicknessTitle: string;
  scratchpadTempTitle: string;
  scratchpadRfTitle: string;
  scratchpadWaferDiam: string;
  scratchpadRfPower: string;
  scratchpadPowerDensity: string;
  scratchpadCopyNotes: string;
  scratchpadDownloadTxt: string;
  scratchpadClearNotes: string;
  scratchpadInsertRecipe: string;
  scratchpadInsertLog: string;
  scratchpadInsertSplit: string;
  scratchpadPlaceholderNotes: string;

  // Engineering Handbook
  handbookBtnTitle: string;
  handbookTitle: string;
  handbookTabFormulas: string;
  handbookTabConstants: string;
  handbookTabMaterials: string;
  handbookTabCleanroom: string;
  handbookSearchPlaceholder: string;
  handbookClose: string;
  handbookPropertyCol: string;
  handbookOpenCalc: string;

  // About, Privacy, Contact prose pages
  aboutEyebrow: string;
  aboutHeading: string;
  aboutLead: string;
  aboutSec1Title: string;
  aboutSec1Text: string;
  aboutSec2Title: string;
  aboutSec2Text: string;
  aboutSec3Title: string;
  aboutSec3Text: string;

  privacyEyebrow: string;
  privacyHeading: string;
  privacyLead: string;
  privacySec1Title: string;
  privacySec1Text: string;
  privacySec2Title: string;
  privacySec2Text: string;
  privacySec3Title: string;
  privacySec3Text: string;

  contactEyebrow: string;
  contactHeading: string;
  contactLead: string;
  contactBugTitle: string;
  contactBugLink: string;
  contactSourceTitle: string;
  contactReportTitle: string;
  contactReportText: string;
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
    skipToContent: 'Skip to content',
    closeToolMenu: 'Close tool menu',
    openToolMenu: 'Open tool menu',
    showToolMenu: 'Show tool menu',
    hideToolMenu: 'Hide tool menu',
    homeTitle: 'Home',
    githubRepo: 'GitHub repository',
    footerTagline: 'Semiconductor engineering tools, made clear. Every calculation runs in your browser; results are generic estimates unless a tool states otherwise.',

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
    valueLabel: 'Value',
    equalTo: 'Equal to',
    unitColumn: 'Unit',
    valueColumn: 'Value',
    copyTable: 'Copy table',
    noFavorites: 'No favorites yet. Use the star on a tool card — or press Ctrl / ⌘ + K to search — and your most-used tools will be listed here on every visit.',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',

    cmdPlaceholder: 'Search tools, formulas, units (Ctrl+K)...',
    cmdTools: 'Tools',
    cmdQuickLinks: 'Quick links',
    cmdNavigate: 'Navigate',
    cmdOpen: 'Open',
    cmdClose: 'Close',
    cmdNoResults: 'No tools or pages match',
    cmdAllTools: 'All tools',
    cmdAllToolsDesc: 'Browse every SemiTools calculator',
    cmdAbout: 'About SemiTools',
    cmdAboutDesc: 'How these calculations work and their limits',
    cmdPrivacy: 'Privacy',
    cmdPrivacyDesc: 'What data is and is not collected',
    cmdContact: 'Contact',
    cmdContactDesc: 'Send a correction or feature request',
    cmdGithub: 'GitHub repository',
    cmdGithubDesc: 'Source code and issue tracker',

    installPwa: 'Install PWA',
    installPwaTitle: 'Install SemiTools to desktop or mobile for offline cleanroom access',
    offlineStatus: 'Offline',
    offlineReady: 'Offline Ready',
    offlineTooltip: 'Offline cleanroom mode: SemiTools is cached and running entirely client-side',
    onlineReadyTooltip: 'SemiTools is offline-ready via client-side Service Worker cache',

    csvDropPrompt: 'Drop raw metrology CSV/TSV file or import from machine',
    csvLoadedSuccess: 'Loaded readings from CSV!',
    csvUploadBtn: 'Upload CSV',
    csvExportBtn: 'Export CSV',
    csvExportTitle: 'Export summary results as RFC 4180 CSV report',
    csvMetricMean: 'Mean',
    csvMetricMin: 'Minimum',
    csvMetricMax: 'Maximum',
    csvMetricRange: 'Range',
    csvMetricSigma: 'Sample Sigma (1σ)',
    csvMetricUniformity: 'Uniformity (± Half Range %)',

    filterToolsAria: 'Filter tools',
    noToolMatches: 'No tool matches. Try “wafer”, “die”, “yield”, “mark”, “nm” or “export”.',
    toolsPageKicker: 'Toolbox',
    toolsPageTitle: 'Every SemiTools calculator',
    toolsPageLead: 'Focused tools, each with explicit units, its formula on the page and a stated scope. Filter by name, keyword or unit — the list updates as you type and stays fully keyboard navigable.',

    heroKicker: 'Semiconductor engineering tools',
    heroTitle: 'Wafer tools that show their work.',
    heroLead: 'Wafer marks, gross die estimates, interactive wafer maps, yield, capability, throughput, cost, films, layout, lithography, etch, thin films, diffusion, power, RF, matching, yield, reliability and unit conversion: focused tools with explicit units, the formula on the page and no server round trip. Nothing is uploaded, and no result is dressed up as an industry standard it is not.',
    statTools: 'tools',
    statClientSide: 'client-side',
    statLengthUnits: 'length units, Å to m',
    statZeroLogins: 'logins required',
    favoritesTitle: 'Your favorites',
    favoritesSubtitle: 'Starred tools are stored in this browser only.',
    newToolsTitle: 'New in this release',
    newToolsSubtitle: 'The newest additions to the toolbox.',
    allToolsTitle: 'All tools',
    allToolsSubtitle: 'Grouped by the part of the flow they support.',
    toolboxView: 'Toolbox view',
    principlesTitle: 'How these tools are built',
    principlesSubtitle: 'Three rules that decide what ships.',
    principle1Title: 'Units or it does not ship',
    principle1Desc: 'Every input and output carries its unit — length, pressure, flow, temperature, percentage, die count — and a length can be typed in ångström through to metres, so a result cannot be misread by whoever picks it up next.',
    principle2Title: 'Keyboard first',
    principle2Desc: 'Press Ctrl / ⌘ + K to jump to any tool, arrow keys to move through results and Enter to open. Forms are labelled, focus-visible and screen-reader friendly.',
    principle3Title: 'Readable on the line',
    principle3Desc: 'Mobile-first layouts, no giant hero, no animation for its own sake. It works on a tablet held next to a tool and on a desktop used for review.',
    homeFaqTitle: 'Frequently asked',
    homeFaq1Q: 'Where does the calculation run?',
    homeFaq1A: 'Every calculator runs in your browser. Inputs are never posted to a server, which is why no account, cookie banner or database is needed.',
    homeFaq2Q: 'Are these results fab standards?',
    homeFaq2A: 'No. Each tool documents its formula and assumptions and states plainly where a result is a generic estimate. Always verify against your own controlled process documentation before using a number in production.',
    homeFaq3Q: 'Which units are used?',
    homeFaq3A: 'Every field carries its unit. Lengths can be entered in ångström, nanometres, micrometres, mils, millimetres, centimetres, inches or metres and are converted exactly, so a result cannot be misread. Pressure, gas flow and temperature have dedicated converters that state their reference conditions.',

    travelerBtn: 'Run Sheet / Traveler',
    travelerBtnTitle: 'Generate Cleanroom Wafer Traveler / Run-Sheet',
    travelerModalTitle: 'Cleanroom Engineering Traveler / Run-Sheet',
    travelerPrintBtn: 'Print / Save PDF',
    travelerCloseBtn: 'Close',
    travelerLotId: 'Lot ID',
    travelerWaferIds: 'Wafer IDs',
    travelerRecipe: 'Recipe / Process Step',
    travelerChamber: 'Tool / Chamber ID',
    travelerOperator: 'Operator / Engineer',
    travelerTargetSpec: 'Target Specification',
    travelerNotes: 'Special Process Notes & Precautions',
    travelerInputsHeading: 'Process Inputs',
    travelerResultsHeading: 'Process Results',
    travelerPreCheck: 'Pre-check Inspection',
    travelerProcessRun: 'Process Run Verified',
    travelerPostMetrology: 'Post-metrology Completed',
    travelerSignOff: 'Engineer Sign-off',

    scratchpadBtnTitle: 'Fab Scratchpad & Engineering Quick Converters',
    scratchpadTitle: 'Fab Engineering Scratchpad',
    scratchpadTabConverters: 'Instant Fab Converters',
    scratchpadTabNotes: 'Engineering Scratchpad',
    scratchpadQuickMath: 'QUICK MATH EXPRESSION',
    scratchpadQuickMathPlaceholder: 'e.g. 300 * 0.08 / 1.25 or 2 * 3.14159 * 150',
    scratchpadPressureTitle: 'Cleanroom Vacuum & Pressure',
    scratchpadThicknessTitle: 'Thin Film Thickness & Depth',
    scratchpadTempTitle: 'Thermal & Process Temperature',
    scratchpadRfTitle: 'RF Power Density (Wafer Surface)',
    scratchpadWaferDiam: 'Wafer Diameter',
    scratchpadRfPower: 'RF Power (Watts)',
    scratchpadPowerDensity: 'Power Density',
    scratchpadCopyNotes: 'Copy Notes',
    scratchpadDownloadTxt: 'Download .txt',
    scratchpadClearNotes: 'Clear Notes',
    scratchpadInsertRecipe: 'Insert Recipe Stamp',
    scratchpadInsertLog: 'Insert Inspection Log',
    scratchpadInsertSplit: 'Insert DOE Split Note',
    scratchpadPlaceholderNotes: 'Use this pad to jot down quick process splits, chamber metrology values, recipe setpoints or shift handover notes. Stored locally in your browser.',

    handbookBtnTitle: 'Semiconductor Engineering Handbook & Formulas',
    handbookTitle: 'Fab Engineering Handbook',
    handbookTabFormulas: 'Key Formulas',
    handbookTabConstants: 'Physical Constants',
    handbookTabMaterials: 'Material Properties',
    handbookTabCleanroom: 'Cleanroom ISO Classes',
    handbookSearchPlaceholder: 'Search formulas, constants, materials...',
    handbookClose: 'Close Handbook',
    handbookPropertyCol: 'Property',
    handbookOpenCalc: 'Open Calculator',

    aboutEyebrow: 'ABOUT',
    aboutHeading: 'Engineering tools, without the friction.',
    aboutLead: 'SemiTools is a focused collection of browser-based calculators for semiconductor engineers, equipment engineers, yield engineers and students.',
    aboutSec1Title: 'Transparent by design',
    aboutSec1Text: 'Inputs are processed locally in your browser. Each tool explains its formula and assumptions so you can check the result before using it in your workflow.',
    aboutSec2Title: 'Generic calculations',
    aboutSec2Text: 'Results may not match a specific fab, customer, equipment, MES or manufacturing specification. Always verify against your controlled process documentation.',
    aboutSec3Title: 'Source code',
    aboutSec3Text: 'The project is open source. Issues, formula corrections and tool requests are handled on GitHub.',

    privacyEyebrow: 'PRIVACY',
    privacyHeading: 'Privacy & Data Protection',
    privacyLead: 'SemiTools runs entirely in your browser, stores your favorites locally and keeps no server-side copy of your calculations.',
    privacySec1Title: 'Local processing',
    privacySec1Text: 'Calculations run in your browser engine. Do not enter restricted proprietary recipe parameters if organizational policies forbid it. No data is stored on remote servers.',
    privacySec2Title: 'What is stored on your device',
    privacySec2Text: 'Only your UI preferences are stored, in this browser local storage: the tools you starred as favorites, collapsed categories, and local scratchpad notes. None are transmitted.',
    privacySec3Title: 'No analytics or trackers',
    privacySec3Text: 'No third-party analytics, behavioral tracking or advertising scripts are loaded across these tool pages.',

    contactEyebrow: 'CONTACT',
    contactHeading: 'Contact & Feedback',
    contactLead: 'Found an incorrect formula, an unclear unit or a useful tool idea? Open an issue on the project tracker.',
    contactBugTitle: 'Bug report or formula correction',
    contactBugLink: 'Open a GitHub issue',
    contactSourceTitle: 'Source code and repository',
    contactReportTitle: 'When reporting a calculation issue',
    contactReportText: 'Include the tool name, exact inputs with units, the result you expected, the result you obtained, and any relevant engineering textbook or fab spec reference.',
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
    skipToContent: '跳转至主要内容',
    closeToolMenu: '关闭工具导航菜单',
    openToolMenu: '打开工具导航菜单',
    showToolMenu: '展开工具侧边栏',
    hideToolMenu: '折叠工具侧边栏',
    homeTitle: '首页',
    githubRepo: 'GitHub 开源仓库',
    footerTagline: '半导体工程专业计算工具箱。所有计算均在浏览器端完成，纯前端本地运算，保障工艺机密。计算结果为通用模型推算，实际生产请以厂内受控文件为准。',

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
    valueLabel: '数值',
    equalTo: '换算结果等于',
    unitColumn: '物理单位',
    valueColumn: '对应数值',
    copyTable: '复制全表数据',
    noFavorites: '暂无收藏工具。点击工具卡片右上角星标（或按 Ctrl / ⌘ + K 快捷键搜索）即可添加常用工具，方便随时调用。',
    addToFavorites: '添加至收藏',
    removeFromFavorites: '取消收藏',

    cmdPlaceholder: '搜索工具、公式、物理单位 (Ctrl+K)...',
    cmdTools: '工程工具',
    cmdQuickLinks: '快捷链接',
    cmdNavigate: '导航',
    cmdOpen: '打开',
    cmdClose: '关闭',
    cmdNoResults: '未找到匹配的工具或页面',
    cmdAllTools: '全部工具箱',
    cmdAllToolsDesc: '浏览 SemiTools 收录的全部半导体计算器',
    cmdAbout: '关于 SemiTools',
    cmdAboutDesc: '了解计算逻辑、算法背景与设计理念',
    cmdPrivacy: '隐私与安全声明',
    cmdPrivacyDesc: '纯前端本地计算，不上传任何工艺机密',
    cmdContact: '联系与反馈',
    cmdContactDesc: '提交公式修正建议或新增工具需求',
    cmdGithub: 'GitHub 开源仓库',
    cmdGithubDesc: '查看源代码与提交 Issue 跟踪',

    installPwa: '安装离线桌面版 (PWA)',
    installPwaTitle: '将 SemiTools 安装到桌面或移动设备，支持洁净室完全离线运行',
    offlineStatus: '离线模式',
    offlineReady: '离线就绪',
    offlineTooltip: '洁净室离线模式：SemiTools 已完成本地缓存，纯客户端独立运行',
    onlineReadyTooltip: 'SemiTools 已通过 Service Worker 完成本地缓存，随时支持离线使用',

    csvDropPrompt: '拖拽量测 CSV/TSV 文件至此，或从量测机台直接导入',
    csvLoadedSuccess: '已成功从 CSV 载入数据！',
    csvUploadBtn: '导入 CSV 数据',
    csvExportBtn: '导出 CSV 报表',
    csvExportTitle: '导出符合 RFC 4180 标准的工程量测 CSV 报告',
    csvMetricMean: '平均值 (Mean)',
    csvMetricMin: '最小值 (Minimum)',
    csvMetricMax: '最大值 (Maximum)',
    csvMetricRange: '极差 (Range)',
    csvMetricSigma: '样本标准差 (1σ)',
    csvMetricUniformity: '均匀性 (±半极差 %)',

    filterToolsAria: '过滤计算工具',
    noToolMatches: '未找到匹配的工具。请尝试搜索“晶圆”、“芯片”、“良率”、“刻蚀”、“薄膜”或物理单位。',
    toolsPageKicker: '工程计算工具箱',
    toolsPageTitle: '全部半导体工程计算器',
    toolsPageLead: '每个工具均明确标明物理单位、公式逻辑与适用范围。支持名称、关键词或物理量快速检索，键盘友好，纯前端计算。',

    heroKicker: '半导体工程专业计算工具箱',
    heroTitle: '计算推导透明可查的晶圆制程工具箱。',
    heroLead: '涵盖晶圆激光标刻、出芯数预估、交互式晶圆图谱、良率模型、制程能力分析、机台产能、芯片成本、薄膜应力、微影光刻、等离子刻蚀、热扩散、射频匹配及半导体物理单位换算。公开所有计算推导，不上传任何机密数据，结果客观严谨。',
    statTools: '个专业工具',
    statClientSide: '纯前端本地运行',
    statLengthUnits: '种长度单位 (Å 到 m)',
    statZeroLogins: '无需注册登录',
    favoritesTitle: '我的常用工具',
    favoritesSubtitle: '已收藏的工具仅存储于当前浏览器本地缓存。',
    newToolsTitle: '最新上线工具',
    newToolsSubtitle: '半导体工程工具箱近期新增的计算与量测模块。',
    allToolsTitle: '全部工程工具',
    allToolsSubtitle: '按半导体前道与后道工艺流程分类排列。',
    toolboxView: '进入完整工具箱',
    principlesTitle: '我们的工程构建原则',
    principlesSubtitle: '决定工具交付质量的三大底线标准。',
    principle1Title: '严格标明物理量与单位',
    principle1Desc: '每个输入和输出均附带严谨物理单位（长度、真空度、流量、温度、芯片数），长度支持埃米至米任意换算，彻底杜绝量纲误读。',
    principle2Title: '键盘操作与高效检索优先',
    principle2Desc: '随时按下 Ctrl / ⌘ + K 快捷键穿梭于各个工具，方向键即刻选择，回车开启。表单语义完整，无障碍友好。',
    principle3Title: '洁净室机台旁清晰可用',
    principle3Desc: '移动端优先适配，杜绝华而不实的动画特效。无论在黄光区/蚀刻机台旁使用平板，还是在工程办公室评审，都保持极佳阅读性。',
    homeFaqTitle: '常见问题解答',
    homeFaq1Q: '计算是在哪里运行的？',
    homeFaq1A: '每个计算器都在您的本地浏览器中直接运算。工艺参数绝不上传云端，因此无需注册登录、无 Cookie 隐私弹窗，严格保护工艺数据安全。',
    homeFaq2Q: '计算结果可以直接作为晶圆厂生产标准吗？',
    homeFaq2A: '不可直接替代受控工艺文件。每个工具都明确注明了物理公式和推导假设，由于各晶圆厂机台差异，用于生产前请务必与本厂工程规范比对核验。',
    homeFaq3Q: '支持哪些物理单位转换？',
    homeFaq3A: '长度支持从埃米 (Å)、纳米 (nm)、微米 (µm)、密耳 (mil)、毫米 (mm) 到米 (m) 精确转换。真空压力、气体流量和温度亦具备专用换算器。',

    travelerBtn: '晶圆流转卡 (Traveler)',
    travelerBtnTitle: '生成洁净室晶圆生产流转卡 / 实验批次运行单 (Run-Sheet)',
    travelerModalTitle: '洁净室工程晶圆流转单 (Engineering Traveler)',
    travelerPrintBtn: '打印 / 导出 PDF',
    travelerCloseBtn: '关闭',
    travelerLotId: '晶圆批次号 (Lot ID)',
    travelerWaferIds: '晶圆编号 (Wafer IDs)',
    travelerRecipe: '工艺配方 / 制程步骤 (Recipe)',
    travelerChamber: '机台 / 反应腔编号 (Chamber ID)',
    travelerOperator: '操作人员 / 责任工程师',
    travelerTargetSpec: '工艺目标规格 (Target Specification)',
    travelerNotes: '工艺特殊说明与注意事项 (Notes)',
    travelerInputsHeading: '工艺输入参数清单',
    travelerResultsHeading: '理论计算与推导指标',
    travelerPreCheck: '进料前检确认 (Pre-check)',
    travelerProcessRun: '制程执行核验 (Process Verified)',
    travelerPostMetrology: '出炉量测完成 (Post-metrology)',
    travelerSignOff: '主管工程师签字确认',

    scratchpadBtnTitle: '洁净室工程便签本与常用快速换算器',
    scratchpadTitle: '洁净室工程便签与速算器',
    scratchpadTabConverters: '洁净室快速换算',
    scratchpadTabNotes: '工程便签记事本',
    scratchpadQuickMath: '快捷数学算式计算器',
    scratchpadQuickMathPlaceholder: '例如：300 * 0.08 / 1.25 或 2 * 3.14159 * 150',
    scratchpadPressureTitle: '真空度与气压换算 (Vacuum & Pressure)',
    scratchpadThicknessTitle: '薄膜厚度与深度换算 (Thickness & Depth)',
    scratchpadTempTitle: '热处理工艺温度换算 (Temperature)',
    scratchpadRfTitle: '射频功率密度估算 (RF Power Density)',
    scratchpadWaferDiam: '晶圆直径 (Wafer Size)',
    scratchpadRfPower: '射频功率 (Watts)',
    scratchpadPowerDensity: '表面功率密度',
    scratchpadCopyNotes: '复制便签内容',
    scratchpadDownloadTxt: '导出 .txt 文件',
    scratchpadClearNotes: '清空便签',
    scratchpadInsertRecipe: '插入工艺配方模板',
    scratchpadInsertLog: '插入机台巡检记录',
    scratchpadInsertSplit: '插入 DOE 实验分批记录',
    scratchpadPlaceholderNotes: '用于记录快速机台参数、膜厚量测值、工艺配方设定或交接班提醒。内容自动保存在当前浏览器本地。',

    handbookBtnTitle: '半导体工程物理常数与核心公式速查手册',
    handbookTitle: '半导体制造工程速查手册',
    handbookTabFormulas: '常用物理公式',
    handbookTabConstants: '基本物理常数',
    handbookTabMaterials: '半导体材料参数',
    handbookTabCleanroom: '洁净室 ISO 标准',
    handbookSearchPlaceholder: '搜索公式名称、物理量符号、材料特性...',
    handbookClose: '关闭速查手册',
    handbookPropertyCol: '材料物理属性',
    handbookOpenCalc: '打开对应计算器',

    aboutEyebrow: '关于 SEMITOOLS',
    aboutHeading: '纯粹、高效、无冗余的半导体工程工具。',
    aboutLead: 'SemiTools 是专为半导体工艺工程师、设备工程师、良率工程师和微电子专业师生打造的轻量级纯前端计算工具集。',
    aboutSec1Title: '推导过程透明公开',
    aboutSec1Text: '所有输入均在您的浏览器本地实时计算。每个工具都公开其背后的物理模型与简化假设，方便您在实际导入生产流程前验证可靠性。',
    aboutSec2Title: '通用模型与工艺规范',
    aboutSec2Text: '本站计算结果基于学术与行业通用物理模型，不同晶圆厂特定机台、MES 或量测校准存在差异，使用前请务必对照您所在的工艺受控文件。',
    aboutSec3Title: '开源代码与社区协同',
    aboutSec3Text: '本项目完全开源。欢迎在 GitHub 上提交公式修正、体验反馈或提报新工具开发需求。',

    privacyEyebrow: '隐私保护声明',
    privacyHeading: '隐私与工艺数据安全',
    privacyLead: 'SemiTools 纯前端本地运行，所有计算均在浏览器端完成，不收集、不上传任何企业机密工艺数据。',
    privacySec1Title: '纯本地客户端计算',
    privacySec1Text: '计算逻辑全部由浏览器 JavaScript 执行。若您所在晶圆厂有严格保密制度，亦可完全放心使用，无需担心数据外泄风险。',
    privacySec2Title: '本地数据持久化说明',
    privacySec2Text: '仅在您当前浏览器的 LocalStorage 中保存个性化配置：收藏的工具清单、侧边栏折叠状态以及您的工程便签草稿。这些数据绝不会传输至远程服务器。',
    privacySec3Title: '无第三方跟踪分析',
    privacySec3Text: '全站不加载任何第三方广告脚本、用户行为追踪探针或第三方数据上报工具。',

    contactEyebrow: '联系与技术交流',
    contactHeading: '联系 SemiTools 团队',
    contactLead: '如您发现公式误差、单位歧义，或希望增加新工艺计算模块，欢迎随时与我们取得联系。',
    contactBugTitle: '公式报错与缺陷反馈',
    contactBugLink: '在 GitHub 提交 Issue',
    contactSourceTitle: '开源仓库与版本发布历史',
    contactReportTitle: '反馈计算问题时的建议',
    contactReportText: '请提供工具名称、具体的输入数值与单位、您的预期结果、实际计算结果，以及参考的教科书或行业技术文献，以便我们迅速核对并修复。',
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
    skipToContent: '跳至主要內容',
    closeToolMenu: '關閉工具選單',
    openToolMenu: '開啟工具選單',
    showToolMenu: '展開工具側邊欄',
    hideToolMenu: '收合工具側邊欄',
    homeTitle: '首頁',
    githubRepo: 'GitHub 開源專案',
    footerTagline: '半導體工程專業計算工具箱。所有計算均在瀏覽器本機完成，純客戶端運算，保障製程機密。計算結果為通用模型推算，實際生產請以廠內受控文件為準。',

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
    valueLabel: '數值',
    equalTo: '換算結果等於',
    unitColumn: '物理單位',
    valueColumn: '對應數值',
    copyTable: '複製完整表格',
    noFavorites: '尚無收藏工具。點擊卡片右上角星號即可加入常用清單，方便隨時調用。',
    addToFavorites: '加入最愛',
    removeFromFavorites: '移除最愛',

    cmdPlaceholder: '搜尋工具、公式、單位 (Ctrl+K)...',
    cmdTools: '工程工具',
    cmdQuickLinks: '快速連結',
    cmdNavigate: '導航',
    cmdOpen: '開啟',
    cmdClose: '關閉',
    cmdNoResults: '找不到符合的工具或頁面',
    cmdAllTools: '全部工具清單',
    cmdAllToolsDesc: '瀏覽 SemiTools 涵蓋的全部工程計算機',
    cmdAbout: '關於 SemiTools',
    cmdAboutDesc: '了解計算原理、物理模型與適用範圍',
    cmdPrivacy: '隱私權政策',
    cmdPrivacyDesc: '純前端本地計算，絕不傳輸製程數據',
    cmdContact: '聯絡與回饋',
    cmdContactDesc: '回報公式問題或提出新工具建議',
    cmdGithub: 'GitHub 開源儲存庫',
    cmdGithubDesc: '檢視原始碼與提交 Issue',

    installPwa: '安裝離線桌面版 (PWA)',
    installPwaTitle: '將 SemiTools 安裝至桌面或行動裝置，無塵室完全離線可用',
    offlineStatus: '離線模式',
    offlineReady: '離線就緒',
    offlineTooltip: '無塵室離線模式：SemiTools 已完成快取，可在完全斷網環境下運作',
    onlineReadyTooltip: 'SemiTools 已透過 Service Worker 快取，隨時可離線運行',

    csvDropPrompt: '拖曳量測 CSV/TSV 檔案至此，或直接匯入機台資料',
    csvLoadedSuccess: '已成功從 CSV 載入資料！',
    csvUploadBtn: '上傳 CSV 檔案',
    csvExportBtn: '匯出 CSV 報表',
    csvExportTitle: '匯出符合 RFC 4180 標準的 CSV 量測報告',
    csvMetricMean: '平均值 (Mean)',
    csvMetricMin: '最小值 (Minimum)',
    csvMetricMax: '最大值 (Maximum)',
    csvMetricRange: '全距 / 極差 (Range)',
    csvMetricSigma: '樣本標準差 (1σ)',
    csvMetricUniformity: '均勻度 (±半極差 %)',

    filterToolsAria: '篩選計算工具',
    noToolMatches: '找不到符合的工具。請嘗試搜尋「晶圓」、「晶粒」、「良率」、「薄膜」或單位。',
    toolsPageKicker: '工程工具箱',
    toolsPageTitle: '全部半導體工程計算機',
    toolsPageLead: '每個工具均明確標記物理單位、數學公式與適用範圍。支援即時鍵盤搜尋與全離線操作。',

    heroKicker: '半導體工程專業計算工具箱',
    heroTitle: '推導完全透明可驗的晶圓工程工具箱。',
    heroLead: '涵蓋晶圓雷射標刻、產出晶粒預估、互動式晶圓地圖、良率模型、製程能力分析、機台產能、晶片成本、薄膜應力、微影曝光、電漿蝕刻、熱擴散、RF射頻阻抗匹配及物理單位轉換。完全不經伺服器，嚴格保護製程機密。',
    statTools: '個專業工具',
    statClientSide: '純客戶端本機運算',
    statLengthUnits: '種長度單位 (Å 至 m)',
    statZeroLogins: '無需註冊帳號',
    favoritesTitle: '我的最愛工具',
    favoritesSubtitle: '收藏工具僅儲存於本機瀏覽器。',
    newToolsTitle: '最新發佈工具',
    newToolsSubtitle: '工具箱最新加入的計算與量測模組。',
    allToolsTitle: '全部工程工具',
    allToolsSubtitle: '依半導體製造與測試工藝流程分類。',
    toolboxView: '進入工具箱檢視',
    principlesTitle: '我們的設計理念',
    principlesSubtitle: '決定產品品質的三項工程準則。',
    principle1Title: '單位清楚，絕不馬虎',
    principle1Desc: '每個輸入與輸出均標註嚴謹物理單位，長度支援從埃米到米精確換算，杜絕工程解讀誤差。',
    principle2Title: '鍵盤操作第一',
    principle2Desc: '按 Ctrl / ⌘ + K 快速開啟搜尋，方向鍵即時瀏覽，Enter 開啟，無障礙體驗完善。',
    principle3Title: '機台現場閱讀清晰',
    principle3Desc: '行動端優先設計，無多餘特效。無論在黃光微影機台旁或辦公室評審均能清晰閱讀。',
    homeFaqTitle: '常見問題解答',
    homeFaq1Q: '計算是在哪裡執行的？',
    homeFaq1A: '所有計算均在您的本機瀏覽器內完成。數據絕不上傳伺服器，無需註冊或設定 Cookie。',
    homeFaq2Q: '計算結果可直接作為晶圓廠標準嗎？',
    homeFaq2A: '不可直接替代受控工程規範。各晶圓廠機台參數不同，導入生產前請務必核對廠內受控文件。',
    homeFaq3Q: '支援哪些物理單位換算？',
    homeFaq3A: '長度支援 Å、nm、µm、mil、mm、cm、in、m 精確轉換，並提供真空、流量、溫度等專用工具。',

    travelerBtn: '晶圓流轉卡 (Traveler)',
    travelerBtnTitle: '產生無塵室晶圓製程流轉單 / 實驗單 (Run-Sheet)',
    travelerModalTitle: '無塵室工程晶圓流轉單 (Engineering Traveler)',
    travelerPrintBtn: '列印 / 儲存 PDF',
    travelerCloseBtn: '關閉',
    travelerLotId: '批次號 (Lot ID)',
    travelerWaferIds: '晶圓編號 (Wafer IDs)',
    travelerRecipe: '製程配方 / 步驟 (Recipe)',
    travelerChamber: '機台 / 腔體編號 (Chamber ID)',
    travelerOperator: '工程師 / 操作員',
    travelerTargetSpec: '製程目標規格 (Target Spec)',
    travelerNotes: '特殊注意事項與說明',
    travelerInputsHeading: '製程輸入參數',
    travelerResultsHeading: '理論推導計算結果',
    travelerPreCheck: '入料前檢查 (Pre-check)',
    travelerProcessRun: '製程執行確認 (Run Verified)',
    travelerPostMetrology: '出爐量測完成 (Post-metrology)',
    travelerSignOff: '主管工程師簽核',

    scratchpadBtnTitle: '無塵室工程便箋與常用快速轉換器',
    scratchpadTitle: '無塵室工程便箋與轉換工具',
    scratchpadTabConverters: '即時快速換算',
    scratchpadTabNotes: '工程便箋筆記',
    scratchpadQuickMath: '快速數學運算式計算',
    scratchpadQuickMathPlaceholder: '例如：300 * 0.08 / 1.25 或 2 * 3.14159 * 150',
    scratchpadPressureTitle: '真空與壓力換算 (Vacuum & Pressure)',
    scratchpadThicknessTitle: '薄膜厚度與深度換算 (Thickness & Depth)',
    scratchpadTempTitle: '製程溫度換算 (Temperature)',
    scratchpadRfTitle: '射頻功率密度估算 (RF Power Density)',
    scratchpadWaferDiam: '晶圓直徑 (Wafer Diameter)',
    scratchpadRfPower: '射頻功率 (Watts)',
    scratchpadPowerDensity: '表面功率密度',
    scratchpadCopyNotes: '複製筆記內容',
    scratchpadDownloadTxt: '下載 .txt 檔',
    scratchpadClearNotes: '清除筆記',
    scratchpadInsertRecipe: '插入配方紀錄模板',
    scratchpadInsertLog: '插入巡檢記錄模板',
    scratchpadInsertSplit: '插入 DOE 分組紀錄',
    scratchpadPlaceholderNotes: '用於記錄機台量測值、配方設定或交接班提醒，資料自動保存在當前瀏覽器本機端。',

    handbookBtnTitle: '半導體工程常數與核心公式手冊',
    handbookTitle: '半導體工程速查手冊',
    handbookTabFormulas: '常用物理公式',
    handbookTabConstants: '基本物理常數',
    handbookTabMaterials: '半導體材料參數',
    handbookTabCleanroom: '無塵室 ISO 等級',
    handbookSearchPlaceholder: '搜尋公式、物理常數、材料...',
    handbookClose: '關閉手冊',
    handbookPropertyCol: '物理性質',
    handbookOpenCalc: '開啟對應計算器',

    aboutEyebrow: '關於 SEMITOOLS',
    aboutHeading: '純粹、高效、無負擔的半導體工程工具。',
    aboutLead: 'SemiTools 為半導體製程工程師、設備工程師、良率工程師與微電子學員打造的純前端免安裝工具集。',
    aboutSec1Title: '透明嚴謹的設計',
    aboutSec1Text: '所有計算均於瀏覽器本機端執行。每個工具均公開數學推導與物理假設，便於在導入流程前評估。',
    aboutSec2Title: '通用模型與規格驗證',
    aboutSec2Text: '計算採用學術與業界標準通用模型，各晶圓廠規範略有差異，使用前請務必對照內部受控規格。',
    aboutSec3Title: '開源與社群貢獻',
    aboutSec3Text: '本專案完全開源，歡迎至 GitHub 提交公式修正或新工具需求。',

    privacyEyebrow: '隱私權與資料保護',
    privacyHeading: '隱私保護宣告',
    privacyLead: 'SemiTools 完全於本機瀏覽器運作，絕不保存或上傳任何企業機密製程資料。',
    privacySec1Title: '本機端純運算',
    privacySec1Text: '所有計算均在使用者裝置端完成，不經伺服器，嚴格保護製程機密安全。',
    privacySec2Title: '本機裝置儲存項目',
    privacySec2Text: '僅在本機 LocalStorage 中存放介面偏好（收藏工具、側邊欄折疊狀態與便箋內容），絕不對外傳輸。',
    privacySec3Title: '無第三方追蹤程式',
    privacySec3Text: '全站不載入任何第三方追蹤分析工具或廣告探針。',

    contactEyebrow: '聯絡與反饋',
    contactHeading: '聯絡 SemiTools 團隊',
    contactLead: '若您發現公式計算有誤、單位標示不清或需要新工具，歡迎隨時與我們聯絡。',
    contactBugTitle: '問題回報與公式修正',
    contactBugLink: '於 GitHub 提交 Issue',
    contactSourceTitle: '原始碼與儲存庫',
    contactReportTitle: '回報問題時之建議',
    contactReportText: '請附上工具名稱、輸入參數與單位、預期數值、實際數值以及參考工程文獻，以利快速修正。',
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
    skipToContent: '본문으로 건너뛰기',
    closeToolMenu: '메뉴 닫기',
    openToolMenu: '메뉴 열기',
    showToolMenu: '사이드바 표시',
    hideToolMenu: '사이드바 숨기기',
    homeTitle: '홈',
    githubRepo: 'GitHub 저장소',
    footerTagline: '투명하고 신뢰할 수 있는 반도체 엔지니어링 툴. 모든 연산은 브라우저에서 로컬로 실행되며 기밀 데이터는 전송되지 않습니다. 실생산 적용 전 사내 규격을 확인하십시오.',

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
    valueLabel: '값',
    equalTo: '변환 결과',
    unitColumn: '단위',
    valueColumn: '수치',
    copyTable: '테이블 전체 복사',
    noFavorites: '즐겨찾기가 비어 있습니다. 도구 카드의 별표를 클릭하거나 Ctrl/⌘+K를 눌러 자주 사용하는 도구를 등록하세요.',
    addToFavorites: '즐겨찾기 추가',
    removeFromFavorites: '즐겨찾기 제거',

    cmdPlaceholder: '도구, 수식, 단위 검색 (Ctrl+K)...',
    cmdTools: '엔지니어링 툴',
    cmdQuickLinks: '빠른 링크',
    cmdNavigate: '탐색',
    cmdOpen: '열기',
    cmdClose: '닫기',
    cmdNoResults: '일치하는 도구 또는 페이지가 없습니다',
    cmdAllTools: '전체 툴 목록',
    cmdAllToolsDesc: 'SemiTools의 모든 반도체 계산기를 확인하세요',
    cmdAbout: 'SemiTools 소개',
    cmdAboutDesc: '계산 원리, 수식 및 모델 가정 안내',
    cmdPrivacy: '개인정보 보호 정책',
    cmdPrivacyDesc: '서버 전송 없이 안전한 브라우저 로컬 계산',
    cmdContact: '문의 및 의견 제안',
    cmdContactDesc: '수식 수정 제안 또는 신규 도구 요청',
    cmdGithub: 'GitHub 오픈소스 저장소',
    cmdGithubDesc: '소스 코드 확인 및 이슈 등록',

    installPwa: '데스크톱 앱 설치 (PWA)',
    installPwaTitle: '클린룸 오프라인 환경에서 사용하기 위해 SemiTools를 설치합니다',
    offlineStatus: '오프라인 모드',
    offlineReady: '오프라인 준비됨',
    offlineTooltip: '클린룸 오프라인 모드: 브라우저 캐시를 통해 완전히 로컬에서 작동합니다',
    onlineReadyTooltip: 'Service Worker를 통해 캐시되어 오프라인에서도 즉시 사용 가능합니다',

    csvDropPrompt: '측정 데이터 CSV/TSV 파일을 여기에 드래그하거나 장비 데이터 가져오기',
    csvLoadedSuccess: 'CSV에서 데이터를 성공적으로 로드했습니다!',
    csvUploadBtn: 'CSV 업로드',
    csvExportBtn: 'CSV 내보내기',
    csvExportTitle: 'RFC 4180 표준 CSV 계측 보고서 내보내기',
    csvMetricMean: '평균값 (Mean)',
    csvMetricMin: '최솟값 (Minimum)',
    csvMetricMax: '최댓값 (Maximum)',
    csvMetricRange: '범위 (Range)',
    csvMetricSigma: '표본 표준편차 (1σ)',
    csvMetricUniformity: '균일도 (± Half Range %)',

    filterToolsAria: '엔지니어링 도구 필터',
    noToolMatches: '일치하는 도구가 없습니다. "웨이퍼", "다이", "수율", "식각", "박막" 등으로 검색해 보세요.',
    toolsPageKicker: '툴박스',
    toolsPageTitle: 'SemiTools 전체 계산기',
    toolsPageLead: '각 도구는 명확한 단위, 계산 수식 및 적용 범위를 명시합니다. 이름, 키워드, 단위로 빠른 검색이 가능합니다.',

    heroKicker: '반도체 엔지니어링 계산기 모음',
    heroTitle: '과정이 투명하게 공개되는 웨이퍼 엔지니어링 툴.',
    heroLead: '웨이퍼 마크, 총 다이 수 추정, 인터랙티브 웨이퍼 맵, 수율 모델, 공정 능력, 생산성, 칩 원가, 박막 응력, 노광, 플라즈마 식각, 확산, RF 임피던스 정합 및 단위 변환: 서버 전송 없이 안전하게 브라우저에서 실행됩니다.',
    statTools: '개 엔지니어링 도구',
    statClientSide: '클라이언트 100% 로컬 연산',
    statLengthUnits: '개 길이 단위 지원 (Å ~ m)',
    statZeroLogins: '로그인 불필요',
    favoritesTitle: '즐겨찾는 도구',
    favoritesSubtitle: '즐겨찾기 목록은 현재 브라우저에만 저장됩니다.',
    newToolsTitle: '신규 추가된 도구',
    newToolsSubtitle: '툴박스에 새롭게 추가된 최신 계산기.',
    allToolsTitle: '전체 엔지니어링 툴',
    allToolsSubtitle: '반도체 제조 및 테스트 공정 단계별 분류.',
    toolboxView: '전체 툴박스 보기',
    principlesTitle: '제품 설계 원칙',
    principlesSubtitle: '엔지니어링 완성도를 보장하는 3가지 원칙.',
    principle1Title: '명확한 물리 단위 표기',
    principle1Desc: '모든 입출력 값에 정확한 단위를 표시하며, 옹스트롬부터 미터까지 정밀하게 변환하여 오독을 방지합니다.',
    principle2Title: '키보드 중심의 빠른 인터페이스',
    principle2Desc: 'Ctrl/⌘+K 키로 모든 도구를 즉시 검색하고 방향키와 엔터로 바로 실행할 수 있습니다.',
    principle3Title: '클린룸 현장에서의 시인성',
    principle3Desc: '과도한 애니메이션을 배제하고 모바일 및 태블릿에 최적화하여 현장 장비 옆에서도 명확하게 사용할 수 있습니다.',
    homeFaqTitle: '자주 묻는 질문',
    homeFaq1Q: '계산은 어디에서 실행되나요?',
    homeFaq1A: '모든 계산은 사용자의 브라우저 내에서 직접 수행됩니다. 입력 데이터는 절대 서버로 전송되지 않으므로 기밀 유출 걱정이 없습니다.',
    homeFaq2Q: '계산 결과를 팹 표준으로 바로 적용할 수 있나요?',
    homeFaq2A: '공식과 가정을 투명하게 밝히고 있으나, 각 제조사 장비 및 공정 조건이 상이하므로 실생산 적용 전 반드시 사내 기술 문서와 대조하십시오.',
    homeFaq3Q: '지원되는 단위 변환에는 어떤 것이 있나요?',
    homeFaq3A: '길이(Å, nm, µm, mil, mm, cm, in, m), 진공도, 가스 유량, 온도 등 반도체 공정에 필요한 핵심 단위 변환을 지원합니다.',

    travelerBtn: '런시트 / 트래블러 (Traveler)',
    travelerBtnTitle: '클린룸 웨이퍼 공정 진행 시트(Run-Sheet) 생성',
    travelerModalTitle: '클린룸 엔지니어링 트래블러 / 런시트',
    travelerPrintBtn: '인쇄 / PDF 저장',
    travelerCloseBtn: '닫기',
    travelerLotId: '로트 번호 (Lot ID)',
    travelerWaferIds: '웨이퍼 번호 (Wafer IDs)',
    travelerRecipe: '공정 레시피 / 단계 (Recipe)',
    travelerChamber: '설비 / 챔버 ID (Chamber ID)',
    travelerOperator: '작업자 / 엔지니어',
    travelerTargetSpec: '목표 규격 (Target Specification)',
    travelerNotes: '공정 주의사항 및 특이사항',
    travelerInputsHeading: '공정 입력 조건',
    travelerResultsHeading: '계산 및 유도 결과',
    travelerPreCheck: '사전 점검 확인 (Pre-check)',
    travelerProcessRun: '공정 진행 확인 (Process Run)',
    travelerPostMetrology: '계측 완료 확인 (Post-metrology)',
    travelerSignOff: '담당 엔지니어 서명',

    scratchpadBtnTitle: '클린룸 엔지니어링 메모장 및 빠른 변환기',
    scratchpadTitle: '클린룸 엔지니어링 메모장',
    scratchpadTabConverters: '실시간 단위 변환',
    scratchpadTabNotes: '엔지니어링 메모',
    scratchpadQuickMath: '빠른 수식 계산기',
    scratchpadQuickMathPlaceholder: '예: 300 * 0.08 / 1.25 또는 2 * 3.14159 * 150',
    scratchpadPressureTitle: '진공 및 압력 단위 변환',
    scratchpadThicknessTitle: '박막 두께 및 깊이 변환',
    scratchpadTempTitle: '열공정 온도 변환',
    scratchpadRfTitle: 'RF 전력 밀도 계산 (웨이퍼 표면)',
    scratchpadWaferDiam: '웨이퍼 직경',
    scratchpadRfPower: 'RF 전력 (Watts)',
    scratchpadPowerDensity: '표면 전력 밀도',
    scratchpadCopyNotes: '메모 복사',
    scratchpadDownloadTxt: '.txt 다운로드',
    scratchpadClearNotes: '메모 지우기',
    scratchpadInsertRecipe: '레시피 템플릿 삽입',
    scratchpadInsertLog: '점검 로그 템플릿 삽입',
    scratchpadInsertSplit: 'DOE 분할 실험 메모 삽입',
    scratchpadPlaceholderNotes: '챔버 계측값, 레시피 파라미터, 인수인계 사항을 빠르게 메모하세요. 브라우저 로컬 스토리지에 자동 저장됩니다.',

    handbookBtnTitle: '반도체 공학 핵심 공식 및 상수 핸드북',
    handbookTitle: '반도체 엔지니어링 핸드북',
    handbookTabFormulas: '핵심 물리 수식',
    handbookTabConstants: '기본 물리 상수',
    handbookTabMaterials: '반도체 재료 물성',
    handbookTabCleanroom: '클린룸 ISO 규격',
    handbookSearchPlaceholder: '수식, 물리 상수, 재료 물성 검색...',
    handbookClose: '핸드북 닫기',
    handbookPropertyCol: '물리적 특성',
    handbookOpenCalc: '계산기 열기',

    aboutEyebrow: 'SEMITOOLS 소개',
    aboutHeading: '군더더기 없는 반도체 엔지니어링 툴.',
    aboutLead: 'SemiTools는 공정 엔지니어, 설비 엔지니어, 수율 엔지니어 및 학생들을 위해 제작된 브라우저 기반 계산기 모음입니다.',
    aboutSec1Title: '투명한 계산 원리',
    aboutSec1Text: '모든 입력은 브라우저에서 로컬로 처리됩니다. 각 도구는 수식과 가정을 공개하여 신뢰성을 직접 검증할 수 있습니다.',
    aboutSec2Title: '일반화된 물리 모델',
    aboutSec2Text: '계산 결과는 표준 이론 모델에 기반하므로 특정 팹 규격과 차이가 있을 수 있습니다. 양산 적용 전 사내 규격을 확인하세요.',
    aboutSec3Title: '오픈소스 프로젝트',
    aboutSec3Text: '본 프로젝트는 오픈소스로 관리됩니다. 수식 오류 제보 및 신규 도구 제안은 GitHub를 통해 진행됩니다.',

    privacyEyebrow: '개인정보 및 보안',
    privacyHeading: '개인정보 보호 정책',
    privacyLead: 'SemiTools는 브라우저 내부에서만 실행되며, 계산 데이터를 서버로 전송하지 않습니다.',
    privacySec1Title: '로컬 브라우저 처리',
    privacySec1Text: '모든 연산은 클라이언트 기기에서 수행됩니다. 보안 규정이 엄격한 환경에서도 안심하고 사용할 수 있습니다.',
    privacySec2Title: '로컬 스토리지 저장 항목',
    privacySec2Text: '즐겨찾기, 접어둔 메뉴 상태, 엔지니어링 메모 등 사용자의 UI 편의 설정만 브라우저 LocalStorage에 저장됩니다.',
    privacySec3Title: '추적기 및 광고 배제',
    privacySec3Text: '사용자 행태 추적기나 타사 광고 스크립트를 일체 로드하지 않습니다.',

    contactEyebrow: '문의 및 제안',
    contactHeading: 'SemiTools에 문의하기',
    contactLead: '수식 수정, 명칭 개선, 신규 기능 제안이 있으신가요? 프로젝트 이슈 트래커에 등록해 주세요.',
    contactBugTitle: '버그 제보 및 수식 오류 수정',
    contactBugLink: 'GitHub 이슈 열기',
    contactSourceTitle: '소스 코드 및 릴리스 내역',
    contactReportTitle: '계산 오류 제보 시 권장 사항',
    contactReportText: '도구명, 정확한 입력값과 단위, 예상 결과와 실제 결과, 참조하신 공학 문헌을 함께 기재해 주시면 신속히 반영됩니다.',
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
    skipToContent: '本文へスキップ',
    closeToolMenu: 'メニューを閉じる',
    openToolMenu: 'メニューを開く',
    showToolMenu: 'サイドバーを表示',
    hideToolMenu: 'サイドバーを折りたたむ',
    homeTitle: 'ホーム',
    githubRepo: 'GitHubリポジトリ',
    footerTagline: '半導体エンジニアリング計算ツール集。すべての計算はブラウザ内でローカルに実行され、機密データが外部送信されることはありません。実生産前には社内管理基準をご確認ください。',

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
    valueLabel: '数値',
    equalTo: '換算結果',
    unitColumn: '物理単位',
    valueColumn: '換算値',
    copyTable: 'テーブル全体をコピー',
    noFavorites: 'お気に入りが登録されていません。ツール右上の星アイコンをクリックするか、Ctrl/⌘+Kキーで検索して追加できます。',
    addToFavorites: 'お気に入りに追加',
    removeFromFavorites: 'お気に入りから解除',

    cmdPlaceholder: 'ツール名、計算式、単位を検索 (Ctrl+K)...',
    cmdTools: '計算ツール',
    cmdQuickLinks: 'クイックリンク',
    cmdNavigate: '移動',
    cmdOpen: '開く',
    cmdClose: '閉じる',
    cmdNoResults: '一致するツールまたはページが見つかりません',
    cmdAllTools: 'ツール一覧',
    cmdAllToolsDesc: 'SemiToolsのすべての計算ツールを閲覧',
    cmdAbout: 'SemiToolsについて',
    cmdAboutDesc: 'ツールの計算モデルと前提条件',
    cmdPrivacy: 'プライバシーポリシー',
    cmdPrivacyDesc: '完全クライアント完結型で安全な設計',
    cmdContact: 'お問い合わせ・報告',
    cmdContactDesc: '計算式の修正依頼や新機能の要望',
    cmdGithub: 'GitHubリポジトリ',
    cmdGithubDesc: 'ソースコードの確認とIssue起票',

    installPwa: 'デスクトップアプリをインストール (PWA)',
    installPwaTitle: 'クリーンルーム等のオフライン環境で利用できるようにインストールします',
    offlineStatus: 'オフライン',
    offlineReady: 'オフライン対応完了',
    offlineTooltip: 'クリーンルームオフラインモード: ブラウザキャッシュ上で完結して動作します',
    onlineReadyTooltip: 'Service Workerによりキャッシュされ、いつでもオフライン利用可能です',

    csvDropPrompt: '計測CSV/TSVファイルをドラッグ＆ドロップ、または装置データをインポート',
    csvLoadedSuccess: 'CSVからデータを正常に読み込みました！',
    csvUploadBtn: 'CSVをインポート',
    csvExportBtn: 'CSVを出力',
    csvExportTitle: 'RFC 4180準拠のCSVサマリーレポートを出力',
    csvMetricMean: '平均値 (Mean)',
    csvMetricMin: '最小値 (Minimum)',
    csvMetricMax: '最大値 (Maximum)',
    csvMetricRange: 'レンジ (Range)',
    csvMetricSigma: 'サンプル標準偏差 (1σ)',
    csvMetricUniformity: '面内均一性 (± Half Range %)',

    filterToolsAria: 'ツールを絞り込む',
    noToolMatches: '一致するツールが見つかりません。「ウェーハ」「歩留まり」「薄膜」「エッチング」などで検索してください。',
    toolsPageKicker: 'ツールボックス',
    toolsPageTitle: 'すべての半導体計算ツール',
    toolsPageLead: '各ツールは物理単位、計算理論、適用範囲を明確に定義しています。名称やキーワードで即座に絞り込み可能です。',

    heroKicker: '半導体エンジニアリング計算ツール',
    heroTitle: '計算過程が明瞭に可視化されるウェーハエンジニアリングツール。',
    heroLead: 'ウェーハマーキング、取得ダイ数推計、インタラクティブウェーハマップ、歩留まり予測、Cp/Cpk工程能力、装置スループット、チップコスト、薄膜応力、フォトリソグラフィ露光、プラズマエッチング、熱拡散、高周波RF整合回路、半導体物理単位変換。サーバー通信を行わず、機密レシピを外部に出しません。',
    statTools: '個の計算ツール',
    statClientSide: 'ブラウザ完全ローカル動作',
    statLengthUnits: '種の長さ単位対応 (Å〜m)',
    statZeroLogins: 'ログイン登録不要',
    favoritesTitle: 'お気に入りのツール',
    favoritesSubtitle: '登録されたツールはお使いのブラウザにのみ保存されます。',
    newToolsTitle: '新着ツール',
    newToolsSubtitle: 'ツールボックスに新たに追加された計算・解析ツール。',
    allToolsTitle: 'すべてのエンジニアリングツール',
    allToolsSubtitle: '半導体製造およびテスト工程に沿って体系的に整理。',
    toolboxView: 'ツールボックス一覧へ',
    principlesTitle: 'ツールの設計原則',
    principlesSubtitle: '高い実用性と信頼性を保証する3つの設計基準。',
    principle1Title: '厳密な単位系の明示',
    principle1Desc: 'すべての入出力に単位を付与し、オングストロームからメートルまで精確に換算可能。誤認によるトラブルを防ぎます。',
    principle2Title: 'キーボードショートカット重視',
    principle2Desc: 'Ctrl/⌘+Kキーで瞬時に任意のツールを検索し、矢印キーとEnterで実行できます。アクセシビリティにも配慮しています。',
    principle3Title: '製造現場での視認性',
    principle3Desc: '過剰なアニメーションを廃し、タブレットや現場端末でも軽快に動作するモバイルファースト設計を採用しています。',
    homeFaqTitle: 'よくある質問',
    homeFaq1Q: '計算はどこで処理されますか？',
    homeFaq1A: 'すべての計算はお使いのブラウザ上で実行されます。入力された数値がサーバーへ送信されることは一切ありません。',
    homeFaq2Q: '計算結果はファブの製造基準としてそのまま使えますか？',
    homeFaq2A: '計算式と前提条件を明示していますが、実際の製造装置やプロセス仕様によって異なるため、必ず管理文書と照合してください。',
    homeFaq3Q: 'どのような単位変換に対応していますか？',
    homeFaq3A: '長さ（Å、nm、µm、mil、mm、cm、in、m）のほか、真空度、ガス流量、温度などの専門的な単位変換ツールを提供しています。',

    travelerBtn: 'ランシート / トラベラー (Traveler)',
    travelerBtnTitle: 'クリーンルーム用ウェーハ工程指示書 / 実験シートを作成',
    travelerModalTitle: 'クリーンルーム工程指示書 (Engineering Traveler)',
    travelerPrintBtn: '印刷 / PDF出力',
    travelerCloseBtn: '閉じる',
    travelerLotId: 'ロット番号 (Lot ID)',
    travelerWaferIds: 'ウェーハ番号 (Wafer IDs)',
    travelerRecipe: 'レシピ名 / 工程ステップ (Recipe)',
    travelerChamber: '装置 / チャンバーID (Chamber ID)',
    travelerOperator: '担当エンジニア / 作業者',
    travelerTargetSpec: '目標仕様規格 (Target Spec)',
    travelerNotes: '特記事項および注意事項',
    travelerInputsHeading: 'プロセス設定パラメータ',
    travelerResultsHeading: '理論推算結果',
    travelerPreCheck: '着工前確認 (Pre-check)',
    travelerProcessRun: '処理実施確認 (Run Verified)',
    travelerPostMetrology: '処理後計測完了 (Post-metrology)',
    travelerSignOff: '責任者承認サイン',

    scratchpadBtnTitle: 'クリーンルーム用エンジニアリングメモ帳・単位換算',
    scratchpadTitle: 'ファブエンジニアリングメモ帳',
    scratchpadTabConverters: '即時単位換算',
    scratchpadTabNotes: 'エンジニアリングメモ',
    scratchpadQuickMath: '簡易数式計算バー',
    scratchpadQuickMathPlaceholder: '例: 300 * 0.08 / 1.25 または 2 * 3.14159 * 150',
    scratchpadPressureTitle: '真空度・圧力換算 (Vacuum & Pressure)',
    scratchpadThicknessTitle: '膜厚・深さ換算 (Thickness & Depth)',
    scratchpadTempTitle: 'プロセス温度換算 (Temperature)',
    scratchpadRfTitle: 'RF電力密度推算 (Wafer Surface)',
    scratchpadWaferDiam: 'ウェーハ径',
    scratchpadRfPower: 'RF高周波電力 (Watts)',
    scratchpadPowerDensity: '表面電力密度',
    scratchpadCopyNotes: 'メモをコピー',
    scratchpadDownloadTxt: '.txtで保存',
    scratchpadClearNotes: 'メモをクリア',
    scratchpadInsertRecipe: 'レシピ記録枠を挿入',
    scratchpadInsertLog: '巡回点検枠を挿入',
    scratchpadInsertSplit: 'DOE実験条件枠を挿入',
    scratchpadPlaceholderNotes: '装置設定値、膜厚計測値、引き継ぎ事項などを一時メモとして記録できます。ブラウザに自動保存されます。',

    handbookBtnTitle: '半導体工学物理定数・公式リファレンスハンドブック',
    handbookTitle: '半導体エンジニアリングハンドブック',
    handbookTabFormulas: '重要物理公式',
    handbookTabConstants: '基礎物理定数',
    handbookTabMaterials: '半導体材料物性表',
    handbookTabCleanroom: 'クリーンルーム規格 (ISO)',
    handbookSearchPlaceholder: '公式名、物理定数、材料物性を検索...',
    handbookClose: 'ハンドブックを閉じる',
    handbookPropertyCol: '物理特性',
    handbookOpenCalc: '計算機を開く',

    aboutEyebrow: 'SEMITOOLSについて',
    aboutHeading: '妥協のない半導体エンジニアリングツール。',
    aboutLead: 'SemiToolsは、プロセス技術者、装置技術者、歩留まり解析担当者および学生のために作られたブラウザ完結型計算ツール集です。',
    aboutSec1Title: '完全な透明性と信頼性',
    aboutSec1Text: 'すべての計算はお使いの端末内で直接行われます。物理モデルと仮定を明示し、現場導入前の検証を容易にします。',
    aboutSec2Title: '理論モデルと製造仕様',
    aboutSec2Text: '標準的な理論式に基づいています。各ファブの装置固有の補正や仕様があるため、実際の適用前には社内文書をご確認ください。',
    aboutSec3Title: 'オープンソース開発',
    aboutSec3Text: '本ツールはGitHub上でオープンソースとして開発されています。計算式の改善や新ツールの提案をお待ちしています。',

    privacyEyebrow: 'プライバシーポリシー',
    privacyHeading: 'データの保護と取り扱い',
    privacyLead: 'SemiToolsはブラウザローカルで実行され、入力されたデータを外部サーバーに送信することはありません。',
    privacySec1Title: 'ブラウザ内での完全処理',
    privacySec1Text: '計算は完全に端末内で完結します。機密保持規程が厳しい現場でも安心してご活用いただけます。',
    privacySec2Title: '端末内に保存されるデータ',
    privacySec2Text: 'お気に入り、サイドバーの開閉状態、エンジニアリングメモなどのUI設定のみがブラウザのLocalStorageに保存されます。',
    privacySec3Title: '解析トラッカーの非使用',
    privacySec3Text: 'サードパーティ製のアクセス解析、行動追跡、広告配信スクリプトは一切導入していません。',

    contactEyebrow: 'お問い合わせ',
    contactHeading: 'SemiToolsへのお問い合わせ',
    contactLead: '計算式の誤り、単位表記の改善点、追加してほしい機能などがございましたらお気軽にご連絡ください。',
    contactBugTitle: 'バグ報告・計算式の修正依頼',
    contactBugLink: 'GitHubでIssueを作成',
    contactSourceTitle: 'ソースコードリポジトリ',
    contactReportTitle: '不具合をご報告いただく際のお願い',
    contactReportText: 'ツール名、入力値と単位、期待される計算結果、実際の計算結果、参考とされた文献などを記載いただけますと迅速に対応できます。',
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
