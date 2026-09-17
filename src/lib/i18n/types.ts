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
  catWetProcess: string;

  // Glove mode
  gloveModeOn: string;
  gloveModeOff: string;

  // Shortcuts guide rows
  scHandbook: string;
  scTraveler: string;
  scGenealogy: string;
  scWorkspace: string;
  scScratchpad: string;
  scPalette: string;
  scShowShortcuts: string;

  // Process workflow bar
  wfCustomFlows: string;
  wfNewCustomFlow: string;
  wfFlowNameLabel: string;
  wfPickToolsLabel: string;
  wfSaveFlow: string;
  wfCancelFlow: string;
  wfDeleteFlow: string;
  wfStepsDone: string;
  wfToggleStep: string;

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
  toolBadge: string;
  cleanroomMode: string;
  genealogyTitle: string;
  workspaceTitle: string;
  shortcutsGuide: string;
  dataBusActive: string;
  stdProcessFlow: string;
  recommendedNextModule: string;
  proceedToNextStep: string;
  pipeParamsForward: string;

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
  updateReady: string;
  updateReadyTitle: string;
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

    notFoundEyebrow: string;
    notFoundHeading: string;
    notFoundLead: string;
    notFoundBrowseBtn: string;

  // Fab Workspace
  fabWsTitle: string;
  fabWsSubtitle: string;
  fabWsTemplates: string;
  fabWsExport: string;
  fabWsExportTitle: string;
  fabWsImport: string;
  fabWsImportTitle: string;
  fabWsReset: string;
  fabWsResetTitle: string;
  fabWsTotalFilmThick: string;
  fabWsNetAvgStress: string;
  fabWsWaferBowWarp: string;
  fabWsCharDiffLength: string;
  fabWsLayerCrossSection: string;
  fabWsNoFilmsVisual: string;
  fabWsSubstrateMaterial: string;
  fabWsWaferDiameter: string;
  fabWsSubstrateThick: string;
  fabWsFilmStackSteps: string;
  fabWsAddLayer: string;
  fabWsEmptyStackPrompt: string;
  fabWsEditLayerParams: string;
  fabWsLayerName: string;
  fabWsMaterial: string;
  fabWsThickness: string;
  fabWsStress: string;
  fabWsRefractiveIndex: string;
  fabWsProcess: string;
  fabWsAutoSavedNotice: string;
  fabWsDoneClose: string;
  fabWsStressTensile: string;
  fabWsStressCompressive: string;
  fabWsStressNeutral: string;
  /** {bow} is replaced with the absolute wafer bow in µm. */
  fabWsSevereWarp: string;
  /** {bow} is replaced with the absolute wafer bow in µm. */
  fabWsModerateWarp: string;
  fabWsSubSi100: string;
  fabWsSubSi111: string;
  fabWsSubSiC4h: string;
  fabWsSubGaas: string;
  fabWsSubSapphire: string;
  fabWsSubGan: string;
  fabWsSubFusedSilica: string;
  fabWsLinkedLot: string;
  fabWsNoLotLinked: string;
  /** {count} is replaced with the number of lot genealogy branches. */
  fabWsBranchesLabel: string;
  fabWsLinkedMetrology: string;
  fabWsNoMetrology: string;

  // Lot Genealogy (VirtualLotGenealogy modal; `genealogyTitle` above labels the AppShell entry button)
  genealogyModalTitle: string;
  genealogyNewLot: string;
  genealogySplitBranches: string;
  genealogySplitWafers: string;
  genealogyLogActiveTool: string;
  genealogyAssignedWafers: string;
  genealogySteps: string;
  genealogyMetrologyPass: string;
  genealogyCreateSplitTitle: string;
  genealogySplitNameLabel: string;
  genealogySplitSlotsLabel: string;
  genealogyCancel: string;
  genealogyConfirmSplit: string;
  genealogyEmptyTitle: string;
  genealogyEmptyDesc: string;
  genealogyRecordInitial: string;
  genealogyRecipeParams: string;
  genealogyMetrologyVerification: string;
  genealogyPromptLotId: string;
  genealogyPromptPartNo: string;
  genealogyCurrentProcessStep: string;
  genealogyBusNotes: string;
  genealogyProvideSplitName: string;
  genealogyInvalidSlots: string;
  genealogyWafersUnit: string;

  // Public shell, status and data privacy
  languagePickerLabel: string;
  languagePickerTitle: string;
  offlineEyebrow: string;
  offlineHeading: string;
  offlineLead: string;
  offlineHomeBtn: string;
  offlineBrowseBtn: string;
  errorHeading: string;
  errorLead: string;
  errorId: string;
  errorTryAgain: string;
  errorGoHome: string;
  toolsErrorHeading: string;
  toolsErrorLead: string;
  toolFinderTitle: string;
  toolFinderLead: string;
  toolFinderLabel: string;
  toolFinderPlaceholder: string;
  toolFinderSubmit: string;
  privacyDataHeading: string;
  privacyDataLead: string;
  privacyStored: string;
  privacyEmpty: string;
  privacyCachedStdf: string;
  privacyContent: string;
  privacyAnalytics: string;
  privacyAnalyticsActive: string;
  privacyAnalyticsInactive: string;
  privacyExportAll: string;
  privacyClear: string;
  privacyClearConfirm: string;

  themeLight: string;
  themeDark: string;
  themeSystem: string;
  cancel: string;
  moveUp: string;
  moveDown: string;
  remove: string;

  // Additional handbook keys
  handbookVariables: string;
  handbookFabApp: string;
  handbookCleanroomIntro: string;
  handbookIsoClass: string;
  handbookFedStd: string;
  handbookMax01: string;
  handbookMax05: string;
  handbookApplication: string;

  // Additional traveler keys
  travelerArchiveTitle: string;
  travelerHistoryTitle: string;
  travelerHistoryCount: string;
  travelerExportMesJson: string;
  travelerExportCsv: string;
  travelerExportPdf: string;
  travelerArchivedTitle: string;
  travelerNoArchived: string;
  travelerRestore: string;
  travelerHeaderTitle: string;
  travelerHeaderSub: string;
  travelerDate: string;
  travelerRev: string;
  travelerStatus: string;
  travelerAuthorized: string;
  travelerLotNum: string;
  travelerWaferSlots: string;
  travelerProcessRecipe: string;
  travelerChamberTool: string;
  travelerRespEng: string;
  travelerOpStep: string;
  travelerStepTag: string;
  travelerParam: string;
  travelerNominal: string;
  travelerTolerance: string;
  travelerActual: string;
  travelerVerification: string;
  travelerPassOos: string;
  travelerProcessTempPower: string;
  travelerStdRecipeSetpoint: string;
  travelerMetrologyOutput: string;
  travelerTheoreticalVal: string;
  travelerMeasuredAvg: string;
  travelerTargetThickRateYield: string;
  travelerReferActiveMetrology: string;
  travelerChamberVacuum: string;
  travelerParticleMonitor: string;
  travelerOperatorSign: string;
  travelerRecipeAlarm: string;
  travelerWafersUnloaded: string;
  travelerShiftHandover: string;
  travelerDisposition: string;
  travelerDevReport: string;
  travelerFabEngSign: string;
  travelerGeneratedNotice: string;
  travelerAuditNotice: string;

  // Metrology Batch Modal
  metrologyModalTitle: string;
  metrologyModalSub: string;
  metrologyPresets: string;
  metrologyBrowseCsv: string;
  metrologyDropPlaceholder: string;
  metrologyOutlierScreening: string;
  metrologyTukey: string;
  metrologyThreeSigma: string;
  metrologyOutlierNone: string;
  metrologyExcludeOutliers: string;
  metrologySubgroupSize: string;
  metrologyFormat: string;
  metrologyTotalReadings: string;
  metrologySubgroupsCount: string;
  metrologyOutliersFlagged: string;
  metrologyProcessMean: string;
  metrologyRaw: string;
  metrologySampleSigma: string;
  metrologyMedianIqr: string;
  metrologyIqr: string;
  metrologyMinMaxRange: string;
  metrologyRange: string;
  metrologySpecLimits: string;
  metrologyTarget: string;
  metrologyOpenSpc: string;
  metrologyRunMonteCarlo: string;
  metrologyExportCleaned: string;
  metrologyEmptyPrompt: string;
  metrologyApplyActive: string;

  // User Data Keys
  userDataKeyLocale: string;
  userDataKeyTheme: string;
  userDataKeyCollapsed: string;
  userDataKeyRail: string;
  userDataKeyGlove: string;
  userDataKeyFavorites: string;
  userDataKeyScratchpad: string;
  userDataKeyTravelerHistory: string;
  userDataKeyFabSession: string;
  userDataKeyLegacyWorkspace: string;
  userDataKeyLegacyGenealogy: string;
  userDataKindContent: string;
  userDataKindPreference: string;
}

export interface ToolTranslation {
  name: string;
  description: string;
  keywords: string[];
}
