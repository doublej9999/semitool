import type { ToolTranslation } from '../types';

export const zhTW: Record<string, ToolTranslation> = {
  "/tools/wafer-die-calculator": {
    "name": "晶圓出芯數計算器",
    "description": "依據晶圓直徑、晶粒尺寸、切割道寬度及邊緣排除估算理論總晶粒數（Gross Die）及晶圓利用率。",
    "keywords": [
      "晶圓出芯數",
      "晶粒數",
      "切割道",
      "邊緣排除",
      "晶圓利用率",
      "Gross Die",
      "DPW"
    ]
  },
  "/tools/wafer-map-generator": {
    "name": "互動式晶圓圖生成器",
    "description": "視覺化互動式晶圓分佈圖，支援晶粒座標排布、良品統計與 CSV/JSON 匯出。",
    "keywords": [
      "晶圓圖",
      "晶片排布",
      "晶圓分佈",
      "分選統計",
      "晶圓視覺化"
    ]
  },
  "/tools/wafer-mark-calculator": {
    "name": "SEMI 晶圓標刻與校驗碼計算器",
    "description": "符合 SEMI M12 與 M13 標準的矽晶圓雷射刻字格式驗證與校驗碼計算。",
    "keywords": [
      "晶圓標刻",
      "SEMI刻字",
      "SEMI M12",
      "SEMI M13",
      "晶圓編號",
      "雷射刻字",
      "校驗碼"
    ]
  },
  "/tools/yield-calculator": {
    "name": "晶圓良率計算器",
    "description": "根據投片晶圓數、合格晶粒產出數與良品率計算晶圓製造及封裝測試綜合良率指標。",
    "keywords": [
      "良率計算",
      "晶圓良率",
      "製程良率",
      "晶粒良率",
      "成品率"
    ]
  },
  "/tools/yield-model-calculator": {
    "name": "良率模型對比計算器",
    "description": "橫向比較 Murphy、Poisson、Seeds 及 Bose-Einstein 半導體晶粒良率預測模型。",
    "keywords": [
      "良率模型",
      "墨菲模型",
      "卜瓦松模型",
      "Seeds模型",
      "缺陷密度模型"
    ]
  },
  "/tools/defect-density-calculator": {
    "name": "缺陷密度計算器",
    "description": "由晶粒面積與實測良率反推晶圓缺陷密度 D0，評估製程與潔淨室潔淨度水準。",
    "keywords": [
      "缺陷密度",
      "D0",
      "致命缺陷",
      "良率損失",
      "潔淨度"
    ]
  },
  "/tools/die-cost-calculator": {
    "name": "晶片製造單位成本計算器",
    "description": "依據晶圓代工成本、晶圓出晶數、製程良率與封測費用計算單顆晶片淨成本。",
    "keywords": [
      "晶片成本",
      "晶圓成本",
      "單顆成本",
      "製造成本",
      "封測成本"
    ]
  },
  "/tools/process-capability-calculator": {
    "name": "製程能力指數計算器 (Cp / Cpk)",
    "description": "依據規格上下限 USL/LSL 與樣本平均值、標準差計算製程能力指標 Cp、Cpk、Pp、Ppk。",
    "keywords": [
      "製程能力",
      "Cp",
      "Cpk",
      "Pp",
      "Ppk",
      "六標準差",
      "品質管制"
    ]
  },
  "/tools/yield-confidence-calculator": {
    "name": "良率信賴區間計算器",
    "description": "根據少量樣本測試數據計算 Wilson 或 Clopper-Pearson 良率信賴區間。",
    "keywords": [
      "信賴區間",
      "良率區間",
      "Wilson得分",
      "Clopper Pearson",
      "抽樣檢驗"
    ]
  },
  "/tools/throughput-calculator": {
    "name": "機台產能與節拍計算器 (WPH)",
    "description": "根據製程耗時、機械手臂搬運延遲與批次量計算機台 WPH（每小時晶圓處理數）。",
    "keywords": [
      "機台產能",
      "WPH",
      "每小時晶圓數",
      "生產節拍",
      "週期時間"
    ]
  },
  "/tools/sheet-resistance-calculator": {
    "name": "四探針薄層電阻與電阻率計算器",
    "description": "由四探針電壓電流讀數、探針間距、薄膜厚度及修正因子計算方阻 Rs 與電阻率。",
    "keywords": [
      "薄層電阻",
      "方塊電阻",
      "四探針",
      "電阻率",
      "Rs"
    ]
  },
  "/tools/wafer-area-calculator": {
    "name": "晶圓有效面積與邊緣去除計算器",
    "description": "計算包含平邊或凹槽（Notch）的晶圓總面積，及扣除邊緣排除區後的有效利用面積。",
    "keywords": [
      "晶圓面積",
      "邊緣排除",
      "有效面積",
      "平邊",
      "凹槽",
      "Edge Exclusion"
    ]
  },
  "/tools/reticle-field-calculator": {
    "name": "光罩曝光視場計算器",
    "description": "計算步進/掃描式曝光機視場範圍內可容納之晶粒陣列排列列數與行數。",
    "keywords": [
      "光罩視場",
      "曝光視場",
      "步進曝光機",
      "Reticle Field"
    ]
  },
  "/tools/thickness-converter": {
    "name": "薄膜厚度單位換算",
    "description": "精準轉換埃（Å）、奈米（nm）、微米（µm）、密耳（mil）與毫米（mm）薄膜厚度單位。",
    "keywords": [
      "薄膜厚度",
      "厚度換算",
      "奈米",
      "微米",
      "埃",
      "單位轉換"
    ]
  },
  "/tools/pressure-converter": {
    "name": "真空與氣壓單位換算",
    "description": "精準轉換帕斯卡（Pa）、毫巴（mbar）、托（Torr）、毫托（mTorr）及標準大氣壓（atm）。",
    "keywords": [
      "真空度",
      "氣壓換算",
      "托",
      "帕斯卡",
      "毫巴",
      "Torr",
      "Pa"
    ]
  },
  "/tools/gas-flow-converter": {
    "name": "氣體質量流量換算 (sccm / slm)",
    "description": "在 sccm、slm、mol/s 及不同標準狀態參考溫度間精確換算氣體流量。",
    "keywords": [
      "氣體流量",
      "流量控制器",
      "MFC",
      "sccm",
      "slm"
    ]
  },
  "/tools/temperature-converter": {
    "name": "溫度單位換算",
    "description": "精準轉換攝氏（°C）、熱力學溫標（K）與華氏（°F），並提供熱能量 kT（eV）。",
    "keywords": [
      "溫度換算",
      "攝氏",
      "絕對溫度",
      "熱能量",
      "kT"
    ]
  },
  "/tools/lithography-resolution-calculator": {
    "name": "微影解析度與焦深計算器 (Rayleigh)",
    "description": "依據瑞利準則根據波長 λ、數值孔徑 NA 及製程因子 k1/k2 計算解析度與焦點深度 DoF。",
    "keywords": [
      "微影解析度",
      "焦深",
      "DoF",
      "瑞利準則",
      "數值孔徑",
      "NA"
    ]
  },
  "/tools/etch-rate-calculator": {
    "name": "蝕刻速率與選擇比計算器",
    "description": "根據蝕刻前後薄膜厚度變化與製程時間計算蝕刻速率，並評估對光阻及下層之選擇比。",
    "keywords": [
      "蝕刻速率",
      "選擇比",
      "電漿蝕刻",
      "濕法蝕刻",
      "Etch Rate"
    ]
  },
  "/tools/cd-uniformity-calculator": {
    "name": "關鍵尺寸 (CD) 均勻性計算器",
    "description": "分析晶圓多點關鍵尺寸量測數據，計算平均值、全距、標準差（3σ）及均勻度百分比。",
    "keywords": [
      "關鍵尺寸",
      "CD均勻性",
      "線寬",
      "3標準差",
      "片內均勻度"
    ]
  },
  "/tools/film-stress-calculator": {
    "name": "薄膜應力計算器 (Stoney 公式)",
    "description": "利用 Stoney 公式依據基板彈性模數、帕松比與沉積前後曲率半徑變化計算張應力或壓應力。",
    "keywords": [
      "薄膜應力",
      "Stoney公式",
      "曲率半徑",
      "張應力",
      "壓應力",
      "翹曲"
    ]
  },
  "/tools/film-uniformity-calculator": {
    "name": "薄膜厚度均勻性計算器",
    "description": "由晶圓面內多點膜厚量測值計算最大值、最小值、平均值與半極差百分比均勻度（±%）。",
    "keywords": [
      "膜厚均勻性",
      "均勻度",
      "橢偏儀",
      "膜厚量測"
    ]
  },
  "/tools/diffusion-length-calculator": {
    "name": "熱擴散長度計算器",
    "description": "根據雜質擴散係數 D 與退火熱處理時間 t 計算特徵擴散長度 2√(Dt)。",
    "keywords": [
      "熱擴散",
      "擴散長度",
      "熱處理",
      "退火",
      "雜質擴散"
    ]
  },
  "/tools/arrhenius-calculator": {
    "name": "Arrhenius 反應速率與活化能計算器",
    "description": "利用阿基尼斯方程式計算溫度反應速率，或由兩組實測速率數據提取活化能 Ea。",
    "keywords": [
      "阿基尼斯",
      "活化能",
      "反應速率",
      "溫度依存性",
      "Ea"
    ]
  },
  "/tools/thermal-oxide-calculator": {
    "name": "熱氧化層生長厚度計算器 (Deal-Grove)",
    "description": "利用 Deal-Grove 模型計算矽晶圓在乾氧或濕氧條件下的熱氧化層厚度與生長耗時。",
    "keywords": [
      "熱氧化",
      "Deal-Grove模型",
      "乾氧氧化",
      "濕氧氧化",
      "氧化膜"
    ]
  },
  "/tools/power-converter": {
    "name": "射頻功率與 dBm 換算",
    "description": "在瓦特（W）、毫瓦（mW）與分貝毫瓦（dBm）間精確轉換，並提供峰對峰電壓。",
    "keywords": [
      "射頻功率",
      "dBm換算",
      "瓦特",
      "峰對峰電壓",
      "Vpp"
    ]
  },
  "/tools/time-constant-calculator": {
    "name": "RC / RL 時間常數計算器",
    "description": "計算 RC 及 RL 電路之時間常數 τ、10%-90% 上升時間與充放電暫態曲線。",
    "keywords": [
      "時間常數",
      "RC電路",
      "RL電路",
      "暫態響應",
      "上升時間"
    ]
  },
  "/tools/rf-power-calculator": {
    "name": "射頻功率與反射損耗計算器",
    "description": "由前向功率與反射功率計算反射係數 Γ、負載吸收功率與回波損耗 dB。",
    "keywords": [
      "射頻功率",
      "反射功率",
      "前向功率",
      "吸收功率",
      "反射係數"
    ]
  },
  "/tools/return-loss-calculator": {
    "name": "回波損耗與電壓駐波比計算器 (VSWR)",
    "description": "在回波損耗（RL）、駐波比（VSWR）、反射係數（Γ）與反射功率百分比間相互轉換。",
    "keywords": [
      "回波損耗",
      "駐波比",
      "VSWR",
      "反射係數",
      "阻抗匹配"
    ]
  },
  "/tools/impedance-matching-calculator": {
    "name": "L型阻抗匹配網路計算器",
    "description": "為半導體電漿射頻負載設計低通/高通 L 型 LC 阻抗匹配電路之電容與電感值。",
    "keywords": [
      "阻抗匹配",
      "L型匹配",
      "電漿負載",
      "史密斯圖"
    ]
  },
  "/tools/microstrip-calculator": {
    "name": "微帶線特性阻抗計算器",
    "description": "依據微帶線走線寬度、介電層厚度、介電常數及銅厚計算特性阻抗 Z0 與有效介電常數。",
    "keywords": [
      "微帶線",
      "特性阻抗",
      "Z0",
      "介電常數",
      "傳輸線"
    ]
  },
  "/tools/stub-matching-calculator": {
    "name": "單截線阻抗匹配計算器",
    "description": "計算開路或短路傳輸線單截線匹配之安裝位置與截線長度。",
    "keywords": [
      "單截線",
      "截線匹配",
      "短截線",
      "傳輸線匹配"
    ]
  },
  "/tools/bin-yield-calculator": {
    "name": "多Bin分選與晶粒測試良率計算器",
    "description": "分析晶圓針測（CP/FT）多 Bin 分選計數，統計各 Bin 分布佔比與通過良品率。",
    "keywords": [
      "Bin分選",
      "CP測試",
      "FT測試",
      "分選良率"
    ]
  },
  "/tools/fit-mtbf-calculator": {
    "name": "失效率 FIT 與平均故障間隔 MTBF",
    "description": "在 FIT（十億小時失效率）、失效率 λ（小時）與平均無故障時間 MTBF 間精準換算。",
    "keywords": [
      "FIT",
      "MTBF",
      "失效率",
      "可靠度",
      "平均無故障時間"
    ]
  },
  "/tools/yield-dppm-calculator": {
    "name": "良率與缺陷 DPPM 轉換",
    "description": "在良品率百分比（%）與百萬分率缺陷數（DPPM）之間精準雙向換算。",
    "keywords": [
      "DPPM",
      "百萬分率",
      "良率轉DPPM",
      "品質水準"
    ]
  },
  "/tools/weibull-life-calculator": {
    "name": "韋伯可靠度壽命分析",
    "description": "依據形狀參數 β 與特徵壽命 η 計算指定工作時間之可靠度 R(t)、累積失效率與 MTTF。",
    "keywords": [
      "韋伯分析",
      "Weibull",
      "特徵壽命",
      "可靠度分析"
    ]
  },
  "/tools/spc-control-chart-calculator": {
    "name": "統計製程管制 SPC 管制圖計算器",
    "description": "計算 X-bar & R / S 計量型管制圖之中心線及管制界限（UCL / LCL），支援 Nelson 規則判異。",
    "keywords": [
      "SPC",
      "管制圖",
      "Xbar-R",
      "管制界限",
      "UCL",
      "LCL"
    ]
  },
  "/tools/acceptance-sampling-calculator": {
    "name": "抽樣檢驗與接收機率計算器 (OC曲線)",
    "description": "依據二項分佈或卜瓦松分佈計算計數型抽樣計畫（n, c）之允收機率 Pa 與抽樣特性曲線。",
    "keywords": [
      "抽樣檢驗",
      "OC曲線",
      "允收機率",
      "AQL"
    ]
  },
  "/tools/ion-implantation-calculator": {
    "name": "離子植入投影射程與峰值濃度計算器",
    "description": "依據離子植入能量計算投影射程 Rp 與離散跨距 ΔRp，由劑量計算高斯峰值摻雜濃度。",
    "keywords": [
      "離子植入",
      "投影射程",
      "Rp",
      "跨距",
      "高斯分佈"
    ]
  },
  "/tools/semiconductor-depletion-calculator": {
    "name": "PN接面空乏區寬度與內建電位計算器",
    "description": "由摻雜濃度與外加逆偏電壓計算階梯式 PN 接面之內建電位 Vbi、空乏層寬度及接面電容。",
    "keywords": [
      "PN接面",
      "空乏層寬度",
      "內建電位",
      "逆向偏壓"
    ]
  },
  "/tools/cleanroom-converter": {
    "name": "無塵室等級與微粒濃度 (ISO / FS209E)",
    "description": "在 ISO 14644-1（Class 1-9）與美國聯邦標準 FS209E 間對照換算各粒徑懸浮微粒濃度上限。",
    "keywords": [
      "無塵室等級",
      "潔淨室",
      "ISO 14644",
      "FS209E",
      "微粒濃度"
    ]
  },
  "/tools/carrier-mobility-calculator": {
    "name": "載子遷移率與漂移速度計算器",
    "description": "利用 Caughey-Thomas 模型依據摻雜濃度計算矽中電子與電洞遷移率及高電場飽和漂移速度。",
    "keywords": [
      "載子遷移率",
      "漂移速度",
      "電子遷移率",
      "電洞遷移率"
    ]
  },
  "/tools/cmp-preston-calculator": {
    "name": "CMP 材料去除率計算器 (Preston 方程)",
    "description": "利用 Preston 方程式依據研磨下壓力 P、相對速度 V 與 Preston 係數估算化學機械研磨去除速率。",
    "keywords": [
      "CMP",
      "化學機械研磨",
      "Preston方程式",
      "去除速率"
    ]
  },
  "/tools/film-color-calculator": {
    "name": "二氧化矽與氮化矽薄膜干涉顏色查表",
    "description": "依據薄膜光學干涉原理，由 SiO2 與 Si3N4 膜厚查表快速預測矽晶圓表面反射之可見干涉色彩。",
    "keywords": [
      "薄膜顏色",
      "干涉色",
      "氧化層顏色",
      "SiO2顏色對照表"
    ]
  },
  "/tools/mosfet-threshold-calculator": {
    "name": "MOSFET 臨界電壓計算器",
    "description": "根據閘極氧化層厚度、基板摻雜濃度與功函數差計算長通道 MOSFET 平帶電壓與臨界電壓 Vt。",
    "keywords": [
      "MOSFET",
      "臨界電壓",
      "Vt",
      "閘極氧化層"
    ]
  },
  "/tools/thermal-fatigue-calculator": {
    "name": "銲點熱疲勞壽命計算器 (Coffin-Manson)",
    "description": "利用修正 Coffin-Manson / Norris-Landzberg 模型估算封裝銲點在溫度循環應力下之抗疲勞壽命圈數。",
    "keywords": [
      "熱疲勞",
      "Coffin Manson",
      "銲點壽命",
      "溫度循環"
    ]
  },
  "/tools/thermal-resistance-calculator": {
    "name": "晶片接面溫度與熱阻計算器",
    "description": "依據晶片功耗與接面至外殼（θjc）、外殼至環境（θca）熱阻計算工作結溫 Tj 與散熱安全餘量。",
    "keywords": [
      "接面溫度",
      "熱阻",
      "Tj",
      "結溫計算",
      "散熱設計"
    ]
  },
  "/tools/wire-bonding-calculator": {
    "name": "打線接合弧高與剪切拉力計算器",
    "description": "依據鍵合引線直徑與跨距幾何估算金線展開長度、金球推力（Ball Shear）與打線拉力（Wire Pull）規格。",
    "keywords": [
      "打線接合",
      "引線鍵合",
      "金球推力",
      "打線拉力"
    ]
  },
  "/tools/chemical-dilution-calculator": {
    "name": "化學品配比稀釋與濕法清洗計算器",
    "description": "RCA SC-1/SC-2、Piranha SPM、DHF 與 BOE 緩衝氫氟酸配比計算，組分質量/有效重量百分比、C1·V1=C2·V2 稀釋方程與二氧化矽蝕刻速率估算。",
    "keywords": [
      "化學配比",
      "濕法清洗",
      "稀釋計算器",
      "RCA清洗",
      "SC-1",
      "SC-2",
      "皮拉尼亞",
      "SPM",
      "氫氟酸",
      "DHF",
      "BOE",
      "緩衝蝕刻液",
      "濕法槽",
      "C1V1",
      "蝕刻速率"
    ]
  },
  "/tools/plasma-sheath-calculator": {
    "name": "電漿鞘層與德拜長度計算器",
    "description": "電子德拜長度（Debye Length）、玻姆聲速（Bohm Velocity）、Child-Langmuir 射頻偏壓鞘層厚度、電漿頻率與離子碰撞無因次參數估算。",
    "keywords": [
      "電漿鞘層",
      "德拜長度",
      "玻姆速度",
      "玻姆準則",
      "Child Langmuir",
      "鞘層厚度",
      "電漿頻率",
      "射頻偏壓",
      "RIE蝕刻",
      "ICP電漿",
      "鞘層電容",
      "平均自由徑"
    ]
  },
  "/tools/ald-cycle-calculator": {
    "name": "原子層沉積 (ALD) 週期與前驅物曝光計算器",
    "description": "原子層沉積（ALD）單週期時序、朗繆爾（Langmuir）前驅物曝光飽和度（θ）、每週期生長速率（GPC）及薄膜厚度與前驅物消耗量計算。",
    "keywords": [
      "原子層沉積",
      "ALD",
      "ALD週期",
      "每週期生長速率",
      "GPC",
      "前驅物曝光",
      "朗繆爾飽和",
      "TMA",
      "氧化鋁",
      "氧化鉿",
      "前驅物消耗",
      "吹掃時間",
      "脈衝時間"
    ]
  },
  "/tools/dopant-diffusion-calculator": {
    "name": "雜質熱擴散與接面深度計算器",
    "description": "恆定表面源（erfc）與有限表面源（高斯分佈）矽中雜質熱擴散計算、阿基尼斯擴散係數 D(T)（硼 B、磷 P、砷 As、銻 Sb）、冶金接面深度 xj 及二氧化矽遮罩厚度估算。",
    "keywords": [
      "雜質擴散",
      "熱擴散",
      "接面深度",
      "xj",
      "菲克定律",
      "預沉積",
      "再分佈",
      "推進擴散",
      "高斯擴散",
      "erfc",
      "硼擴散",
      "磷擴散",
      "熱預算",
      "氧化層遮罩"
    ]
  },
  "/tools/cvd-kinetics-calculator": {
    "name": "化學氣相沉積 (CVD) 與磊晶動力學計算器",
    "description": "依據格羅夫（Grove）邊界層傳質模型與阿基尼斯表面反應速率，計算 CVD/磊晶薄膜生長速率、機制轉變溫度及沿晶托前驅物消耗均勻性。",
    "keywords": [
      "CVD",
      "化學氣相沉積",
      "磊晶",
      "磊晶生長速率",
      "Grove模型",
      "邊界層",
      "傳質控制",
      "表面反應控制",
      "阿基尼斯",
      "矽烷",
      "LPCVD",
      "TEOS"
    ]
  },
  "/tools/four-point-probe-calculator": {
    "name": "四探針電阻率與方阻計算器 (ASTM F84)",
    "description": "基於 ASTM F84 / SEMI MF84 標準的共線四探針薄層電阻、晶圓體電阻率、有限厚度幾何修正係數及 NIST/Thurber 摻雜濃度反推計算器。",
    "keywords": [
      "四探針",
      "ASTM F84",
      "SEMI MF84",
      "薄層電阻",
      "方塊電阻",
      "電阻率",
      "厚度修正",
      "摻雜濃度反推",
      "載流子遷移率"
    ]
  },
  "/tools/split-lot-calculator": {
    "name": "Split-Lot 實驗與 DOE 配方對比計算器",
    "description": "半導體分批實驗（Split-Lot）及正交試驗（DOE）配方矩陣對比，晶圓級參數偏差監控、工藝響應 Delta 分析及製造流轉卡導出。",
    "keywords": [
      "split lot",
      "DOE",
      "實驗設計",
      "配方對比",
      "分批實驗",
      "晶圓流轉卡",
      "工藝偏差",
      "配方微調",
      "無塵室工單"
    ]
  },
  "/tools/curve-fitting-calculator": {
    "name": "曲線擬合與工藝參數提取計算器",
    "description": "半導體反應動力學參數提取：阿倫尼烏斯活化能 (Ea)、Deal-Grove 氧化速率常數 (B, B/A) 以及一元線性迴歸與 R² 擬合優度判定。",
    "keywords": [
      "曲線擬合",
      "阿倫尼烏斯擬合",
      "活化能提取",
      "Deal-Grove 參數提取",
      "線性迴歸",
      "參數擬合",
      "動力學參數",
      "氧化速率常數",
      "擴散活化能"
    ]
  },
  "/tools/arde-etch-calculator": {
    "name": "高深寬比蝕刻與微負載效應計算器 (ARDE)",
    "description": "深寬比相關蝕刻效應 (ARDE / RIE Lag)、圖形微負載效應（Microloading）及光阻選擇比與側壁傾角模擬。",
    "keywords": [
      "ARDE",
      "RIE滯後",
      "微負載效應",
      "深寬比",
      "蝕刻速率",
      "選擇比",
      "側壁傾角",
      "Coburn-Winter"
    ]
  },
  "/tools/cmp-endpoint-calculator": {
    "name": "CMP 終點檢測與研磨墊壽命計算器",
    "description": "化學機械平坦化馬達電流終點判定、光學干涉條紋週期測厚與鑽石修整盤研磨墊損耗預測。",
    "keywords": [
      "CMP",
      "終點檢測",
      "研磨墊壽命",
      "光學干涉條紋",
      "修整器磨損",
      "溝槽深度",
      "平坦化"
    ]
  },
  "/tools/wafer-warp-stress-calculator": {
    "name": "晶圓彎曲、翹曲與薄膜殘餘應力計算器",
    "description": "基於 Stoney 方程式計算薄膜殘餘應力、晶圓彎曲度（Bow）與翹曲度（Warp）曲率半徑轉換、熱膨脹失配應力及薄膜裂紋/剝離臨界厚度。",
    "keywords": [
      "Stoney 方程式",
      "晶圓彎曲",
      "晶圓翹曲",
      "薄膜應力",
      "熱失配應力",
      "雙軸彈性模量",
      "殘餘應力",
      "曲率半徑"
    ]
  },
  "/tools/wet-bench-calculator": {
    "name": "濕法清洗槽壽命與加藥補充計算器",
    "description": "RCA清洗（SC-1/SC-2）、SPM硫酸雙氧水去阻劑及BOE緩衝氧化矽蝕刻槽壽命評估、化學藥液定時定量補加與矽負載老化模型。",
    "keywords": [
      "濕法清洗",
      "RCA清洗",
      "SC-1",
      "SC-2",
      "SPM",
      "BOE",
      "藥液補充",
      "槽壽命",
      "蝕刻槽"
    ]
  },
  "/tools/cu-plating-calculator": {
    "name": "銅互連電鍍與雙大馬士革超充填計算器",
    "description": "銅電化學沉積 (ECD)、雙大馬士革溝槽超保形填充 (Superfilling)、晶圓種子層終端效應 (Terminal Effect) 與法拉第電解動力學。",
    "keywords": [
      "銅互連",
      "電鍍",
      "ECD",
      "大馬士革",
      "超充填",
      "法拉第定律",
      "終端效應",
      "電流密度",
      "添加劑"
    ]
  },
  "/tools/stdf-klarf-explorer": {
    "name": "STDF/KLARF 資料瀏覽器",
    "description": "在瀏覽器中解析 ATE STDF V4 與 KLA KLARF 檔案：逐測試 Cpk 統計、趨勢走勢圖、Bin 分布、良率與缺陷簇分析，並可一鍵轉入 SPC 控制圖。",
    "keywords": [
      "STDF",
      "KLARF",
      "測試資料",
      "ATE 資料日誌",
      "參數量測",
      "Cpk",
      "製程能力",
      "Bin 分布",
      "軟Bin",
      "硬Bin",
      "良率",
      "缺陷檢測",
      "晶圓測試",
      "SPC"
    ]
  },
  "/tools/layout-parasitics-calculator": {
    "name": "IC 版圖寄生參數估算器",
    "description": "基於版圖繪製幾何尺寸估算互連電阻、平板與邊緣電容、IR 壓降與 RC 延遲，支援 Cu/Al/鎢/多晶矽的電阻率溫度修正，是下線前的經典核查工具。",
    "keywords": [
      "版圖",
      "寄生參數",
      "配線電阻",
      "RC延遲",
      "壓降",
      "互連電容",
      "邊緣電容",
      "方塊電阻",
      "金屬布線",
      "多晶矽閘極",
      "下線前檢查"
    ]
  },
  "/tools/drc-rule-checker": {
    "name": "DRC 設計規則自檢器",
    "description": "選擇製程節點即可檢視各層的典型設計規則（最小線寬、間距、節距、接觸孔/導孔包圍量、最小面積），並核對繪製的佈局尺寸是否符合規則，給出通過/違例與裕量 —— 經驗參考值，並非晶圓廠 DRC 檢查檔案。",
    "keywords": [
      "設計規則",
      "DRC",
      "線寬",
      "間距",
      "節距",
      "包圍",
      "最小面積",
      "製程節點",
      "FinFET",
      "下線",
      "佈局檢查",
      "經驗值"
    ]
  }
};
