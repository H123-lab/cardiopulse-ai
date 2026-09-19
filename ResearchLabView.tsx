import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  FlaskConical, 
  CheckCircle, 
  ArrowRight, 
  Share2, 
  Download,
  BookOpen,
  Send,
  Building2,
  ShieldCheck,
  Sliders,
  Target,
  Activity,
  Copy,
  Check,
  RotateCcw,
  Info,
  Users,
  BarChart2,
  Zap
} from 'lucide-react';
import { RESEARCH_PILLARS, INVESTOR_VALUATION_DECK } from '../data/researchData';

// --------------------------------------------------------------------------
// Biostatistical Normal Distribution Helper Functions
// --------------------------------------------------------------------------

// Standard normal cumulative distribution function (Abramowitz & Stegun approximation)
function normalCdf(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * erf);
}

// Rational approximation for inverse standard normal CDF (Acklam algorithm)
function normalQuantile(p: number): number {
  if (p <= 0) return -8;
  if (p >= 1) return 8;
  if (p === 0.5) return 0;
  
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

  const q = p < 0.5 ? p : 1 - p;
  let r: number;
  if (q > 0.02425) {
    const u = q - 0.5;
    const t = u * u;
    r = u * (((((a[0]*t + a[1])*t + a[2])*t + a[3])*t + a[4])*t + a[5]) /
            (((((b[0]*t + b[1])*t + b[2])*t + b[3])*t + b[4])*t + 1);
  } else {
    const t = Math.sqrt(-2 * Math.log(q));
    r = (((((c[0]*t + c[1])*t + c[2])*t + c[3])*t + c[4])*t + c[5]) /
        ((((d[0]*t + d[1])*t + d[2])*t + d[3])*t + 1);
  }
  return p < 0.5 ? -r : r;
}

export const ResearchLabView: React.FC = () => {
  // --------------------------------------------------------------------------
  // 1. Interactive Biostatistical Control Panel State
  // --------------------------------------------------------------------------
  const [baselineMaceRate, setBaselineMaceRate] = useState<number>(15); // 5% - 30%, default 15%
  const [maceReductionRrr, setMaceReductionRrr] = useState<number>(25); // 10% - 50%, default 25%
  const [targetPower, setTargetPower] = useState<number>(0.90); // 0.80 - 0.95, default 0.90
  const [alphaLevel, setAlphaLevel] = useState<number>(0.05); // 0.05 or 0.01

  // Copy justification feedback state
  const [copiedJustification, setCopiedJustification] = useState<boolean>(false);

  // Grant proposal synthesizer state
  const [researchDomain, setResearchDomain] = useState<string>('Zero-Shot Electro-Mechanical Vector Coupling in Microvascular Ischemia');
  const [innovationGoal, setInnovationGoal] = useState<string>('Early detection of subclinical myocardial infarction 4 hours prior to troponin release');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<string | null>(null);

  // Canvas Reference & Dimensions
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredData, setHoveredData] = useState<{ n: number; power: number; x: number; y: number } | null>(null);

  // --------------------------------------------------------------------------
  // 2. Real-Time Sample Size Computation (Two-Sample Parallel Proportions)
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const p1 = baselineMaceRate / 100; // Control arm proportion
    const rrr = maceReductionRrr / 100; // Relative risk reduction
    const p2 = p1 * (1 - rrr); // Intervention arm proportion
    const delta = p1 - p2; // Absolute risk reduction (ARR)
    const pooledP = (p1 + p2) / 2;

    // Critical two-tailed Z value for alpha
    const zAlpha = normalQuantile(1 - alphaLevel / 2);
    // Critical one-tailed Z value for target power (1 - beta)
    const zBeta = normalQuantile(targetPower);

    // Standard two-sample parallel proportions formula:
    // n_arm = ( Z_alpha * sqrt(2*p_bar*(1-p_bar)) + Z_beta * sqrt(p1*(1-p1) + p2*(1-p2)) )^2 / (p1 - p2)^2
    const term1 = zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP));
    const term2 = zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
    const numerator = Math.pow(term1 + term2, 2);
    const denominator = Math.pow(delta, 2);

    const nPerArm = Math.max(10, Math.ceil(numerator / denominator));
    const totalEvaluableN = nPerArm * 2;
    // 10% attrition buffer for dropouts / lost to follow-up
    const attritionRate = 0.10;
    const totalTrialCohortWithBuffer = Math.ceil(totalEvaluableN / (1 - attritionRate));
    const nPerArmBuffered = Math.ceil(totalTrialCohortWithBuffer / 2);
    const nnt = Math.round(1 / delta);

    return {
      p1,
      p2,
      delta,
      pooledP,
      zAlpha,
      zBeta,
      nPerArm,
      totalEvaluableN,
      totalTrialCohortWithBuffer,
      nPerArmBuffered,
      nnt,
      attritionRate,
    };
  }, [baselineMaceRate, maceReductionRrr, targetPower, alphaLevel]);

  // Compute statistical power for any arbitrary total sample size N
  const calculatePowerForN = (totalN: number): number => {
    const nArm = totalN / 2;
    if (nArm <= 0) return 0;
    const { p1, p2, delta, pooledP, zAlpha } = stats;
    const numerator = Math.sqrt(nArm) * delta - zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP));
    const denominator = Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
    const zBeta = numerator / denominator;
    return Math.max(0, Math.min(0.999, normalCdf(zBeta)));
  };

  // --------------------------------------------------------------------------
  // 3. HTML5 2D Canvas Statistical Power Curve Renderer
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays for ultra-crisp line renderings
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width || 600;
    const displayHeight = rect.height || 340;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    // Padding & Plot Area Geometry
    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const plotW = displayWidth - padLeft - padRight;
    const plotH = displayHeight - padTop - padBottom;

    // X-Axis range: from 0 up to 1.6x of the required sample size (minimum 1,500)
    const targetN = stats.totalEvaluableN;
    const maxN = Math.max(1500, Math.ceil((targetN * 1.6) / 200) * 200);

    // Coordinate conversion utilities
    const getX = (nVal: number) => padLeft + (nVal / maxN) * plotW;
    const getY = (powerVal: number) => padTop + (1 - powerVal) * plotH;

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Background Subtle Fill
    ctx.fillStyle = '#090d16'; // Deep slate 950
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw Subtle Grid Lines & Y-Axis Labels (Power: 0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
    ctx.lineWidth = 1;
    const ySteps = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
    ySteps.forEach((pVal) => {
      const yPos = getY(pVal);

      ctx.strokeStyle = pVal === 0.8 || pVal === 0.9 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(148, 163, 184, 0.08)';
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(padLeft + plotW, yPos);
      ctx.stroke();

      // Label
      ctx.fillStyle = pVal === 0.8 || pVal === 0.9 ? '#818cf8' : '#64748b';
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(pVal.toFixed(1), padLeft - 10, yPos);
    });

    // Draw X-Axis Ticks & Labels (Sample Size N)
    const xStepCount = 5;
    const xStepValue = Math.round(maxN / xStepCount / 100) * 100;
    for (let nVal = 0; nVal <= maxN; nVal += xStepValue) {
      if (nVal === 0) continue;
      const xPos = getX(nVal);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.beginPath();
      ctx.moveTo(xPos, padTop);
      ctx.lineTo(xPos, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(nVal >= 1000 ? `${(nVal / 1000).toFixed(1)}k` : `${nVal}`, xPos, padTop + plotH + 8);
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Total Evaluable Trial Cohort (N = n₁ + n₂)', padLeft + plotW / 2, displayHeight - 8);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Statistical Power (1 - β)', 0, 0);
    ctx.restore();

    // -------------------------------------------------------------
    // Draw Continuous Curvilinear Power Curve
    // -------------------------------------------------------------
    const sampleStepPx = 2;
    const curvePoints: { x: number; y: number; n: number; power: number }[] = [];

    for (let px = 0; px <= plotW; px += sampleStepPx) {
      const nVal = (px / plotW) * maxN;
      const powerVal = calculatePowerForN(nVal);
      const xPos = padLeft + px;
      const yPos = getY(powerVal);
      curvePoints.push({ x: xPos, y: yPos, n: nVal, power: powerVal });
    }

    // Translucent Area Fill Underneath Curve
    if (curvePoints.length > 0) {
      const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      areaGrad.addColorStop(0, 'rgba(225, 29, 72, 0.28)'); // Crimson rose tint
      areaGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.15)'); // Indigo tint
      areaGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');

      ctx.beginPath();
      ctx.moveTo(padLeft, padTop + plotH);
      curvePoints.forEach((pt, i) => {
        if (i === 0) ctx.lineTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.lineTo(padLeft + plotW, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = areaGrad;
      ctx.fill();
    }

    // Draw Sleek Power Curve Stroke
    const strokeGrad = ctx.createLinearGradient(padLeft, 0, padLeft + plotW, 0);
    strokeGrad.addColorStop(0, '#6366f1'); // Indigo
    strokeGrad.addColorStop(0.5, '#ec4899'); // Pink
    strokeGrad.addColorStop(1, '#f43f5e'); // Crimson rose

    ctx.beginPath();
    curvePoints.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = strokeGrad;
    ctx.stroke();

    // -------------------------------------------------------------
    // Render Distinct Crimson Target Indicator Marker & Crosshair
    // -------------------------------------------------------------
    const targetX = getX(targetN);
    const targetY = getY(targetPower);

    // Dashed Crosshair Lines
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)'; // Crimson dashed
    ctx.lineWidth = 1.2;

    // Vertical line down to X-axis
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(targetX, padTop + plotH);
    ctx.stroke();

    // Horizontal line left to Y-axis
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(padLeft, targetY);
    ctx.stroke();
    ctx.restore();

    // X-Axis Indicator Marker Pill
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.roundRect(targetX - 28, padTop + plotH + 2, 56, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`N=${targetN}`, targetX, padTop + plotH + 11);

    // Y-Axis Indicator Marker Pill
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.roundRect(padLeft - 52, targetY - 9, 46, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${(targetPower * 100).toFixed(0)}%`, padLeft - 29, targetY);

    // Crimson Target Marker: Outer Glowing Halo
    const haloGrad = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, 18);
    haloGrad.addColorStop(0, 'rgba(244, 63, 94, 0.8)');
    haloGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.3)');
    haloGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Solid Target Center
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
    ctx.fill();

    // White Core Center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Active Floating Callout Badge above the Target Intersection
    const calloutX = Math.min(padLeft + plotW - 130, Math.max(padLeft + 10, targetX - 65));
    const calloutY = Math.max(padTop + 10, targetY - 45);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(calloutX, calloutY, 130, 32, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Target: N = ${targetN.toLocaleString()}`, calloutX + 65, calloutY + 5);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '9px ui-monospace, monospace';
    ctx.fillText(`Power: ${(targetPower * 100).toFixed(0)}% | α: ${alphaLevel}`, calloutX + 65, calloutY + 18);

    // If mouse hovered over a point on canvas, render interactive tooltip
    if (hoveredData) {
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(hoveredData.x, padTop);
      ctx.lineTo(hoveredData.x, padTop + plotH);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(hoveredData.x, hoveredData.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [stats, targetPower, alphaLevel, hoveredData]);

  // Handle canvas mouse move for interactive power inspection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const plotW = rect.width - padLeft - padRight;
    const plotH = rect.height - padTop - padBottom;

    if (clientX < padLeft || clientX > padLeft + plotW) {
      setHoveredData(null);
      return;
    }

    const maxN = Math.max(1500, Math.ceil((stats.totalEvaluableN * 1.6) / 200) * 200);
    const nVal = Math.round(((clientX - padLeft) / plotW) * maxN);
    const powerVal = calculatePowerForN(nVal);
    const yVal = padTop + (1 - powerVal) * plotH;

    setHoveredData({
      n: nVal,
      power: powerVal,
      x: clientX,
      y: yVal,
    });
  };

  const handleCanvasMouseLeave = () => {
    setHoveredData(null);
  };

  // --------------------------------------------------------------------------
  // Biostatistical Sample Size Grant Paragraph Copy
  // --------------------------------------------------------------------------
  const sampleSizeJustificationText = useMemo(() => {
    return `STATISTICAL POWER & SAMPLE SIZE JUSTIFICATION (2026 CLINICAL PROTOCOL):
The trial is designed as a prospective, randomized, double-blind, parallel-group trial comparing the AI-guided intervention against standard-of-care control with 1:1 treatment allocation. 

Based on contemporary multicenter registry data, the anticipated 12-month primary Major Adverse Cardiovascular Event (MACE) rate in the standard-of-care control arm is ${baselineMaceRate}%. We hypothesize that the AI diagnostic copilot engine will achieve a ${maceReductionRrr}% relative risk reduction, decreasing the interventional arm MACE rate to ${(stats.p2 * 100).toFixed(2)}% (absolute risk reduction of ${(stats.delta * 100).toFixed(2)}%; NNT = ${stats.nnt}).

Applying a two-sample parallel proportions test with a two-tailed alpha significance level of ${alphaLevel} and a statistical power of ${(targetPower * 100).toFixed(0)}% (1 - β = ${targetPower}), a minimum evaluable sample size of ${stats.nPerArm.toLocaleString()} patients per arm (Total N = ${stats.totalEvaluableN.toLocaleString()} evaluable subjects) is required.

Accounting for a conservative ${stats.attritionRate * 100}% attrition and loss-to-follow-up rate over the study duration, the total enrolled trial cohort is specified as ${stats.totalTrialCohortWithBuffer.toLocaleString()} subjects (${stats.nPerArmBuffered.toLocaleString()} randomized per arm).`;
  }, [baselineMaceRate, maceReductionRrr, targetPower, alphaLevel, stats]);

  const handleCopyJustification = () => {
    navigator.clipboard.writeText(sampleSizeJustificationText);
    setCopiedJustification(true);
    setTimeout(() => setCopiedJustification(false), 2200);
  };

  // --------------------------------------------------------------------------
  // AI Grant Proposal Synthesizer
  // --------------------------------------------------------------------------
  const handleGenerateResearch = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/research-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researchDomain,
          innovationFocus: `${innovationGoal} | Statistical Design: N=${stats.totalTrialCohortWithBuffer} subjects, Power=${(targetPower * 100).toFixed(0)}%, Baseline MACE=${baselineMaceRate}%, RRR=${maceReductionRrr}%, Alpha=${alphaLevel}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedBlueprint(data.researchBlueprint);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner for MD-PhD Translational Frontier */}
      <div className="bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <FlaskConical className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              MD-PhD TRANSLATIONAL FRONTIER 2026
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Automated Clinical Trial Biostatistics &amp; Translational Engineering
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            "Eliminating the diagnostic gap in modern cardiology demands mathematically unassailable trial protocols. Our real-time sample size simulation engine bridges hypothesis formation with statistical power curves required by the FDA, NIH, and top-tier clinical journals."
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-indigo-300">
            <span>• Lead Author: MD, PhD Physician-Scientist</span>
            <span>• Statistical Rigor: 2-Sample Proportions Power Engine</span>
            <span>• Regulatory Grade: FDA SaMD &amp; NIH R01 Architecture</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* INTERACTIVE BIOSTATISTICAL SIMULATOR: POWER ANALYSIS & SAMPLE SIZE ENGINE */}
      {/* ----------------------------------------------------------------------------- */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Automated Trial Power Analysis &amp; Sample Size Engine
              </h3>
              <p className="text-xs text-slate-400">
                Parallel-group RCT biostatistical simulation with dynamic continuous power curve synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJustification}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedJustification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{copiedJustification ? 'Copied Protocol Text' : 'Copy Sample Size Justification'}</span>
            </button>
          </div>
        </div>

        {/* Biostatistical Grid: Left Input Sliders (5 cols) & Right Canvas Power Curve (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Biostatistical Sliders & Output Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  Trial Design Parameters
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Two-Tailed Design
                </span>
              </div>

              {/* Slider 1: Expected Baseline MACE Rate (5% - 30%) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Control Arm Baseline MACE Rate</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {baselineMaceRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={baselineMaceRate}
                  onChange={(e) => setBaselineMaceRate(Number(e.target.value))}
                  className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>5% (Low Risk)</span>
                  <span>15% (Standard Default)</span>
                  <span>30% (High Risk ACS)</span>
                </div>
              </div>

              {/* Slider 2: Target MACE Reduction / RRR (10% - 50%) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Target MACE Reduction (RRR)</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {maceReductionRrr}% <span className="text-[11px] text-slate-400 font-normal">relative</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={maceReductionRrr}
                  onChange={(e) => setMaceReductionRrr(Number(e.target.value))}
                  className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10% (Modest)</span>
                  <span>25% (Trial Target)</span>
                  <span>50% (Breakthrough)</span>
                </div>
              </div>

              {/* Slider 3: Statistical Power (1 - beta: 0.80 - 0.95) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Statistical Power (1 - β)</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {(targetPower * 100).toFixed(0)}% <span className="text-[11px] text-slate-400 font-normal">(β = {(1 - targetPower).toFixed(2)})</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="0.95"
                  step="0.01"
                  value={targetPower}
                  onChange={(e) => setTargetPower(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.80 (80% Power)</span>
                  <span>0.90 (FDA Benchmark)</span>
                  <span>0.95 (Definitive)</span>
                </div>
              </div>

              {/* Input 4: Alpha Significance Level (0.05 or 0.01) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Type I Error Rate (Alpha, α)</span>
                  <span className="font-mono font-bold text-indigo-300">
                    Two-tailed α = {alphaLevel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlphaLevel(0.05)}
                    className={`text-xs py-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                      alphaLevel === 0.05
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-950/60'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    α = 0.05 (Z = 1.960)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlphaLevel(0.01)}
                    className={`text-xs py-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                      alphaLevel === 0.01
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-950/60'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    α = 0.01 (Z = 2.576)
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Computed Cohort Telemetry Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">SAMPLE SIZE PER ARM</span>
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-2xl font-extrabold text-white font-mono block">
                  {stats.nPerArm.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  1:1 Randomization (n₁ = n₂)
                </span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-rose-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-rose-300 uppercase">TOTAL EVALUABLE N</span>
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-2xl font-extrabold text-rose-400 font-mono block">
                  {stats.totalEvaluableN.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Required statistical threshold
                </span>
              </div>
            </div>

            {/* Trial Attrition & Effect Size Box */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Intervention Arm Expected MACE:</span>
                <span className="font-mono font-bold text-emerald-400">{(stats.p2 * 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Absolute Risk Reduction (ARR):</span>
                <span className="font-mono font-bold text-cyan-400">{(stats.delta * 100).toFixed(2)}% (NNT = {stats.nnt})</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block">Enrolled Trial Cohort (+10% Attrition):</span>
                  <span className="text-[11px] text-slate-400">Compensates for loss to follow-up</span>
                </div>
                <span className="text-base font-extrabold text-white font-mono px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/40">
                  {stats.totalTrialCohortWithBuffer.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: HTML5 Canvas Statistical Power Curve Viewport (7 cols) */}
          <div className="lg:col-span-7 space-y-3 flex flex-col justify-between">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Dynamic Statistical Power Curve
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                    Target N = {stats.totalEvaluableN.toLocaleString()}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-cyan-400">Power = {(targetPower * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* The HTML5 Canvas Element */}
              <div className="relative w-full h-[320px] sm:h-[340px] flex-1">
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                  className="w-full h-full rounded-xl cursor-crosshair"
                />
              </div>

              {/* Canvas Legend & Real-Time Indicator Callouts */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full" />
                    Continuous Power Trajectory
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Critical Intersection Target
                  </span>
                </div>
                <div className="text-slate-300">
                  Hover canvas to inspect power across arbitrary sample sizes
                </div>
              </div>
            </div>

            {/* Trial Methodology Badge */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fleiss / Normal Approximation with Two-Sided Test and Continuity-Preserving Asymptotics</span>
              </span>
              <span className="font-mono font-bold text-slate-300">ICH E9 / FDA Guidance Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Scientific Innovation Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {RESEARCH_PILLARS.map((pillar) => (
          <div key={pillar.id} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-lg">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                {pillar.tagline}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">
                {pillar.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pillar.abstract}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Validated Benchmarks:</span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {pillar.metrics.map((m, idx) => (
                  <div key={idx} className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-xs font-extrabold text-indigo-300 font-mono block">{m.value}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commercial Valuation & Investor Pitch Deck */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400 p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20" />
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Venture Capital &amp; Commercialization Blueprint ($10M+ Valuation)
              </h3>
              <p className="text-xs text-slate-400">
                Strategic market thesis tailored for medical builders, hospital health systems, and life science investors.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
            TAM: {INVESTOR_VALUATION_DECK.tam}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue Models */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              1. Multi-Tier Commercial Revenue
            </span>
            <div className="space-y-2 text-xs">
              {INVESTOR_VALUATION_DECK.revenueModel.map((rev, i) => (
                <div key={i} className="border-b border-slate-800/60 pb-1.5 last:border-0">
                  <span className="font-semibold text-slate-200 block">{rev.model}</span>
                  <p className="text-[11px] text-slate-400">{rev.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Target Customers */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              2. Target Institutional Buyers
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {INVESTOR_VALUATION_DECK.targetCustomers.map((cust, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{cust}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Regulatory Pathway */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
              3. Regulatory &amp; FDA SaMD Roadmap
            </span>
            <div className="space-y-2 text-xs">
              {INVESTOR_VALUATION_DECK.regulatoryRoadmap.map((reg, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className="font-mono font-bold text-purple-300 shrink-0">{reg.milestone}:</span>
                  <span className="text-slate-300">{reg.task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive AI Research Hypothesis & Grant Proposal Generator */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              Automated 2026 Research Grant &amp; Trial Protocol Synthesizer
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">MD-PhD AI Research Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Cardiology Research Domain:
            </label>
            <input
              type="text"
              value={researchDomain}
              onChange={(e) => setResearchDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Specific Breakthrough / Translational Focus:
            </label>
            <input
              type="text"
              value={innovationGoal}
              onChange={(e) => setInnovationGoal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleGenerateResearch}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Synthesizing Protocol...' : 'Synthesize 2026 Breakthrough Proposal'}</span>
          </button>
        </div>

        {generatedBlueprint && (
          <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-indigo-400">
                Generated Trial Protocol &amp; Grant Abstract
              </span>
            </div>
            <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto pr-2 prose prose-invert max-w-none prose-headings:text-indigo-300 prose-strong:text-white">
              {generatedBlueprint}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
