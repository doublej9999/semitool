import type { ToolTranslation } from '../types';

export const ja: Record<string, ToolTranslation> = {
  "/tools/wafer-die-calculator": {
    "name": "ウェーハダイ取得数計算ツール",
    "description": "ウェーハ径、ダイサイズ、スクライブライン幅、エッジ除外から総ダイ数（Gross Die）と面積利用率を算出。",
    "keywords": [
      "ウェーハ",
      "ダイ取得数",
      "チップ数",
      "スクライブライン",
      "エッジ除外",
      "Gross Die"
    ]
  },
  "/tools/wafer-map-generator": {
    "name": "対話型ウェーハマップ生成ツール",
    "description": "ダイ配置、良品・不良品統計、CSV/JSONエクスポートに対応した視覚的ウェーハマップ。",
    "keywords": [
      "ウェーハマップ",
      "ダイマップ",
      "ウェーハ図",
      "ビニング",
      "可視化"
    ]
  },
  "/tools/wafer-mark-calculator": {
    "name": "SEMI規格ウェーハ刻印チェッカー",
    "description": "SEMI M12/M13規格に準拠したウェーハレーザーマーキングのフォーマット生成とチェックサム検証。",
    "keywords": [
      "SEMI刻印",
      "SEMI M12",
      "SEMI M13",
      "ウェーハID",
      "チェックサム",
      "レーザーマーク"
    ]
  },
  "/tools/yield-calculator": {
    "name": "ウェーハ歩留まり計算ツール",
    "description": "投入ウェーハ数、良品ダイ数からウェーハ処理およびパッケージング歩留まり指標を算出。",
    "keywords": [
      "歩留まり",
      "歩留まり計算",
      "ウェーハ歩留まり",
      "良品率"
    ]
  },
  "/tools/yield-model-calculator": {
    "name": "歩留まり予測モデル比較ツール",
    "description": "Murphy、Poisson、Seeds、Bose-Einsteinモデルによる欠陥密度からの歩留まり予測比較。",
    "keywords": [
      "歩留まりモデル",
      "ポアソンモデル",
      "マーフィーモデル",
      "欠陥密度モデル"
    ]
  },
  "/tools/defect-density-calculator": {
    "name": "欠陥密度計算ツール (D0)",
    "description": "ダイ面積と実測歩留まりからウェーハ欠陥密度（D0）を逆算し、プロセス品質を評価。",
    "keywords": [
      "欠陥密度",
      "D0",
      "キラー欠陥",
      "歩留まり低下",
      "クリーン度"
    ]
  },
  "/tools/die-cost-calculator": {
    "name": "チップ製造原価計算ツール",
    "description": "ウェーハコスト、取得ダイ数、ライン歩留まり、パッケージング費用からチップ1個の正味原価を算出。",
    "keywords": [
      "チップ原価",
      "ウェーハコスト",
      "製造原価",
      "チップコスト"
    ]
  },
  "/tools/process-capability-calculator": {
    "name": "工程能力指数計算ツール (Cp / Cpk)",
    "description": "規格限界（USL/LSL）と平均値・標準偏差から工程能力指数 Cp、Cpk、Pp、Ppk を算出。",
    "keywords": [
      "工程能力",
      "Cp",
      "Cpk",
      "Pp",
      "Ppk",
      "品質管理",
      "SPC"
    ]
  },
  "/tools/yield-confidence-calculator": {
    "name": "歩留まり信頼区間計算ツール",
    "description": "サンプリング試験データから Wilson または Clopper-Pearson 歩留まり信頼区間を推定。",
    "keywords": [
      "信頼区間",
      "歩留まり信頼区間",
      "サンプルサイズ",
      "ウィルソン法"
    ]
  },
  "/tools/throughput-calculator": {
    "name": "装置スループット計算ツール (WPH)",
    "description": "プロセス時間、搬送オーバーヘッド、カセットサイズから装置 WPH（枚/時）を計算。",
    "keywords": [
      "スループット",
      "WPH",
      "時間あたりウェーハ数",
      "タクトタイム",
      "装置能力"
    ]
  },
  "/tools/sheet-resistance-calculator": {
    "name": "四探針シート抵抗・抵抗率計算ツール",
    "description": "四探針法測定電圧・電流、探針間隔、膜厚、幾何補正係数からシート抵抗と体積抵抗率を算出。",
    "keywords": [
      "シート抵抗",
      "四探針",
      "抵抗率",
      "面抵抗",
      "Rs"
    ]
  },
  "/tools/wafer-area-calculator": {
    "name": "ウェーハ有効面積・エッジ除外計算ツール",
    "description": "オリフラ・ノッチを含むウェーハ全面積と、エッジ除外（Edge Exclusion）後の有効面積を計算。",
    "keywords": [
      "ウェーハ面積",
      "エッジ除外",
      "有効面積",
      "オリフラ",
      "ノッチ"
    ]
  },
  "/tools/reticle-field-calculator": {
    "name": "レチクル露光フィールド計算ツール",
    "description": "ステッパー／スキャナーの最大露光ショット内に配置可能なダイ配列数と面積効率を計算。",
    "keywords": [
      "レチクル",
      "露光フィールド",
      "ステッパー",
      "スキャナー",
      "ショット"
    ]
  },
  "/tools/thickness-converter": {
    "name": "薄膜膜厚単位換算ツール",
    "description": "オングストローム（Å）、nm、µm、mil、mm 間の薄膜膜厚を即座に相互変換。",
    "keywords": [
      "膜厚換算",
      "オングストローム",
      "ナノメートル",
      "マイクロメートル",
      "単位変換"
    ]
  },
  "/tools/pressure-converter": {
    "name": "真空度・圧力単位換算ツール",
    "description": "パスカル（Pa）、mbar、Torr、mTorr、気圧（atm）の高精度真空・プロセス圧力換算。",
    "keywords": [
      "真空度",
      "圧力換算",
      "パスカル",
      "トール",
      "Torr",
      "Pa"
    ]
  },
  "/tools/gas-flow-converter": {
    "name": "ガス流量換算ツール (sccm / slm)",
    "description": "sccm、slm、mol/s および基準温度（0℃/20℃/25℃）間のガス質量流量を高精度換算。",
    "keywords": [
      "ガス流量",
      "マスフロー",
      "MFC",
      "sccm",
      "slm"
    ]
  },
  "/tools/temperature-converter": {
    "name": "温度単位換算ツール",
    "description": "摂氏（°C）、ケルビン（K）、華氏（°F）間の換算と半導体熱エネルギー kT（eV）の算出。",
    "keywords": [
      "温度換算",
      "摂氏",
      "ケルビン",
      "熱エネルギー",
      "kT"
    ]
  },
  "/tools/lithography-resolution-calculator": {
    "name": "露光解像度・焦点深度計算ツール (レイリー基準)",
    "description": "レイリーの式に基づき、露光波長 λ、NA、プロセス係数 k1/k2 から限界解像度と焦点深度（DoF）を計算。",
    "keywords": [
      "露光解像度",
      "焦点深度",
      "DoF",
      "レイリーの式",
      "開口数",
      "NA"
    ]
  },
  "/tools/etch-rate-calculator": {
    "name": "エッチングレート・選択比計算ツール",
    "description": "エッチング前後の膜厚差と処理時間からエッチング速度を求め、下地やマスクに対する選択比を算出。",
    "keywords": [
      "エッチングレート",
      "選択比",
      "ドライエッチング",
      "ウェットエッチング"
    ]
  },
  "/tools/cd-uniformity-calculator": {
    "name": "CD（線幅）均一性計算ツール",
    "description": "ウェーハ面内マルチポイントCD測定値から、平均値、レンジ、3σ、均一性（%）を算出。",
    "keywords": [
      "CD均一性",
      "線幅均一性",
      "3シグマ",
      "面内ばらつき"
    ]
  },
  "/tools/film-stress-calculator": {
    "name": "薄膜応力計算ツール (Stoneyの式)",
    "description": "Stoneyの式に基づき、成膜前後のウェーハ曲率半径変化から薄膜内部応力（引張/圧縮）を算出。",
    "keywords": [
      "薄膜応力",
      "Stoneyの式",
      "曲率半径",
      "反り",
      "ウェーハボウ"
    ]
  },
  "/tools/film-uniformity-calculator": {
    "name": "膜厚均一性計算ツール",
    "description": "面内多点膜厚測定データから、Max、Min、平均値、ハーフレンジ均一性（±%）を算出。",
    "keywords": [
      "膜厚均一性",
      "面内均一性",
      "ハーフレンジ",
      "エリプソメトリー"
    ]
  },
  "/tools/diffusion-length-calculator": {
    "name": "熱拡散長計算ツール (2√Dt)",
    "description": "不純物拡散係数 D と熱処理アニール時間 t から特性拡散長 2√(Dt) を算出。",
    "keywords": [
      "拡散長",
      "不純物拡散",
      "熱処理",
      "アニール",
      "2√Dt"
    ]
  },
  "/tools/arrhenius-calculator": {
    "name": "アレニウス反応速度・活性化エネルギー計算ツール",
    "description": "頻度因子と活性化エネルギー Ea から反応速度を算出、または2点の測定値から Ea を抽出。",
    "keywords": [
      "アレニウス",
      "活性化エネルギー",
      "Ea",
      "反応速度",
      "温度依存性"
    ]
  },
  "/tools/thermal-oxide-calculator": {
    "name": "熱酸化膜成長シミュレーター (Deal-Groveモデル)",
    "description": "Deal-Groveモデルに基づき、ドライ酸化およびウェット酸化条件下でのシリコン酸化膜成長膜厚を算出。",
    "keywords": [
      "熱酸化",
      "Deal-Groveモデル",
      "ドライ酸化",
      "ウェット酸化",
      "酸化膜厚"
    ]
  },
  "/tools/power-converter": {
    "name": "RF電力・dBm換算ツール",
    "description": "ワット（W）、ミリワット（mW）、dBm 間の高周波電力換算とピーク間電圧換算。",
    "keywords": [
      "RF電力",
      "dBm換算",
      "ワット",
      "高周波",
      "Vpp"
    ]
  },
  "/tools/time-constant-calculator": {
    "name": "RC / RL 時定数計算ツール",
    "description": "RC回路およびRL回路の時定数 τ、立ち上がり時間（10%-90%）、過渡応答電圧を計算。",
    "keywords": [
      "時定数",
      "RC回路",
      "RL回路",
      "過渡応答",
      "立ち上がり時間"
    ]
  },
  "/tools/rf-power-calculator": {
    "name": "RF反射電力・透過電力計算ツール",
    "description": "進行波電力と反射波電力から、反射係数、負荷吸収実効電力、リターンロスを算出。",
    "keywords": [
      "高周波電力",
      "反射電力",
      "進行波",
      "負荷吸収電力",
      "反射係数"
    ]
  },
  "/tools/return-loss-calculator": {
    "name": "リターンロス・VSWR換算ツール",
    "description": "リターンロス（dB）、電圧定在波比（VSWR）、反射係数（Γ）、反射電力（%）を相互変換。",
    "keywords": [
      "リターンロス",
      "VSWR",
      "定在波比",
      "反射係数",
      "S11"
    ]
  },
  "/tools/impedance-matching-calculator": {
    "name": "L型インピーダンス整合回路計算ツール",
    "description": "RFプラズマ電源と負荷間のインピーダンスマッチングを行うローパス/ハイパスLセクションLC回路定数を設計。",
    "keywords": [
      "インピーダンス整合",
      "マッチャー",
      "L型整合",
      "プラズマ負荷"
    ]
  },
  "/tools/microstrip-calculator": {
    "name": "マイクロストリップ線路インピーダンス計算ツール",
    "description": "パターン線幅、誘電体厚、比誘電率、銅厚からマイクロストリップラインの特性インピーダンス Z0 を算出。",
    "keywords": [
      "マイクロストリップ",
      "特性インピーダンス",
      "Z0",
      "伝送線路"
    ]
  },
  "/tools/stub-matching-calculator": {
    "name": "シングルスタブ整合計算ツール",
    "description": "オープン/ショートスタブを用いた高周波伝送線路のスタブ位置距離とスタブ長を算出。",
    "keywords": [
      "スタブ整合",
      "シングルスタブ",
      "高周波整合",
      "伝送線路"
    ]
  },
  "/tools/bin-yield-calculator": {
    "name": "マルチビン歩留まり分類集計ツール",
    "description": "ウェーハプロービング（CP/FT）のBin分類テストデータから、各Bin比率と良品率を自動集計。",
    "keywords": [
      "Bin分類",
      "歩留まり集計",
      "プロービング",
      "ウェーハテスト"
    ]
  },
  "/tools/fit-mtbf-calculator": {
    "name": "FIT・MTBF信頼性換算ツール",
    "description": "FIT（10^9時間あたりの故障数）、故障率 λ、平均故障間隔 MTBF 間の高精度換算。",
    "keywords": [
      "FIT",
      "MTBF",
      "故障率",
      "信頼性工学",
      "寿命計算"
    ]
  },
  "/tools/yield-dppm-calculator": {
    "name": "歩留まり・不良率 DPPM 換算ツール",
    "description": "歩留まり率（%）と百万分率不良数（DPPM: Defect Parts Per Million）を相互換算。",
    "keywords": [
      "DPPM",
      "不良率",
      "PPM換算",
      "品質管理"
    ]
  },
  "/tools/weibull-life-calculator": {
    "name": "ワイブル信頼性寿命解析ツール",
    "description": "形状パラメータ β（傾き）と特性寿命 η から、任意時間での信頼度 R(t) や MTTF を算出。",
    "keywords": [
      "ワイブル解析",
      "Weibull",
      "特性寿命",
      "信頼度",
      "MTTF"
    ]
  },
  "/tools/spc-control-chart-calculator": {
    "name": "SPC管理図・工程管理限界計算ツール",
    "description": "X-bar & R/S 管理図の中心線および管理限界線（UCL/LCL）を算出、異常判定ルールに対応。",
    "keywords": [
      "SPC",
      "管理図",
      "Xbar-R",
      "管理限界",
      "UCL",
      "LCL"
    ]
  },
  "/tools/acceptance-sampling-calculator": {
    "name": "計数値抜取検査・OC曲線計算ツール",
    "description": "二項分布・ポアソン分布に基づき、抜取方式（n, c）の合格確率 Pa および OC 曲線（検査特性曲線）を計算。",
    "keywords": [
      "抜取検査",
      "OC曲線",
      "合格判定",
      "AQL"
    ]
  },
  "/tools/ion-implantation-calculator": {
    "name": "イオン注入飛程・ピーク濃度計算ツール",
    "description": "注入エネルギーとドーズ量から投影飛程 Rp、ストラグリング ΔRp、ピーク不純物濃度を算出。",
    "keywords": [
      "イオン注入",
      "投影飛程",
      "Rp",
      "ストラグリング",
      "注入エネルギー"
    ]
  },
  "/tools/semiconductor-depletion-calculator": {
    "name": "PN接合空乏層幅・内蔵電位計算ツール",
    "description": "アクセプタ・ドナー濃度と逆バイアス電圧から、PN接合の内蔵電位 Vbi、空乏層幅 W、接合容量を計算。",
    "keywords": [
      "PN接合",
      "空乏層幅",
      "内蔵電位",
      "接合容量",
      "逆バイアス"
    ]
  },
  "/tools/cleanroom-converter": {
    "name": "クリーンルーム規格・粒子濃度換算ツール",
    "description": "ISO 14644-1（クラス1〜9）と米国連邦規格 FED-STD-209E 間の清浄度クラス相互換算。",
    "keywords": [
      "クリーンルーム",
      "清浄度規格",
      "ISO 14644",
      "FS209E",
      "微粒子濃度"
    ]
  },
  "/tools/carrier-mobility-calculator": {
    "name": "キャリア移動度・ドリフト速度計算ツール",
    "description": "Caughey-Thomasモデルに基づき、不純物濃度に応じたシリコン中の電子・正孔移動度とドリフト速度を算出。",
    "keywords": [
      "キャリア移動度",
      "ドリフト速度",
      "電子移動度",
      "正孔移動度"
    ]
  },
  "/tools/cmp-preston-calculator": {
    "name": "CMP研磨レート計算ツール (プレストン方程式)",
    "description": "プレストン（Preston）の式に基づき、研磨圧力 P、相対速度 V、材料定数からCMP加工除去速度（MRR）を計算。",
    "keywords": [
      "CMP",
      "化学機械研磨",
      "プレストンの式",
      "研磨速度"
    ]
  },
  "/tools/film-color-calculator": {
    "name": "酸化膜・窒化膜 干渉色判定ツール",
    "description": "光の垂直干渉理論に基づき、SiO2（熱酸化膜）および Si3N4 膜厚からウェーハ表面に見える干渉色を照会。",
    "keywords": [
      "干渉色",
      "薄膜色",
      "SiO2色",
      "酸化膜色",
      "光干渉"
    ]
  },
  "/tools/mosfet-threshold-calculator": {
    "name": "MOSFET しきい値電圧計算ツール (Vth)",
    "description": "ゲート酸化膜厚、基板濃度、仕事関数差から長チャネル MOSFET のフラットバンド電圧およびしきい値電圧 Vt を計算。",
    "keywords": [
      "MOSFET",
      "しきい値電圧",
      "Vth",
      "ゲート酸化膜"
    ]
  },
  "/tools/thermal-fatigue-calculator": {
    "name": "はんだ接合部熱疲労寿命予測ツール (Coffin-Manson)",
    "description": "温度サイクル試験条件下での Norris-Landzberg / Coffin-Manson モデルによるICパッケージはんだ寿命予測。",
    "keywords": [
      "熱疲労",
      "はんだ寿命",
      "Coffin Manson",
      "温度サイクル試験"
    ]
  },
  "/tools/thermal-resistance-calculator": {
    "name": "接合部ジャンクション温度・熱抵抗計算ツール",
    "description": "消費電力と熱抵抗（θjc, θca）からICジャンクション動作温度 Tj を計算し、熱設計マージンを検証。",
    "keywords": [
      "熱抵抗",
      "ジャンクション温度",
      "Tj",
      "熱設計"
    ]
  },
  "/tools/wire-bonding-calculator": {
    "name": "ワイヤボンディング・ループ長＆シェア強度計算ツール",
    "description": "金線・銅線ワイヤ径とスパン長からループ展開長、ボールシェア強度（Ball Shear）、プル強度（Wire Pull）を計算。",
    "keywords": [
      "ワイヤボンディング",
      "ループ長",
      "ボールシェア",
      "ワイヤプル"
    ]
  },
  "/tools/chemical-dilution-calculator": {
    "name": "薬液希釈・ウェット洗浄配合計算ツール",
    "description": "RCA SC-1/SC-2、ピラニアSPM、DHF、BOEバッファードフッ酸の体積比率・質量・実効重量%、C1·V1=C2·V2希釈方程式および酸化膜エッチングレート算出。",
    "keywords": [
      "薬液希釈",
      "ウェット洗浄",
      "RCA洗浄",
      "SC-1",
      "SC-2",
      "ピラニア洗浄",
      "SPM",
      "フッ酸",
      "DHF",
      "BOE",
      "バッファードフッ酸",
      "ウェットベンチ",
      "エッチングレート"
    ]
  },
  "/tools/plasma-sheath-calculator": {
    "name": "プラズマシース＆デバイ長計算ツール",
    "description": "電子デバイ遮蔽長（Debye Length）、ボーム音速（Bohm Velocity）、Child-Langmuir式高周波RFバイアスシース厚、プラズマ振動数およびイオン衝突性判定。",
    "keywords": [
      "プラズマシース",
      "デバイ長",
      "ボーム速度",
      "ボーム基準",
      "Child Langmuir",
      "シース厚",
      "プラズマ周波数",
      "RFバイアス",
      "RIEエッチング",
      "ICPプラズマ",
      "平均自由行程"
    ]
  },
  "/tools/ald-cycle-calculator": {
    "name": "原子層堆積 (ALD) サイクル・プリカーサ露光量計算ツール",
    "description": "原子層堆積（ALD）のサイクルシーケンス、ラングミュア（Langmuir）飽和度（θ）、1サイクルあたり成長膜厚（GPC）、合計膜厚およびプリカーサ消費量を算出。",
    "keywords": [
      "原子層堆積",
      "ALD",
      "ALDサイクル",
      "GPC",
      "飽和曲線",
      "ラングミュア",
      "プリカーサ露光量",
      "パージ時間",
      "TMA",
      "Al2O3",
      "HfO2",
      "段差被覆性",
      "前駆体消費量"
    ]
  },
  "/tools/dopant-diffusion-calculator": {
    "name": "不純物熱拡散・接合深さ計算ツール (xj)",
    "description": "定表面濃度（erfc）および有限拡散源（ガウス分布）によるシリコン熱拡散、アレニウス拡散係数 D(T)（B, P, As, Sb）、冶金接合深さ xj、酸化膜マスク必要厚さを算出。",
    "keywords": [
      "不純物拡散",
      "熱拡散",
      "接合深さ",
      "xj",
      "フィックの法則",
      "プリデポジション",
      "ドライブイン",
      "ガウス分布",
      "erfc",
      "ボロン拡散",
      "リン拡散",
      "サーマルバジェット",
      "酸化膜マスク"
    ]
  },
  "/tools/cvd-kinetics-calculator": {
    "name": "CVD・エピタキシャル成長速度・反応動力学計算ツール",
    "description": "Grove境界層物質移動モデルおよびArrhenius表面反応速度論に基づき、CVD/エピタキシャル成長速度、律速領域遷移温度、サセプタ沿いの原料枯渇を算出。",
    "keywords": [
      "CVD",
      "化学気相成長",
      "エピタキシャル",
      "成長速度",
      "Groveモデル",
      "境界層",
      "物質移動律速",
      "反応律速",
      "アレニウス",
      "シラン",
      "LPCVD",
      "TEOS"
    ]
  },
  "/tools/four-point-probe-calculator": {
    "name": "四探針抵抗率・シート抵抗計算ツール (ASTM F84)",
    "description": "ASTM F84 / SEMI MF84 規格に準拠した直線配置四探針シート抵抗、ウェーハ体積抵抗率、有限厚み幾何補正係数、NISTドーパント濃度逆算ツール。",
    "keywords": [
      "四探針法",
      "ASTM F84",
      "SEMI MF84",
      "シート抵抗",
      "体積抵抗率",
      "厚み補正",
      "不純物濃度",
      "移動度"
    ]
  },
  "/tools/split-lot-calculator": {
    "name": "Split-Lot / DOE レシピ比較計算ツール",
    "description": "半導体スプリットロットおよび実験計画法（DOE）のレシピ対比マトリクス、ウェーハ別パラメータ偏差追跡、応答デルタ分析およびトラベラー出力。",
    "keywords": [
      "スプリットロット",
      "split lot",
      "DOE",
      "実験計画法",
      "レシピ比較",
      "ランシート",
      "パラメータ偏差",
      "プロセス調整"
    ]
  },
  "/tools/curve-fitting-calculator": {
    "name": "曲線フィッティング・反応速度パラメータ抽出計算ツール",
    "description": "半導体動力学パラメータ抽出：アレニウスプロットによる活性化エネルギー (Ea)、Deal-Grove 酸化速度定数 (B, B/A)、最小二乗線形回帰と決定係数 R²。",
    "keywords": [
      "曲線フィッティング",
      "アレニウスプロット",
      "活性化エネルギー",
      "Deal-Grove パラメータ",
      "線形回帰",
      "パラメータ抽出",
      "反応速度論",
      "酸化速度定数"
    ]
  },
  "/tools/arde-etch-calculator": {
    "name": "高アスペクト比エッチング (ARDE)・マイクロローディング計算ツール",
    "description": "アスペクト比依存エッチング (RIE Lag)、パターン密度マイクロローディング効果、およびマスク選択比・テーパー角シミュレーション。",
    "keywords": [
      "ARDE",
      "RIEラグ",
      "マイクロローディング",
      "アスペクト比",
      "エッチングレート",
      "選択比",
      "テーパー角",
      "ドライエッチング"
    ]
  },
  "/tools/cmp-endpoint-calculator": {
    "name": "CMP 終点検出・研磨パッド寿命計算ツール",
    "description": "化学機械研磨 (CMP) のモーター電流終点検出、光学干渉フリンジ周期解析、およびダイヤモンドコンディショナーによるパッド溝摩耗予測。",
    "keywords": [
      "CMP",
      "終点検出",
      "パッド寿命",
      "コンディショニング",
      "光干渉",
      "光学フリンジ",
      "平坦化"
    ]
  },
  "/tools/wafer-warp-stress-calculator": {
    "name": "ウェーハボウ・ワープ＆薄膜応力計算ツール",
    "description": "Stoney式に基づく薄膜残留応力、ウェーハのボウ (Bow) およびワープ (Warp) 曲率半径換算、熱膨張係数差による熱応力、臨界クラック膜厚を算出。",
    "keywords": [
      "Stoney式",
      "ウェーハボウ",
      "ウェーハワープ",
      "薄膜応力",
      "熱膨張ミスマッチ",
      "二軸弾性係数",
      "残留応力",
      "曲率半径"
    ]
  },
  "/tools/wet-bench-calculator": {
    "name": "ウェットベンチ薬液寿命・スパイク補充計算ツール",
    "description": "RCA洗浄（SC-1/SC-2）、SPMピラニア洗浄、BOEエッチングバスの寿命予測、薬品スパイク補充量、および溶存シリコン蓄積モデル。",
    "keywords": [
      "ウェットベンチ",
      "RCA洗浄",
      "SC-1",
      "SC-2",
      "ピラニア",
      "SPM",
      "BOE",
      "薬液補充",
      "バス寿命",
      "エッチング槽"
    ]
  },
  "/tools/cu-plating-calculator": {
    "name": "Cu 電解めっき・ダマシン超充填計算ツール",
    "description": "銅電気化学めっき (ECD)、デュアルダマシン微細トレンチのボトムアップ超充填、シード層ターミナル効果、ファラデー電気分解解析。",
    "keywords": [
      "Cuめっき",
      "電解めっき",
      "ECD",
      "ダマシン",
      "スーパーフィリング",
      "ファラデーの法則",
      "ターミナル効果",
      "添加剤"
    ]
  },
  "/tools/stdf-klarf-explorer": {
    "name": "STDF/KLARF エクスプローラー",
    "description": "ATE STDF V4 と KLA KLARF ファイルをブラウザーで解析: テストごとの Cpk 統計、スパークライン趨勢、ビン分布、歩留まりと欠陥クラスタ分析、SPC 管理図への連携。",
    "keywords": [
      "STDF",
      "KLARF",
      "テストデータ",
      "ATE データログ",
      "パラメトリック",
      "Cpk",
      "工程能力",
      "ビン分布",
      "ソフトビン",
      "ハードビン",
      "歩留まり",
      "欠陥検査",
      "ウェハテスト",
      "SPC"
    ]
  },
  "/tools/layout-parasitics-calculator": {
    "name": "ICレイアウト寄生パラメータ推定",
    "description": "レイアウト描画ジオメトリから配線抵抗、平板・フリンジ容量、IRドロップ、RC遅延を推定するテープアウト前の古典的な検証ツール。Cu/Al/タングステン/ポリシリコンの抵抗率温度補正に対応。",
    "keywords": [
      "レイアウト",
      "寄生パラメータ",
      "配線抵抗",
      "寄生容量",
      "RC遅延",
      "電圧降下",
      "IRドロップ",
      "フリンジ容量",
      "シート抵抗",
      "配線",
      "テープアウト前チェック"
    ]
  }
};
