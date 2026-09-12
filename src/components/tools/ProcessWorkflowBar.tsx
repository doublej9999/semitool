'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Workflow, CheckCircle2 } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';

interface WorkflowStep {
  toolPath: string;
  nameEn: string;
  nameZh: string;
  stageName: string;
  description: string;
  paramMap?: (outputValue?: number | string) => Record<string, string>;
}

interface ProcessFlow {
  id: string;
  titleEn: string;
  titleZh: string;
  steps: WorkflowStep[];
}

const FAB_FLOWS: ProcessFlow[] = [
  {
    id: 'gate-dielectric-flow',
    titleEn: 'Gate Stack & Dielectric Module Flow',
    titleZh: '栅介质与薄膜工艺流',
    steps: [
      {
        toolPath: '/tools/thermal-oxide-calculator',
        nameEn: 'Thermal Oxidation',
        nameZh: '热氧化动力学',
        stageName: 'Oxide Growth',
        description: 'Grow initial SiO2 gate dielectric using Deal-Grove kinetics.',
      },
      {
        toolPath: '/tools/film-color-calculator',
        nameEn: 'Film Thickness & Color',
        nameZh: '氧化层测厚与显色',
        stageName: 'Metrology',
        description: 'Verify optical interference film thickness non-destructively.',
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
      },
    ],
  },
  {
    id: 'patterning-etch-flow',
    titleEn: 'Advanced Patterning & Etch Module Flow',
    titleZh: '先进光刻与刻蚀图形化工艺流',
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
];

interface ProcessWorkflowBarProps {
  currentToolPath: string;
}

export function ProcessWorkflowBar({ currentToolPath }: ProcessWorkflowBarProps) {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');

  // Find if current tool is part of any known flow
  const matchingFlow = FAB_FLOWS.find((f) =>
    f.steps.some((step) => step.toolPath === currentToolPath)
  );

  if (!matchingFlow) return null;

  const currentIndex = matchingFlow.steps.findIndex((s) => s.toolPath === currentToolPath);
  const nextStep = currentIndex >= 0 && currentIndex < matchingFlow.steps.length - 1
    ? matchingFlow.steps[currentIndex + 1]
    : null;

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

          return (
            <React.Fragment key={step.toolPath}>
              <Link
                href={step.toolPath}
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
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--teal, #0d7c82)', fontWeight: 600 }}>
              {isZh ? '下一步推荐工序' : 'Recommended Next Module'}:
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink, #152127)' }}>
              {isZh ? nextStep.nameZh : nextStep.nameEn} ({nextStep.stageName})
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ink-soft, #475569)' }}>
              {nextStep.description}
            </div>
          </div>
          <Link
            href={nextStep.toolPath}
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
