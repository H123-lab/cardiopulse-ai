import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Pill, 
  FileText, 
  Copy, 
  Check, 
  Heart,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { PatientProfile } from '../types';

interface CathLabInterventionPanelProps {
  patient: PatientProfile;
  selectedCaseId: string;
  onUpdatePatient?: (updated: PatientProfile) => void;
}

type CulpritVessel = 'LAD' | 'RCA';

export const CathLabInterventionPanel: React.FC<CathLabInterventionPanelProps> = ({
  patient,
  selectedCaseId,
  onUpdatePatient,
}) => {
  // Determine default culprit vessel based on selected case or patient diagnostics
  const initialVessel: CulpritVessel = useMemo(() => {
    if (selectedCaseId === 'stemi-inferior') return 'RCA';
    if (selectedCaseId === 'stemi-anterior') return 'LAD';
    const stLead = (patient.ecgSummary.stSegment || '').toLowerCase();
    if (stLead.includes('ii, iii') || stLead.includes('inferior') || stLead.includes('avf')) {
      return 'RCA';
    }
    return 'LAD';
  }, [selectedCaseId, patient]);

  const [activeVessel, setActiveVessel] = useState<CulpritVessel>(initialVessel);
  const [isStented, setIsStented] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployProgress, setDeployProgress] = useState<number>(0); // 0 to 1
  const [doorToBalloonTime] = useState<number>(72); // 72 minutes (Complies with <90 min target)
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  // Sync active vessel whenever selectedCaseId changes
  useEffect(() => {
    if (selectedCaseId === 'stemi-inferior') {
      setActiveVessel('RCA');
      setIsStented(false);
      setDeployProgress(0);
    } else if (selectedCaseId === 'stemi-anterior') {
      setActiveVessel('LAD');
      setIsStented(false);
      setDeployProgress(0);
    }
  }, [selectedCaseId]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Trigger PCI Balloon & Stent Deployment
  const handleDeployStent = () => {
    if (isDeploying || isStented) return;
    setIsDeploying(true);
    const startTime = performance.now();
    const duration = 1600; // 1.6s smooth deployment animation

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      setDeployProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsDeploying(false);
        setIsStented(true);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleResetIntervention = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsDeploying(false);
    setIsStented(false);
    setDeployProgress(0);
  };

  // Canvas Angiogram Renderer with Fluoroscopy Cine Contrast Pulse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cineFrameId: number;
    let startTime = performance.now();

    const render = (time: number) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 640;
      const h = rect.height || 420;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      // Contrast pulse phase (cycles every 1.8s)
      const pulsePhase = ((time - startTime) % 1800) / 1800;

      // 1. Dark Fluoroscopy Background
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, w, h);

      // Fluoroscopy Calibration Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      const gridStep = 40;
      for (let x = 0; x < w; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Cardiac Silhouette Shadow in Fluoroscopy
      const cardiacGrad = ctx.createRadialGradient(w * 0.48, h * 0.52, 30, w * 0.48, h * 0.52, 170);
      cardiacGrad.addColorStop(0, 'rgba(30, 41, 59, 0.45)');
      cardiacGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.25)');
      cardiacGrad.addColorStop(1, 'rgba(5, 8, 17, 0)');
      ctx.fillStyle = cardiacGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.48, h * 0.52, 150, 130, Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();

      // Fluoroscopy Target Crosshair Marker in Center
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 80, 0, Math.PI * 2);
      ctx.stroke();

      // Stent & Flow parameters
      const currentProgress = isStented ? 1 : deployProgress;
      const hasRestoredFlow = currentProgress > 0.6;

      // Arterial contrast stroke style
      const basePatentStroke = '#38bdf8'; // Sky blue contrast
      const baseOccludedStroke = 'rgba(56, 189, 248, 0.2)'; // Faint post-occlusion ghost

      // Coordinates setup
      const rootX = w * 0.46;
      const rootY = h * 0.18;

      // -------------------------------------------------------------
      // Left Coronary System (Left Main, LAD, LCx)
      // -------------------------------------------------------------
      const lmStart = { x: rootX, y: rootY };
      const lmBifurcation = { x: rootX + 50, y: rootY + 35 };

      // Left Main Trunk (LM)
      ctx.beginPath();
      ctx.moveTo(lmStart.x, lmStart.y);
      ctx.lineTo(lmBifurcation.x, lmBifurcation.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Left Circumflex (LCx) - branches laterally and downward
      const lcxP1 = { x: lmBifurcation.x + 40, y: lmBifurcation.y + 10 };
      const lcxP2 = { x: lmBifurcation.x + 80, y: lmBifurcation.y + 55 };
      const lcxP3 = { x: lmBifurcation.x + 100, y: lmBifurcation.y + 120 };

      ctx.beginPath();
      ctx.moveTo(lmBifurcation.x, lmBifurcation.y);
      ctx.bezierCurveTo(lcxP1.x, lcxP1.y, lcxP2.x, lcxP2.y, lcxP3.x, lcxP3.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.stroke();

      // LCx Obtuse Marginal branches (OM1, OM2)
      ctx.beginPath();
      ctx.moveTo(lcxP1.x + 20, lcxP1.y + 20);
      ctx.lineTo(lcxP1.x + 65, lcxP1.y + 35);
      ctx.moveTo(lcxP2.x, lcxP2.y);
      ctx.lineTo(lcxP2.x + 45, lcxP2.y + 30);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Left Anterior Descending (LAD)
      const ladOccX = lmBifurcation.x + 20;
      const ladOccY = lmBifurcation.y + 60;
      const ladMidX = lmBifurcation.x + 28;
      const ladMidY = lmBifurcation.y + 140;
      const ladApexX = lmBifurcation.x + 35;
      const ladApexY = lmBifurcation.y + 220;

      // Proximal LAD (before occlusion)
      ctx.beginPath();
      ctx.moveTo(lmBifurcation.x, lmBifurcation.y);
      ctx.lineTo(ladOccX, ladOccY);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 7;
      ctx.stroke();

      // Diagonal 1 (D1) branch before occlusion
      ctx.beginPath();
      ctx.moveTo(ladOccX - 5, ladOccY - 15);
      ctx.lineTo(ladOccX - 45, ladOccY + 20);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Distal LAD & D2 branch (Affected if activeVessel is LAD)
      const ladIsCulprit = activeVessel === 'LAD';
      const ladHasFlow = !ladIsCulprit || hasRestoredFlow;

      // Mid-to-Distal LAD Segment
      ctx.beginPath();
      ctx.moveTo(ladOccX, ladOccY);
      ctx.bezierCurveTo(ladMidX - 10, ladMidY - 30, ladMidX, ladMidY, ladApexX, ladApexY);
      ctx.strokeStyle = ladHasFlow ? '#38bdf8' : baseOccludedStroke;
      ctx.lineWidth = ladHasFlow ? 5.5 : 2;
      ctx.stroke();

      // Diagonal 2 (D2)
      ctx.beginPath();
      ctx.moveTo(ladMidX - 3, ladMidY - 10);
      ctx.lineTo(ladMidX - 50, ladMidY + 30);
      ctx.strokeStyle = ladHasFlow ? '#38bdf8' : baseOccludedStroke;
      ctx.lineWidth = ladHasFlow ? 3 : 1.5;
      ctx.stroke();

      // -------------------------------------------------------------
      // Right Coronary Artery System (RCA)
      // -------------------------------------------------------------
      const rcaStart = { x: rootX - 25, y: rootY + 5 };
      const rcaP1 = { x: rootX - 90, y: rootY + 20 };
      const rcaOcc = { x: rootX - 115, y: rootY + 95 }; // Mid RCA occlusion point
      const rcaP3 = { x: rootX - 105, y: rootY + 175 };
      const rcaCrux = { x: rootX - 50, y: rootY + 225 };
      const rcaPda = { x: rootX - 10, y: rootY + 235 };

      // Proximal RCA (before occlusion)
      ctx.beginPath();
      ctx.moveTo(rcaStart.x, rcaStart.y);
      ctx.bezierCurveTo(rcaP1.x, rcaP1.y - 10, rcaP1.x - 10, rcaP1.y + 40, rcaOcc.x, rcaOcc.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Acute Marginal Branch from proximal RCA
      ctx.beginPath();
      ctx.moveTo(rcaOcc.x + 5, rcaOcc.y - 30);
      ctx.lineTo(rcaOcc.x + 40, rcaOcc.y - 15);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Mid-to-Distal RCA & PDA (Affected if activeVessel is RCA)
      const rcaIsCulprit = activeVessel === 'RCA';
      const rcaHasFlow = !rcaIsCulprit || hasRestoredFlow;

      ctx.beginPath();
      ctx.moveTo(rcaOcc.x, rcaOcc.y);
      ctx.bezierCurveTo(rcaP3.x - 10, rcaP3.y - 10, rcaCrux.x - 40, rcaCrux.y, rcaCrux.x, rcaCrux.y);
      ctx.lineTo(rcaPda.x, rcaPda.y);
      ctx.strokeStyle = rcaHasFlow ? '#38bdf8' : baseOccludedStroke;
      ctx.lineWidth = rcaHasFlow ? 6.5 : 2;
      ctx.stroke();

      // Posterolateral branch (PLB)
      ctx.beginPath();
      ctx.moveTo(rcaCrux.x, rcaCrux.y);
      ctx.lineTo(rcaCrux.x - 20, rcaCrux.y + 35);
      ctx.strokeStyle = rcaHasFlow ? '#38bdf8' : baseOccludedStroke;
      ctx.lineWidth = rcaHasFlow ? 3 : 1.5;
      ctx.stroke();

      // -------------------------------------------------------------
      // Render Occlusion Cutoff or Stent Over Culprit Site
      // -------------------------------------------------------------
      const occTarget = ladIsCulprit ? { x: ladOccX, y: ladOccY, angle: Math.PI * 0.38 } : { x: rcaOcc.x, y: rcaOcc.y, angle: Math.PI * 0.55 };

      if (!isStented && deployProgress === 0) {
        // PRE-PCI: Sudden Cutoff Meniscus / Red Thrombotic Truncation
        ctx.save();
        ctx.translate(occTarget.x, occTarget.y);
        ctx.rotate(occTarget.angle);

        // Crimson Truncation Bar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-12, -4, 24, 8);

        // Pulsing Warning Rings
        const pulseRadius = 14 + Math.sin(time / 200) * 5;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Label callout
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        ctx.beginPath();
        ctx.roundRect(occTarget.x + 14, occTarget.y - 14, 155, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`CUTOFF: 100% TIMI 0 (${activeVessel})`, occTarget.x + 20, occTarget.y - 2);
      } else {
        // DURING DEPLOYMENT OR POST-PCI: Render Drug-Eluting Stent Mesh
        ctx.save();
        ctx.translate(occTarget.x, occTarget.y);
        ctx.rotate(occTarget.angle);

        const stentLen = 38;
        const stentMaxRadius = 7;
        const currentRadius = 3 + (stentMaxRadius - 3) * Math.min(1, currentProgress * 1.25);

        // Stent expansion balloon glow during deployment
        if (deployProgress > 0 && deployProgress < 1) {
          ctx.fillStyle = `rgba(56, 189, 248, ${0.4 * (1 - deployProgress)})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, stentLen / 2 + 6, currentRadius + 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Metallic Stent Struts (Diamond Mesh / Cobalt-Chromium Lattice)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.4;
        const strutCols = 6;
        const halfLen = stentLen / 2;

        for (let i = 0; i < strutCols; i++) {
          const sx = -halfLen + (i / (strutCols - 1)) * stentLen;
          // Top & bottom longitudinal struts
          ctx.beginPath();
          ctx.moveTo(sx, -currentRadius);
          ctx.lineTo(sx + stentLen / strutCols / 2, currentRadius);
          ctx.lineTo(sx + stentLen / strutCols, -currentRadius);
          ctx.stroke();
        }

        // Outer Stent Cage Borders
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-halfLen, -currentRadius);
        ctx.lineTo(halfLen, -currentRadius);
        ctx.moveTo(-halfLen, currentRadius);
        ctx.lineTo(halfLen, currentRadius);
        ctx.stroke();

        ctx.restore();

        // Stented Success Badge Callout
        ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
        ctx.beginPath();
        ctx.roundRect(occTarget.x + 16, occTarget.y - 14, 150, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`DES DEPLOYED • TIMI 3`, occTarget.x + 24, occTarget.y - 2);
      }

      // -------------------------------------------------------------
      // Angiographic Contrast Cine Pulse (Radiopaque dye motion)
      // -------------------------------------------------------------
      if (hasRestoredFlow || !ladIsCulprit) {
        // Draw contrast particle bolus down LAD
        const ladTravel = pulsePhase * 240;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(lmBifurcation.x + 20 + ladTravel * 0.08, lmBifurcation.y + ladTravel, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anatomical Annotations & Caliber Markers
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AO ROOT', rootX - 5, rootY - 10);
      ctx.fillText('LM (4.5mm)', lmBifurcation.x - 20, lmBifurcation.y - 12);
      ctx.fillText('LAD (3.5mm)', lmBifurcation.x + 75, lmBifurcation.y + 150);
      ctx.fillText('LCx (3.0mm)', lcxP2.x + 25, lcxP2.y);
      ctx.fillText('RCA (4.0mm)', rcaStart.x - 70, rcaOcc.y - 40);

      cineFrameId = requestAnimationFrame(render);
    };

    cineFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(cineFrameId);
  }, [activeVessel, isStented, deployProgress]);

  // Copy Operative Note
  const operativeNote = useMemo(() => {
    return `CARDIAC CATHETERIZATION & CORONARY ANGIOGRAPHY OPERATIVE REPORT:
Patient: ${patient.name || 'Anonymous'} (${patient.age}y ${patient.gender.toUpperCase()})
Indication: Acute STEMI (${activeVessel === 'LAD' ? 'Anterior Wall' : 'Inferior Wall'})
Access: Right Radial Artery (6 French Slender Sheath)
Door-to-Balloon (D2B) Time: ${doorToBalloonTime} minutes (Compliant with ACC/AHA <90 minute benchmark)

DIAGNOSTIC ANGIOGRAPHY:
- Left Main: Patent, no significant luminal stenosis.
- ${activeVessel === 'LAD' ? 'Left Anterior Descending (LAD): 100% thrombotic occlusion at proximal segment. Baseline Flow: TIMI Grade 0 (No Perfusion).' : 'LAD: Mild non-obstructive plaque.'}
- ${activeVessel === 'RCA' ? 'Right Coronary Artery (RCA): 100% thrombotic occlusion at mid segment. Baseline Flow: TIMI Grade 0 (No Perfusion).' : 'RCA: Dominant vessel, patent with normal TIMI 3 flow.'}
- Left Circumflex (LCx): Patent with preserved distal flow.

INTERVENTION:
- Lesion crossed with 0.014" coronary guidewire.
- Pre-dilatation with 2.5 x 15mm semi-compliant balloon.
- Primary PCI with successful deployment of ${activeVessel === 'LAD' ? '3.5 x 24mm' : '4.0 x 28mm'} Everolimus-Eluting Coronary Stent (DES) at 16 atm.
- Post-dilatation performed with non-compliant balloon.

FINAL RESULT:
- Residual Stenosis: 0% with complete angiographic restoration.
- Final Epicardial Perfusion: TIMI Grade 3 (Normal Antegrade Flow).
- Myocardial Blush Grade: MBG Grade 3 (Complete microvascular reperfusion).

POST-PROCEDURAL RECOMMENDATIONS:
1. High-Intensity Statin Therapy: Atorvastatin 80 mg PO QD (Class I).
2. Dual Antiplatelet Therapy (DAPT): Aspirin 81 mg QD + Ticagrelor 90 mg BID for minimum 12 months.
3. Echocardiogram in 48-72 hours to assess baseline recovery of LV ejection fraction.`;
  }, [patient, activeVessel, doorToBalloonTime]);

  const handleCopyNote = () => {
    navigator.clipboard.writeText(operativeNote);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2200);
  };

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-5 space-y-6 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Zap className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Cath Lab Coronary Angiography &amp; Primary PCI Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Fluoroscopy Cine Simulation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 2D fluoroscopic coronary tree mapping, real-time stent expansion, and TIMI Grade perfusion telemetry
            </p>
          </div>
        </div>

        {/* Vessel Territory Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                setActiveVessel('LAD');
                setIsStented(false);
                setDeployProgress(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeVessel === 'LAD'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Anterior LAD STEMI
            </button>
            <button
              onClick={() => {
                setActiveVessel('RCA');
                setIsStented(false);
                setDeployProgress(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeVessel === 'RCA'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inferior RCA STEMI
            </button>
          </div>

          <button
            onClick={handleResetIntervention}
            title="Reset angiography state to pre-intervention occlusion"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Fluoroscopy Viewport (7 cols) & Right Telemetry & Actions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas Fluoroscopy Angiogram (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 z-10">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  LIVE CATH FLUOROSCOPY: {activeVessel === 'LAD' ? 'RAO CRANIAL VIEW (LAD/LCx)' : 'LAO 30° VIEW (RCA)'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className={`px-2 py-0.5 rounded font-bold border ${
                  isStented
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                }`}>
                  {isStented ? 'TIMI 3 (PATENT FLOW)' : 'TIMI 0 (ACUTE CUTOFF)'}
                </span>
              </div>
            </div>

            {/* The Canvas Angiogram */}
            <div className="relative w-full h-[340px] sm:h-[380px] rounded-xl overflow-hidden border border-slate-800/80 bg-[#050811]">
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
              />

              {/* Fluoroscopy Cine Watermark HUD */}
              <div className="absolute top-2 left-3 pointer-events-none text-[9px] font-mono text-slate-500 space-y-0.5">
                <div>FRAME RATE: 15 FPS CINE</div>
                <div>kVp: 78 | mA: 420 | DAP: 24.2 Gy·cm²</div>
                <div>CONTRAST: ISOVIST 370 (5 mL bolus)</div>
              </div>

              {/* Dynamic Target Marker HUD */}
              <div className="absolute bottom-3 left-3 pointer-events-none bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg p-2 text-[11px] font-mono">
                <div className="text-slate-400">Culprit Vessel: <span className="text-rose-400 font-bold">{activeVessel} Segment</span></div>
                <div className="text-slate-400">Lesion: <span className="text-white font-bold">{isStented ? 'Everolimus DES (Post-PCI)' : 'Thrombotic Occlusion (Pre-PCI)'}</span></div>
              </div>
            </div>

            {/* Legend Footer */}
            <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  Opacified Arterial Lumen
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isStented ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {isStented ? 'Expanded DES Stent' : 'Thrombotic Occlusion (TIMI 0)'}
                </span>
              </div>
              <span className="text-slate-500">ACC/AHA Cath Registry Standard</span>
            </div>
          </div>
        </div>

        {/* Right Column: Revascularization Trigger & Post-PCI Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Action Trigger Card */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                Interventional Action
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Primary PCI Protocol
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isStented
                ? 'Drug-Eluting Stent (DES) successfully deployed across the lesion. Full lumen restored with laminar coronary perfusion.'
                : `Thrombotic occlusion verified in the proximal ${activeVessel}. Immediate balloon angioplasty and stent deployment required to salvage ischemic myocardium.`}
            </p>

            {/* Prominent Action Button */}
            {!isStented ? (
              <button
                onClick={handleDeployStent}
                disabled={isDeploying}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-xl shadow-rose-950/50 border border-rose-400/40 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>
                  {isDeploying
                    ? 'Deploying Stent & Expanding Balloon...'
                    : 'Execute Primary PCI & Deploy Drug-Eluting Stent'}
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Revascularization Successful</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
                    TIMI 3 RESTORED
                  </span>
                </div>
                <button
                  onClick={handleResetIntervention}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-test / Simulate Another Occlusion</span>
                </button>
              </div>
            )}
          </div>

          {/* Macro Telemetry Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Door-to-Balloon Time Card */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">DOOR-TO-BALLOON</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {doorToBalloonTime}
                </span>
                <span className="text-xs text-slate-400">minutes</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 block">
                ✓ 18 min under &lt;90m target
              </span>
            </div>

            {/* Perfusion Telemetry Card */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">MYOCARDIAL BLUSH</span>
                <Heart className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold font-mono ${isStented ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isStented ? 'MBG 3' : 'MBG 0'}
                </span>
                <span className="text-xs text-slate-400">Grade</span>
              </div>
              <span className={`text-[10px] font-mono block ${isStented ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isStented ? 'Complete microvascular flow' : 'No microvascular blush'}
              </span>
            </div>
          </div>

          {/* Post-Intervention Guideline Pharmacotherapy Advisory Card */}
          <div className="bg-slate-950/90 rounded-2xl border border-indigo-500/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Pill className="w-3.5 h-3.5 text-indigo-400" />
                <span>Post-PCI Guideline Mandates (ACC/AHA Class I)</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Immediate Rx
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">High-Intensity Statin Therapy:</span>
                  <span className="text-slate-300 text-[11px]">
                    Initiate <strong>Atorvastatin 80mg QD</strong> (or Rosuvastatin 40mg QD) immediately prior to discharge to stabilize plaque and reduce recurrent MACE.
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Dual Antiplatelet Therapy (DAPT):</span>
                  <span className="text-slate-300 text-[11px]">
                    Prescribe <strong>Aspirin 81mg QD</strong> + <strong>Ticagrelor 90mg BID</strong> (or Prasugrel 10mg QD) for a minimum of 12 months post-DES.
                  </span>
                </div>
              </div>
            </div>

            {/* Copy Operative Report Button */}
            <div className="pt-1 flex justify-end">
              <button
                onClick={handleCopyNote}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                <span>{copiedNote ? 'Copied Operative Report' : 'Copy Cath Operative Note'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
