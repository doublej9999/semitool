'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import {
  FilmStackProject,
  FilmLayer,
  SubstrateMaterial,
  SubstrateProperties,
  SUBSTRATE_CATALOG,
  INDUSTRIAL_STACK_TEMPLATES,
  calculateFilmStackPhysics,
  loadActiveWorkspaceProject,
  saveActiveWorkspaceProject,
  createDefaultFilmStackProject,
} from '@/lib/film-stack';
import { useLocale, type SupportedLocale } from '@/lib/i18n/context';

interface FabWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORKSPACE_I18N = {
  'zh-CN': {
    title: '晶圆工艺堆叠与虚拟工程工作区',
    subtitle: '统一多层几何厚度、Stoney 综合应力翘曲与热预算跟踪',
    templates: '预置配方模板',
    export: '导出',
    exportTitle: '导出工程文件 (.json)',
    import: '导入',
    importTitle: '导入工程文件 (.json)',
    reset: '重置',
    resetTitle: '重置工作区',
    totalFilmThick: '总薄膜厚度',
    netAvgStress: '平均等效应力',
    waferBowWarp: '晶圆矢高 / 翘曲',
    charDiffLength: '特征热扩散长度',
    layerCrossSection: '薄膜层叠剖面图 (Cross-Section)',
    noFilmsVisual: '（暂无薄膜沉积）',
    substrateMaterial: '衬底材料',
    waferDiameter: '晶圆直径',
    substrateThick: '衬底厚度',
    filmStackSteps: '薄膜工步序列',
    addLayer: '沉积新薄膜',
    emptyStackPrompt: '当前晶圆尚无薄膜，请点击右上角「沉积新薄膜」或加载预置配方。',
    editLayerParams: '选定层工艺与物理参数编辑',
    layerName: '层名称',
    material: '材料配方',
    thickness: '膜厚 (nm)',
    stress: '固有应力 (MPa)',
    refractiveIndex: '折射率 n (@633nm)',
    process: '工艺方法',
    autoSavedNotice: '工作区数据已通过 LocalStorage 自动离线保存。快捷键 Ctrl+W 随时唤出。',
    doneClose: '完成并关闭',
    stressTensile: '张应力 (Tensile)',
    stressCompressive: '压应力 (Compressive)',
    stressNeutral: '中性应力 (Neutral)',
    severeWarp: (bow: string) => `晶圆翘曲严重 (|矢高| = ${bow} µm > 150 µm)。静电/真空吸盘有脱附失夹风险，机械手搬运易碎裂！`,
    moderateWarp: (bow: string) => `晶圆中度翘曲 (|矢高| = ${bow} µm > 60 µm)。可能导致光刻机曝光焦深 (DoF) 超差及线宽失真。`,
  },
  'zh-TW': {
    title: '晶圓製程堆疊與虛擬工程工作區',
    subtitle: '統一多層幾何厚度、Stoney 綜合應力翹曲與熱預算追蹤',
    templates: '預置配方範本',
    export: '匯出',
    exportTitle: '匯出工程檔案 (.json)',
    import: '匯入',
    importTitle: '匯入工程檔案 (.json)',
    reset: '重設',
    resetTitle: '重設工作區',
    totalFilmThick: '總薄膜厚度',
    netAvgStress: '平均等效應力',
    waferBowWarp: '晶圓矢高 / 翹曲',
    charDiffLength: '特徵熱擴散長度',
    layerCrossSection: '薄膜層疊剖面圖 (Cross-Section)',
    noFilmsVisual: '（暫無薄膜沉積）',
    substrateMaterial: '基板材料',
    waferDiameter: '晶圓直徑',
    substrateThick: '基板厚度',
    filmStackSteps: '薄膜工步序列',
    addLayer: '沉積新薄膜',
    emptyStackPrompt: '當前晶圓尚無薄膜，請點選右上角「沉積新薄膜」或載入預置配方。',
    editLayerParams: '選定層工藝與物理參數編輯',
    layerName: '層名稱',
    material: '材料配方',
    thickness: '膜厚 (nm)',
    stress: '固有應力 (MPa)',
    refractiveIndex: '折射率 n (@633nm)',
    process: '工藝方法',
    autoSavedNotice: '工作區資料已透過 LocalStorage 自動離線儲存。快捷鍵 Ctrl+W 隨時開啟。',
    doneClose: '完成並關閉',
    stressTensile: '張應力 (Tensile)',
    stressCompressive: '壓應力 (Compressive)',
    stressNeutral: '中性應力 (Neutral)',
    severeWarp: (bow: string) => `晶圓翹曲嚴重 (|矢高| = ${bow} µm > 150 µm)。靜電/真空吸盤有脫附失夾風險，機械手傳送易碎裂！`,
    moderateWarp: (bow: string) => `晶圓中度翹曲 (|矢高| = ${bow} µm > 60 µm)。可能導致曝光機焦深 (DoF) 超差及線寬失真。`,
  },
  ja: {
    title: 'ウェーハ薄膜積層＆半導体ワークスペース',
    subtitle: '多層膜厚・拡張Stoney応力反り・熱履歴（熱バジェット）の一元管理',
    templates: '標準プロセスレシピ',
    export: 'エクスポート',
    exportTitle: 'プロジェクトJSONを出力',
    import: 'インポート',
    importTitle: 'プロジェクトJSONを読み込み',
    reset: 'リセット',
    resetTitle: 'ワークスペースを初期化',
    totalFilmThick: '総薄膜厚',
    netAvgStress: '平均有効応力',
    waferBowWarp: 'ウェーハ反り / Warp',
    charDiffLength: '実効拡散長',
    layerCrossSection: '薄膜断面プロファイル (Cross-Section)',
    noFilmsVisual: '（堆積された薄膜はありません）',
    substrateMaterial: '基板材料',
    waferDiameter: 'ウェーハ口径',
    substrateThick: '基板厚み',
    filmStackSteps: '薄膜工程シーケンス',
    addLayer: '薄膜を追加',
    emptyStackPrompt: '薄膜層がありません。「薄膜を追加」をクリックするか、上の標準レシピを選択してください。',
    editLayerParams: '選択した膜層のパラメータ編集',
    layerName: '膜層名',
    material: '材料組成',
    thickness: '膜厚 (nm)',
    stress: '固有応力 (MPa)',
    refractiveIndex: '屈折率 n (@633nm)',
    process: '成膜プロセス',
    autoSavedNotice: 'データはブラウザのLocalStorageに自動保存されます。Ctrl+Wで即座に開閉可能。',
    doneClose: '完了して閉じる',
    stressTensile: '引張応力 (Tensile)',
    stressCompressive: '圧縮応力 (Compressive)',
    stressNeutral: '中立 (Neutral)',
    severeWarp: (bow: string) => `重度のウェーハ反り (|Bow| = ${bow} µm > 150 µm)。静電/真空チャック保持不良および搬送時のウェーハ破損リスクがあります！`,
    moderateWarp: (bow: string) => `中度のウェーハ反り (|Bow| = ${bow} µm > 60 µm)。露光機の焦点深度 (DoF) マージン不足やCD寸法異常を招く可能性があります。`,
  },
  ko: {
    title: '웨이퍼 박막 적층 및 가상 팹 작업 공간',
    subtitle: '다층 박막 두께, 확장 Stoney 응력 휨 및 열 이력 통합 관리',
    templates: '표준 레시피 템플릿',
    export: '내보내기',
    exportTitle: '프로젝트 JSON 내보내기',
    import: '가져오기',
    importTitle: '프로젝트 JSON 가져오기',
    reset: '초기화',
    resetTitle: '작업 공간 초기화',
    totalFilmThick: '총 박막 두께',
    netAvgStress: '평균 유효 응력',
    waferBowWarp: '웨이퍼 보우 / 휨',
    charDiffLength: '특성 열 확산 길이',
    layerCrossSection: '박막 적층 단면도 (Cross-Section)',
    noFilmsVisual: '（증착된 박막 없음）',
    substrateMaterial: '기판 재료',
    waferDiameter: '웨이퍼 직경',
    substrateThick: '기판 두께',
    filmStackSteps: '박막 공정 시퀀스',
    addLayer: '박막 증착 추가',
    emptyStackPrompt: '적층된 박막이 없습니다. "+ 박막 증착 추가"를 클릭하거나 위 표준 템플릿을 선택하세요.',
    editLayerParams: '선택한 박막 파라미터 편집',
    layerName: '박막 이름',
    material: '재료 조성',
    thickness: '박막 두께 (nm)',
    stress: '고유 응력 (MPa)',
    refractiveIndex: '굴절률 n (@633nm)',
    process: '공정 방식',
    autoSavedNotice: '작업 데이터는 브라우저 LocalStorage에 자동 저장됩니다. Ctrl+W로 언제든지 열 수 있습니다.',
    doneClose: '완료 및 닫기',
    stressTensile: '인장 응력 (Tensile)',
    stressCompressive: '압축 응력 (Compressive)',
    stressNeutral: '중립 (Neutral)',
    severeWarp: (bow: string) => `심각한 웨이퍼 휨 (|Bow| = ${bow} µm > 150 µm). 정전/진공 척 흡착 실패 및 이송 중 웨이퍼 파손 위험!`,
    moderateWarp: (bow: string) => `중간 수준의 웨이퍼 휨 (|Bow| = ${bow} µm > 60 µm). 노광 장비 초점 심도 (DoF) 이탈 및 CD 왜곡 유발 가능성.`,
  },
  en: {
    title: 'Wafer Film Stack & Fab Project Workspace',
    subtitle: 'Unified multi-layer stack, extended Stoney warp & thermal budget ledger',
    templates: 'Templates',
    export: 'Export',
    exportTitle: 'Export Project JSON',
    import: 'Import',
    importTitle: 'Import Project JSON',
    reset: 'Reset',
    resetTitle: 'Reset Workspace',
    totalFilmThick: 'Total Film Thick.',
    netAvgStress: 'Net Avg. Stress',
    waferBowWarp: 'Wafer Bow / Warp',
    charDiffLength: 'Char. Diffusion Length',
    layerCrossSection: 'Layer Cross-Section',
    noFilmsVisual: '(No deposited films)',
    substrateMaterial: 'Substrate Material',
    waferDiameter: 'Wafer Diameter',
    substrateThick: 'Substrate Thick.',
    filmStackSteps: 'Film Stack Steps',
    addLayer: 'Add Layer',
    emptyStackPrompt: 'No films in stack. Click "+ Add Layer" or pick a template above.',
    editLayerParams: 'Edit Selected Layer Parameters',
    layerName: 'Layer Name',
    material: 'Material',
    thickness: 'Thickness (nm)',
    stress: 'Stress (MPa)',
    refractiveIndex: 'Refractive Index n',
    process: 'Process',
    autoSavedNotice: 'Auto-saved to offline local storage. Toggle anytime with Ctrl+W.',
    doneClose: 'Done & Close',
    stressTensile: 'tensile',
    stressCompressive: 'compressive',
    stressNeutral: 'neutral',
    severeWarp: (bow: string) => `Severe wafer warp (|Bow| = ${bow} µm > 150 µm). High risk of electrostatic/vacuum chuck clamping failure and wafer breakage during transfer!`,
    moderateWarp: (bow: string) => `Moderate wafer bow (|Bow| = ${bow} µm > 60 µm). May induce lithography scanner focus depth (DoF) runout and CD distortion.`,
  },
};

function getSubstrateName(sub: SubstrateProperties, locale: SupportedLocale): string {
  if (locale === 'zh-CN') return sub.nameZh;
  if (locale === 'zh-TW') {
    switch (sub.id) {
      case 'si100': return '單晶矽 (100)';
      case 'si111': return '單晶矽 (111)';
      case 'sic4h': return '碳化矽 (4H-SiC)';
      case 'gaas': return '砷化鎵 (GaAs)';
      case 'sapphire': return '藍寶石 (c面 Al2O3)';
      case 'gan': return '氮化鎵 (GaN)';
      case 'fused_silica': return '石英玻璃 (熔融石英)';
      default: return sub.name;
    }
  }
  if (locale === 'ja') {
    switch (sub.id) {
      case 'si100': return '単結晶シリコン (100)';
      case 'si111': return '単結晶シリコン (111)';
      case 'sic4h': return '炭化ケイ素 (4H-SiC)';
      case 'gaas': return 'ヒ化ガリウム (GaAs)';
      case 'sapphire': return 'サファイア (c面 Al2O3)';
      case 'gan': return '窒化ガリウム (GaN)';
      case 'fused_silica': return '合成石英ガラス (Fused Silica)';
      default: return sub.name;
    }
  }
  if (locale === 'ko') {
    switch (sub.id) {
      case 'si100': return '단결정 실리콘 (100)';
      case 'si111': return '단결정 실리콘 (111)';
      case 'sic4h': return '탄화규소 (4H-SiC)';
      case 'gaas': return '갈륨 비소 (GaAs)';
      case 'sapphire': return '사파이어 (c면 Al2O3)';
      case 'gan': return '질화갈륨 (GaN)';
      case 'fused_silica': return '석영 유리 (Fused Silica)';
      default: return sub.name;
    }
  }
  return sub.name;
}

export default function FabWorkspaceModal({ isOpen, onClose }: FabWorkspaceModalProps) {
  const locale = useLocale();
  const m = WORKSPACE_I18N[locale] || WORKSPACE_I18N.en;

  const [project, setProject] = useState<FilmStackProject>(() => createDefaultFilmStackProject());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage on initial open
  useEffect(() => {
    if (isOpen) {
      const active = loadActiveWorkspaceProject();
      setProject(active);
      if (active.layers.length > 0) {
        setSelectedLayerId(active.layers[0].id);
      }
    }
  }, [isOpen]);

  // Sync to LocalStorage whenever project updates
  const updateProject = (updater: (prev: FilmStackProject) => FilmStackProject) => {
    setProject((prev) => {
      const next = updater(prev);
      saveActiveWorkspaceProject(next);
      return next;
    });
  };

  const physics = useMemo(() => {
    return calculateFilmStackPhysics(
      project.substrate.material,
      project.substrate.thicknessUm,
      project.waferDiameterMm,
      project.layers,
      project.thermalBudgetHistory
    );
  }, [project]);

  if (!isOpen) return null;

  // Add new layer
  const handleAddLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer: FilmLayer = {
      id: newId,
      name: `Layer ${project.layers.length + 1}`,
      material: 'SiO2',
      processType: 'cvd',
      thicknessNm: 100,
      residualStressMpa: -150,
      refractiveIndex: 1.46,
      extinctionCoefficient: 0,
      addedAtIsoDate: new Date().toISOString(),
      colorHex: '#38bdf8',
    };

    updateProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer],
    }));
    setSelectedLayerId(newId);
  };

  // Remove layer
  const handleRemoveLayer = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
    }));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Move layer up / down
  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.layers.length) return;

    updateProject((prev) => {
      const newLayers = [...prev.layers];
      const temp = newLayers[index];
      newLayers[index] = newLayers[targetIndex];
      newLayers[targetIndex] = temp;
      return { ...prev, layers: newLayers };
    });
  };

  // Update selected layer property
  const handleUpdateSelectedLayer = (updates: Partial<FilmLayer>) => {
    if (!selectedLayerId) return;
    updateProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)),
    }));
  };

  // Apply industrial template
  const handleApplyTemplate = (templateKey: string) => {
    const tmpl = INDUSTRIAL_STACK_TEMPLATES[templateKey];
    if (!tmpl) return;

    updateProject((prev) => ({
      ...prev,
      name: tmpl.name,
      description: tmpl.description,
      waferDiameterMm: tmpl.waferDiameterMm,
      substrate: { ...tmpl.substrate },
      layers: tmpl.layers.map((l) => ({ ...l, id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      thermalBudgetHistory: [...tmpl.thermalBudgetHistory],
    }));
    setIsTemplateDropdownOpen(false);
  };

  // Export JSON file
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.substrate && parsed.layers) {
          updateProject(() => parsed);
        }
      } catch (err) {
        console.error('Failed to parse project JSON:', err);
      }
    };
    reader.readAsText(file);
  };

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId) || null;

  const localizedWarpWarning = () => {
    const absBow = Math.abs(physics.waferBowUm);
    if (absBow > 150) {
      return m.severeWarp(absBow.toFixed(1));
    }
    if (absBow > 60) {
      return m.moderateWarp(absBow.toFixed(1));
    }
    return null;
  };

  const stressRegimeLabel = () => {
    if (physics.dominantStressRegime === 'tensile') return m.stressTensile;
    if (physics.dominantStressRegime === 'compressive') return m.stressCompressive;
    return m.stressNeutral;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          backgroundColor: 'var(--card, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--line, #cbd5e1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--teal, #0d7c82)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink, #0f172a)' }}>
                {m.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft, #64748b)' }}>
                {m.subtitle}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Template picker */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="button outline"
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
              >
                <Sparkles size={14} />
                {m.templates}
              </button>
              {isTemplateDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    width: '240px',
                    background: 'var(--card, #ffffff)',
                    border: '1px solid var(--line, #cbd5e1)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => handleApplyTemplate('advanced_cmos_gate')}
                  >
                    <strong>28nm HKMG Gate Stack</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>SiO2/HfO2/TiN/Poly-Si</div>
                  </button>
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', borderTop: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => handleApplyTemplate('dual_damascene_cu')}
                  >
                    <strong>Cu Damascene BEOL</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>SiCN/Low-k/TaN/Cu</div>
                  </button>
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', borderTop: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => handleApplyTemplate('gan_on_si_power')}
                  >
                    <strong>GaN-on-Si Power HEMT</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>AlN/AlGaN/GaN HEMT</div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="button outline"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={handleExportJson}
              title={m.exportTitle}
            >
              <Download size={14} />
              {m.export}
            </button>

            <button
              type="button"
              className="button outline"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => fileInputRef.current?.click()}
              title={m.importTitle}
            >
              <Upload size={14} />
              {m.import}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImportJson}
            />

            <button
              type="button"
              className="button secondary"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => updateProject(() => createDefaultFilmStackProject())}
              title={m.resetTitle}
            >
              <RotateCcw size={14} />
              {m.reset}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.4rem',
                cursor: 'pointer',
                color: 'var(--ink-soft)',
                padding: '0 0.3rem',
                marginLeft: '0.4rem',
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Top Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.8rem',
              backgroundColor: 'var(--paper, #f8fafc)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--line, #cbd5e1)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{m.totalFilmThick}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--teal-dark, #0b5e63)' }}>
                {physics.totalFilmThicknessNm.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>nm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                {(physics.totalFilmThicknessNm / 1000).toFixed(3)} µm
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{m.netAvgStress}</div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color:
                    physics.dominantStressRegime === 'tensile'
                      ? 'var(--amber, #d97706)'
                      : physics.dominantStressRegime === 'compressive'
                        ? '#2563eb'
                        : 'var(--ink)',
                }}
              >
                {physics.netAverageStressMpa > 0 ? `+${physics.netAverageStressMpa.toFixed(1)}` : physics.netAverageStressMpa.toFixed(1)}{' '}
                <span style={{ fontSize: '0.8rem' }}>MPa</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                {stressRegimeLabel()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{m.waferBowWarp}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: Math.abs(physics.waferBowUm) > 60 ? 'var(--red, #dc2626)' : 'var(--ink)' }}>
                {physics.waferBowUm > 0 ? `+${physics.waferBowUm.toFixed(1)}` : physics.waferBowUm.toFixed(1)}{' '}
                <span style={{ fontSize: '0.8rem' }}>µm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                R = {Number.isFinite(physics.radiusOfCurvatureM) ? `${physics.radiusOfCurvatureM.toFixed(1)} m` : '∞'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{m.charDiffLength}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                {physics.effectiveDiffusionLengthNm.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>nm</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                Σ Dt = {physics.cumulativeDtCm2.toExponential(2)} cm²
              </div>
            </div>
          </div>

          {/* Safety & Focus Warnings */}
          {localizedWarpWarning() && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.7rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#b91c1c',
                fontSize: '0.82rem',
                fontWeight: 500,
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>{localizedWarpWarning()}</div>
            </div>
          )}

          {/* Main Layout: Left = Cross Section Visual + Substrate Info, Right = Layer Table & Editor */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '1.2rem', alignItems: 'start' }}>
            {/* Left Column: Cross Section SVG Visualization */}
            <div
              style={{
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: 'var(--paper, #f8fafc)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>
                {m.layerCrossSection}
              </div>

              {/* SVG Cross-section */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  background: '#ffffff',
                  border: '1px solid var(--line, #cbd5e1)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <svg viewBox="0 0 320 220" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                  </defs>

                  {/* Substrate */}
                  <rect x="40" y="140" width="240" height="60" rx="3" fill="url(#subGrad)" />
                  <text x="160" y="175" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                    {getSubstrateName(SUBSTRATE_CATALOG[project.substrate.material], locale)}
                  </text>
                  <text x="160" y="190" textAnchor="middle" fill="#e2e8f0" fontSize="10">
                    {project.substrate.thicknessUm} µm | ⌀{project.waferDiameterMm}mm
                  </text>

                  {/* Layers stacked on top */}
                  {project.layers.length === 0 ? (
                    <text x="160" y="100" textAnchor="middle" fill="#94a3b8" fontSize="12" fontStyle="italic">
                      {m.noFilmsVisual}
                    </text>
                  ) : (
                    (() => {
                      const totalNm = Math.max(1, physics.totalFilmThicknessNm);
                      const maxVisualH = 90; // pixels for all films
                      let currentY = 140;

                      return project.layers.map((layer) => {
                        const layerH = Math.max(12, (layer.thicknessNm / totalNm) * maxVisualH);
                        currentY -= layerH;
                        const isSel = layer.id === selectedLayerId;

                        return (
                          <g
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <rect
                              x="40"
                              y={currentY}
                              width="240"
                              height={layerH}
                              fill={layer.colorHex || '#38bdf8'}
                              stroke={isSel ? '#0d7c82' : '#ffffff'}
                              strokeWidth={isSel ? 2 : 1}
                              opacity={0.9}
                            />
                            <text
                              x="160"
                              y={currentY + layerH / 2 + 3}
                              textAnchor="middle"
                              fill="#0f172a"
                              fontSize="10"
                              fontWeight={isSel ? 'bold' : 'normal'}
                            >
                              {layer.material} ({layer.thicknessNm} nm)
                            </text>
                          </g>
                        );
                      });
                    })()
                  )}
                </svg>
              </div>

              {/* Substrate settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{m.substrateMaterial}:</span>
                  <select
                    className="select"
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: '150px' }}
                    value={project.substrate.material}
                    onChange={(e) => {
                      const mat = e.target.value as SubstrateMaterial;
                      updateProject((prev) => ({
                        ...prev,
                        substrate: {
                          material: mat,
                          thicknessUm: SUBSTRATE_CATALOG[mat].defaultThicknessUm,
                        },
                      }));
                    }}
                  >
                    {Object.values(SUBSTRATE_CATALOG).map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {getSubstrateName(sub, locale)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{m.waferDiameter}:</span>
                  <select
                    className="select"
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: '150px' }}
                    value={project.waferDiameterMm}
                    onChange={(e) =>
                      updateProject((prev) => ({
                        ...prev,
                        waferDiameterMm: Number(e.target.value),
                      }))
                    }
                  >
                    {SUBSTRATE_CATALOG[project.substrate.material].standardDiametersMm.map((d) => (
                      <option key={d} value={d}>
                        {d} mm ({(d / 25.4).toFixed(0)} inch)
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{m.substrateThick}:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input"
                      style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: '90px' }}
                      value={project.substrate.thicknessUm}
                      onChange={(e) =>
                        updateProject((prev) => ({
                          ...prev,
                          substrate: { ...prev.substrate, thicknessUm: Number(e.target.value) },
                        }))
                      }
                    />
                    <span>µm</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Column: Layer List & Layer Property Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Layer List Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>
                  {m.filmStackSteps} ({project.layers.length})
                </div>
                <button
                  type="button"
                  className="button primary"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleAddLayer}
                >
                  <Plus size={14} />
                  {m.addLayer}
                </button>
              </div>

              {/* Layer Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {project.layers.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                    {m.emptyStackPrompt}
                  </div>
                ) : (
                  project.layers.map((layer, idx) => {
                    const isSelected = layer.id === selectedLayerId;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid var(--teal, #0d7c82)' : '1px solid var(--line, #e2e8f0)',
                          backgroundColor: isSelected ? 'var(--teal-soft, rgba(13, 124, 130, 0.08))' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: layer.colorHex || '#38bdf8',
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)' }}>
                            {idx + 1}. {layer.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                            [{layer.material}]
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>
                            {layer.thicknessNm} nm
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: layer.residualStressMpa > 0 ? 'var(--amber)' : '#2563eb',
                              fontWeight: 500,
                            }}
                          >
                            {layer.residualStressMpa > 0 ? `+${layer.residualStressMpa}` : layer.residualStressMpa} MPa
                          </span>

                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayer(idx, 'up');
                              }}
                              disabled={idx === 0}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayer(idx, 'down');
                              }}
                              disabled={idx === project.layers.length - 1}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: idx === project.layers.length - 1 ? 0.3 : 1 }}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLayer(layer.id);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red, #dc2626)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Layer Detailed Property Editor */}
              {selectedLayer && (
                <div
                  style={{
                    border: '1px solid var(--line, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    backgroundColor: 'var(--paper, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink)' }}>
                    {m.editLayerParams}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{m.layerName}</span>
                      <input
                        type="text"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.name}
                        onChange={(e) => handleUpdateSelectedLayer({ name: e.target.value })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{m.material}</span>
                      <input
                        type="text"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.material}
                        onChange={(e) => handleUpdateSelectedLayer({ material: e.target.value })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{m.thickness}</span>
                      <input
                        type="number"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.thicknessNm}
                        onChange={(e) => handleUpdateSelectedLayer({ thicknessNm: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{m.stress}</span>
                      <input
                        type="number"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.residualStressMpa}
                        onChange={(e) => handleUpdateSelectedLayer({ residualStressMpa: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{m.refractiveIndex}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.refractiveIndex}
                        onChange={(e) => handleUpdateSelectedLayer({ refractiveIndex: Number(e.target.value) })}
                      />
                    </label>

                    <label style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{m.process}</span>
                      <select
                        className="select"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        value={selectedLayer.processType}
                        onChange={(e) => handleUpdateSelectedLayer({ processType: e.target.value as any })}
                      >
                        <option value="thermal_oxidation">Thermal Oxidation</option>
                        <option value="cvd">CVD / PECVD / LPCVD</option>
                        <option value="ald">ALD (Atomic Layer)</option>
                        <option value="plating">Electroplating (ECP)</option>
                        <option value="pvd_sputter">PVD / Sputter</option>
                        <option value="spin_coating">Spin-Coating</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.4rem',
            borderTop: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper, #f8fafc)',
            fontSize: '0.8rem',
            color: 'var(--ink-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={15} style={{ color: 'var(--teal)' }} />
            <span>{m.autoSavedNotice}</span>
          </div>

          <button type="button" className="button primary" onClick={onClose}>
            {m.doneClose}
          </button>
        </div>
      </div>
    </div>
  );
}
export { FabWorkspaceModal };
