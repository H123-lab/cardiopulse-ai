import React, { useMemo, useState } from 'react';
import { 
  Gauge, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  Check, 
  Copy, 
  FileSpreadsheet, 
  BarChart2, 
  Layers, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import type { EchoPreset, MyocardialSegment } from './EchoSimulatorView';

export interface QuantitativeValidationHudProps {
  preset?: EchoPreset;
  selectedPreset?: EchoPreset;
  hemodynamics?: {
    calculatedEF: number;
    strokeVolumeMl: number;
    cardiacOutputLMin: number;
    cardiacIndex: number;
    edv: number;
    esv: number;
  };
  currentCycle?: {
    calculatedEF: number;
    strokeVolumeMl: number;
    cardiacOutputLMin: number;
    cardiacIndex: number;
    edv?: number;
    esv?: number;
    cycleDurationSec?: number;
  };
  dynamicPresetState?: {
    effectivePreset: EchoPreset;
    isIschemic: boolean;
    isAnteriorSTEMI: boolean;
    isElectroMechanicalLag: boolean;
    ischemicWarpFactor: number;
    dynamicWmsi: number;
    sumScores: number;
  };
  heartRate?: number;
  ischemiaDurationMinutes?: number;
  onIschemiaChange?: (minutes: number) => void;
  isElectroMechanicalLag?: boolean;
  dynamicWmsi?: number;
  sumScores?: number;
  segments?: Record<string, MyocardialSegment>;
  inspectedSegmentKey?: string | null;
  onSelectSegment?: (key: string) => void;
  isColorDoppler?: boolean;
  transducerView?: 'dual' | 'a4c' | 'plax';
  patientId?: string;
  patientName?: string;
}

export const QuantitativeValidationHud: React.FC<QuantitativeValidationHudProps> = (props) => {
  const {
    preset,
    selectedPreset,
    hemodynamics,
    currentCycle,
    dynamicPresetState,
    heartRate = 72,
    ischemiaDurationMinutes = 0,
    isElectroMechanicalLag,
    dynamicWmsi,
    sumScores,
    segments,
    inspectedSegmentKey = null,
    onSelectSegment = () => {},
  } = props;

  const [copied, setCopied] = useState<boolean>(false);

  // Safely resolve active preset
  const effPreset = selectedPreset || preset || dynamicPresetState?.effectivePreset || {
    id: 'normal-sinus',
    name: 'Normal Sinus Rhythm',
    category: 'Normal Reference',
    heartRate: 72,
    expectedLVEF: 60,
    edv: 120,
    esv: 48,
    lvedd: 46,
    wmsi: 1.0,
    wmaSummary: 'Normal biventricular size and function.',
    valvularFindings: 'Normal mitral and tricuspid valve mobility.',
    clinicalSignificance: 'Baseline normal hemodynamics.',
    coronaryArtery: 'Patent epicardial coronaries',
    segments: {},
    hasMitralRegurgitation: false,
    mrSeverity: 'None',
    isConcentricLVH: false,
    isDilatedChambers: false,
  };

  const effHemodynamics = hemodynamics || {
    calculatedEF: currentCycle?.calculatedEF ?? effPreset.expectedLVEF ?? 60,
    strokeVolumeMl: currentCycle?.strokeVolumeMl ?? Math.max(1, (effPreset.edv ?? 120) - (effPreset.esv ?? 48)),
    cardiacOutputLMin: currentCycle?.cardiacOutputLMin ?? Number((((effPreset.edv ?? 120) - (effPreset.esv ?? 48)) * heartRate / 1000).toFixed(2)),
    cardiacIndex: currentCycle?.cardiacIndex ?? 2.8,
    edv: effPreset.edv ?? 120,
    esv: effPreset.esv ?? 48,
  };

  const effWmsi = dynamicWmsi ?? dynamicPresetState?.dynamicWmsi ?? effPreset.wmsi ?? 1.0;
  const effSumScores = sumScores ?? dynamicPresetState?.sumScores ?? 4;
  const effIsLag = isElectroMechanicalLag ?? dynamicPresetState?.isElectroMechanicalLag ?? false;
  const effSegments = segments || effPreset.segments || {};

  // High-Sensitivity Cardiac Troponin I (hs-cTnI) Kinetics Mathematical Model
  // Dynamically recalculates instantly as ischemia duration or presets change
  const troponinKinetics = useMemo(() => {
    const pId = effPreset.id || '';
    const isSTEMI = pId === 'stemi-anterior-lad' || pId === 'stemi-inferior-rca';
    let val = 8;
    let slope = 0;
    let status = 'Baseline Normal (<14 ng/L)';
    let statusColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    let escRecommendation = 'ESC 0h/1h Protocol: Rapid Rule-Out';

    if (isSTEMI) {
      if (ischemiaDurationMinutes <= 10) {
        val = Math.round(8 + (ischemiaDurationMinutes / 10) * 4);
        slope = 14;
        status = 'Lag Phase: Under 99th% URL (<14 ng/L)';
        statusColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
        escRecommendation = 'Pre-Leak Phase: Serial 1h Draw Mandated';
      } else if (ischemiaDurationMinutes <= 20) {
        const p = (ischemiaDurationMinutes - 10) / 10;
        val = Math.round(12 + p * 38);
        slope = 145;
        status = 'Transitional Surge: Pathologic Leak (>14 ng/L)';
        statusColor = 'text-amber-400 bg-amber-950/60 border-amber-500/30';
        escRecommendation = 'ESC 0h/1h Observational Zone: High Delta';
      } else if (ischemiaDurationMinutes <= 60) {
        const p = (ischemiaDurationMinutes - 20) / 40;
        val = Math.round(50 + p * 930);
        slope = 840;
        status = 'Acute Transmural Necrosis: Active Washout';
        statusColor = 'text-rose-400 bg-rose-950/60 border-rose-500/30';
        escRecommendation = 'ESC 0h/1h Rule-In: Emergent Angiography Pathway';
      } else {
        const p = (ischemiaDurationMinutes - 60) / 60;
        val = Math.round(980 + p * 2820);
        slope = 1420;
        status = 'Established Infarction: Maximal Necrosis';
        statusColor = 'text-red-400 bg-red-950/60 border-red-500/40 animate-pulse';
        escRecommendation = 'Immediate Primary PCI / Door-to-Balloon Priority';
      }
    } else if (pId.includes('hocm')) {
      val = 22;
      slope = 2;
      status = 'Chronic Microvascular Mismatch (Mild Elevation)';
      statusColor = 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      escRecommendation = 'Non-ACS Elevation: Evaluate Outflow Gradient';
    } else if (pId === 'pericardial-tamponade') {
      val = 36;
      slope = 8;
      status = 'Epicardial Compressive Strain';
      statusColor = 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      escRecommendation = 'Emergency Pericardiocentesis Priority';
    } else if (pId === 'aortic-dissection-type-a') {
      val = 58;
      slope = 42;
      status = 'Coronary Ostial Shear / Malperfusion';
      statusColor = 'text-rose-400 bg-rose-950/60 border-rose-500/30';
      escRecommendation = 'Contraindicated Anticoagulation: Emergent Surgery';
    } else if (pId === 'papillary-muscle-rupture') {
      val = 1520;
      slope = 640;
      status = 'Acute Posteromedial Infarct with Mechanical Shock';
      statusColor = 'text-rose-400 bg-rose-950/60 border-rose-500/30';
      escRecommendation = 'Emergent Mechanical Support & Surgical Valve Repair';
    } else if (pId.includes('hfref')) {
      val = 28;
      slope = 3;
      status = 'Chronic Dilated Myocyte Turnover';
      statusColor = 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      escRecommendation = 'Guideline-Directed Medical Therapy (GDMT)';
    }

    return {
      val,
      slope,
      status,
      statusColor,
      escRecommendation,
      isRuleIn: val >= 52 || slope >= 5,
    };
  }, [effPreset.id, ischemiaDurationMinutes]);

  // Generate In Silico Study Registry Record
  const handleCopyStudyRecord = () => {
    const studyRecord = {
      studyMetadata: {
        timestampISO: new Date().toISOString(),
        validationPlatform: "CardioSim-Q1 In Silico Validation Engine",
        guidelineStandard: "ASE/EACVI 17-Segment Clinical Standards",
      },
      patientCase: {
        presetId: effPreset.id,
        presetName: effPreset.name,
        category: effPreset.category,
        heartRateBPM: heartRate,
        coronaryTerritory: effPreset.coronaryArtery,
      },
      ischemicKinetics: {
        ischemiaDurationMinutes,
        isElectroMechanicalLag: effIsLag,
        hsTroponinI_ngL: troponinKinetics.val,
        troponinRateDelta_ngL_hr: troponinKinetics.slope,
        clinicalPhase: troponinKinetics.status,
        esc0h1hRecommendation: troponinKinetics.escRecommendation,
      },
      hemodynamics: {
        biplaneSimpsonEF_percent: effHemodynamics.calculatedEF,
        edv_mL: effHemodynamics.edv,
        esv_mL: effHemodynamics.esv,
        strokeVolume_mL: effHemodynamics.strokeVolumeMl,
        cardiacOutput_LMin: effHemodynamics.cardiacOutputLMin,
        cardiacIndex_LMinM2: effHemodynamics.cardiacIndex,
        wallMotionScoreIndex_WMSI: effWmsi,
        sumScores: effSumScores,
      },
      segmentalKinematics: Object.entries(effSegments).map(([key, seg]: [string, any]) => ({
        key,
        name: seg?.name || key,
        territory: seg?.coronaryTerritory || 'LAD',
        score: seg?.score || 1,
        scoreLabel: seg?.scoreLabel || 'Normal',
        radialExcursionRatio: seg?.radialExcursion || 1.0,
        wallThickeningPercent: Math.round((seg?.wallThickening || 1.0) * 35),
      })),
    };

    navigator.clipboard.writeText(JSON.stringify(studyRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const getSafeSeg = (key: string, defaultName: string, defaultTerritory: string) => {
    const seg = (effSegments as Record<string, any>)[key];
    if (seg) return seg;
    return {
      id: key,
      name: defaultName,
      coronaryTerritory: defaultTerritory,
      score: 1,
      scoreLabel: 'Normal',
      radialExcursion: 1.0,
      wallThickening: 1.0,
    };
  };

  const segmentList = [
    { key: 'basalSeptal', seg: getSafeSeg('basalSeptal', 'Basal Septal', 'RCA'), aseCode: 'ASE #1', territory: 'RCA / LAD' },
    { key: 'midSeptal', seg: getSafeSeg('midSeptal', 'Mid Septal', 'LAD'), aseCode: 'ASE #2', territory: 'LAD' },
    { key: 'apicalSeptal', seg: getSafeSeg('apicalSeptal', 'Apical Septal', 'LAD'), aseCode: 'ASE #13', territory: 'LAD' },
    { key: 'apex', seg: getSafeSeg('apex', 'LV Apex', 'LAD'), aseCode: 'ASE #17', territory: 'LAD' },
    { key: 'apicalLateral', seg: getSafeSeg('apicalLateral', 'Apical Lateral', 'LCx'), aseCode: 'ASE #16', territory: 'LAD / LCx' },
    { key: 'midLateral', seg: getSafeSeg('midLateral', 'Mid Lateral', 'LCx'), aseCode: 'ASE #5', territory: 'LCx' },
    { key: 'basalLateral', seg: getSafeSeg('basalLateral', 'Basal Lateral', 'LCx'), aseCode: 'ASE #6', territory: 'LCx' },
    { key: 'rvFreeWall', seg: getSafeSeg('rvFreeWall', 'RV Free Wall', 'RCA'), aseCode: 'ASE RV', territory: 'RCA' },
  ];

  return (
    <div className="bg-slate-900/95 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Quantitative In Silico Validation HUD
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                ASE 17-Segment Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instantaneous biophysical telemetry, wall motion scoring, and serial biomarker kinetics for study data gathering.
            </p>
          </div>
        </div>

        {/* Copy Dataset Button */}
        <button
          onClick={handleCopyStudyRecord}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 cursor-pointer shadow-md ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-950/50'
              : 'bg-slate-800/90 text-cyan-300 border-cyan-500/40 hover:bg-slate-700 hover:text-white'
          }`}
          title="Copy Complete In Silico Validation Record as JSON"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Registry Copied (JSON)' : 'Copy Study Snapshot'}</span>
        </button>
      </div>

      {/* 6 Core Biophysical HUD Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Metric 1: Biplane LVEF */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>BIPLANE LVEF</span>
            <Activity className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-white tracking-tight">
            {effHemodynamics.calculatedEF}%
          </div>
          <div className="text-[10px]">
            <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
              effHemodynamics.calculatedEF >= 70
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                : effHemodynamics.calculatedEF >= 52
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                : effHemodynamics.calculatedEF >= 40
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
            }`}>
              {effHemodynamics.calculatedEF >= 70 ? 'Hyperdynamic' : effHemodynamics.calculatedEF >= 52 ? 'Preserved' : effHemodynamics.calculatedEF >= 40 ? 'Mild-Mod LVD' : 'Severe LVD'}
            </span>
          </div>
        </div>

        {/* Metric 2: Stroke Volume */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>STROKE VOLUME</span>
            <span className="text-[9px] text-slate-500 font-mono">EDV-ESV</span>
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-400 tracking-tight">
            {effHemodynamics.strokeVolumeMl} <span className="text-xs font-normal text-slate-400">mL</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {effHemodynamics.edv} − {effHemodynamics.esv} mL
          </div>
        </div>

        {/* Metric 3: Cardiac Output & Index */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>CARDIAC OUTPUT</span>
            <span className="text-[9px] text-slate-500 font-mono">CI 1.9m²</span>
          </div>
          <div className="text-xl font-extrabold font-mono text-sky-400 tracking-tight">
            {effHemodynamics.cardiacOutputLMin} <span className="text-xs font-normal text-slate-400">L/m</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            CI: <strong className="text-sky-300">{effHemodynamics.cardiacIndex}</strong> L/m/m²
          </div>
        </div>

        {/* Metric 4: Wall Motion Score Index (WMSI) */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>DYNAMIC WMSI</span>
            <BarChart2 className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-cyan-300 tracking-tight">
            {effWmsi.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Sum: {effSumScores} / 4 Segments
          </div>
        </div>

        {/* Metric 5: Instantaneous hs-cTnI */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>hs-cTnI LEVEL</span>
            <Clock className="w-3 h-3 text-amber-400" />
          </div>
          <div className={`text-xl font-extrabold font-mono tracking-tight ${
            troponinKinetics.val < 14 ? 'text-emerald-400' : troponinKinetics.val < 52 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {troponinKinetics.val.toLocaleString()} <span className="text-xs font-normal text-slate-400">ng/L</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            URL: &lt;14 ng/L
          </div>
        </div>

        {/* Metric 6: Biomarker Kinetics Delta */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>d[cTnI]/dt DELTA</span>
            <TrendingUp className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-amber-300 tracking-tight">
            +{troponinKinetics.slope} <span className="text-xs font-normal text-slate-400">/hr</span>
          </div>
          <div className="text-[10px]">
            <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
              troponinKinetics.isRuleIn
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
            }`}>
              {troponinKinetics.isRuleIn ? 'ESC Rule-In' : 'ESC Rule-Out'}
            </span>
          </div>
        </div>
      </div>

      {/* Kinetic Interpretation Banner */}
      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-300 font-mono text-[11px]">
            <strong className="text-white">Validation Status:</strong> {troponinKinetics.status}
          </span>
        </div>
        <div className="text-[11px] font-mono text-cyan-400 shrink-0">
          {troponinKinetics.escRecommendation}
        </div>
      </div>

      {/* Individual ASE Segment Scores Registry Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span>ASE 17-Segment Myocardial Scoring Matrix</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Click row to inspect on canvas
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-[11px] font-mono">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
              <tr>
                <th className="py-2 px-3">Segment Name</th>
                <th className="py-2 px-2.5">ASE Code</th>
                <th className="py-2 px-2.5">Territory</th>
                <th className="py-2 px-2.5 text-center">Score (1-4)</th>
                <th className="py-2 px-2.5 text-center">Radial Excursion</th>
                <th className="py-2 px-2.5 text-center">Thickening</th>
                <th className="py-2 px-3 text-right">Functional Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {segmentList.map(({ key, seg, aseCode, territory }) => {
                const isInspected = inspectedSegmentKey === key;
                return (
                  <tr
                    key={key}
                    onClick={() => onSelectSegment(key)}
                    className={`cursor-pointer transition-colors hover:bg-slate-800/60 ${
                      isInspected ? 'bg-rose-950/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-white flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        seg.score === 1 ? 'bg-emerald-400' : seg.score === 2 ? 'bg-amber-400' : 'bg-rose-400 animate-pulse'
                      }`} />
                      <span>{seg.name}</span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-400">{aseCode}</td>
                    <td className="py-2 px-2.5 text-cyan-300">{territory}</td>
                    <td className="py-2 px-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        seg.score === 1
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : seg.score === 2
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                      }`}>
                        {seg.score}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-center text-sky-300">
                      {seg.radialExcursion.toFixed(2)}x
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span className={seg.wallThickening < 0.3 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {Math.round(seg.wallThickening * 35)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`text-[10px] ${
                        seg.score === 1 ? 'text-emerald-400' : seg.score === 2 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {seg.scoreLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
