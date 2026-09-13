import type { ToolTranslation } from '../types';

export const zhCN: Record<string, ToolTranslation> = {
  "/tools/wafer-die-calculator": {
    "name": "晶圆出芯数计算器",
    "description": "基于晶圆直径、芯片尺寸、划片槽宽度和边缘去除估算理论总芯数（Gross Die）及面积利用率。",
    "keywords": [
      "晶圆出芯数",
      "出片数",
      "芯片数",
      "划片槽",
      "边缘去除",
      "晶圆利用率",
      "Gross Die",
      "DPW"
    ]
  },
  "/tools/wafer-map-generator": {
    "name": "交互式晶圆图生成器",
    "description": "交互式可视化晶圆网格图，支持芯片坐标排布、合格/不良统计及 CSV/JSON 格式导出。",
    "keywords": [
      "晶圆图",
      "晶圆地图",
      "芯片排布",
      "分选统计",
      "晶圆可视化",
      "wafer map"
    ]
  },
  "/tools/wafer-mark-calculator": {
    "name": "SEMI 晶圆标刻与校验码计算器",
    "description": "符合 SEMI M12 与 M13 标准的单晶硅晶圆激光打标字符格式化与校验和校验算法。",
    "keywords": [
      "晶圆打标",
      "SEMI标刻",
      "SEMI M12",
      "SEMI M13",
      "晶圆编号",
      "激光打标",
      "校验码"
    ]
  },
  "/tools/yield-calculator": {
    "name": "晶圆良率计算器",
    "description": "基于投片晶圆数、产出合格芯片数与良品率计算晶圆制造综合良率及封装测试良率。",
    "keywords": [
      "良率计算",
      "晶圆良率",
      "制程良率",
      "芯片良率",
      "成品率",
      "生产良率"
    ]
  },
  "/tools/yield-model-calculator": {
    "name": "良率模型对比计算器",
    "description": "横向对比 Murphy、Poisson、Seeds 和 Bose-Einstein 半导体良率预测模型。",
    "keywords": [
      "良率模型",
      "墨菲模型",
      "泊松模型",
      "Seeds模型",
      "缺陷密度模型",
      "良率预测"
    ]
  },
  "/tools/defect-density-calculator": {
    "name": "缺陷密度计算器",
    "description": "基于芯片面积和实测良率反推晶圆缺陷密度 D0，量化评估洁净室与工艺水平。",
    "keywords": [
      "缺陷密度",
      "D0",
      "致命缺陷",
      "良率损失",
      "泊松分布",
      "洁净度"
    ]
  },
  "/tools/die-cost-calculator": {
    "name": "晶圆芯片成本计算器",
    "description": "根据晶圆加工成本、晶圆出芯数、制造良率与封装测试费用测算单颗芯片净成本。",
    "keywords": [
      "芯片成本",
      "晶圆成本",
      "单颗成本",
      "芯片报价",
      "制造成本",
      "封装测试成本"
    ]
  },
  "/tools/process-capability-calculator": {
    "name": "制程能力指数计算器 (Cp / Cpk)",
    "description": "基于规格公差上限 USL、下限 LSL 以及样本均值和标准差计算制程能力 Cp、Cpk、Pp、Ppk。",
    "keywords": [
      "制程能力",
      "工序能力",
      "Cp",
      "Cpk",
      "Pp",
      "Ppk",
      "六西格玛",
      "统计过程控制"
    ]
  },
  "/tools/yield-confidence-calculator": {
    "name": "良率置信区间计算器",
    "description": "基于小批量抽样测试数据计算 Wilson 分数或 Clopper-Pearson 良率置信区间。",
    "keywords": [
      "置信区间",
      "良率区间",
      "Wilson得分",
      "Clopper Pearson",
      "抽样置信度"
    ]
  },
  "/tools/throughput-calculator": {
    "name": "机台产能与节拍计算器 (WPH)",
    "description": "基于单步工艺耗时、传输机械手开销与批次大小计算晶圆厂机台 WPH（每小时晶圆数）。",
    "keywords": [
      "机台产能",
      "WPH",
      "每小时晶圆数",
      "节拍时间",
      "设备生产率",
      "周期时间"
    ]
  },
  "/tools/sheet-resistance-calculator": {
    "name": "四探针方块电阻与电阻率计算器",
    "description": "由四探针电压电流测量值、探针间距、薄膜厚度及几何修正因子计算方阻与体电阻率。",
    "keywords": [
      "方阻",
      "方块电阻",
      "四探针",
      "电阻率",
      "薄膜电阻率",
      "薄层电阻",
      "Rs"
    ]
  },
  "/tools/wafer-area-calculator": {
    "name": "晶圆有效面积与边缘去除计算器",
    "description": "计算含平边（Flat）或缺口（Notch）的晶圆总面积，以及扣除边缘去除后的有效工艺面积。",
    "keywords": [
      "晶圆面积",
      "边缘去除",
      "有效面积",
      "平边",
      "缺口",
      "Edge Exclusion"
    ]
  },
  "/tools/reticle-field-calculator": {
    "name": "光罩曝光视场计算器",
    "description": "计算步进光刻机/扫描光刻机（Stepper/Scanner）曝光视场内可容纳的芯片阵列行数与列数。",
    "keywords": [
      "光罩视场",
      "曝光视场",
      "光刻视场",
      "单步曝光",
      "步进光刻",
      "Reticle Field"
    ]
  },
  "/tools/thickness-converter": {
    "name": "薄膜厚度单位换算",
    "description": "在埃（Å）、纳米（nm）、微米（µm）、密耳（mil）和毫米（mm）之间精确换算薄膜厚度。",
    "keywords": [
      "薄膜厚度",
      "厚度换算",
      "埃",
      "纳米",
      "微米",
      "膜厚单位",
      "单位转换"
    ]
  },
  "/tools/pressure-converter": {
    "name": "真空与气压单位换算",
    "description": "在帕斯卡（Pa）、毫巴（mbar）、托（Torr）、毫托（mTorr）和标准大气压（atm）间高精度换算。",
    "keywords": [
      "真空度",
      "气压换算",
      "托",
      "帕斯卡",
      "毫巴",
      "真空腔体",
      "Torr",
      "Pa"
    ]
  },
  "/tools/gas-flow-converter": {
    "name": "气体质量流量换算 (sccm / slm)",
    "description": "在标准立方厘米每分（sccm）、标准升每分（slm）、mol/s 及不同标况参考温度间换算气体流量。",
    "keywords": [
      "气体流量",
      "质量流量计",
      "MFC",
      "sccm",
      "slm",
      "标准立方厘米"
    ]
  },
  "/tools/temperature-converter": {
    "name": "温度单位换算",
    "description": "在摄氏度（°C）、开尔文（K）和华氏度（°F）之间精确互换，并提供半导体热能 kT（eV）。",
    "keywords": [
      "温度换算",
      "摄氏度",
      "开尔文",
      "热能量",
      "玻尔兹曼",
      "kT"
    ]
  },
  "/tools/lithography-resolution-calculator": {
    "name": "光刻分辨率与焦深计算器 (Rayleigh)",
    "description": "利用瑞利判据基于曝光波长 λ、数值孔径 NA 和工艺因子 k1/k2 计算理论分辨率与焦点深度（DoF）。",
    "keywords": [
      "光刻分辨率",
      "焦深",
      "DoF",
      "瑞利准则",
      "数值孔径",
      "NA",
      "k1因子",
      "曝光极限"
    ]
  },
  "/tools/etch-rate-calculator": {
    "name": "刻蚀速率与选择比计算器",
    "description": "根据刻蚀前后薄膜厚度变化与处理时间计算刻蚀速率，并计算目标层与掩膜层/下层选择比。",
    "keywords": [
      "刻蚀速率",
      "选择比",
      "刻蚀选择性",
      "等离子体刻蚀",
      "湿法刻蚀",
      "Etch Rate"
    ]
  },
  "/tools/cd-uniformity-calculator": {
    "name": "关键尺寸 (CD) 均匀性计算器",
    "description": "分析晶圆多点 CD 量测数据，计算均值、极差（Range）、标准差（3σ）及 ±3σ 均匀性百分比。",
    "keywords": [
      "关键尺寸",
      "CD均匀性",
      "线宽均匀性",
      "3西格玛",
      "极差",
      "片内均一性"
    ]
  },
  "/tools/film-stress-calculator": {
    "name": "薄膜应力计算器 (Stoney 公式)",
    "description": "基于晶圆衬底弹性模量、泊松比及沉积前后曲率半径变化由 Stoney 公式计算薄膜张/压应力。",
    "keywords": [
      "薄膜应力",
      "Stoney公式",
      "曲率半径",
      "张应力",
      "压应力",
      "晶圆弯曲",
      "翘曲"
    ]
  },
  "/tools/film-uniformity-calculator": {
    "name": "薄膜厚度均匀性计算器",
    "description": "由晶圆面内多点膜厚读数计算最大值、最小值、平均值及半极差百分比均匀度（±%）。",
    "keywords": [
      "膜厚均匀性",
      "薄膜均匀度",
      "半极差",
      "椭偏仪",
      "膜厚量测"
    ]
  },
  "/tools/diffusion-length-calculator": {
    "name": "热扩散长度计算器",
    "description": "根据半导体杂质扩散系数 D 与退火热处理时间 t 计算特征扩散长度 2√(Dt)。",
    "keywords": [
      "扩散长度",
      "扩散深度",
      "热扩散",
      "杂质退火",
      "掺杂扩散",
      "扩散时间"
    ]
  },
  "/tools/arrhenius-calculator": {
    "name": "Arrhenius 反应速率与活化能计算器",
    "description": "由指前因子与活化能 Ea 计算温度相关反应速率，或通过两点实测速率提取表观活化能。",
    "keywords": [
      "阿伦尼乌斯",
      "活化能",
      "反应速率",
      "指前因子",
      "温度依赖性",
      "Arrhenius",
      "Ea"
    ]
  },
  "/tools/thermal-oxide-calculator": {
    "name": "热氧化生长厚度计算器 (Deal-Grove)",
    "description": "利用经典 Deal-Grove 模型计算单晶硅在干氧（Dry O2）或湿氧（Wet H2O）条件下的热氧化层生长厚度。",
    "keywords": [
      "热氧化",
      "氧化层厚度",
      "Deal-Grove模型",
      "干氧氧化",
      "湿氧氧化",
      "二氧化硅生长"
    ]
  },
  "/tools/power-converter": {
    "name": "射频功率与 dBm 换算",
    "description": "在瓦特（W）、毫瓦（mW）与毫瓦分贝（dBm）之间精确换算，并提供峰峰值电压参考。",
    "keywords": [
      "射频功率",
      "dBm换算",
      "瓦特换算",
      "mW换算",
      "峰峰值电压",
      "Vpp"
    ]
  },
  "/tools/time-constant-calculator": {
    "name": "RC / RL 时间常数计算器",
    "description": "计算 RC（τ = RC）和 RL（τ = L/R）瞬态电路时间常数、上升时间与充放电响应。",
    "keywords": [
      "时间常数",
      "RC电路",
      "RL电路",
      "上升时间",
      "充放电",
      "暂态响应"
    ]
  },
  "/tools/rf-power-calculator": {
    "name": "射频功率与反射计算器",
    "description": "由前向入射功率与反向反射功率计算反射系数、负载净吸收功率及回波损耗。",
    "keywords": [
      "射频功率",
      "反射功率",
      "前向功率",
      "吸收功率",
      "反射系数",
      "RF匹配"
    ]
  },
  "/tools/return-loss-calculator": {
    "name": "回波损耗与驻波比计算器 (VSWR)",
    "description": "在回波损耗（Return Loss）、电压驻波比（VSWR）、电压反射系数（Γ）与反射功率百分比间换算。",
    "keywords": [
      "回波损耗",
      "驻波比",
      "VSWR",
      "反射系数",
      "S11",
      "阻抗匹配"
    ]
  },
  "/tools/impedance-matching-calculator": {
    "name": "L型阻抗匹配网络计算器",
    "description": "为射频等离子体发生器与负载设计低通或高通 L 型 LC 阻抗匹配网络元件参数。",
    "keywords": [
      "阻抗匹配",
      "L型匹配",
      "LC网络",
      "射频电源",
      "等离子体匹配",
      "史密斯圆图"
    ]
  },
  "/tools/microstrip-calculator": {
    "name": "微带线阻抗计算器",
    "description": "根据微带线导线宽度、介质厚度、介电常数与铜箔厚度估算特性阻抗 Z0 与有效介电常数。",
    "keywords": [
      "微带线",
      "特性阻抗",
      "Z0",
      "介电常数",
      "传输线",
      "PCB微带线"
    ]
  },
  "/tools/stub-matching-calculator": {
    "name": "单枝节阻抗匹配计算器",
    "description": "计算开路或短路单枝节微波匹配传输线的位置距离与枝节长度。",
    "keywords": [
      "单枝节",
      "短截线",
      "截线匹配",
      "开路线",
      "短路线",
      "微波匹配"
    ]
  },
  "/tools/bin-yield-calculator": {
    "name": "多Bin分选与测试良率计算器",
    "description": "分析芯片晶圆测试（CP/FT）多 Bin 分选结果，统计各 Bin 分布占比与总体良品率。",
    "keywords": [
      "Bin分选",
      "多Bin良率",
      "CP测试",
      "FT测试",
      "晶圆分选",
      "良率统计"
    ]
  },
  "/tools/fit-mtbf-calculator": {
    "name": "失效率 FIT 与平均无故障时间 MTBF",
    "description": "在 FIT（每十亿小时失效数）、失效率 λ（/小时）和平均无故障时间 MTBF 间精确换算。",
    "keywords": [
      "FIT",
      "MTBF",
      "失效率",
      "可靠性",
      "平均无故障时间",
      "失效率单位"
    ]
  },
  "/tools/yield-dppm-calculator": {
    "name": "良率与缺陷 DPPM 转换",
    "description": "在制造/封测良率百分比（%）与每百万缺陷数（DPPM / Parts Per Million）之间精确互换。",
    "keywords": [
      "DPPM",
      "百万分率",
      "良率转DPPM",
      "缺陷率",
      "PPM换算",
      "品质指标"
    ]
  },
  "/tools/weibull-life-calculator": {
    "name": "威布尔可靠性寿命分析",
    "description": "基于形状参数 β（斜率）和特征寿命 η 计算指定工作时间的可靠度 R(t)、失效率及中位寿命。",
    "keywords": [
      "威布尔分析",
      "Weibull",
      "特征寿命",
      "可靠度",
      "失效率曲线",
      "浴盆曲线"
    ]
  },
  "/tools/spc-control-chart-calculator": {
    "name": "统计过程控制 SPC 控制图计算器",
    "description": "计算 X-bar & R / S 控制图中心线与上/下控制限（UCL / LCL），并提供 Nelson 判异规则检查。",
    "keywords": [
      "SPC",
      "控制图",
      "Xbar-R",
      "控制限",
      "UCL",
      "LCL",
      "Nelson规则",
      "过程受控"
    ]
  },
  "/tools/acceptance-sampling-calculator": {
    "name": "抽样检验与接收概率计算器 (OC曲线)",
    "description": "基于二项分布或泊松分布计算抽样方案（n, c）在不同批量批不合格品率下的接收概率 Pa 及 OC 曲线。",
    "keywords": [
      "抽样检验",
      "OC曲线",
      "接收概率",
      "AQL",
      "批接收",
      "抽样方案"
    ]
  },
  "/tools/ion-implantation-calculator": {
    "name": "离子注入投影射程与峰值浓度计算器",
    "description": "根据注入能量估算杂质投影射程 Rp 与跨距 ΔRp，由注入剂量估算高斯掺杂峰值体浓度。",
    "keywords": [
      "离子注入",
      "投影射程",
      "Rp",
      "跨距",
      "注入能量",
      "注入剂量",
      "峰值浓度"
    ]
  },
  "/tools/semiconductor-depletion-calculator": {
    "name": "PN结势垒区宽度与内建电势计算器",
    "description": "由掺杂浓度 Na、Nd 与外加反偏电压计算突变 PN 结内建电势 Vbi、耗尽层宽度及势垒电容。",
    "keywords": [
      "PN结",
      "耗尽层宽度",
      "内建电势",
      "势垒电容",
      "空间电荷区",
      "反向偏压"
    ]
  },
  "/tools/cleanroom-converter": {
    "name": "洁净室等级与颗粒浓度 (ISO / FS209E)",
    "description": "在 ISO 14644-1（Class 1-9）与美联邦标准 FED-STD-209E（Class 1-100000）间换算空气洁净度颗粒上限。",
    "keywords": [
      "洁净室等级",
      "无尘室",
      "ISO 14644",
      "FS209E",
      "颗粒浓度",
      "百级无尘室",
      "千级洁净室"
    ]
  },
  "/tools/carrier-mobility-calculator": {
    "name": "载流子迁移率与漂移速度计算器",
    "description": "根据半导体中掺杂浓度（Caughey-Thomas 经验模型）估算电子与空穴低场迁移率及电场饱和漂移速度。",
    "keywords": [
      "载流子迁移率",
      "漂移速度",
      "电子迁移率",
      "空穴迁移率",
      "饱和速度",
      "Caughey Thomas"
    ]
  },
  "/tools/cmp-preston-calculator": {
    "name": "CMP 材料去除率计算器 (Preston 方程)",
    "description": "利用经典 Preston 方程由下压力 P、相对线速度 V 及 Preston 系数 kp 估算化学机械抛光材料去除速率（MRR）。",
    "keywords": [
      "CMP",
      "化学机械抛光",
      "Preston方程",
      "材料去除率",
      "MRR",
      "研磨压力"
    ]
  },
  "/tools/film-color-calculator": {
    "name": "二氧化硅与氮化硅薄膜干涉颜色查表",
    "description": "基于垂直白光干涉原理，根据热氧化硅（SiO2）和氮化硅（Si3N4）薄膜厚度查表预测晶圆表面干涉可见颜色。",
    "keywords": [
      "薄膜颜色",
      "干涉色",
      "氧化层颜色",
      "氮化硅颜色",
      "SiO2颜色",
      "膜厚颜色对照表"
    ]
  },
  "/tools/mosfet-threshold-calculator": {
    "name": "MOSFET 阈值电压计算器",
    "description": "基于栅氧厚度、衬底掺杂浓度与功函数差计算长沟道 MOS 场效应管平带电压与阈值电压 Vt。",
    "keywords": [
      "MOSFET",
      "阈值电压",
      "Vt",
      "平带电压",
      "栅氧厚度",
      "功函数差"
    ]
  },
  "/tools/thermal-fatigue-calculator": {
    "name": "焊点热疲劳寿命计算器 (Coffin-Manson)",
    "description": "基于修正 Coffin-Manson / Norris-Landzberg 模型估算半导体器件封装焊点在温度循环下的热疲劳失效循环数。",
    "keywords": [
      "热疲劳",
      "Coffin Manson",
      "Norris Landzberg",
      "焊点寿命",
      "温度循环",
      "封装可靠性"
    ]
  },
  "/tools/thermal-resistance-calculator": {
    "name": "芯片结温与热阻计算器",
    "description": "由芯片功耗与结-壳（θjc）、壳-环境（θca）热阻计算芯片工作结温 Tj 并评估散热设计裕量。",
    "keywords": [
      "芯片结温",
      "热阻",
      "Tj",
      "结温计算",
      "Theta JC",
      "散热设计",
      "热耗散"
    ]
  },
  "/tools/wire-bonding-calculator": {
    "name": "引线键合线弧与剪切力计算器",
    "description": "基于金线/铜线直径与线弧跨度几何估算键合线展开长度、金球剪切力（Ball Shear）与焊线拉力（Wire Pull）。",
    "keywords": [
      "引线键合",
      "打线",
      "线弧高度",
      "金球剪切力",
      "焊线拉力",
      "Ball Shear",
      "Wire Pull"
    ]
  },
  "/tools/chemical-dilution-calculator": {
    "name": "化学品配比稀释与湿法清洗计算器",
    "description": "RCA SC-1/SC-2、Piranha SPM、DHF 与 BOE 缓冲氢氟酸配比计算，组分质量/有效浓度百分比、C1·V1=C2·V2 稀释方程与二氧化硅刻蚀速率估算。",
    "keywords": [
      "化学配比",
      "湿法清洗",
      "稀释计算器",
      "RCA清洗",
      "SC-1",
      "SC-2",
      "皮拉尼亚",
      "SPM",
      "氢氟酸",
      "DHF",
      "BOE",
      "缓冲刻蚀液",
      "湿法槽",
      "C1V1",
      "二氧化硅腐蚀速率"
    ]
  },
  "/tools/plasma-sheath-calculator": {
    "name": "等离子体鞘层与德拜长度计算器",
    "description": "电子德拜长度（Debye Length）、玻姆声速（Bohm Velocity）、Child-Langmuir 射频偏压鞘层厚度、等离子体频率与离子碰撞无量纲参数估算。",
    "keywords": [
      "等离子体鞘层",
      "德拜长度",
      "玻姆速度",
      "玻姆判据",
      "Child Langmuir",
      "鞘层厚度",
      "等离子体频率",
      "射频偏压",
      "RIE刻蚀",
      "ICP等离子体",
      "鞘层电容",
      "平均自由程"
    ]
  },
  "/tools/ald-cycle-calculator": {
    "name": "原子层沉积 (ALD) 周期与前驱体曝光计算器",
    "description": "原子层沉积（ALD）单周期时序、朗缪尔（Langmuir）前驱体曝光饱和度（θ）、每周期生长速率（GPC）及薄膜厚度与前驱体消耗量计算。",
    "keywords": [
      "原子层沉积",
      "ALD",
      "ALD周期",
      "每周期生长速率",
      "GPC",
      "前驱体曝光",
      "朗缪尔饱和",
      "TMA",
      "氧化铝",
      "氧化铪",
      "前驱体消耗",
      "吹扫时间",
      "脉冲时间"
    ]
  },
  "/tools/dopant-diffusion-calculator": {
    "name": "杂质热扩散与结深计算器",
    "description": "恒定表面源（erfc）与有限表面源（高斯分布）硅中杂质热扩散计算、阿伦尼乌斯扩散系数 D(T)（硼 B、磷 P、砷 As、锑 Sb）、冶金结深 xj 及二氧化硅掩膜厚度估算。",
    "keywords": [
      "杂质扩散",
      "热扩散",
      "结深",
      "xj",
      "菲克定律",
      "预淀积",
      "再分布",
      "推进扩散",
      "高斯扩散",
      "erfc",
      "硼扩散",
      "磷扩散",
      "热预算",
      "氧化物掩膜"
    ]
  },
  "/tools/cvd-kinetics-calculator": {
    "name": "化学气相沉积 (CVD) 与外延动力学计算器",
    "description": "基于格罗夫（Grove）边界层传质模型与阿伦尼乌斯表面反应速率，计算 CVD/外延薄膜生长速率、机制转变温度及沿晶托前驱体耗尽均匀性。",
    "keywords": [
      "CVD",
      "化学气相沉积",
      "外延",
      "外延生长速率",
      "Grove模型",
      "边界层",
      "传质控制",
      "表面反应控制",
      "阿伦尼乌斯",
      "硅烷",
      "LPCVD",
      "TEOS"
    ]
  },
  "/tools/four-point-probe-calculator": {
    "name": "四探针电阻率与方阻计算器 (ASTM F84)",
    "description": "基于 ASTM F84 / SEMI MF84 标准的共线四探针薄层电阻、晶圆体电阻率、有限厚度几何修正系数及 NIST/Thurber 掺杂浓度反推计算器。",
    "keywords": [
      "四探针",
      "ASTM F84",
      "SEMI MF84",
      "薄层电阻",
      "方块电阻",
      "电阻率",
      "厚度修正",
      "掺杂浓度反推",
      "载流子迁移率"
    ]
  },
  "/tools/split-lot-calculator": {
    "name": "Split-Lot 实验与 DOE 配方对比计算器",
    "description": "半导体分批实验（Split-Lot）及正交试验（DOE）配方矩阵对比，晶圆级参数偏差监控、工艺响应 Delta 分析及制造流转卡导出。",
    "keywords": [
      "split lot",
      "DOE",
      "实验设计",
      "配方对比",
      "分批实验",
      "晶圆流转卡",
      "工艺偏差",
      "配方调整",
      "洁净室工单"
    ]
  },
  "/tools/curve-fitting-calculator": {
    "name": "曲线拟合与工艺参数提取计算器",
    "description": "半导体反应动力学参数提取：阿伦尼乌斯激活能 (Ea)、Deal-Grove 氧化速率常数 (B, B/A) 以及一元线性回归与 R² 拟合优度判定。",
    "keywords": [
      "曲线拟合",
      "阿伦尼乌斯拟合",
      "激活能提取",
      "Deal-Grove 参数提取",
      "线性回归",
      "参数拟合",
      "动力学参数",
      "氧化速率常数",
      "扩散激活能"
    ]
  },
  "/tools/arde-etch-calculator": {
    "name": "高深宽比刻蚀与微负载效应计算器 (ARDE)",
    "description": "深宽比相关刻蚀效应 (ARDE / RIE Lag)、图形微负载效应（Microloading）及掩膜选择比与侧壁陡直度仿真。",
    "keywords": [
      "ARDE",
      "RIE滞后",
      "微负载效应",
      "深宽比",
      "刻蚀速率",
      "选择比",
      "侧壁倾角",
      "Coburn-Winter"
    ]
  },
  "/tools/cmp-endpoint-calculator": {
    "name": "CMP 终点检测与研磨垫寿命计算器",
    "description": "化学机械平坦化电机电流终点判定、光学干涉条纹周期测厚与金刚石修整器研磨垫磨损预测。",
    "keywords": [
      "CMP",
      "终点检测",
      "研磨垫寿命",
      "光学干涉条纹",
      "修整器磨损",
      "沟槽深度",
      "平坦化"
    ]
  },
  "/tools/wafer-warp-stress-calculator": {
    "name": "晶圆弯曲、翘曲与薄膜残余应力计算器",
    "description": "基于 Stoney 方程计算薄膜残余应力、晶圆弯曲度（Bow）与翘曲度（Warp）曲率半径转换、热膨胀失配应力及薄膜开裂/剥离临界厚度。",
    "keywords": [
      "Stoney 方程",
      "晶圆弯曲",
      "晶圆翘曲",
      "薄膜应力",
      "热失配应力",
      "双轴弹性模量",
      "残余应力",
      "曲率半径"
    ]
  },
  "/tools/wet-bench-calculator": {
    "name": "湿法清洗槽寿命与加药补加计算器",
    "description": "RCA清洗（SC-1/SC-2）、SPM硫酸双氧水去胶及BOE缓冲氧化硅刻蚀槽寿命评估、化学药液定时定量补加与硅负载老化模型。",
    "keywords": [
      "湿法清洗",
      "RCA清洗",
      "SC-1",
      "SC-2",
      "SPM",
      "BOE",
      "药液补加",
      "槽寿命",
      "刻蚀槽"
    ]
  },
  "/tools/cu-plating-calculator": {
    "name": "铜互连电镀与双大马士革超充填计算器",
    "description": "铜电化学沉积 (ECD)、双大马士革沟槽超保形填充 (Superfilling)、晶圆种子层终端效应 (Terminal Effect) 与法拉第电解动力学。",
    "keywords": [
      "铜互连",
      "电镀",
      "ECD",
      "大马士革",
      "超充填",
      "法拉第定律",
      "终端效应",
      "电流密度",
      "添加剂"
    ]
  },
  "/tools/stdf-klarf-explorer": {
    "name": "STDF/KLARF 数据浏览器",
    "description": "在浏览器中解析 ATE STDF V4 与 KLA KLARF 文件：逐测试 Cpk 统计、趋势迷你图、Bin 分布、良率与缺陷簇分析，并可一键转入 SPC 控制图。",
    "keywords": [
      "STDF",
      "KLARF",
      "测试数据",
      "ATE 数据日志",
      "参数量测",
      "Cpk",
      "工艺能力",
      "Bin 分布",
      "软bin",
      "硬bin",
      "良率",
      "缺陷检测",
      "晶圆测试",
      "SPC"
    ]
  },
  "/tools/layout-parasitics-calculator": {
    "name": "IC 版图寄生参数估算器",
    "description": "基于版图绘制几何尺寸估算互连电阻、平板与边缘电容、IR 压降与 RC 延迟，支持 Cu/Al/钨/多晶硅的电阻率温度修正，是流片前的经典核查工具。",
    "keywords": [
      "版图",
      "寄生参数",
      "配线电阻",
      "RC延迟",
      "压降",
      "互连电容",
      "边缘电容",
      "方块电阻",
      "金属布线",
      "多晶硅栅",
      "流片前检查"
    ]
  }
};
