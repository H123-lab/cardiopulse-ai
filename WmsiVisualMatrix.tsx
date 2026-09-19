import React, { useState } from 'react';
import { 
  ScanLine, 
  Activity, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Sparkles, 
  FileText, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cpu,
  Calculator
} from 'lucide-react';

export interface FourSegmentItem {
  id: string;
  name: string;
  shortName: string;
  score: 1 | 2 | 3 | 4; // 1=Normal, 2=Hypokinetic, 3=Akinetic, 4=Dyskinetic
  label: string;
  territory: string;
  excursion: number;
  thickening: number;
}

interface WmsiVisualMatrixProps {
  fourSegments?: {
    basalSeptal: FourSegmentItem;
    midSeptal: FourSegmentItem;
    apicalSeptal: FourSegmentItem;
    lateral: FourSegmentItem;
  };
  segments?: {
    basalSeptal: FourSegmentItem;
    midSeptal: FourSegmentItem;
    apicalSeptal: FourSegmentItem;
    lateral: FourSegmentItem;
  };
  calculatedWMSI?: number;
  wmsi?: number;
  calculatedEF?: number;
  edv?: number;
  esv?: number;
  ischemiaDurationMinutes?: number;
  isElectroMechanicalLag?: boolean;
  isLagPhase?: boolean;
  inspectedSegmentKey?: string | null;
  activeSegmentKey?: string | null;
  onSelectSegment?: (key: string | null) => void;
  aiReport?: string | null;
  isGeneratingAiReport?: boolean;
  onGenerateAiReport?: () => void;
}

const DEFAULT_SEGMENTS: Record<'basalSeptal' | 'midSeptal' | 'apicalSeptal' | 'lateral', FourSegmentItem> = {
  basalSeptal: {
    id: 'ase-1',
    name: 'Basal Septal',
    shortName: 'Basal Sept',
    score: 1,
    label: 'Normal',
    territory: 'LAD / RCA',
    excursion: 1.0,
    thickening: 42,
  },
  midSeptal: {
    id: 'ase-2',
    name: 'Mid Septal',
    shortName: 'Mid Sept',
    score: 1,
    label: 'Normal',
    territory: 'LAD Septal Perforators',
    excursion: 1.0,
    thickening: 40,
  },
  apicalSeptal: {
    id: 'ase-3',
    name: 'Apical Septum & Cap',
    shortName: 'Apex / Apic Sept',
    score: 1,
    label: 'Normal',
    territory: 'LAD Terminus',
    excursion: 1.0,
    thickening: 45,
  },
  lateral: {
    id: 'ase-4',
    name: 'Lateral Wall',
    shortName: 'Mid-Basal Lat',
    score: 1,
    label: 'Normal',
    territory: 'LCx / OM',
    excursion: 1.0,
    thickening: 42,
  },
};

export const WmsiVisualMatrix: React.FC<WmsiVisualMatrixProps> = ({
  fourSegments,
  segments,
  calculatedWMSI,
  wmsi,
  calculatedEF = 60,
  edv = 115,
  esv = 45,
  ischemiaDurationMinutes = 0,
  isElectroMechanicalLag = false,
  isLagPhase = false,
  inspectedSegmentKey,
  activeSegmentKey,
  onSelectSegment,
  aiReport = null,
  isGeneratingAiReport = false,
  onGenerateAiReport,
}) => {
  const [showFullNarrative, setShowFullNarrative] = useState<boolean>(false);

  const effectiveSegments = fourSegments || segments || DEFAULT_SEGMENTS;
  const effectiveWMSI = calculatedWMSI ?? wmsi ?? 1.0;
  const effectiveLag = isElectroMechanicalLag || isLagPhase;
  const effectiveActiveKey = inspectedSegmentKey ?? activeSegmentKey ?? null;

  const segmentList: (FourSegmentItem & { key: 'basalSeptal' | 'midSeptal' | 'apicalSeptal' | 'lateral' })[] = [
    { ...(effectiveSegments.basalSeptal || DEFAULT_SEGMENTS.basalSeptal), key: 'basalSeptal' },
    { ...(effectiveSegments.midSeptal || DEFAULT_SEGMENTS.midSeptal), key: 'midSeptal' },
    { ...(effectiveSegments.apicalSeptal || DEFAULT_SEGMENTS.apicalSeptal), key: 'apicalSeptal' },
    { ...(effectiveSegments.lateral || DEFAULT_SEGMENTS.lateral), key: 'lateral' },
  ];

  const getScoreStyle = (score: number, excursion: number) => {
    if (excursion > 1.35) {
      return {
        badgeBg: 'bg-sky-950/80 border-sky-500/40 text-sky-300',
        scoreColor: 'text-sky-300',
        borderColor: 'border-sky-500/30',
        activeBg: 'bg-sky-950/40',
        pulse: false,
      };
    }
    switch (score) {
      case 1:
        return {
          badgeBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
          scoreColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          activeBg: 'bg-emerald-950/30',
          pulse: false,
        };
      case 2:
        return {
          badgeBg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
          scoreColor: 'text-amber-400',
          borderColor: 'border-amber-500/40',
          activeBg: 'bg-amber-950/30',
          pulse: false,
        };
      case 3:
        return {
          badgeBg: 'bg-red-950/90 border-red-500/60 text-red-200 shadow-sm shadow-red-950',
          scoreColor: 'text-red-400',
          borderColor: 'border-red-500/50',
          activeBg: 'bg-red-950/40',
          pulse: true,
        };
      case 4:
      default:
        return {
          badgeBg: 'bg-purple-950/80 border-purple-500/50 text-purple-200',
          scoreColor: 'text-purple-400',
          borderColor: 'border-purple-500/40',
          activeBg: 'bg-purple-950/30',
          pulse: true,
        };
    }
  };

  const bScore = effectiveSegments.basalSeptal?.score ?? 1;
  const mScore = effectiveSegments.midSeptal?.score ?? 1;
  const aScore = effectiveSegments.apicalSeptal?.score ?? 1;
  const lScore = effectiveSegments.lateral?.score ?? 1;
  const sumScores = bScore + mScore + aScore + lScore;

  return (
    <div className="space-y-4">
      {/* Lag Banner Alert if within the 0-10m window */}
      {effectiveLag && (
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              <strong>Electro-Mechanical Lag Active ({ischemiaDurationMinutes}m):</strong> Normal score (1) across all segments despite STEMI ECG.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300 font-semibold">
            WMSI 1.00
          </span>
        </div>
      )}

      {/* Interactive 4-Segment Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {segmentList.map((seg) => {
          const isInspected = effectiveActiveKey === seg.key;
          const style = getScoreStyle(seg.score, seg.excursion);

          return (
            <button
              key={seg.id}
              onClick={() => onSelectSegment?.(isInspected ? null : seg.key)}
              className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                isInspected
                  ? `${style.activeBg} ring-2 ring-rose-500 border-rose-400`
                  : 'bg-slate-950/80 hover:bg-slate-900/90 border-slate-800'
              }`}
            >
              {/* Top Row: Segment Title & Territory */}
              <div className="flex items-start justify-between gap-1 mb-2">
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-rose-300 transition-colors">
                    {seg.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Territory: <strong className="text-slate-300">{seg.territory}</strong>
                  </span>
                </div>

                {/* ASE Score Number Badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-base font-extrabold border ${style.badgeBg}`}>
                  {seg.score}
                </div>
              </div>

              {/* Status Label & Metrics */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Movement:</span>
                  <span className={`font-semibold ${style.scoreColor}`}>
                    {seg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Excursion: <strong className="text-slate-200">{seg.excursion.toFixed(2)}x</strong></span>
                  <span>Thickening: <strong className="text-slate-200">{Math.round(seg.thickening * 38)}%</strong></span>
                </div>
              </div>

              {/* Selection Accent */}
              {isInspected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Raw Clinical Math Panel */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              ASE 17-Segment Clinical Mathematics
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
            Raw Derivation
          </span>
        </div>

        {/* Formula 1: WMSI */}
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Wall Motion Score Index (WMSI):</span>
            <span className="font-bold text-rose-400">{effectiveWMSI.toFixed(2)}</span>
          </div>
          <div className="text-[11px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800/80">
            WMSI = ({bScore} + {mScore} + {aScore} + {lScore}) ÷ 4 = <strong className="text-rose-400">{effectiveWMSI.toFixed(2)}</strong>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Normal: 1.00</span>
            <span>Mild: 1.10–1.40</span>
            <span>Severe: &gt; 1.70</span>
          </div>
        </div>

        {/* Formula 2: Calculated Ejection Fraction */}
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Calculated LVEF (Biplane Area-Length / Simpson's):</span>
            <span className={`font-bold ${calculatedEF < 40 ? 'text-red-400' : calculatedEF < 52 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {calculatedEF}%
            </span>
          </div>
          <div className="text-[11px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800/80">
            EF = ((EDV {edv} mL − ESV {esv} mL) ÷ EDV {edv} mL) × 100% = <strong className="text-white">{calculatedEF}%</strong>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>WMSI Inverse Regression:</span>
            <span>EF ≈ 65% − ((WMSI − 1.0) × 30%) = <strong className="text-rose-400">{Math.max(20, Math.round(65 - (effectiveWMSI - 1.0) * 30))}%</strong></span>
          </div>
        </div>
      </div>

      {/* Narrative AI Consultation Note Expander */}
      <div className="pt-1">
        <button
          onClick={() => setShowFullNarrative(!showFullNarrative)}
          className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-all"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>Formal Consultation Narrative Note</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            {showFullNarrative ? 'Collapse' : 'Expand'}
            {showFullNarrative ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </button>

        {showFullNarrative && (
          <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 whitespace-pre-wrap font-sans leading-relaxed max-h-[260px] overflow-y-auto scrollbar-thin">
            {aiReport ? (
              aiReport
            ) : (
              <div className="py-4 text-center text-slate-400 space-y-1">
                <p>No narrative text generated yet.</p>
                <button
                  onClick={onGenerateAiReport}
                  disabled={isGeneratingAiReport}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow mt-1 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>{isGeneratingAiReport ? 'Synthesizing...' : 'Synthesize AI Note'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
