# 半导体工程师工具箱 V1 产品规格

## 一、项目定位

暂定项目名：

**SemiTools**

副标题：

> Semiconductor Engineering Calculators & Tools

中文：

> 半导体工程计算与实用工具箱

核心特点：

-   免费
-   无需登录
-   手机/电脑都能用
-   输入参数 → 立即计算
-   公式透明，可查看计算过程
-   支持复制结果
-   支持 CSV / JSON 导出
-   中英文双语

网站定位不是普通"计算器大全"，而是突出**半导体专业工具**。

------------------------------------------------------------------------

# 二、V1 页面结构

``` text
/
├── 首页
│
├── /tools
│   └── 工具列表
│
├── /tools/wafer-mark-calculator
│   └── 刻号计算器
│
├── /tools/wafer-die-calculator
│   └── Wafer Die 数量计算器
│
└── /tools/wafer-map-generator
    └── Wafer Map 生成器
```

另外建议从第一天就预留：

``` text
/about
/privacy
/contact
```

------------------------------------------------------------------------

# 三、首页

首页不要复杂。

## Hero

``` text
Semiconductor Tools

Practical tools for semiconductor engineers.

半导体工程师的在线计算与实用工具箱

[ Search tools... ]
```

## Popular Tools

四个卡片：

``` text
┌─────────────────────────┐
│ 🔢 Wafer Mark Calculator│
│                         │
│ Generate and validate   │
│ wafer marking codes.   │
│                         │
│ Open Tool →             │
└─────────────────────────┘

┌─────────────────────────┐
│ ◉ Wafer Die Calculator │
│                         │
│ Estimate dies per wafer│
│                         │
│ Open Tool →             │
└─────────────────────────┘

┌─────────────────────────┐
│ ◉ Wafer Map Generator  │
│                         │
│ Generate wafer die map │
│                         │
│ Open Tool →             │
└─────────────────────────┘

┌─────────────────────────┐
│ % Yield Calculator     │
│                         │
│ Calculate wafer yield  │
│                         │
│ Open Tool →             │
└─────────────────────────┘
```

下面再放分类：

``` text
Wafer Tools
Mark & ID
Process
Electrical
Yield
Unit Conversion
```

------------------------------------------------------------------------

# 四、核心工具 ①：刻号计算器

URL：

``` text
/tools/wafer-mark-calculator
```

页面标题：

> Wafer Mark Calculator

说明：

> Generate, validate and format semiconductor wafer marking codes.

## 输入区

### Basic Information

``` text
Lot ID
[ ABC123          ]

Wafer Number
[ 07              ]

Product ID
[ XYZ001          ]

Layer
[ M5              ]

Date
[ 2026-09-10      ]
```

### Format

``` text
Mark Format

[ {LOT}-{WAFER}-{DATE}-{LAYER} ]
```

下面实时显示：

``` text
Preview

ABC123-07-260910-M5
```

## 参数

``` text
Wafer Number Digits
[ 2 ]

Date Format
(● YYMMDD)
( ) YYMM
( ) YYYYMMDD

Separator
[ - ]

Uppercase
[ ✓ ]
```

## 输出

``` text
Generated Mark

ABC123-07-260910-M5

Characters: 18
```

按钮：

``` text
[ Copy ]

[ Validate ]

[ Generate ]
```

## Validation

例如用户输入：

``` text
Wafer Number = 7
```

如果要求 2 位：

``` text
⚠ Wafer number should contain 2 digits.

Suggested:

07
```

如果出现非法字符：

``` text
⚠ Invalid character detected: /
```

------------------------------------------------------------------------

# 五、刻号计算器真正值得做的功能

不要只做字符串拼接。

增加：

## 1. Zero Padding

``` text
7 → 07
1 → 001
25 → 025
```

## 2. Date Code

``` text
2026-09-10

YYMMDD
↓
260910
```

## 3. Checksum

支持：

``` text
None
Luhn
Mod 10
Mod 11
CRC-8
```

但不要声称这些算法符合某个特定 Fab /
客户标准，除非已经明确实现并验证了对应标准。

可以写：

> Custom checksum utilities. Verify compatibility with your
> manufacturing specification.

------------------------------------------------------------------------

# 六、核心工具 ②：Wafer Die Calculator

URL：

``` text
/tools/wafer-die-calculator
```

这个页面可以成为网站的重要流量入口。

## Input

``` text
Wafer Diameter

[ 300 ] [ mm ▼ ]

Die Width

[ 10 ] mm

Die Height

[ 10 ] mm

Street Width

[ 0.10 ] mm

Edge Exclusion

[ 3.0 ] mm
```

## Result

``` text
Wafer Diameter
300 mm

Wafer Area
70,685.83 mm²

Die Size
10 × 10 mm

Gross Die
≈ XXXX

Estimated Usable Die
≈ XXXX

Utilization
XX.XX %
```

## 计算逻辑注意事项

不要简单使用：

``` text
Wafer Area / Die Area
```

直接得出 Die 数量。

因为 Wafer 是圆形，而 Die 是矩形。

需要根据**Die 中心点是否落在有效圆形区域内**判断。

概念上：

``` text
x² + y² ≤ R²
```

并考虑：

``` text
Edge Exclusion
Die Size
Street Width
```

这样计算器才更具有工程价值。

------------------------------------------------------------------------

# 七、核心工具 ③：Wafer Map Generator

URL：

``` text
/tools/wafer-map-generator
```

这是 V1 最有特色的页面之一。

## 左边输入

``` text
Wafer

Diameter
[ 300 ] mm

Edge Exclusion
[ 3 ] mm


Die

Width
[ 10 ] mm

Height
[ 10 ] mm


Grid

X Pitch
[ 10.1 ] mm

Y Pitch
[ 10.1 ] mm

X Offset
[ 0 ] mm

Y Offset
[ 0 ] mm
```

按钮：

``` text
[ Generate Wafer Map ]
```

## 右边生成图

建议使用 **SVG / Canvas** 绘制。

每个 Die 可以点击。

点击后显示：

``` text
Die #123

X = 12
Y = -8

Row = 18
Column = 23

Center X = 121.2 mm
Center Y = -80.8 mm

Status
VALID
```

------------------------------------------------------------------------

# 八、Wafer Map 的增强功能

增加：

## Defect Map

用户可以点击 Die：

``` text
Good
Defect
Skip
Edge
```

例如：

``` text
○ ○ ○ ○ ● ○ ○
○ ○ ○ ○ ○ ○ ○
○ ○ × ○ ○ ○ ○
○ ○ ○ ○ ○ ○ ○
```

统计：

``` text
Total Dies       720
Good Dies        697
Defect Dies       18
Edge Dies          5

Yield           97.49%
```

以后可以继续支持上传 CSV。

这样就从"画图工具"升级成：

> **Wafer Map + Yield Analysis**

------------------------------------------------------------------------

# 九、第四个工具：Yield Calculator

URL：

``` text
/tools/yield-calculator
```

## 基础功能

``` text
Gross Die
[ 720 ]

Good Die
[ 697 ]

[ Calculate ]
```

结果：

``` text
Yield

96.81 %
```

再增加：

``` text
Defect Dies
[ 23 ]

Yield
96.81 %

Reject Rate
3.19 %
```

以后可以加入：

-   Bin Yield
-   Wafer Yield
-   Final Test Yield
-   Assembly Yield
-   Overall Yield

------------------------------------------------------------------------

# 十、统一设计语言

不要做成传统工业软件风格。

建议：

**浅色背景 + 白色 Card + 深色文字 + 单一强调色**

整体：

``` text
┌─────────────────────────────────────────┐
│ SemiTools                    Tools  Docs│
├─────────────────────────────────────────┤
│                                         │
│ Wafer Die Calculator                    │
│ Estimate dies that fit on a wafer.     │
│                                         │
│ ┌────────────────┐ ┌─────────────────┐ │
│ │ INPUT          │ │ RESULT          │ │
│ │                │ │                 │ │
│ │ Diameter       │ │ Gross Die       │ │
│ │ [300] mm       │ │     7,xxx       │ │
│ │                │ │                 │ │
│ │ Die Width      │ │ Usable Die      │ │
│ │ [10] mm        │ │     7,xxx       │ │
│ │                │ │                 │ │
│ │ [ Calculate ]  │ │ Yield           │ │
│ └────────────────┘ └─────────────────┘ │
│                                         │
│ Formula                                 │
│ ─────────────────────────────────────── │
│ ...                                     │
└─────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 十一、技术方案

如果自己开发或使用 AI Coding，推荐：

``` text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
```

计算：

``` text
Client-side
```

第一版可以：

``` text
No Database
No Login
No Backend
```

这样成本低、速度快，也不需要保存用户数据。

如果以后需要保存自定义刻号规则，再增加数据库。

------------------------------------------------------------------------

# 十二、项目目录

``` text
src/
├── app/
│   ├── page.tsx
│   ├── tools/
│   │   ├── page.tsx
│   │   ├── wafer-mark-calculator/
│   │   │   └── page.tsx
│   │   ├── wafer-die-calculator/
│   │   │   └── page.tsx
│   │   ├── wafer-map-generator/
│   │   │   └── page.tsx
│   │   └── yield-calculator/
│   │       └── page.tsx
│
├── components/
│   ├── ToolCard.tsx
│   ├── CalculatorInput.tsx
│   ├── ResultCard.tsx
│   ├── UnitInput.tsx
│   └── WaferMap.tsx
│
├── lib/
│   ├── wafer.ts
│   ├── marking.ts
│   ├── yield.ts
│   └── units.ts
```

------------------------------------------------------------------------

# 十三、SEO

不要只有一个首页。

每个计算器都应该是独立 SEO 页面。

例如：

``` text
/tools/wafer-die-calculator
```

Title：

> Wafer Die Calculator - Semiconductor Tools

Description：

> Calculate the estimated number of dies per wafer based on wafer
> diameter, die size, street width and edge exclusion.

中文：

> 晶圆 Die 数量计算器，根据晶圆尺寸、Die 尺寸、Street Width 和 Edge
> Exclusion 计算可用 Die 数量。

------------------------------------------------------------------------

# 十四、未来工具库

## V1

``` text
4 tools
```

## V2

``` text
10–20 tools
```

## V3

``` text
50+ tools
```

可以逐渐扩展：

``` text
          SemiTools
              │
 ┌────────────┼────────────┐
 │            │            │
Wafer        Process      Electrical
 │            │            │
Die Count    Etch         Rs
Map          Deposition   Resistivity
Yield        Film         RC
Edge         CD           Cap
 │            │            │
 └────────────┼────────────┘
              │
         Manufacturing
              │
        Mark / ID / Lot
```

以后还可以加入：

**AI Semiconductor Assistant**

例如用户输入：

> 300mm wafer，Die 12×8mm，edge exclusion 3mm，大概能切多少颗？

AI 自动调用计算工具，然后给结果和计算过程。

这样网站就不只是一个工具站。

------------------------------------------------------------------------

# 十五、推荐开发顺序

不要先做首页。

按这个顺序：

``` text
① Wafer Mark Calculator
        ↓
② Wafer Die Calculator
        ↓
③ Wafer Map Generator
        ↓
④ Yield Calculator
        ↓
⑤ 首页
        ↓
⑥ SEO
        ↓
⑦ Analytics
```

其中 **① + ② + ③** 最值得重点打磨。

尤其是 **Wafer Map
Generator**，如果交互做得好，会成为网站区别于普通计算器网站的核心功能。
