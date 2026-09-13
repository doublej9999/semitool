'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp, Plus, Trash2, Workflow, CheckCircle2, Zap } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { getTranslation } from '@/lib/i18n/translations';
import { translateToolName } from '@/lib/i18n/tool-translations';
import {
  addCustomFlow,
  removeCustomFlow,
  toggleFlowStep,
  useFabSession,
  type CustomFlow,
} from '@/lib/fab-session';
import { tools } from '@/tools';
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
  titleZhTw?: string;
  titleJa?: string;
  titleKo?: string;
  steps: WorkflowStep[];
}

export const FAB_FLOWS: ProcessFlow[] = [
  {
    id: 'gate-dielectric-flow',
    titleEn: 'Gate Stack & Dielectric Module Flow',
    titleZh: '栅介质与薄膜外延工艺流',
    titleZhTw: '閘介質與薄膜外延工藝流',
    titleJa: 'ゲート絶縁膜・薄膜形成プロセスフロー',
    titleKo: '게이트 스택 및 절연막 모듈 공정 흐름',
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
    titleZhTw: '先進光刻與深反應離子蝕刻工藝流',
    titleJa: '先端微細パターニング・HARエッチングフロー',
    titleKo: '첨단 패터닝 및 고종횡比 식각 공정 흐름',
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
    titleZhTw: '雙大馬士革銅互連與化學鍍工藝流',
    titleJa: 'BEOL デュアルダマシン・金属配線プロセスフロー',
    titleKo: '후공정 듀얼 다마신 및 금속 배선 공정 흐름',
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
    titleZhTw: '結深構建與摻雜退火工藝流',
    titleJa: 'FEOL 接合注入・熱アニールプロセスフロー',
    titleKo: '전공정 도핑 접합 주입 및 열처리 어닐링 공정 흐름',
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
    titleZhTw: '晶圓良率、品質與缺陷工程流',
    titleJa: 'ロット判定・SPC管理・欠陥品質フロー',
    titleKo: '로트 판정, SPC 및 결함 품질 공정 흐름',
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

/** Adapts a session custom flow's tool paths into renderable steps. */
function customFlowToSteps(flow: CustomFlow): WorkflowStep[] {
  return flow.toolPaths.map((toolPath) => {
    const tool = tools.find((candidate) => candidate.path === toolPath);
    return {
      toolPath,
      nameEn: tool?.name ?? toolPath,
      nameZh: '',
      stageName: tool?.category ?? '',
      description: tool?.description ?? '',
    };
  });
}

export function ProcessWorkflowBar({ currentToolPath }: ProcessWorkflowBarProps) {
  const locale = useLocale();
  const t = getTranslation(locale);
  const session = useFabSession();
  const [currentQuery, setCurrentQuery] = useState<Record<string, string>>({});
  const [builderOpen, setBuilderOpen] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [pickedTools, setPickedTools] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Deferred out of the effect body (react-hooks/set-state-in-effect): the read
    // is synchronous, the state update lands on the next microtask.
    const taskId = queueMicrotask(() => {
      const params: Record<string, string> = {};
      new URLSearchParams(window.location.search).forEach((val, key) => {
        params[key] = val;
      });
      setCurrentQuery(params);
    });
    return () => taskId;
  }, [currentToolPath]);

  const customFlows: Array<{ flow: CustomFlow; steps: WorkflowStep[] }> = session.customFlows
    .map((flow) => ({ flow, steps: customFlowToSteps(flow) }))
    .filter((entry) => entry.steps.some((step) => step.toolPath === currentToolPath));

  const presetMatch = FAB_FLOWS.find((f) => f.steps.some((step) => step.toolPath === currentToolPath));

  if (!presetMatch && customFlows.length === 0) return null;

  const matchingPresets = presetMatch ? [presetMatch] : [];

  const renderFlowCard = (flowId: string, title: string, steps: WorkflowStep[]) => {
    const currentIndex = steps.findIndex((s) => s.toolPath === currentToolPath);
    const nextStep = currentIndex >= 0 && currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
    const completed = new Set(session.flowProgress[flowId] ?? []);
    const doneCount = steps.reduce((acc, _, idx) => acc + (completed.has(idx) ? 1 : 0), 0);

    const buildStepHref = (step: WorkflowStep) => {
      const nextParams = new URLSearchParams();
      const inheritedKeys = ['waferDiameter', 'filmThickness', 'targetThickness', 'temperature', 'lotId'];
      inheritedKeys.forEach((key) => {
        if (currentQuery[key]) nextParams.set(key, currentQuery[key]);
      });
      if (step.paramMap) {
        const mapped = step.paramMap(currentQuery);
        Object.entries(mapped).forEach(([k, v]) => {
          if (v !== undefined && v !== '') nextParams.set(k, v);
        });
      }
      const qs = nextParams.toString();
      return qs ? `${step.toolPath}?${qs}` : step.toolPath;
    };

    const nextStepHref = nextStep ? buildStepHref(nextStep) : '';
    const hasPipedParams = nextStepHref.includes('?');
    const isCustomFlow = session.customFlows.some((f) => f.id === flowId);

    return (
      <div
        key={flowId}
        style={{
          padding: '0.9rem',
          borderRadius: '8px',
          backgroundColor: 'var(--card, #ffffff)',
          border: '1px solid var(--line, #dbe2e4)',
          marginBottom: '0.7rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink, #152127)' }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                backgroundColor: doneCount === steps.length && steps.length > 0 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(13, 124, 130, 0.1)',
                color: doneCount === steps.length && steps.length > 0 ? '#059669' : 'var(--teal-dark, #0a5f66)',
              }}
            >
              <CheckCircle2 size={12} />
              {t.wfStepsDone.replace('{done}', String(doneCount)).replace('{total}', String(steps.length))}
            </span>
            {isCustomFlow && (
              <button
                type="button"
                onClick={() => removeCustomFlow(flowId)}
                title={t.wfDeleteFlow}
                aria-label={t.wfDeleteFlow}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft, #475569)', display: 'inline-flex', padding: '0.15rem' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.7rem' }}>
          {steps.map((step, idx) => {
            const isCurrent = step.toolPath === currentToolPath;
            const isDone = completed.has(idx);
            const targetHref = isCurrent ? '#' : buildStepHref(step);

            return (
              <React.Fragment key={`${step.toolPath}-${idx}`}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => toggleFlowStep(flowId, idx)}
                    title={t.wfToggleStep}
                    aria-label={`${t.wfToggleStep}: ${translateToolName(step.toolPath, locale) || step.nameEn}`}
                    aria-pressed={isDone}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.1rem',
                      color: isDone ? '#059669' : 'var(--line-strong, #cbd5e1)',
                      display: 'inline-flex',
                    }}
                  >
                    <CheckCircle2 size={14} />
                  </button>
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
                        : isDone
                        ? 'var(--teal-dark, #0a5f66)'
                        : 'var(--ink-soft, #475569)',
                      backgroundColor: isCurrent
                        ? 'var(--teal, #0d7c82)'
                        : isDone
                        ? 'rgba(13, 124, 130, 0.1)'
                        : 'var(--card, #ffffff)',
                      border: isCurrent ? '1px solid var(--teal, #0d7c82)' : '1px solid var(--line, #dbe2e4)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{idx + 1}.</span>
                    <span>{translateToolName(step.toolPath, locale) || step.nameEn}</span>
                  </Link>
                </span>
                {idx < steps.length - 1 && <span style={{ color: 'var(--line-strong, #cbd5e1)', fontSize: '0.75rem' }}>→</span>}
              </React.Fragment>
            );
          })}
        </div>

        {nextStep && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--paper, #f7f9f9)',
              borderRadius: '6px',
              border: '1px solid var(--teal, #0d7c82)',
              flexWrap: 'wrap',
              gap: '0.6rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--teal, #0d7c82)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{t.recommendedNextModule}:</span>
                {hasPipedParams && (
                  <span style={{ color: 'var(--amber, #d97706)', fontWeight: 500 }}>({t.pipeParamsForward})</span>
                )}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink, #152127)' }}>
                {translateToolName(nextStep.toolPath, locale) || nextStep.nameEn} {nextStep.stageName ? `(${nextStep.stageName})` : ''}
              </div>
              {nextStep.description && (
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-soft, #475569)' }}>{nextStep.description}</div>
              )}
            </div>
            <Link
              href={nextStepHref}
              className="button primary sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              <span>{t.proceedToNextStep}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
    );
  };

  const saveCustomFlow = () => {
    if (!flowName.trim() || pickedTools.length < 2) return;
    addCustomFlow(flowName.trim(), pickedTools);
    setFlowName('');
    setPickedTools([]);
    setBuilderOpen(false);
  };

  const movePicked = (index: number, delta: number) => {
    setPickedTools((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

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
            {matchingPresets.length > 0 ? t.stdProcessFlow : t.wfCustomFlows}
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
              <span>{t.dataBusActive}</span>
            </span>
          )}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          {matchingPresets.length > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft, #475569)', fontWeight: 500 }}>
              {locale === 'zh-TW'
                ? (matchingPresets[0].titleZhTw || matchingPresets[0].titleZh)
                : locale === 'zh-CN'
                ? matchingPresets[0].titleZh
                : locale === 'ja'
                ? (matchingPresets[0].titleJa || matchingPresets[0].titleEn)
                : locale === 'ko'
                ? (matchingPresets[0].titleKo || matchingPresets[0].titleEn)
                : matchingPresets[0].titleEn}
            </span>
          )}
          <button
            type="button"
            className="button secondary sm"
            onClick={() => setBuilderOpen((prev) => !prev)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}
          >
            <Plus size={12} />
            {t.wfNewCustomFlow}
          </button>
        </span>
      </div>

      {builderOpen && (
        <div
          style={{
            padding: '0.9rem',
            borderRadius: '8px',
            backgroundColor: 'var(--card, #ffffff)',
            border: '1px dashed var(--line-strong, #cbd5e1)',
            marginBottom: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder={t.wfFlowNameLabel}
              aria-label={t.wfFlowNameLabel}
              style={{ flex: '1 1 180px', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--line, #dbe2e4)', fontSize: '0.8rem' }}
            />
            <select
              value=""
              aria-label={t.wfPickToolsLabel}
              onChange={(e) => {
                if (e.target.value) setPickedTools((prev) => (prev.includes(e.target.value) ? prev : [...prev, e.target.value]));
              }}
              style={{ flex: '1 1 220px', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--line, #dbe2e4)', fontSize: '0.8rem' }}
            >
              <option value="">{t.wfPickToolsLabel}</option>
              {tools.map((tool) => (
                <option key={tool.path} value={tool.path}>
                  {`${tool.category} — ${translateToolName(tool.path, locale) || tool.name}`}
                </option>
              ))}
            </select>
          </div>

          {pickedTools.length > 0 && (
            <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}>
              {pickedTools.map((toolPath, idx) => (
                <li key={toolPath} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ flex: 1, color: 'var(--ink, #152127)' }}>
                    {translateToolName(toolPath, locale)}
                    {toolPath === currentToolPath ? ' ←' : ''}
                  </span>
                  <button type="button" onClick={() => movePicked(idx, -1)} disabled={idx === 0} aria-label="Move step up" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}>
                    <ChevronUp size={14} />
                  </button>
                  <button type="button" onClick={() => movePicked(idx, 1)} disabled={idx === pickedTools.length - 1} aria-label="Move step down" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}>
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickedTools((prev) => prev.filter((p) => p !== toolPath))}
                    aria-label="Remove step"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft, #475569)', padding: '0.1rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ol>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="button primary sm"
              onClick={saveCustomFlow}
              disabled={!flowName.trim() || pickedTools.length < 2}
              style={{ fontSize: '0.75rem' }}
            >
              {t.wfSaveFlow}
            </button>
            <button
              type="button"
              className="button secondary sm"
              onClick={() => {
                setBuilderOpen(false);
                setFlowName('');
                setPickedTools([]);
              }}
              style={{ fontSize: '0.75rem' }}
            >
              {t.wfCancelFlow}
            </button>
          </div>
        </div>
      )}

      {matchingPresets.map((flow) => renderFlowCard(flow.id, flow.titleEn, flow.steps))}
      {customFlows.map((entry) => renderFlowCard(entry.flow.id, entry.flow.name, entry.steps))}
    </div>
  );
}

export default ProcessWorkflowBar;
