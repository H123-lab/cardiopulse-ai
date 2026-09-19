import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pill, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Sliders, 
  ArrowUpRight, 
  HelpCircle,
  Stethoscope,
  Lock,
  Unlock,
  Copy,
  Check,
  RotateCcw,
  User,
  Zap,
  Heart,
  Droplets,
  AlertOctagon,
  TrendingUp,
  XCircle,
  Info
} from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';

export const GDMTView: React.FC = () => {
  const { patient } = usePatientContext();

  // --------------------------------------------------------------------------
  // Bedside Reactive Biometric State Variables
  // --------------------------------------------------------------------------
  const [sbp, setSbp] = useState<number>(115);
  const [heartRate, setHeartRate] = useState<number>(74);
  const [potassium, setPotassium] = useState<number>(4.4);
  const [egfr, setEgfr] = useState<number>(55);
  const [isEuvolemic, setIsEuvolemic] = useState<boolean>(true);
  
  // The 36-Hour ACEi Washout Interlock
  const [isTakingAcei, setIsTakingAcei] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // 4-Pillar Selected Drugs & Dosage Steps
  // --------------------------------------------------------------------------
  // Pillar 1: ARNI (Sacubitril/Valsartan)
  // Step 0: Off (0)
  // Step 1: 24/26 mg BID (Low Starting)
  // Step 2: 49/51 mg BID (Standard Starting)
  // Step 3: 97/103 mg BID (Target Class I Dose)
  const [arniStep, setArniStep] = useState<number>(2);

  // Pillar 2: Beta-Blocker Agent Selection & Step
  const [bbAgent, setBbAgent] = useState<'carvedilol' | 'metoprolol' | 'bisoprolol'>('carvedilol');
  // Carvedilol steps: 0: Off, 1: 3.125mg BID, 2: 6.25mg BID, 3: 12.5mg BID, 4: 25mg BID (Target)
  // Metoprolol steps: 0: Off, 1: 25mg QD, 2: 50mg QD, 3: 100mg QD, 4: 200mg QD (Target)
  // Bisoprolol steps: 0: Off, 1: 1.25mg QD, 2: 2.5mg QD, 3: 5mg QD, 4: 10mg QD (Target)
  const [bbStep, setBbStep] = useState<number>(3);

  // Pillar 3: MRA Agent Selection & Step
  const [mraAgent, setMraAgent] = useState<'spironolactone' | 'eplerenone'>('spironolactone');
  // Spironolactone steps: 0: Off, 1: 12.5mg QD, 2: 25mg QD (Starting), 3: 50mg QD (Target)
  // Eplerenone steps: 0: Off, 1: 25mg QD (Starting), 2: 50mg QD (Target)
  const [mraStep, setMraStep] = useState<number>(2);

  // Pillar 4: SGLT2i Agent Selection & Step
  const [sglt2iAgent, setSglt2iAgent] = useState<'dapagliflozin' | 'empagliflozin'>('dapagliflozin');
  // SGLT2i steps: 0: Off, 1: 10 mg QD (Target single-tier dose)
  const [sglt2iStep, setSglt2iStep] = useState<number>(1);

  // --------------------------------------------------------------------------
  // Auto-synchronize with active patient profile
  // --------------------------------------------------------------------------
  const syncWithPatient = () => {
    if (!patient) return;
    setSbp(patient.vitals?.sbp ?? 115);
    setHeartRate(patient.vitals?.heartRate ?? 74);
    setPotassium(patient.labs?.potassium ?? 4.4);
    setEgfr(patient.labs?.egfr ?? 55);

    // Check if patient's current outpatient medications include an ACE inhibitor
    const meds = (patient.currentMedications || []).map(m => m.toLowerCase());
    const takingAcei = meds.some(m => 
      m.includes('lisinopril') || 
      m.includes('enalapril') || 
      m.includes('ramipril') || 
      m.includes('captopril') || 
      m.includes('benazepril') || 
      m.includes('fosinopril') || 
      m.includes('quinapril') || 
      m.includes('perindopril') ||
      m.includes('trandolapril')
    );
    setIsTakingAcei(takingAcei);
  };

  useEffect(() => {
    syncWithPatient();
  }, [patient?.id]);

  // --------------------------------------------------------------------------
  // Safety Interlock Evaluations
  // --------------------------------------------------------------------------
  // Hemodynamic Gates:
  // - SBP < 100 mmHg: flag prominent hypotension caution for ARNI and Beta-Blockers
  // - SBP < 90 mmHg: Hard Block, turning titration bar dark red and locking out prescription capability
  // - HR < 60 bpm: halt further Beta-Blocker up-titration
  const isHypotensiveCaution = sbp < 100 && sbp >= 90;
  const isSbpHardBlock = sbp < 90;
  const isBradycardiaHalt = heartRate < 60;
  const isSevereBradycardia = heartRate < 50;

  // Biochemical Interlocks:
  // - Potassium > 5.0 mEq/L: trigger hyperkalemia warning for MRAs
  // - Potassium > 5.5 mEq/L: absolute contraindication block
  // - eGFR < 30 mL/min: restrict ARNI and MRA dosages
  // - eGFR < 20 mL/min: hard block for SGLT2 inhibitors
  const isHyperkalemiaWarning = potassium > 5.0 && potassium <= 5.5;
  const isHyperkalemiaHardBlock = potassium > 5.5;
  const isEgfrRestricted = egfr < 30;
  const isSglt2iHardBlock = egfr < 20;

  // Angioedema Safety Washout:
  // Active checkbox: Patient currently taking an ACE inhibitor
  // If checked, lock out ARNI initiation panel with a prominent high-risk warning box enforcing a strict 36-hour washout window
  const isArniAceiLocked = isTakingAcei;

  // --------------------------------------------------------------------------
  // Handlers for Titration with Interlock Guards
  // --------------------------------------------------------------------------
  const handleArniStepChange = (newStep: number) => {
    // If SBP hard block or ACEi active, locked at 0
    if (isSbpHardBlock || isArniAceiLocked || isHyperkalemiaHardBlock) {
      return;
    }
    // If eGFR < 30, restrict max step to 2 (49/51 mg BID max, standard starting 24/26 mg BID)
    if (isEgfrRestricted && newStep > 2) {
      setArniStep(2);
      return;
    }
    setArniStep(newStep);
  };

  const handleBbStepChange = (newStep: number) => {
    // If SBP < 90, hard block
    if (isSbpHardBlock) {
      return;
    }
    // If HR < 60, halt further UP-titration
    if (isBradycardiaHalt && newStep > bbStep) {
      return; // Do not allow increasing
    }
    setBbStep(newStep);
  };

  const handleMraStepChange = (newStep: number) => {
    // If K > 5.5 or eGFR < 30 or SBP < 90, hard block
    if (isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock) {
      return;
    }
    // If K > 5.0, halt further up-titration
    if (isHyperkalemiaWarning && newStep > mraStep) {
      return;
    }
    setMraStep(newStep);
  };

  const handleSglt2iStepChange = (newStep: number) => {
    if (isSglt2iHardBlock) {
      return;
    }
    setSglt2iStep(newStep);
  };

  // --------------------------------------------------------------------------
  // Drug Dosing Specifications & Clinical Text
  // --------------------------------------------------------------------------
  const arniDoseNames = ['None (0 mg)', '24/26 mg BID (Low Starting)', '49/51 mg BID (Standard Starting)', '97/103 mg BID (Target Class I)'];
  const arniActiveDose = arniDoseNames[isSbpHardBlock || isArniAceiLocked ? 0 : arniStep];

  const bbDoses = {
    carvedilol: ['None', '3.125 mg BID', '6.25 mg BID', '12.5 mg BID', '25 mg BID (Target)'],
    metoprolol: ['None', '25 mg QD', '50 mg QD', '100 mg QD', '200 mg QD (Target)'],
    bisoprolol: ['None', '1.25 mg QD', '2.5 mg QD', '5 mg QD', '10 mg QD (Target)'],
  };
  const bbActiveDose = bbDoses[bbAgent][isSbpHardBlock ? 0 : bbStep];

  const mraDoses = {
    spironolactone: ['None', '12.5 mg QD', '25 mg QD (Standard)', '50 mg QD (Target)'],
    eplerenone: ['None', '25 mg QD (Standard)', '50 mg QD (Target)'],
  };
  const mraActiveDose = mraAgent === 'spironolactone' 
    ? mraDoses.spironolactone[isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock ? 0 : mraStep]
    : mraDoses.eplerenone[isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock ? 0 : Math.min(mraStep, 2)];

  const sglt2iDoses = {
    dapagliflozin: ['None', '10 mg Once Daily (Target)'],
    empagliflozin: ['None', '10 mg Once Daily (Target)'],
  };
  const sglt2iActiveDose = sglt2iDoses[sglt2iAgent][isSglt2iHardBlock ? 0 : sglt2iStep];

  // --------------------------------------------------------------------------
  // Cumulative GDMT Metrics & Target Score
  // --------------------------------------------------------------------------
  const effectiveArniStep = isSbpHardBlock || isArniAceiLocked ? 0 : arniStep;
  const effectiveBbStep = isSbpHardBlock ? 0 : bbStep;
  const effectiveMraStep = isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock ? 0 : mraStep;
  const effectiveSglt2iStep = isSglt2iHardBlock ? 0 : sglt2iStep;

  const pillarsInitiatedCount = (effectiveArniStep > 0 ? 1 : 0) + 
                                (effectiveBbStep > 0 ? 1 : 0) + 
                                (effectiveMraStep > 0 ? 1 : 0) + 
                                (effectiveSglt2iStep > 0 ? 1 : 0);

  // Target dose fractions
  const arniTargetPct = (effectiveArniStep / 3) * 100;
  const bbTargetPct = (effectiveBbStep / 4) * 100;
  const mraTargetPct = mraAgent === 'spironolactone' ? (effectiveMraStep / 3) * 100 : (effectiveMraStep / 2) * 100;
  const sglt2iTargetPct = (effectiveSglt2iStep / 1) * 100;
  const overallTargetPct = Math.round((arniTargetPct + bbTargetPct + mraTargetPct + sglt2iTargetPct) / 4);

  // Projected 2-year mortality reduction from landmark clinical trials
  // Quadruple GDMT achieves ~61-73% cumulative relative reduction in all-cause mortality (Lancet 2020)
  const cumulativeMortalityReduction = useMemo(() => {
    let risk = 1.0;
    if (effectiveArniStep > 0) risk *= 0.80; // PARADIGM-HF 20%
    if (effectiveBbStep > 0) risk *= 0.66; // MERIT-HF / COPERNICUS 34%
    if (effectiveMraStep > 0) risk *= 0.70; // RALES / EMPHASIS-HF 30%
    if (effectiveSglt2iStep > 0) risk *= 0.74; // DAPA-HF / EMPEROR-R 26%
    return Math.round((1 - risk) * 100);
  }, [effectiveArniStep, effectiveBbStep, effectiveMraStep, effectiveSglt2iStep]);

  // Copy clinical consultation note
  const handleCopyNote = () => {
    const note = `HEART FAILURE 4-PILLAR GDMT TITRATION & SAFETY NOTE
Patient: ${patient?.name || 'Unknown'} (${patient?.age || 'N/A'}y, ${patient?.gender || 'N/A'})
Biometrics: SBP ${sbp} mmHg, HR ${heartRate} bpm, Serum K+ ${potassium} mEq/L, eGFR ${egfr} mL/min
Euvolemic: ${isEuvolemic ? 'Yes' : 'No (Volume Overload)'}
ACEi Ingestion within 36h: ${isTakingAcei ? 'YES (ARNI WASH-OUT ENFORCED)' : 'No'}

PRESCRIBED 4-PILLAR GDMT REGIMEN:
- Pillar 1 (ARNI): ${isArniAceiLocked ? 'HOLD / CONTRAINDICATED (Mandatory 36h ACEi washout)' : isSbpHardBlock ? 'HARD BLOCK (SBP < 90 mmHg)' : arniActiveDose}
- Pillar 2 (Beta-Blocker): ${isSbpHardBlock ? 'HARD BLOCK (SBP < 90 mmHg)' : `${bbAgent.toUpperCase()}: ${bbActiveDose} (HR ${heartRate} bpm)`}
- Pillar 3 (MRA): ${isHyperkalemiaHardBlock ? 'CONTRAINDICATED (K+ > 5.5 mEq/L)' : isEgfrRestricted ? 'HOLD (eGFR < 30 mL/min)' : `${mraAgent.toUpperCase()}: ${mraActiveDose}`}
- Pillar 4 (SGLT2i): ${isSglt2iHardBlock ? 'CONTRAINDICATED (eGFR < 20 mL/min)' : `${sglt2iAgent.toUpperCase()}: ${sglt2iActiveDose}`}

SUMMARY METRICS:
Pillars Initiated: ${pillarsInitiatedCount}/4
Target Dose Optimization: ${overallTargetPct}%
Projected Relative Mortality Reduction: ${cumulativeMortalityReduction}%
Timestamp: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Pill className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Heart Failure 4-Pillar GDMT Titration & Safety Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                2024 ACC/AHA & ESC Class I Guideline-Directed Medical Therapy with Active Biophysical Safety Interlocks
              </p>
            </div>
          </div>
        </div>

        {/* Profile Auto-Sync & Copy Action */}
        <div className="flex flex-wrap items-center gap-2">
          {patient && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-medium">
                Active Profile: <strong className="text-white">{patient.name}</strong> ({patient.age}y {patient.gender})
              </span>
              <button
                onClick={syncWithPatient}
                title="Resynchronize biometrics from active patient case"
                className="ml-1 p-1 rounded-md hover:bg-slate-800 text-cyan-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopyNote}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? 'Copied Plan' : 'Copy GDMT Note'}</span>
          </button>
        </div>
      </div>

      {/* Global Safety Alert Banner: Visible when any Hard Block or Severe Warning is Active */}
      {(isSbpHardBlock || isArniAceiLocked || isHyperkalemiaHardBlock || isSglt2iHardBlock || isHypotensiveCaution || isBradycardiaHalt || isHyperkalemiaWarning || isEgfrRestricted) && (
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-white">Active Clinical Safety Interlocks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {/* Hemodynamic Gates */}
            {isSbpHardBlock ? (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">SBP HARD BLOCK (&lt; 90 mmHg)</strong>
                  <span>Shock / hypoperfusion threshold. Titration bars locked; ARNI &amp; BB held.</span>
                </div>
              </div>
            ) : isHypotensiveCaution ? (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">HYPOTENSION CAUTION (SBP &lt; 100)</strong>
                  <span>Flagged for ARNI &amp; Beta-Blockers. Monitor orthostasis; down-titrate loop diuretic first.</span>
                </div>
              </div>
            ) : null}

            {isBradycardiaHalt && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">BRADYCARDIA HALT (HR &lt; 60 bpm)</strong>
                  <span>Further Beta-Blocker up-titration halted to prevent AV block and symptomatic bradycardia.</span>
                </div>
              </div>
            )}

            {/* Biochemical Gates */}
            {isHyperkalemiaHardBlock ? (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">MRA ABSOLUTE BLOCK (K⁺ &gt; 5.5)</strong>
                  <span>Severe hyperkalemia. MRA locked out immediately to prevent malignant arrhythmias.</span>
                </div>
              </div>
            ) : isHyperkalemiaWarning ? (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">MRA WARNING (K⁺ &gt; 5.0 mEq/L)</strong>
                  <span>Hyperkalemia caution. Hold further MRA up-titration; recheck chemistry within 7 days.</span>
                </div>
              </div>
            ) : null}

            {/* Renal Gates */}
            {isSglt2iHardBlock ? (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">SGLT2i HARD BLOCK (eGFR &lt; 20)</strong>
                  <span>Below validated initiation threshold for Dapagliflozin / Empagliflozin. Locked out.</span>
                </div>
              </div>
            ) : isEgfrRestricted ? (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">RENAL RESTRICTION (eGFR &lt; 30)</strong>
                  <span>ARNI restricted to max 49/51 mg BID. MRA contraindicated per guidelines.</span>
                </div>
              </div>
            ) : null}

            {/* 36-Hour ACEi Washout Interlock */}
            {isArniAceiLocked && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">36h ACEi WASHOUT MANDATE</strong>
                  <span>Active ACE inhibitor detected. ARNI locked out to prevent life-threatening angioedema.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Left Controls (4 cols) & Right 4 Pillars Board (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bedside Reactive Biometrics & Washout Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-sm">Bedside Safety Parameters</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Reactive Gates
              </span>
            </div>

            {/* SBP Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Systolic Blood Pressure (SBP)</span>
                <span className={`font-mono font-bold text-sm ${
                  isSbpHardBlock ? 'text-red-400' : isHypotensiveCaution ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {sbp} <span className="text-xs text-slate-400 font-normal">mmHg</span>
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="160"
                step="1"
                value={sbp}
                onChange={(e) => setSbp(Number(e.target.value))}
                className={`w-full h-2 rounded-lg cursor-pointer ${
                  isSbpHardBlock ? 'accent-red-500 bg-red-950' : isHypotensiveCaution ? 'accent-amber-500 bg-amber-950' : 'accent-emerald-500 bg-slate-800'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span className={sbp < 90 ? 'text-red-400 font-bold' : ''}>&lt; 90 Hard Block</span>
                <span className={sbp >= 90 && sbp < 100 ? 'text-amber-400 font-bold' : ''}>&lt; 100 Caution</span>
                <span className={sbp >= 100 ? 'text-emerald-400' : ''}>≥ 100 Target</span>
                <span>160</span>
              </div>
            </div>

            {/* Heart Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Resting Heart Rate</span>
                <span className={`font-mono font-bold text-sm ${
                  isSevereBradycardia ? 'text-red-400' : isBradycardiaHalt ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {heartRate} <span className="text-xs text-slate-400 font-normal">bpm</span>
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="120"
                step="1"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className={`w-full h-2 rounded-lg cursor-pointer ${
                  isBradycardiaHalt ? 'accent-amber-500 bg-amber-950' : 'accent-emerald-500 bg-slate-800'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>40</span>
                <span className={heartRate < 60 ? 'text-amber-400 font-bold' : ''}>&lt; 60 bpm: Halt BB Up-titration</span>
                <span className={heartRate >= 60 && heartRate <= 70 ? 'text-emerald-400 font-bold' : ''}>60–70 Target</span>
                <span>120</span>
              </div>
            </div>

            {/* Serum Potassium Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Serum Potassium (K⁺)</span>
                <span className={`font-mono font-bold text-sm ${
                  isHyperkalemiaHardBlock ? 'text-red-400' : isHyperkalemiaWarning ? 'text-amber-400' : 'text-purple-300'
                }`}>
                  {potassium.toFixed(1)} <span className="text-xs text-slate-400 font-normal">mEq/L</span>
                </span>
              </div>
              <input
                type="range"
                min="3.0"
                max="6.5"
                step="0.1"
                value={potassium}
                onChange={(e) => setPotassium(Number(e.target.value))}
                className={`w-full h-2 rounded-lg cursor-pointer ${
                  isHyperkalemiaHardBlock ? 'accent-red-500 bg-red-950' : isHyperkalemiaWarning ? 'accent-amber-500 bg-amber-950' : 'accent-purple-500 bg-slate-800'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>3.0</span>
                <span className={potassium > 5.0 && potassium <= 5.5 ? 'text-amber-400 font-bold' : ''}>&gt; 5.0 Warning</span>
                <span className={potassium > 5.5 ? 'text-red-400 font-bold' : ''}>&gt; 5.5 Hard Block</span>
                <span>6.5</span>
              </div>
            </div>

            {/* eGFR Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Renal Function (eGFR)</span>
                <span className={`font-mono font-bold text-sm ${
                  isSglt2iHardBlock ? 'text-red-400' : isEgfrRestricted ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {egfr} <span className="text-xs text-slate-400 font-normal">mL/min/1.73m²</span>
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={egfr}
                onChange={(e) => setEgfr(Number(e.target.value))}
                className={`w-full h-2 rounded-lg cursor-pointer ${
                  isSglt2iHardBlock ? 'accent-red-500 bg-red-950' : isEgfrRestricted ? 'accent-amber-500 bg-amber-950' : 'accent-cyan-500 bg-slate-800'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span className={egfr < 20 ? 'text-red-400 font-bold' : ''}>&lt; 20 SGLT2i Block</span>
                <span className={egfr < 30 ? 'text-amber-400 font-bold' : ''}>&lt; 30 MRA / ARNI Restrict</span>
                <span>90</span>
              </div>
            </div>

            {/* Clinical Checkboxes & The 36-Hour ACEi Washout Interlock */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              {/* Mandatory 36-Hour ACEi Washout Checkbox */}
              <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isTakingAcei ? 'bg-red-950/50 border-red-500/60 shadow-lg shadow-red-950/40' : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={isTakingAcei}
                  onChange={(e) => setIsTakingAcei(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Patient is currently taking an ACE inhibitor (e.g., Lisinopril)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Class I mandate: Strict 36-hour washout period required before initiating Sacubitril/Valsartan to avoid dual-pathway bradykinin breakdown blockage.
                  </p>
                </div>
              </label>

              {/* Volume Status */}
              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isEuvolemic}
                  onChange={(e) => setIsEuvolemic(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
                <span>Patient is clinically euvolemic (no acute pulmonary congestion / jugular venous distention)</span>
              </label>
            </div>
          </div>

          {/* GDMT Composite Score & Mortality Benefit Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">GDMT Optimization Index</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {pillarsInitiatedCount} / 4 Pillars
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">TARGET DOSE ACHIEVED</span>
                <span className="text-2xl font-extrabold text-white font-mono">{overallTargetPct}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">EST. 2-YR MORTALITY REDUCTION</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">{cumulativeMortalityReduction}%</span>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Quadruple Therapy Completeness</span>
                <span className="font-mono text-white font-semibold">{overallTargetPct}% of Target Dose</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${overallTargetPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: The 4 Pillars Interactive Titration Board (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ------------------------------------------------------------- */}
            {/* PILLAR 1: ARNI (Sacubitril/Valsartan) */}
            {/* ------------------------------------------------------------- */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
              isSbpHardBlock || isArniAceiLocked || isHyperkalemiaHardBlock
                ? 'bg-slate-950/90 border-red-600/70 shadow-2xl shadow-red-950/60'
                : isHypotensiveCaution || isEgfrRestricted
                ? 'bg-slate-900/90 border-amber-500/50 shadow-lg'
                : 'bg-slate-900/90 border-indigo-500/40 shadow-xl'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    PILLAR 1: ARNI
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Sacubitril / Valsartan</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  {isSbpHardBlock || isArniAceiLocked || isHyperkalemiaHardBlock ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> HARD BLOCK
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-indigo-400 font-mono">Class I (A)</span>
                  )}
                </div>
              </div>

              {/* 36-Hour ACEi High-Risk Warning Box */}
              {isArniAceiLocked && (
                <div className="p-3 rounded-xl bg-red-950 border-2 border-red-500 space-y-1 text-xs text-red-200 animate-pulse">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <AlertOctagon className="w-4 h-4 text-red-400" />
                    <span>36-HOUR ACEi WASHOUT MANDATE</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-200">
                    Patient currently taking ACE inhibitor. Attempting to initiate ARNI without a 36-hour washout triggers severe, life-threatening <strong>angioedema</strong> due to simultaneous inhibition of neutral endopeptidase and ACE.
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-red-900 text-red-100 border border-red-400">
                    STATUS: LOCKED OUT UNTIL WASHOUT COMPLETED
                  </span>
                </div>
              )}

              {/* SBP Hard Block Warning */}
              {isSbpHardBlock && !isArniAceiLocked && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-xs text-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                    <span>SBP &lt; 90 mmHg: Hard Block Active</span>
                  </div>
                  <p className="text-[11px]">
                    Prescription capability locked out to avoid cardiogenic collapse. Hold ARNI until SBP stabilizes &ge; 100 mmHg.
                  </p>
                </div>
              )}

              {/* SBP Hypotension Caution */}
              {isHypotensiveCaution && !isSbpHardBlock && (
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200">
                  <span className="font-bold text-amber-300">Hypotension Caution (SBP {sbp} mmHg):</span> Down-titrate loop diuretic first. Monitor for symptomatic postural hypotension.
                </div>
              )}

              {/* Renal Restriction */}
              {isEgfrRestricted && (
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200">
                  <span className="font-bold text-amber-300">Renal Floor (eGFR {egfr} mL/min):</span> Max recommended dose restricted to 49/51 mg BID.
                </div>
              )}

              {/* Interactive Titration Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Titration Step:</span>
                  <span className={`font-mono font-bold ${
                    isSbpHardBlock || isArniAceiLocked ? 'text-red-400' : 'text-indigo-300'
                  }`}>
                    {arniActiveDose}
                  </span>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={isEgfrRestricted ? 2 : 3}
                    step="1"
                    disabled={isSbpHardBlock || isArniAceiLocked || isHyperkalemiaHardBlock}
                    value={effectiveArniStep}
                    onChange={(e) => handleArniStepChange(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg cursor-pointer ${
                      isSbpHardBlock || isArniAceiLocked || isHyperkalemiaHardBlock
                        ? 'accent-red-600 bg-red-950 opacity-60 cursor-not-allowed'
                        : 'accent-indigo-500 bg-slate-800'
                    }`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Off</span>
                    <span>24/26</span>
                    <span>49/51</span>
                    {!isEgfrRestricted && <span>97/103 (Target)</span>}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Target Clinical Dose:</span>
                  <span className="text-white font-mono font-semibold">97/103 mg PO BID</span>
                </div>
                <div className="flex justify-between">
                  <span>Landmark Evidence:</span>
                  <span className="text-indigo-400 font-mono">PARADIGM-HF (20% Mortality Reduction)</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PILLAR 2: EVIDENCE-BASED BETA-BLOCKER */}
            {/* ------------------------------------------------------------- */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
              isSbpHardBlock
                ? 'bg-slate-950/90 border-red-600/70 shadow-2xl shadow-red-950/60'
                : isBradycardiaHalt || isHypotensiveCaution || !isEuvolemic
                ? 'bg-slate-900/90 border-amber-500/50 shadow-lg'
                : 'bg-slate-900/90 border-rose-500/40 shadow-xl'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                    PILLAR 2: BETA-BLOCKER
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <select
                      value={bbAgent}
                      onChange={(e) => setBbAgent(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-rose-500"
                    >
                      <option value="carvedilol">Carvedilol</option>
                      <option value="metoprolol">Metoprolol Succinate (ER)</option>
                      <option value="bisoprolol">Bisoprolol</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isSbpHardBlock ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> HARD BLOCK
                    </span>
                  ) : isBradycardiaHalt ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> HALT UP-TITRATION
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400 font-mono">Class I (A)</span>
                  )}
                </div>
              </div>

              {/* SBP Hard Block Warning */}
              {isSbpHardBlock && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-xs text-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                    <span>SBP &lt; 90 mmHg: Hard Block Active</span>
                  </div>
                  <p className="text-[11px]">
                    Titration locked out. Beta-blockers can worsen cardiogenic hypoperfusion in profound hypotension.
                  </p>
                </div>
              )}

              {/* HR < 60 bpm Up-Titration Halt Banner */}
              {isBradycardiaHalt && !isSbpHardBlock && (
                <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500 text-xs text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Heart Rate &lt; 60 bpm: Up-Titration Halted</span>
                  </div>
                  <p className="text-[11px]">
                    Current resting HR is {heartRate} bpm. Further dosage escalation is prevented to prevent symptomatic bradycardia or high-grade AV block. Maintain current step or down-titrate.
                  </p>
                </div>
              )}

              {/* Euvolemia Rule */}
              {!isEuvolemic && (
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200">
                  <span className="font-bold text-amber-300">Volume Overload:</span> Patient must achieve clinical euvolemia with IV loop diuretics before escalating beta-blockers.
                </div>
              )}

              {/* Interactive Titration Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Titration Step:</span>
                  <span className={`font-mono font-bold ${
                    isSbpHardBlock ? 'text-red-400' : isBradycardiaHalt ? 'text-amber-300' : 'text-rose-300'
                  }`}>
                    {bbActiveDose}
                  </span>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    disabled={isSbpHardBlock}
                    value={effectiveBbStep}
                    onChange={(e) => handleBbStepChange(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg cursor-pointer ${
                      isSbpHardBlock
                        ? 'accent-red-600 bg-red-950 opacity-60 cursor-not-allowed'
                        : isBradycardiaHalt
                        ? 'accent-amber-500 bg-slate-800'
                        : 'accent-rose-500 bg-slate-800'
                    }`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Off</span>
                    <span>Start</span>
                    <span>Low</span>
                    <span>Med</span>
                    <span>Target</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Target Clinical Dose:</span>
                  <span className="text-white font-mono font-semibold">
                    {bbAgent === 'carvedilol' ? '25 mg BID' : bbAgent === 'metoprolol' ? '200 mg QD' : '10 mg QD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Landmark Evidence:</span>
                  <span className="text-rose-400 font-mono">COPERNICUS / MERIT-HF (34% Mortality Red.)</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PILLAR 3: MINERALOCORTICOID RECEPTOR ANTAGONIST (MRA) */}
            {/* ------------------------------------------------------------- */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
              isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock
                ? 'bg-slate-950/90 border-red-600/70 shadow-2xl shadow-red-950/60'
                : isHyperkalemiaWarning
                ? 'bg-slate-900/90 border-amber-500/50 shadow-lg'
                : 'bg-slate-900/90 border-purple-500/40 shadow-xl'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    PILLAR 3: MRA
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <select
                      value={mraAgent}
                      onChange={(e) => setMraAgent(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-purple-500"
                    >
                      <option value="spironolactone">Spironolactone</option>
                      <option value="eplerenone">Eplerenone</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> HARD BLOCK
                    </span>
                  ) : isHyperkalemiaWarning ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> K⁺ WARNING
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-purple-400 font-mono">Class I (A)</span>
                  )}
                </div>
              </div>

              {/* Hyperkalemia Hard Block Warning */}
              {isHyperkalemiaHardBlock && (
                <div className="p-2.5 rounded-xl bg-red-950 border border-red-500 text-xs text-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                    <span>Potassium &gt; 5.5 mEq/L: Absolute Contraindication</span>
                  </div>
                  <p className="text-[11px]">
                    Current K⁺ is {potassium.toFixed(1)} mEq/L. MRA must be discontinued immediately to prevent fatal cardiac conduction block / ventricular fibrillation.
                  </p>
                </div>
              )}

              {/* eGFR < 30 Contraindication */}
              {isEgfrRestricted && !isHyperkalemiaHardBlock && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-xs text-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                    <span>eGFR &lt; 30 mL/min: MRA Contraindicated</span>
                  </div>
                  <p className="text-[11px]">
                    Severe renal impairment prevents physiological potassium excretion. MRA locked out per 2024 ESC / ACC guidelines.
                  </p>
                </div>
              )}

              {/* Hyperkalemia Warning (5.0 - 5.5) */}
              {isHyperkalemiaWarning && !isHyperkalemiaHardBlock && !isEgfrRestricted && (
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200">
                  <span className="font-bold text-amber-300">K⁺ Elevation ({potassium.toFixed(1)} mEq/L):</span> Halt up-titration. Check creatinine and K⁺ in 7 days; consider dietary potassium reduction or potassium binder.
                </div>
              )}

              {/* Interactive Titration Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Titration Step:</span>
                  <span className={`font-mono font-bold ${
                    isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock ? 'text-red-400' : 'text-purple-300'
                  }`}>
                    {mraActiveDose}
                  </span>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={mraAgent === 'spironolactone' ? 3 : 2}
                    step="1"
                    disabled={isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock}
                    value={effectiveMraStep}
                    onChange={(e) => handleMraStepChange(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg cursor-pointer ${
                      isHyperkalemiaHardBlock || isEgfrRestricted || isSbpHardBlock
                        ? 'accent-red-600 bg-red-950 opacity-60 cursor-not-allowed'
                        : 'accent-purple-500 bg-slate-800'
                    }`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Off</span>
                    <span>12.5mg</span>
                    <span>25mg</span>
                    {mraAgent === 'spironolactone' && <span>50mg (Target)</span>}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Target Clinical Dose:</span>
                  <span className="text-white font-mono font-semibold">50 mg Once Daily</span>
                </div>
                <div className="flex justify-between">
                  <span>Landmark Evidence:</span>
                  <span className="text-purple-400 font-mono">RALES / EMPHASIS-HF (30% Mortality Red.)</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PILLAR 4: SGLT2 INHIBITOR */}
            {/* ------------------------------------------------------------- */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
              isSglt2iHardBlock
                ? 'bg-slate-950/90 border-red-600/70 shadow-2xl shadow-red-950/60'
                : 'bg-slate-900/90 border-emerald-500/40 shadow-xl'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    PILLAR 4: SGLT2 INHIBITOR
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <select
                      value={sglt2iAgent}
                      onChange={(e) => setSglt2iAgent(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-emerald-500"
                    >
                      <option value="dapagliflozin">Dapagliflozin</option>
                      <option value="empagliflozin">Empagliflozin</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isSglt2iHardBlock ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> HARD BLOCK
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 font-mono">Class I (A)</span>
                  )}
                </div>
              </div>

              {/* SGLT2i Hard Block Warning (eGFR < 20) */}
              {isSglt2iHardBlock ? (
                <div className="p-2.5 rounded-xl bg-red-950 border border-red-500 text-xs text-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                    <span>eGFR &lt; 20 mL/min: Hard Block Active</span>
                  </div>
                  <p className="text-[11px]">
                    Current eGFR is {egfr} mL/min. SGLT2 inhibitors are not approved for initiation below eGFR 20 mL/min due to lack of randomized safety and clinical trial data.
                  </p>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Single-step target dosing. Minimal BP effect (1-2 mmHg). Start on Day 1.</span>
                </div>
              )}

              {/* Interactive Titration Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Titration Step:</span>
                  <span className={`font-mono font-bold ${
                    isSglt2iHardBlock ? 'text-red-400' : 'text-emerald-300'
                  }`}>
                    {sglt2iActiveDose}
                  </span>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="1"
                    disabled={isSglt2iHardBlock}
                    value={effectiveSglt2iStep}
                    onChange={(e) => handleSglt2iStepChange(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg cursor-pointer ${
                      isSglt2iHardBlock
                        ? 'accent-red-600 bg-red-950 opacity-60 cursor-not-allowed'
                        : 'accent-emerald-500 bg-slate-800'
                    }`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Off (0 mg)</span>
                    <span>10 mg Once Daily (Target Dose)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Target Clinical Dose:</span>
                  <span className="text-white font-mono font-semibold">10 mg Once Daily</span>
                </div>
                <div className="flex justify-between">
                  <span>Landmark Evidence:</span>
                  <span className="text-emerald-400 font-mono">DAPA-HF / EMPEROR-R (26% CV Death/HHF Red.)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rapid Sequencing Roadmap (2024-2026 Consensus) */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Rapid Sequencing Roadmap (Complete Quadruple Therapy in &le; 14 Days)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-emerald-400 block text-xs">Phase 1 (Day 1 - Inpatient)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Start <strong>SGLT2i (10 mg QD)</strong> immediately regardless of BP. Add low-dose <strong>Beta-Blocker</strong> once patient achieves clinical euvolemia.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-indigo-400 block text-xs">Phase 2 (Day 3–7)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Initiate <strong>ARNI (24/26 or 49/51 mg BID)</strong>. Confirm SBP &ge; 100 mmHg and verify 36-hour ACEi washout is respected.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-purple-400 block text-xs">Phase 3 (Day 7–14)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Add <strong>MRA (Spironolactone 25 mg QD)</strong> if K⁺ &le; 5.0 and eGFR &ge; 30. Recheck renal chemistry at Day 7 post-initiation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
