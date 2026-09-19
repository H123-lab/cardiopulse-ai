import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Timer, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Info,
  Activity
} from 'lucide-react';

interface TroponinKineticGrapherProps {
  ischemiaDurationMinutes: number;
  isSTEMI: boolean;
  selectedCaseName: string;
}

export const TroponinKineticGrapher: React.FC<TroponinKineticGrapherProps> = ({
  ischemiaDurationMinutes,
  isSTEMI,
  selectedCaseName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clinical Revascularization Parameters
  const [pciRevascularized, setPciRevascularized] = useState<boolean>(true);
  const [doorToBalloonMinutes, setDoorToBalloonMinutes] = useState<number>(60);
  const [showGuidelineCutoffs, setShowGuidelineCutoffs] = useState<boolean>(true);

  // Time in hours from onset
  const currentHours = Math.max(0.1, ischemiaDurationMinutes / 60);

  // Mathematical Kinetic Formulations for hs-cTnI (ng/L) over 24 hours
  // 1. Untreated Persistent Occlusion
  // 2. Primary PCI Early Reperfusion (with washout peak followed by necrosis arrest)
  const calcTroponin = useMemo(() => {
    // Untreated curve: C_untreated(t)
    const getUntreated = (t: number): number => {
      if (t <= 0.25) return 8; // Baseline normal (<14 ng/L)
      // Sigmoidal necrosis curve peaking around 14h at ~9,200 ng/L
      const baseline = 8;
      const peak = 9200;
      const k = 0.62;
      const tMid = 6.2;
      const sigmoid = peak / (1 + Math.exp(-k * (t - tMid)));
      const plateauMod = 1 - 0.12 * (t / 24);
      return Math.round(baseline + sigmoid * plateauMod);
    };

    // Primary PCI curve: C_pci(t)
    const pciTimeHours = doorToBalloonMinutes / 60;
    const getRevascularized = (t: number): number => {
      if (t < pciTimeHours) {
        return getUntreated(t);
      }
      // Reperfusion creates a rapid cytosolic washout peak within 1.5 - 2 hours of balloon inflation
      const timeSincePci = t - pciTimeHours;
      const prePciVal = getUntreated(pciTimeHours);
      
      // Washout peak amplitude depends on door-to-balloon time
      const washoutMax = Math.min(3200, prePciVal * 2.6 + 600);
      const peakOffset = 1.8; // hours to washout peak

      if (timeSincePci < peakOffset) {
        const factor = timeSincePci / peakOffset;
        return Math.round(prePciVal + (washoutMax - prePciVal) * Math.sin(factor * (Math.PI / 2)));
      } else {
        // Rapid decline: structural necrosis was halted
        const decayTime = timeSincePci - peakOffset;
        const decayVal = washoutMax * Math.exp(-0.24 * decayTime);
        return Math.round(Math.max(decayVal, 45));
      }
    };

    // Instantaneous Tangent Derivative d[cTnI]/dt at current time
    const delta = 0.05; // 3 mins in hours
    const activeCurveFn = pciRevascularized ? getRevascularized : getUntreated;
    const valNow = activeCurveFn(currentHours);
    const valAhead = activeCurveFn(currentHours + delta);
    const slopePerHour = Math.round((valAhead - valNow) / delta);

    // Myocardial Salvage Index (area under curve reduction compared to untreated)
    // Early PCI saves 55% - 75% of tissue
    const salvagePercent = pciRevascularized 
      ? Math.max(25, Math.round(82 - (doorToBalloonMinutes / 120) * 45))
      : 0;

    // Peak comparison
    const peakUntreated = 9200;
    const peakPci = Math.round(Math.min(3200, getUntreated(pciTimeHours) * 2.6 + 600));

    return {
      getUntreated,
      getRevascularized,
      activeValNow: valNow,
      slopePerHour,
      salvagePercent,
      pciTimeHours,
      peakUntreated,
      peakPci,
    };
  }, [currentHours, pciRevascularized, doorToBalloonMinutes]);

  // Canvas Graph Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 240 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = 240;

    // Margins
    const padL = 58;
    const padR = 24;
    const padT = 24;
    const padB = 40;
    const graphW = w - padL - padR;
    const graphH = h - padT - padB;

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Scale helpers (0 to 24 hours on X, 0 to 10,000 ng/L on Y)
    const maxTime = 24;
    const maxY = 10000;

    const toX = (tHours: number) => padL + (tHours / maxTime) * graphW;
    const toY = (val: number) => padT + graphH - (Math.min(val, maxY) / maxY) * graphH;

    // Grid lines - Horizontal
    const yTicks = [0, 1000, 2500, 5000, 7500, 10000];
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';

    yTicks.forEach(val => {
      const yPos = toY(val);
      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(w - padR, yPos);
      ctx.stroke();
      ctx.fillText(`${val}`, padL - 6, yPos + 3);
    });

    // Grid lines - Vertical (Time in hours: 0h, 2h, 4h, 6h, 12h, 18h, 24h)
    const xTicks = [0, 2, 4, 6, 9, 12, 16, 20, 24];
    ctx.textAlign = 'center';

    xTicks.forEach(t => {
      const xPos = toX(t);
      ctx.beginPath();
      ctx.moveTo(xPos, padT);
      ctx.lineTo(xPos, padT + graphH);
      ctx.stroke();
      ctx.fillText(`${t}h`, xPos, h - padB + 16);
    });

    // X and Y Axis Titles
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('Time Since Symptom Onset (Hours)', padL + graphW / 2, h - 8);

    ctx.save();
    ctx.translate(14, padT + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('hs-cTnI (ng/L)', 0, 0);
    ctx.restore();

    // Guideline 99th Percentile URL cutoff line (14 ng/L)
    if (showGuidelineCutoffs) {
      const urlY = toY(14);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, urlY);
      ctx.lineTo(w - padR, urlY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#facc15';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('99th %ile URL (14 ng/L)', padL + 6, urlY - 4);
    }

    // Ischemic Lag Zone (0 to current duration) shaded
    if (ischemiaDurationMinutes > 0) {
      const lagX = toX(Math.min(currentHours, maxTime));
      const lagGrad = ctx.createLinearGradient(padL, padT, lagX, padT);
      lagGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
      lagGrad.addColorStop(1, 'rgba(6, 182, 212, 0.04)');

      ctx.fillStyle = lagGrad;
      ctx.fillRect(padL, padT, lagX - padL, graphH);

      // Lag border
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(lagX, padT);
      ctx.lineTo(lagX, padT + graphH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Door-to-balloon PCI marker line
    if (pciRevascularized) {
      const pciX = toX(calcTroponin.pciTimeHours);
      ctx.strokeStyle = '#10b981';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pciX, padT);
      ctx.lineTo(pciX, padT + graphH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.fillRect(pciX - 32, padT - 2, 64, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PCI: ${doorToBalloonMinutes}m`, pciX, padT + 8);
    }

    // 1. Draw Untreated Necrosis Curve (Red/Orange with shadow)
    ctx.lineWidth = pciRevascularized ? 1.6 : 2.8;
    ctx.strokeStyle = pciRevascularized ? 'rgba(239, 68, 68, 0.4)' : '#ef4444';
    ctx.beginPath();
    for (let t = 0; t <= maxTime; t += 0.2) {
      const yVal = calcTroponin.getUntreated(t);
      const px = toX(t);
      const py = toY(yVal);
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 2. Draw Primary PCI Revascularization Curve (Emerald / Cyan)
    if (pciRevascularized) {
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = '#10b981';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let t = 0; t <= maxTime; t += 0.2) {
        const yVal = calcTroponin.getRevascularized(t);
        const px = toX(t);
        const py = toY(yVal);
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 3. Current Bedside Time Point & Upward Acceleration Tangent Line
    const curX = toX(Math.min(currentHours, maxTime));
    const curY = toY(calcTroponin.activeValNow);

    // Bedside Dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Upward Acceleration Tangent Line: d[cTnI]/dt
    // Render tangent line extending ±1.2 hours from current point
    const tSpan = 1.4; // hours
    const slope = calcTroponin.slopePerHour;
    const t1 = Math.max(0, currentHours - tSpan);
    const t2 = Math.min(maxTime, currentHours + tSpan);
    const val1 = calcTroponin.activeValNow + slope * (t1 - currentHours);
    const val2 = calcTroponin.activeValNow + slope * (t2 - currentHours);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 3]);
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(toX(t1), toY(Math.max(0, val1)));
    ctx.lineTo(toX(t2), toY(Math.min(maxY, val2)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Tangent Slope Callout Box
    const calloutX = Math.min(curX + 12, w - 165);
    const calloutY = Math.max(curY - 32, padT + 8);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(calloutX, calloutY, 155, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TANGENT: d[cTnI]/dt`, calloutX + 6, calloutY + 11);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`+${slope} ng/L/hr`, calloutX + 6, calloutY + 23);

  }, [calcTroponin, currentHours, ischemiaDurationMinutes, pciRevascularized, doorToBalloonMinutes, showGuidelineCutoffs]);

  return (
    <div className="bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Serial hs-cTnI Acceleration Kinetics
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 font-mono border border-slate-700">
                24h Timeline
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Correlating ischemic lag duration with high-sensitivity Troponin I release velocity
            </p>
          </div>
        </div>

        {/* Revascularization Quick Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPciRevascularized(!pciRevascularized)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              pciRevascularized
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-red-950/70 text-red-300 border-red-500/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{pciRevascularized ? 'Primary PCI Active' : 'Untreated Occlusion'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Timeline */}
      <div className="relative rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
        <canvas ref={canvasRef} className="w-full h-[240px] block" />
      </div>

      {/* Interactive Controls & Real-Time Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        {/* Left 7 Cols: Bedside Kinematics Stats */}
        <div className="md:col-span-7 grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              Current hs-cTnI
            </span>
            <p className="text-base font-extrabold font-mono text-white">
              {calcTroponin.activeValNow.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ng/L</span>
            </p>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border inline-block ${
              calcTroponin.activeValNow > 14 
                ? 'bg-red-950/80 text-red-300 border-red-500/40'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
            }`}>
              {calcTroponin.activeValNow > 14 ? '> 99th %ile URL' : 'Normal Baseline'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              1-hr Delta (Δ)
            </span>
            <p className="text-base font-extrabold font-mono text-amber-300">
              +{calcTroponin.slopePerHour} <span className="text-[10px] text-slate-400 font-normal">ng/L/h</span>
            </p>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border inline-block ${
              calcTroponin.slopePerHour >= 5
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {calcTroponin.slopePerHour >= 5 ? 'ESC Rule-In (Δ≥5)' : 'Below Delta'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              Tissue Salvage
            </span>
            <p className={`text-base font-extrabold font-mono ${pciRevascularized ? 'text-emerald-400' : 'text-slate-500'}`}>
              {calcTroponin.salvagePercent}%
            </p>
            <span className="text-[10px] text-slate-400">
              {pciRevascularized ? 'Necrosis Abruptly Halted' : 'Transmural Death'}
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Door-to-Balloon Time Slider & Legend */}
        <div className="md:col-span-5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              Door-to-Balloon Time
            </span>
            <span className="font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              {doorToBalloonMinutes} min
            </span>
          </div>

          <input
            type="range"
            min={30}
            max={120}
            step={10}
            disabled={!pciRevascularized}
            value={doorToBalloonMinutes}
            onChange={(e) => setDoorToBalloonMinutes(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
          />

          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>30m (Target)</span>
            <span>60m (ESC Benchmark)</span>
            <span>90m (ACC/AHA Limit)</span>
            <span>120m</span>
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Peak Necrosis AUC:</span>
            <span className="font-mono font-bold text-slate-200">
              {pciRevascularized ? `${calcTroponin.peakPci} ng/L (Truncated)` : `${calcTroponin.peakUntreated} ng/L (Massive)`}
            </span>
          </div>
        </div>
      </div>

      {/* Clinical Guidance Footnote */}
      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300">Pathophysiologic Pearl:</strong> Early reperfusion via primary PCI produces an initial <span className="text-emerald-300 font-medium">accelerated cytosolic washout spike</span> followed by abrupt termination of cellular necrosis. In contrast, persistent occlusion exhibits an exponential upward tangent with severe transmural wall necrosis.
        </div>
      </div>
    </div>
  );
};
