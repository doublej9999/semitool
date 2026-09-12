'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Workflow, CheckCircle2, Zap } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';

export interface WorkflowStep {
  toolPath: string;
  nameEn: string;
  nameZh: string;
  stageName: string;
  description: string;
  paramMap?: (sourceParams: Record<string, string>) => Record<string, string>;
}

export interface ProcessFlow {
  id: string;
  titleEn: string;
  titleZh: string;
  steps: WorkflowStep[];
}

export const FAB_FLOWS: ProcessFlow[] = [
  {
    id: 'gate-dielectric-flow',
    titleEn: 'Gate Stack & Dielectric Module Flow',
    titleZh: '栅介质与薄膜外延工艺流',
    steps: [
      {
        toolPath: '/tools/wet-bench-calculator',
        nameEn: 'RCA / Pre-Oxide Clean',
        nameZh: 'RCA / 氧化前清洗',
        stageName: 'Surface Prep',
        description: 'Prepare organic-free, oxide-stripped hydrophilic wafer surface.',
        paramMap: (p) => ({
          bathTemp: p.bathTemp || '75',
          tankRecirculationRate: p.tankRecirculationRate || '30',
        }),
      },
      {
        toolPath: '/tools/thermal-oxide-calculator',
        nameEn: 'Thermal Oxidation',
        nameZh: '热氧化动力学',
        stageName: 'Oxide Growth',
        description: 'Grow initial SiO2 gate dielectric using Deal-Grove kinetics.',
        paramMap: (p) => ({
          targetThickness: p.targetThickness || p.thickness || '100',
          temperature: p.temperature || '1000',
        }),
      },
      {
        toolPath: '/tools/film-color-calculator',
        nameEn: 'Film Thickness & Color',
        nameZh: '氧化层测厚与显色',
        stageName: 'Metrology',
        description: 'Verify optical interference film thickness non-destructively.',
        paramMap: (p) => ({
          thickness: p.targetThickness || p.thickness || '100',
          filmType: 'sio2',
        }),
      },
      {
        toolPath: '/tools/cmp-preston-calculator',
        nameEn: 'CMP Preston Polishing',
        nameZh: 'CMP 介质层平坦化',
        stageName: 'Planarization',
        description: 'Planarize dielectric surface topology to target uniformity.',
      },
      {
        toolPath: '/tools/cmp-endpoint-calculator',
        nameEn: 'CMP Endpoint & Pad Life',
        nameZh: 'CMP 终点检测与抛光垫寿命',
        stageName: 'Endpoint Control',
        description: 'Monitor motor torque & optical reflection to halt at barrier interface.',
        paramMap: (p) => ({
          initialThickness: p.initialThickness || p.thickness || '600',
          targetThickness: '150',
        }),
      },
      {
        toolPath: '/tools/wafer-warp-stress-calculator',
        nameEn: 'Wafer Bow & Film Stress',
        nameZh: '晶圆翘曲与薄膜应力',
        stageName: 'Stress Verification',
        description: 'Assess Stoney curvature stress and post-CMP warp distortion.',
        paramMap: (p) => ({
          filmThickness: p.targetThickness || p.thickness || '150',
          waferDiameter: p.waferDiameter || '300',
        }),
      },
    ],
  },
  {
    id: 'patterning-etch-flow',
    titleEn: 'Advanced Patterning & HAR Etch Module Flow',
    titleZh: '先进光刻与深反应离子刻蚀工艺流',
    steps: [
      {
        toolPath: '/tools/lithography-resolution-calculator',
        nameEn: 'Lithography Resolution',
        nameZh: '光刻分辨率与焦深',
        stageName: 'Exposure',
        description: 'Determine critical dimension CD limit and depth of focus (DOF).',
      },
      {
        toolPath: '/tools/cd-uniformity-calculator',
        nameEn: 'CD Uniformity & Process Window',
        nameZh: 'CD 均匀性与工艺窗口',
        stageName: 'CD Metrology',
        description: 'Inspect wafer CD across field, exposure latitude, and 3-sigma uniformity.',
        paramMap: (p) => ({
          targetCd: p.resolution || p.cd || '65',
        }),
      },
      {
        toolPath: '/tools/etch-rate-calculator',
        nameEn: 'Etch Rate & Selectivity',
        nameZh: '刻蚀速率与选择比',
        stageName: 'Plasma Etch',
        description: 'Calculate nominal vertical etch rate, selectivity to hardmask, and bias.',
      },
      {
        toolPath: '/tools/arde-etch-calculator',
        nameEn: 'ARDE & Microloading Etch',
        nameZh: '深宽比延迟与微负载效应',
        stageName: 'Profile Control',
        description: 'Simulate high aspect ratio trench RIE lag and dense/iso loading differences.',
        paramMap: (p) => ({
          nominalDepth: p.targetDepth || '1000',
          nominalWidth: p.targetCd || p.cd || '100',
        }),
      },
      {
        toolPath: '/tools/wet-bench-calculator',
        nameEn: 'Wet Post-Etch Strip',
        nameZh: '湿法刻蚀后剥离清洗',
        stageName: 'Post-Etch Clean',
        description: 'Strip polymer residues and fluorocarbon sidewall passivation.',
      },
    ],
  },
  {
    id: 'damascene-metallization-flow',
    titleEn: 'Dual Damascene Metallization & Interconnect Flow',
    titleZh: '双大马士革铜互连与化学镀工艺流',
    steps: [
      {
        toolPath: '/tools/lithography-resolution-calculator',
        nameEn: 'Trench & Via Lithography',
        nameZh: '沟槽与通孔光刻',
        stageName: 'Patterning',
        description: 'Pattern sub-micron copper trench and via openings.',
      },
      {
        toolPath: '/tools/arde-etch-calculator',
        nameEn: 'ARDE Trench & Via Etch',
        nameZh: '高深宽比介质刻蚀',
        stageName: 'HAR Etch',
        description: 'Dielectric etch with aspect-ratio dependent microloading control.',
        paramMap: () => ({
          nominalDepth: '600',
          nominalWidth: '90',
        }),
      },
      {
        toolPath: '/tools/wet-bench-calculator',
        nameEn: 'Pre-Metal Wet Cleaning',
        nameZh: '金属沉积前湿法清洗',
        stageName: 'Wet Clean',
        description: 'Clean native copper oxides and post-ash organic residues.',
      },
      {
        toolPath: '/tools/cu-plating-calculator',
        nameEn: 'Copper Electroplating (ECD)',
        nameZh: '铜电镀与大马士革填充',
        stageName: 'Superfilling',
        description: 'Faraday deposition and CEAC bottom-up trench superfilling.',
        paramMap: (p) => ({
          targetThickness: p.nominalDepth || '800',
          cd: p.nominalWidth || '90',
          trenchDepth: p.nominalDepth || '500',
        }),
      },
      {
        toolPath: '/tools/cmp-endpoint-calculator',
        nameEn: 'CMP Endpoint & Pad Life',
        nameZh: 'CMP 终点检测与抛光垫寿命',
        stageName: 'Overburden CMP',
        description: 'Clear Cu overburden and stop selectively on Ta/TaN barrier.',
        paramMap: (p) => ({
          initialThickness: p.targetThickness || '950',
          targetThickness: '50',
        }),
      },
      {
        toolPath: '/tools/wafer-warp-stress-calculator',
        nameEn: 'Wafer Bow & Film Stress',
        nameZh: '铜层热应力与晶圆翘曲',
        stageName: 'Stress Metrology',
        description: 'Measure Stoney curvature and thermal stress from 400°C anneal.',
        paramMap: (p) => ({
          filmThickness: p.targetThickness || '650',
          depositionTemp: '380',
          substrateThickness: '775',
          waferDiameter: '300',
        }),
      },
      {
        toolPath: '/tools/four-point-probe-calculator',
        nameEn: '4-Point Probe NIST / ASTM',
        nameZh: '四探针薄层电阻与载流子迁移率',
        stageName: 'Sheet Metrology',
        description: 'Verify final Cu sheet resistance and film electrical resistivity.',
        paramMap: (p) => ({
          thickness: p.filmThickness || '650',
        }),
      },
    ],
  },
  {
    id: 'junction-implant-flow',
    titleEn: 'Junction Formation & Doping Flow',
    titleZh: '结深构建与掺杂退火工艺流',
    steps: [
      {
        toolPath: '/tools/ion-implantation-calculator',
        nameEn: 'Ion Implantation & Amorphization',
        nameZh: '离子注入与非晶化',
        stageName: 'Implant',
        description: 'Target projected range Rp, straggle, and critical dose threshold.',
      },
      {
        toolPath: '/tools/dopant-diffusion-calculator',
        nameEn: 'Dopant Activation & Diffusion',
        nameZh: '杂质激活与热扩散',
        stageName: 'RTA Anneal',
        description: 'Simulate Gaussian / erfc redistribution and junction depth during anneal.',
        paramMap: (p) => ({
          dose: p.dose || '1e15',
          energy: p.energy || '30',
        }),
      },
      {
        toolPath: '/tools/four-point-probe-calculator',
        nameEn: '4-Point Probe NIST / ASTM',
        nameZh: '四探针薄层电阻与载流子迁移率',
        stageName: 'Sheet Metrology',
        description: 'Invert sheet resistance Rs to active carrier concentration using NIST/Thurber.',
      },
      {
        toolPath: '/tools/semiconductor-depletion-calculator',
        nameEn: 'Depletion & C-V Profiling',
        nameZh: '耗尽层宽度与电容',
        stageName: 'Electrical Verification',
        description: 'Verify built-in junction potential, depletion width, and breakdown voltage.',
      },
    ],
  },
  {
    id: 'yield-quality-flow',
    titleEn: 'Fab Yield, Quality & Defect Engineering Flow',
    titleZh: '晶圆良率、品质与缺陷工程流',
    steps: [
      {
        toolPath: '/tools/wafer-area-calculator',
        nameEn: 'Wafer Area & Gross Die',
        nameZh: '晶圆面积与晶粒估算',
        stageName: 'Wafer Floorplan',
        description: 'Calculate gross die per wafer and edge exclusion margin.',
      },
      {
        toolPath: '/tools/wafer-map-generator',
        nameEn: 'Wafer Map SEMI G85',
        nameZh: 'SEMI G85 晶圆图与缺陷聚类',
        stageName: 'Metrology Map',
        description: 'Inspect die bins, BFS spatial clustering, and export standard G85 maps.',
      },
      {
        toolPath: '/tools/process-capability-calculator',
        nameEn: 'Process Capability & Monte Carlo',
        nameZh: '工序能力 Cp/Cpk 与蒙特卡洛',
        stageName: 'Statistical Quality',
        description: 'Evaluate normal capability, Pearson correlation, and defect tolerance.',
      },
      {
        toolPath: '/tools/split-lot-calculator',
        nameEn: 'Split Lot Statistical Matrix',
        nameZh: '分批试验统计评估 (DoE)',
        stageName: 'Process Optimization',
        description: 'Run Welch t-test, ANOVA F-test, and Bonferroni pairwise comparisons.',
      },
    ],
  },
];

interface ProcessWorkflowBarProps {
  currentToolPath: string;
}

export function ProcessWorkflowBar({ currentToolPath }: ProcessWorkflowBarProps) {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const [currentQuery, setCurrentQuery] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const params: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
      setCurrentQuery(params);
    }
  }, [currentToolPath]);

  // Find if current tool is part of any known flow
  const matchingFlow = FAB_FLOWS.find((f) =>
    f.steps.some((step) => step.toolPath === currentToolPath)
  );

  if (!matchingFlow) return null;

  const currentIndex = matchingFlow.steps.findIndex((s) => s.toolPath === currentToolPath);
  const nextStep = currentIndex >= 0 && currentIndex < matchingFlow.steps.length - 1
    ? matchingFlow.steps[currentIndex + 1]
    : null;

  /**
   * Helper to build destination URL passing mapped or inherited query parameters
   */
  const buildStepHref = (step: WorkflowStep) => {
    const nextParams = new URLSearchParams();

    // 1. Inherit universal fab parameters if present
    const inheritedKeys = ['waferDiameter', 'filmThickness', 'targetThickness', 'temperature', 'lotId'];
    inheritedKeys.forEach((key) => {
      if (currentQuery[key]) {
        nextParams.set(key, currentQuery[key]);
      }
    });

    // 2. Apply custom pipeline parameter mapper if specified
    if (step.paramMap) {
      const mapped = step.paramMap(currentQuery);
      Object.entries(mapped).forEach(([k, v]) => {
        if (v !== undefined && v !== '') {
          nextParams.set(k, v);
        }
      });
    }

    const qs = nextParams.toString();
    return qs ? `${step.toolPath}?${qs}` : step.toolPath;
  };

  const nextStepHref = nextStep ? buildStepHref(nextStep) : '';
  const hasPipedParams = nextStepHref.includes('?');

  return (
    <div
      className="process-workflow-card no-print"
      style={{
        marginTop: '2rem',
        padding: '1.2rem',
        borderRadius: '8px',
        backgroundColor: 'var(--paper, #f7f9f9)',
        border: '1px solid var(--line, #dbe2e4)',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Workflow size={17} color="var(--teal, #0d7c82)" />
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--teal-dark, #0a5f66)' }}>
            {isZh ? '标准半导体制造工艺流' : 'Standard Fab Process Sequence'}
          </span>
          {Object.keys(currentQuery).length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                backgroundColor: 'rgba(13, 124, 130, 0.12)',
                color: 'var(--teal-dark, #0a5f66)',
                fontWeight: 600,
              }}
              title="Parameters currently active on bus"
            >
              <Zap size={11} />
              <span>{isZh ? '参数总线已连通' : 'Data Bus Active'}</span>
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft, #475569)', fontWeight: 500 }}>
          {isZh ? matchingFlow.titleZh : matchingFlow.titleEn}
        </span>
      </div>

      {/* Workflow Step Sequence Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.4rem',
          marginBottom: '0.8rem',
        }}
      >
        {matchingFlow.steps.map((step, idx) => {
          const isCurrent = step.toolPath === currentToolPath;
          const isPast = idx < currentIndex;
          const targetHref = isCurrent ? '#' : buildStepHref(step);

          return (
            <React.Fragment key={step.toolPath}>
              <Link
                href={targetHref}
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent
                    ? 'var(--card, #ffffff)'
                    : isPast
                    ? 'var(--teal-dark, #0a5f66)'
                    : 'var(--ink-soft, #475569)',
                  backgroundColor: isCurrent
                    ? 'var(--teal, #0d7c82)'
                    : isPast
                    ? 'rgba(13, 124, 130, 0.1)'
                    : 'var(--card, #ffffff)',
                  border: isCurrent
                    ? '1px solid var(--teal, #0d7c82)'
                    : '1px solid var(--line, #dbe2e4)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {isPast ? <CheckCircle2 size={12} color="#059669" /> : <span>{idx + 1}.</span>}
                <span>{isZh ? step.nameZh : step.nameEn}</span>
              </Link>
              {idx < matchingFlow.steps.length - 1 && (
                <span style={{ color: 'var(--line-strong, #cbd5e1)', fontSize: '0.75rem' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Suggested Next Step Banner */}
      {nextStep && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: '6px',
            border: '1px solid var(--teal, #0d7c82)',
            marginTop: '0.4rem',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--teal, #0d7c82)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{isZh ? '下一步推荐工序' : 'Recommended Next Module'}:</span>
              {hasPipedParams && (
                <span style={{ color: 'var(--amber, #d97706)', fontWeight: 500 }}>
                  ({isZh ? '自动传递当前工艺参数' : 'Piping parameters forward'})
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink, #152127)' }}>
              {isZh ? nextStep.nameZh : nextStep.nameEn} ({nextStep.stageName})
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ink-soft, #475569)' }}>
              {nextStep.description}
            </div>
          </div>
          <Link
            href={nextStepHref}
            className="button primary sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{isZh ? '前往下一工序' : 'Proceed to Next Step'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default ProcessWorkflowBar;
