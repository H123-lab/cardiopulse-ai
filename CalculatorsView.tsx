import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  Info, 
  ArrowRight,
  Pill,
  CheckCircle,
  AlertOctagon,
  Activity,
  Zap,
  Copy,
  Check,
  RotateCcw,
  User,
  Stethoscope,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Scale,
  Droplets,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';

export const CalculatorsView: React.FC = () => {
  const { patient } = usePatientContext();

  const [activeCalc, setActiveCalc] = useState<'chads' | 'timi' | 'hfpeff'>('chads');
  const [copied, setCopied] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 1. CHA2DS2-VASc & 2024 ESC Class I DOAC Dosing Engine State
  // -------------------------------------------------------------
  const [chadsState, setChadsState] = useState({
    chf: false,
    hypertension: true,
    ageCategory: '65_74' as 'under_65' | '65_74' | '75_plus',
    diabetes: false,
    stroke: false,
    vascular: true,
    gender: 'male' as 'male' | 'female',
    // DOAC renal & demographic clearance variables
    egfr: 65, // mL/min/1.73m²
    weightKg: 72, // kg
    serumCr: 1.1, // mg/dL
    hasPotentPgpInhibitor: false,
    hasHighBleedingRisk: false,
  });

  // Auto-synchronize with active patient context
  const syncWithPatient = () => {
    if (!patient) return;
    const isFemale = patient.gender === 'female';
    const age = patient.age;
    const ageCategory = age >= 75 ? '75_plus' : age >= 65 ? '65_74' : 'under_65';

    const pmh = (patient.pastMedicalHistory || []).map(h => h.toLowerCase());
    const hasChf = pmh.some(h => h.includes('heart fail') || h.includes('chf') || h.includes('cardiomyopathy')) || (patient.echoSummary?.lvef ?? 55) <= 40;
    const hasHtn = pmh.some(h => h.includes('hypertens') || h.includes('htn')) || patient.vitals.sbp >= 140;
    const hasDm = pmh.some(h => h.includes('diabet') || h.includes('dm')) || (patient.labs?.hba1c ?? 5.6) >= 6.5;
    const hasStroke = pmh.some(h => h.includes('stroke') || h.includes('tia') || h.includes('thromboembol'));
    const hasVasc = pmh.some(h => h.includes('cad') || h.includes('coronary') || h.includes('mi') || h.includes('pad') || h.includes('plaque'));

    setChadsState(prev => ({
      ...prev,
      chf: hasChf,
      hypertension: hasHtn,
      ageCategory,
      diabetes: hasDm,
      stroke: hasStroke,
      vascular: hasVasc,
      gender: isFemale ? 'female' : 'male',
      egfr: patient.labs?.egfr ?? 65,
      serumCr: patient.labs?.creatinine ?? 1.1,
    }));

    // Also auto-sync TIMI variables
    const stDev = (patient.ecgSummary?.stSegment || '').toLowerCase().includes('depress') ||
                  (patient.ecgSummary?.stSegment || '').toLowerCase().includes('elevat') ||
                  (patient.ecgSummary?.findings || '').toLowerCase().includes('st ');
    const posTrop = (patient.labs?.troponin ?? 0) > 0.04;

    setTimiState(prev => ({
      ...prev,
      age65: age >= 65,
      cadRiskFactors: (hasHtn ? 1 : 0) + (hasDm ? 1 : 0) + (pmh.some(h => h.includes('lipid')) ? 1 : 0) >= 2,
      knownCad: hasVasc,
      aspirinUse: (patient.currentMedications || []).some(m => m.toLowerCase().includes('aspirin') || m.toLowerCase().includes('asa')),
      stDeviation: stDev,
      elevatedMarkers: posTrop,
    }));

    // Also auto-sync HFA-PEFF variables
    const eOverE = patient.echoSummary?.eOverEPrime ?? 12;
    const pasp = patient.echoSummary?.pasP ?? 32;
    const bnp = patient.labs?.bnp ?? 140;
    const isAf = (patient.ecgSummary?.rhythm || '').toLowerCase().includes('fibrillation');

    setHfpeffState(prev => ({
      ...prev,
      isAtrialFibrillation: isAf,
      eOverEPrimeVal: eOverE,
      trVelocityVal: Number((Math.sqrt(Math.max(0, pasp - 5) / 4)).toFixed(2)) || 2.6,
      laviVal: isAf ? 38 : 32,
      ntProBnpVal: bnp,
      functionalMajor: eOverE >= 15 || pasp > 35,
      functionalMinor: (eOverE >= 9 && eOverE < 15),
      morphologicMajor: false,
      morphologicMinor: true,
      biomarkerMajor: isAf ? bnp > 660 : bnp > 220,
      biomarkerMinor: isAf ? (bnp >= 365 && bnp <= 660) : (bnp >= 125 && bnp <= 220),
    }));
  };

  // Sync on patient profile change
  useEffect(() => {
    syncWithPatient();
  }, [patient?.id]);

  // Calculate CHA2DS2-VASc
  const chadsScore = useMemo(() => {
    let score = 0;
    if (chadsState.chf) score += 1;
    if (chadsState.hypertension) score += 1;
    if (chadsState.ageCategory === '75_plus') score += 2;
    else if (chadsState.ageCategory === '65_74') score += 1;
    if (chadsState.diabetes) score += 1;
    if (chadsState.stroke) score += 2;
    if (chadsState.vascular) score += 1;
    if (chadsState.gender === 'female') score += 1;
    return score;
  }, [chadsState]);

  const chadsRecommendation = useMemo(() => {
    const isFemale = chadsState.gender === 'female';
    const effectiveScore = isFemale ? chadsScore - 1 : chadsScore;

    if (effectiveScore === 0) {
      return {
        level: 'Low Risk (Score 0 in Men, 1 in Women)',
        color: 'emerald',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        strokeRisk: '< 1.0% / year',
        text: 'Oral anticoagulation is NOT recommended per 2024 ESC AF Guidelines (Class III, Level B). Low ischemic stroke risk; bleeding hazard outweighs clinical benefit.',
        action: 'OAC Not Indicated',
        isOacIndicated: false,
      };
    } else if (effectiveScore === 1) {
      return {
        level: 'Intermediate Risk (Score 1 in Men, 2 in Women)',
        color: 'amber',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        strokeRisk: '1.5% - 2.8% / year',
        text: 'Oral anticoagulation (DOAC preferred over VKA) should be considered based on individual net clinical benefit and shared patient values (2024 ESC Class IIa, Level B).',
        action: 'Consider DOAC (Class IIa)',
        isOacIndicated: true,
      };
    } else {
      return {
        level: `High Risk (Score ${chadsScore})`,
        color: 'rose',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        strokeRisk: '4.0% - 15.2% / year',
        text: 'Direct Oral Anticoagulant (DOAC: Apixaban, Rivaroxaban, Edoxaban) is strongly recommended (2024 ESC Class I, Level A). High ischemic thromboembolic hazard.',
        action: 'Initiate Class I DOAC',
        isOacIndicated: true,
      };
    }
  }, [chadsScore, chadsState.gender]);

  // 2024 ESC Class I DOAC Dosing Calculations
  const doacRegimens = useMemo(() => {
    const { egfr, weightKg, serumCr, ageCategory, hasPotentPgpInhibitor, hasHighBleedingRisk } = chadsState;
    const isSevereRenal = egfr < 15;
    const isModerateRenal = egfr >= 15 && egfr < 50;
    const isOverclearance = egfr > 95;

    // 1. Apixaban (Eliquis)
    // Reduction criteria: >= 2 of (Age >= 80, Wt <= 60 kg, Cr >= 1.5 mg/dL) OR eGFR 15-29 mL/min
    const meetsAge80 = ageCategory === '75_plus'; // Used as marker or if age >= 80
    const meetsWeight60 = weightKg <= 60;
    const meetsCr15 = serumCr >= 1.5;
    const reductionCriteriaMetCount = (meetsAge80 ? 1 : 0) + (meetsWeight60 ? 1 : 0) + (meetsCr15 ? 1 : 0);
    const apixabanReduced = reductionCriteriaMetCount >= 2 || (egfr >= 15 && egfr < 30);

    let apixabanDose = '5 mg PO BID';
    let apixabanStatus: 'standard' | 'reduced' | 'contraindicated' = 'standard';
    let apixabanNote = 'Standard therapeutic dose. Take twice daily with or without food.';

    if (isSevereRenal) {
      apixabanDose = 'Contraindicated (eGFR < 15)';
      apixabanStatus = 'contraindicated';
      apixabanNote = '2024 ESC Class III: Avoid DOACs in ESRD / dialysis; consider VKA or LAA closure.';
    } else if (apixabanReduced) {
      apixabanDose = '2.5 mg PO BID';
      apixabanStatus = 'reduced';
      apixabanNote = `Dose reduced: ${reductionCriteriaMetCount >= 2 ? `Met ${reductionCriteriaMetCount}/3 criteria (Age≥80, Wt≤60kg, Cr≥1.5)` : 'Severe renal impairment (eGFR 15-29 mL/min)'}.`;
    }

    // 2. Rivaroxaban (Xarelto)
    // Standard: 20 mg once daily with evening meal
    // Reduction: 15 mg once daily with food if eGFR 15-49 mL/min
    let rivaroxabanDose = '20 mg PO QD';
    let rivaroxabanStatus: 'standard' | 'reduced' | 'contraindicated' = 'standard';
    let rivaroxabanNote = 'Take with evening meal (mandatory for bioavailability of 15/20 mg tablets).';

    if (isSevereRenal) {
      rivaroxabanDose = 'Contraindicated (eGFR < 15)';
      rivaroxabanStatus = 'contraindicated';
      rivaroxabanNote = 'Avoid due to lack of randomized safety data in ESRD.';
    } else if (isModerateRenal) {
      rivaroxabanDose = '15 mg PO QD';
      rivaroxabanStatus = 'reduced';
      rivaroxabanNote = 'Reduced dose mandated for eGFR 15–49 mL/min. Must be ingested with food.';
    }

    // 3. Edoxaban (Savaysa / Lixiana)
    // Standard: 60 mg once daily
    // Reduction: 30 mg once daily if eGFR 15-50, Wt <= 60 kg, or strong P-gp inhibitor
    let edoxabanDose = '60 mg PO QD';
    let edoxabanStatus: 'standard' | 'reduced' | 'contraindicated' | 'warning' = 'standard';
    let edoxabanNote = 'Standard once-daily dosing with or without food.';

    if (isSevereRenal) {
      edoxabanDose = 'Contraindicated (eGFR < 15)';
      edoxabanStatus = 'contraindicated';
      edoxabanNote = 'Contraindicated when eGFR < 15 mL/min.';
    } else if (egfr <= 50 || weightKg <= 60 || hasPotentPgpInhibitor) {
      edoxabanDose = '30 mg PO QD';
      edoxabanStatus = 'reduced';
      const reasons = [];
      if (egfr <= 50) reasons.push(`eGFR ${egfr} mL/min`);
      if (weightKg <= 60) reasons.push(`Weight ${weightKg} kg`);
      if (hasPotentPgpInhibitor) reasons.push('P-gp inhibitor');
      edoxabanNote = `Dose reduced to 30 mg QD due to: ${reasons.join(', ')}.`;
    } else if (isOverclearance) {
      edoxabanStatus = 'warning';
      edoxabanNote = 'FDA Black Box Warning / ESC caution: eGFR >95 mL/min associated with increased ischemic stroke vs warfarin. Consider alternative DOAC.';
    }

    // 4. Dabigatran (Pradaxa)
    let dabigatranDose = '150 mg PO BID';
    let dabigatranStatus: 'standard' | 'reduced' | 'contraindicated' = 'standard';
    let dabigatranNote = 'Direct thrombin inhibitor. Specific reversal agent: Idarucizumab.';

    if (egfr < 30) {
      dabigatranDose = 'Contraindicated (eGFR < 30)';
      dabigatranStatus = 'contraindicated';
      dabigatranNote = '80% renally cleared; contraindicated when eGFR < 30 mL/min in European guidelines.';
    } else if (egfr < 50 || meetsAge80 || hasHighBleedingRisk) {
      dabigatranDose = '110 mg PO BID';
      dabigatranStatus = 'reduced';
      dabigatranNote = 'Reduced to 110 mg BID due to renal clearance (30-49 mL/min), age, or bleeding risk.';
    }

    return {
      apixaban: { name: 'Apixaban (Eliquis)', dose: apixabanDose, status: apixabanStatus, note: apixabanNote, classRank: 'Class I, Level A' },
      rivaroxaban: { name: 'Rivaroxaban (Xarelto)', dose: rivaroxabanDose, status: rivaroxabanStatus, note: rivaroxabanNote, classRank: 'Class I, Level A' },
      edoxaban: { name: 'Edoxaban (Lixiana / Savaysa)', dose: edoxabanDose, status: edoxabanStatus, note: edoxabanNote, classRank: 'Class I, Level B' },
      dabigatran: { name: 'Dabigatran (Pradaxa)', dose: dabigatranDose, status: dabigatranStatus, note: dabigatranNote, classRank: 'Class I, Level B' },
    };
  }, [chadsState]);

  // -------------------------------------------------------------
  // 2. TIMI Risk Score for UA / NSTEMI Engine State
  // -------------------------------------------------------------
  const [timiState, setTimiState] = useState({
    age65: false,
    cadRiskFactors: true, // >=3 risk factors (FHx, HTN, Hyperlipidemia, DM, Smoker)
    knownCad: true, // Stenosis >= 50%
    aspirinUse: true, // In prior 7 days
    severeAngina: true, // >= 2 episodes in 24h
    stDeviation: true, // >= 0.5 mm
    elevatedMarkers: true, // Positive cardiac troponin
  });

  const timiScore = useMemo(() => {
    let score = 0;
    if (timiState.age65) score += 1;
    if (timiState.cadRiskFactors) score += 1;
    if (timiState.knownCad) score += 1;
    if (timiState.aspirinUse) score += 1;
    if (timiState.severeAngina) score += 1;
    if (timiState.stDeviation) score += 1;
    if (timiState.elevatedMarkers) score += 1;
    return score;
  }, [timiState]);

  const timiStratification = useMemo(() => {
    if (timiScore <= 2) {
      return {
        riskTier: 'Low Risk',
        scoreRange: 'Score 0–2',
        maceRate: timiScore === 0 || timiScore === 1 ? '4.7%' : '8.3%',
        color: 'emerald',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        strategy: 'Selective Invasive / Conservative Strategy',
        timing: 'Elective / Outpatient Evaluation',
        rationale: 'Low 14-day ischemic risk. Admit for telemetry monitoring, serial hs-cTnI (0h/1h or 0h/3h protocol), and non-invasive functional or anatomical testing (CCTA or Stress Echo) prior to hospital discharge.',
        isHighRisk: false,
        isUrgentInvasive: false,
      };
    } else if (timiScore <= 4) {
      return {
        riskTier: 'Intermediate Risk',
        scoreRange: 'Score 3–4',
        maceRate: timiScore === 3 ? '13.2%' : '19.9%',
        color: 'amber',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        strategy: 'In-Hospital Invasive Strategy',
        timing: 'Coronary Angiography within 24–72 Hours',
        rationale: 'Moderate 14-day MACE risk (~13-20%). Initiate dual antiplatelet therapy (Aspirin + P2Y12 inhibitor) and parenteral anticoagulation (Enoxaparin or Fondaparinux). Schedule diagnostic coronary catheterization during the index hospitalization.',
        isHighRisk: false,
        isUrgentInvasive: false,
      };
    } else {
      return {
        riskTier: 'High Risk',
        scoreRange: 'Score 5–7',
        maceRate: timiScore === 5 ? '26.2%' : '40.9%',
        color: 'rose',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        strategy: 'Early Invasive Strategy (Class I, Level A)',
        timing: 'Immediate Invasive Coronary Angiography (< 24 Hours)',
        rationale: 'Severe 14-day risk of death, recurrent MI, or urgent revascularization (>26-41%). ACC/AHA & ESC NSTE-ACS guidelines mandate coronary angiography within <24 hours (<2 hours if refractory angina, dynamic ST changes, or hemodynamic compromise).',
        isHighRisk: true,
        isUrgentInvasive: true,
      };
    }
  }, [timiScore]);

  // -------------------------------------------------------------
  // 3. HFA-PEFF Diagnostic Stratification Framework State
  // -------------------------------------------------------------
  const [hfpeffState, setHfpeffState] = useState({
    isAtrialFibrillation: false,
    eOverEPrimeVal: 15,
    trVelocityVal: 2.9,
    laviVal: 36,
    ntProBnpVal: 280,
    // Stepwise domain flags
    functionalMajor: true, // E/e' >= 15 or TR vel > 2.8 m/s
    functionalMinor: false, // E/e' 9-14 or GLS < 16%
    morphologicMajor: true, // LAVi > 34 mL/m2 or LVMI > 149/122 g/m2
    morphologicMinor: false, // LAVi 29-34 mL/m2
    biomarkerMajor: true, // NT-proBNP > 220 (SR) or > 660 (AF)
    biomarkerMinor: false, // NT-proBNP 125-220 (SR) or 365-660 (AF)
  });

  // Calculate HFA-PEFF Domain Points (Max 2 points per domain)
  const hfaFunctionalPoints = hfpeffState.functionalMajor ? 2 : hfpeffState.functionalMinor ? 1 : 0;
  const hfaMorphologicPoints = hfpeffState.morphologicMajor ? 2 : hfpeffState.morphologicMinor ? 1 : 0;
  const hfaBiomarkerPoints = hfpeffState.biomarkerMajor ? 2 : hfpeffState.biomarkerMinor ? 1 : 0;
  const hfaTotalScore = hfaFunctionalPoints + hfaMorphologicPoints + hfaBiomarkerPoints;

  const hfaInterpretation = useMemo(() => {
    if (hfaTotalScore >= 5) {
      return {
        status: 'Definite HFpEF Confirmed',
        scoreBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        recommendation: 'Diagnosis of Heart Failure with Preserved Ejection Fraction is formally established per ESC HFA guidelines (Score ≥5).',
        nextStep: 'Step 4: Etiological Phenotyping',
        actions: [
          'Initiate Guideline-Directed SGLT2 Inhibitor (Dapagliflozin or Empagliflozin 10 mg QD; Class I, Level A).',
          'Titrate Loop Diuretic (Furosemide or Torsemide) to achieve and sustain clinical euvolemia.',
          'Strict Blood Pressure Optimization (target SBP < 130 mmHg) using ACEi/ARB/ARNI or MRA.',
          'Rule out cardiac amyloidosis with 99mTc-PYP scintigraphy / serum free light chains if wall thickness ≥ 12 mm.',
        ],
      };
    } else if (hfaTotalScore >= 2) {
      return {
        status: 'Intermediate / Equivocal Probability',
        scoreBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        recommendation: 'Diagnostic uncertainty remains (Score 2–4). Diagnosis cannot be confirmed or excluded by resting parameters alone.',
        nextStep: 'Step 3: Diastolic Stress Test Required',
        actions: [
          'Order Exercise Stress Echocardiography: Assess dynamic E/e\' and TR velocity during supine bicycle ergometry.',
          'Or proceed to Invasive Hemodynamic Exercise Testing: PCWP ≥ 15 mmHg at rest or ≥ 25 mmHg during exercise.',
          'Re-evaluate natriuretic peptides with serial testing or post-exercise draw.',
        ],
      };
    } else {
      return {
        status: 'Low Probability / HFpEF Unlikely',
        scoreBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        recommendation: 'HFpEF is highly unlikely as the etiology of the patient\'s dyspnea (Score ≤1).',
        nextStep: 'Differential Diagnosis of Dyspnea',
        actions: [
          'Investigate primary pulmonary disease: Spirometry / PFTs, High-Resolution Chest CT.',
          'Screen for severe anemia, iron deficiency, chronic kidney disease, or deconditioning.',
          'Evaluate for chronotropic incompetence or sleep-disordered breathing (Polysomnography).',
        ],
      };
    }
  }, [hfaTotalScore]);

  // Copy clinical consultation record
  const handleCopyRecord = () => {
    const record = {
      timestamp: new Date().toISOString(),
      patient: {
        id: patient?.id,
        name: patient?.name,
        age: patient?.age,
        gender: patient?.gender,
        eGFR: chadsState.egfr,
      },
      calculatorEngine: activeCalc === 'chads' ? 'CHA2DS2-VASc + DOAC' : activeCalc === 'timi' ? 'TIMI UA/NSTEMI' : 'HFA-PEFF HFpEF',
      results: activeCalc === 'chads' ? {
        score: chadsScore,
        category: chadsRecommendation.level,
        annualStrokeRisk: chadsRecommendation.strokeRisk,
        recommendedAction: chadsRecommendation.action,
        doacPrescribing: doacRegimens,
      } : activeCalc === 'timi' ? {
        score: timiScore,
        riskTier: timiStratification.riskTier,
        fourteenDayMaceRate: timiStratification.maceRate,
        strategy: timiStratification.strategy,
        timing: timiStratification.timing,
      } : {
        score: hfaTotalScore,
        functionalPoints: hfaFunctionalPoints,
        morphologicPoints: hfaMorphologicPoints,
        biomarkerPoints: hfaBiomarkerPoints,
        status: hfaInterpretation.status,
        nextStep: hfaInterpretation.nextStep,
      }
    };

    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Engine Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Cardiology Risk & Clinical Strategy Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                2024 ESC / ACC Guideline-Grounded Anticoagulation, Acute Coronary Syndrome, and HFpEF Diagnostic Triages
              </p>
            </div>
          </div>
        </div>

        {/* Patient Profile Auto-Sync Status Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {patient && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-medium">
                Active Profile: <strong className="text-white">{patient.name}</strong> ({patient.age}y {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)})
              </span>
              <button
                onClick={syncWithPatient}
                title="Resynchronize variables from active patient profile"
                className="ml-1 p-1 rounded-md hover:bg-slate-800 text-cyan-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopyRecord}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Strategy'}</span>
          </button>
        </div>
      </div>

      {/* Modern High-Tech Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveCalc('chads')}
          className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeCalc === 'chads'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>CHA₂DS₂-VASc & DOAC Dosing</span>
        </button>

        <button
          onClick={() => setActiveCalc('timi')}
          className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeCalc === 'timi'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>TIMI Score (UA / NSTEMI)</span>
        </button>

        <button
          onClick={() => setActiveCalc('hfpeff')}
          className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeCalc === 'hfpeff'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>HFA-PEFF Diagnostic Matrix</span>
        </button>
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* 1. CHA2DS2-VASc & AUTOMATED 2024 ESC CLASS I DOAC DOSING GUIDELINE INTERFACE */}
      {/* ----------------------------------------------------------------------------- */}
      {activeCalc === 'chads' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Scoring Panel + Demographic & Renal Sliders (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>CHA₂DS₂-VASc Clinical Variables</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      Auto-synced with Patient
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculates annual thromboembolic risk and indications for anticoagulation.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-2xl font-extrabold text-white">{chadsScore}</span>
                  <span className="text-xs text-slate-400"> / 9 pts</span>
                </div>
              </div>

              {/* Checkbox List for Variables */}
              <div className="space-y-2">
                {/* Congestive Heart Failure */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={chadsState.chf}
                      onChange={(e) => setChadsState({ ...chadsState, chf: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Congestive Heart Failure (C)</span>
                      <p className="text-[11px] text-slate-400">Signs/symptoms of HF or objective evidence of LVEF ≤ 40%.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">+1</span>
                </label>

                {/* Hypertension */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={chadsState.hypertension}
                      onChange={(e) => setChadsState({ ...chadsState, hypertension: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Hypertension (H)</span>
                      <p className="text-[11px] text-slate-400">Resting SBP &gt;140 mmHg or currently prescribed antihypertensive pharmacotherapy.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">+1</span>
                </label>

                {/* Age Selector */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>Age Category (A / A₂)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Patient Age: {patient?.age ?? 68}y</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setChadsState({ ...chadsState, ageCategory: 'under_65' })}
                      className={`text-xs py-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        chadsState.ageCategory === 'under_65'
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      &lt; 65 years (+0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChadsState({ ...chadsState, ageCategory: '65_74' })}
                      className={`text-xs py-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        chadsState.ageCategory === '65_74'
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      65–74 years (+1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChadsState({ ...chadsState, ageCategory: '75_plus' })}
                      className={`text-xs py-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        chadsState.ageCategory === '75_plus'
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      ≥ 75 years (+2)
                    </button>
                  </div>
                </div>

                {/* Diabetes */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={chadsState.diabetes}
                      onChange={(e) => setChadsState({ ...chadsState, diabetes: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Diabetes Mellitus (D)</span>
                      <p className="text-[11px] text-slate-400">Fasting glucose &gt;126 mg/dL, HbA1c ≥ 6.5%, or on antidiabetic medication.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">+1</span>
                </label>

                {/* Stroke */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={chadsState.stroke}
                      onChange={(e) => setChadsState({ ...chadsState, stroke: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Prior Stroke / TIA / Thromboembolism (S₂)</span>
                      <p className="text-[11px] text-slate-400">Previous ischemic stroke, transient ischemic attack, or systemic arterial embolism.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">+2</span>
                </label>

                {/* Vascular Disease */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={chadsState.vascular}
                      onChange={(e) => setChadsState({ ...chadsState, vascular: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Vascular Disease History (V)</span>
                      <p className="text-[11px] text-slate-400">Prior myocardial infarction, peripheral arterial disease, or complex aortic atheroma.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">+1</span>
                </label>

                {/* Sex Category */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Biological Sex Category (Sc)</span>
                    <span className="text-[11px] text-slate-400">Female sex confers an additional risk point only in the presence of other non-sex risk factors.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setChadsState({ ...chadsState, gender: 'male' })}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                        chadsState.gender === 'male'
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Male (+0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChadsState({ ...chadsState, gender: 'female' })}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                        chadsState.gender === 'female'
                          ? 'bg-rose-600 text-white border-rose-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Female (+1)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Renal Clearance & DOAC Modifiers Live Sliders */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Live Renal & Dosing Clearance Controls</h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-300">
                  Dynamic Drug Recalibration
                </span>
              </div>

              <div className="space-y-4">
                {/* eGFR Renal Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Estimated GFR (CKD-EPI)</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {chadsState.egfr} <span className="text-xs text-slate-400 font-normal">mL/min/1.73m²</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="1"
                    value={chadsState.egfr}
                    onChange={(e) => setChadsState({ ...chadsState, egfr: Number(e.target.value) })}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>10 (ESRD)</span>
                    <span className={chadsState.egfr < 15 ? 'text-rose-400 font-bold' : chadsState.egfr < 50 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      {chadsState.egfr < 15 ? 'Severely Impaired (<15)' : chadsState.egfr < 50 ? 'Moderate Reduction (15-49)' : chadsState.egfr > 95 ? 'Supranormal (>95)' : 'Normal Renal (≥50)'}
                    </span>
                    <span>120</span>
                  </div>
                </div>

                {/* Weight Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Patient Body Weight</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {chadsState.weightKg} <span className="text-xs text-slate-400 font-normal">kg</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    step="1"
                    value={chadsState.weightKg}
                    onChange={(e) => setChadsState({ ...chadsState, weightKg: Number(e.target.value) })}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span className={chadsState.weightKg <= 60 ? 'text-amber-400 font-bold' : ''}>40 kg (≤60kg = Apixaban/Edoxaban trigger)</span>
                    <span>120 kg</span>
                  </div>
                </div>

                {/* Serum Creatinine Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Serum Creatinine</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {chadsState.serumCr.toFixed(2)} <span className="text-xs text-slate-400 font-normal">mg/dL</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.1"
                    value={chadsState.serumCr}
                    onChange={(e) => setChadsState({ ...chadsState, serumCr: Number(e.target.value) })}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>0.5</span>
                    <span className={chadsState.serumCr >= 1.5 ? 'text-amber-400 font-bold' : ''}>
                      {chadsState.serumCr >= 1.5 ? '≥ 1.5 mg/dL (Apixaban reduction criteria)' : 'Normal'}
                    </span>
                    <span>4.0</span>
                  </div>
                </div>

                {/* Concomitant Drug & Bleeding Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={chadsState.hasPotentPgpInhibitor}
                      onChange={(e) => setChadsState({ ...chadsState, hasPotentPgpInhibitor: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-900 border-slate-700"
                    />
                    <span>Potent P-gp Inhibitor (Dronedarone / Cyclosporine)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={chadsState.hasHighBleedingRisk}
                      onChange={(e) => setChadsState({ ...chadsState, hasHighBleedingRisk: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-900 border-slate-700"
                    />
                    <span>High Bleeding Risk (HAS-BLED ≥ 3)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Stratification Summary & Class I DOAC Dosing Guide (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Risk Summary Card */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>2024 ESC Anticoagulation Mandate</span>
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${chadsRecommendation.badgeColor}`}>
                  {chadsRecommendation.action}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">CHA₂DS₂-VASc SCORE</span>
                  <span className="text-2xl font-extrabold text-white font-mono">{chadsScore}</span>
                  <span className="text-xs text-slate-400 ml-1">/ 9</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">ANNUAL ISCHEMIC STROKE</span>
                  <span className="text-xl font-extrabold text-rose-400 font-mono">{chadsRecommendation.strokeRisk}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {chadsRecommendation.text}
              </div>
            </div>

            {/* Dedicated 2024 ESC Class I DOAC Prescribing Guide Panel */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Class I DOAC Prescribing Guide</h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Live eGFR {chadsState.egfr} mL/min
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Apixaban */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {doacRegimens.apixaban.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {doacRegimens.apixaban.classRank}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">Calculated Dose:</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      doacRegimens.apixaban.status === 'contraindicated'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : doacRegimens.apixaban.status === 'reduced'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {doacRegimens.apixaban.dose}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {doacRegimens.apixaban.note}
                  </p>
                </div>

                {/* 2. Rivaroxaban */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {doacRegimens.rivaroxaban.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {doacRegimens.rivaroxaban.classRank}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">Calculated Dose:</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      doacRegimens.rivaroxaban.status === 'contraindicated'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : doacRegimens.rivaroxaban.status === 'reduced'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {doacRegimens.rivaroxaban.dose}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {doacRegimens.rivaroxaban.note}
                  </p>
                </div>

                {/* 3. Edoxaban */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {doacRegimens.edoxaban.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {doacRegimens.edoxaban.classRank}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">Calculated Dose:</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      doacRegimens.edoxaban.status === 'contraindicated'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : doacRegimens.edoxaban.status === 'reduced'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : doacRegimens.edoxaban.status === 'warning'
                        ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {doacRegimens.edoxaban.dose}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {doacRegimens.edoxaban.note}
                  </p>
                </div>

                {/* 4. Dabigatran */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {doacRegimens.dabigatran.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {doacRegimens.dabigatran.classRank}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">Calculated Dose:</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      doacRegimens.dabigatran.status === 'contraindicated'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : doacRegimens.dabigatran.status === 'reduced'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {doacRegimens.dabigatran.dose}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {doacRegimens.dabigatran.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------- */}
      {/* 2. TIMI RISK SCORE FOR UA/NSTEMI WITH ANGIOGRAPHY TIMING LOGIC */}
      {/* ----------------------------------------------------------------------------- */}
      {activeCalc === 'timi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 7-Variable Interactive Risk Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>TIMI NSTE-ACS 7-Variable Panel</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      14-Day MACE Predictor
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Predicts 14-day all-cause mortality, new or recurrent myocardial infarction, and urgent revascularization.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-2xl font-extrabold text-white">{timiScore}</span>
                  <span className="text-xs text-slate-400"> / 7 pts</span>
                </div>
              </div>

              {/* 7 Interactive Checklist Items */}
              <div className="space-y-2.5">
                {[
                  {
                    key: 'age65',
                    title: '1. Age ≥ 65 Years',
                    desc: 'Biological vulnerability marker; increases risk of extensive multivessel disease and plaque vulnerability.',
                    pts: '+1',
                  },
                  {
                    key: 'cadRiskFactors',
                    title: '2. ≥ 3 Traditional CAD Risk Factors',
                    desc: 'Hypertension, hypercholesterolemia, diabetes mellitus, current cigarette smoker, or confirmed family history of premature CAD.',
                    pts: '+1',
                  },
                  {
                    key: 'knownCad',
                    title: '3. Known Coronary Artery Disease (CAD)',
                    desc: 'Prior cardiac catheterization demonstrating coronary artery lumen diameter stenosis ≥ 50%.',
                    pts: '+1',
                  },
                  {
                    key: 'aspirinUse',
                    title: '4. Aspirin Use in Past 7 Days',
                    desc: 'Pathophysiologic hallmark of plaque rupture and thrombus formation refractory to baseline platelet inhibition.',
                    pts: '+1',
                  },
                  {
                    key: 'severeAngina',
                    title: '5. Severe Anginal Episodes (≥ 2 in 24h)',
                    desc: '≥ 2 distinct episodes of severe resting or crescendo chest discomfort occurring within the preceding 24 hours.',
                    pts: '+1',
                  },
                  {
                    key: 'stDeviation',
                    title: '6. ST-Segment Deviation ≥ 0.5 mm on ECG',
                    desc: 'Horizontal or downsloping ST-segment depression ≥ 0.5 mm, or transient ST elevation during symptomatic episodes.',
                    pts: '+1',
                  },
                  {
                    key: 'elevatedMarkers',
                    title: '7. Elevated Cardiac Biomarkers',
                    desc: 'Serum high-sensitivity cardiac Troponin I (hs-cTnI) or Troponin T (hs-cTnT) exceeding the 99th percentile URL.',
                    pts: '+1',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={(timiState as any)[item.key]}
                        onChange={(e) => setTimiState({ ...timiState, [item.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">{item.title}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400 shrink-0 ml-3">{item.pts}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Angiography Timing Logic & Urgent High Risk Alert (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Urgent Flashing High-Risk Alert Banner (Flashes when TIMI >= 5) */}
            {timiStratification.isHighRisk && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-2xl shadow-rose-950/80 space-y-3 animate-pulse">
                <div className="flex items-center gap-2.5 text-rose-200 font-extrabold text-sm tracking-wide">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>URGENT CLINICAL ALERT: EARLY INVASIVE STRATEGY</span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  Calculated TIMI score of <strong className="text-white font-mono">{timiScore}/7</strong> places patient in the <strong>High-Risk Tier (MACE: {timiStratification.maceRate})</strong>. Per 2024 ACC/AHA & ESC guidelines, immediate invasive coronary angiography within <strong>&lt; 24 hours</strong> is mandated (Class I, Level A).
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/40 text-[11px] font-mono text-rose-300 space-y-1">
                  <div>• Stat Cath Lab Notification: Primary radial access preferred</div>
                  <div>• DAPT Loading: Aspirin 300mg + Ticagrelor 180mg / Prasugrel</div>
                  <div>• Anticoagulation: Enoxaparin 1mg/kg SC or UFH infusion</div>
                </div>
              </div>
            )}

            {/* Stratification & 14-Day MACE Metric Card */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>TIMI Risk Stratification</span>
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${timiStratification.badgeClass}`}>
                  {timiStratification.riskTier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">TOTAL SCORE</span>
                  <span className="text-2xl font-extrabold text-white font-mono">{timiScore}</span>
                  <span className="text-xs text-slate-400 ml-1">/ 7 pts</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">14-DAY MACE RATE</span>
                  <span className="text-2xl font-extrabold text-rose-400 font-mono">{timiStratification.maceRate}</span>
                </div>
              </div>

              {/* Angiography Timing Decision Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Strategy Classification:</span>
                  <span className="font-bold text-white font-mono">{timiStratification.strategy}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Angiography Timing:</span>
                  <span className="font-bold text-cyan-400 font-mono">{timiStratification.timing}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                  {timiStratification.rationale}
                </p>
              </div>

              {/* TIMI Reference Scale Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden text-[11px] font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <tr>
                      <th className="py-1.5 px-3">Score</th>
                      <th className="py-1.5 px-3">Risk Tier</th>
                      <th className="py-1.5 px-3 text-right">14-Day MACE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    <tr className={timiScore <= 1 ? 'bg-emerald-950/40 font-bold text-emerald-300' : 'text-slate-400'}>
                      <td className="py-1.5 px-3">0 – 1</td>
                      <td className="py-1.5 px-3">Low</td>
                      <td className="py-1.5 px-3 text-right">4.7%</td>
                    </tr>
                    <tr className={timiScore === 2 ? 'bg-emerald-950/40 font-bold text-emerald-300' : 'text-slate-400'}>
                      <td className="py-1.5 px-3">2</td>
                      <td className="py-1.5 px-3">Low</td>
                      <td className="py-1.5 px-3 text-right">8.3%</td>
                    </tr>
                    <tr className={timiScore === 3 ? 'bg-amber-950/40 font-bold text-amber-300' : 'text-slate-400'}>
                      <td className="py-1.5 px-3">3</td>
                      <td className="py-1.5 px-3">Intermediate</td>
                      <td className="py-1.5 px-3 text-right">13.2%</td>
                    </tr>
                    <tr className={timiScore === 4 ? 'bg-amber-950/40 font-bold text-amber-300' : 'text-slate-400'}>
                      <td className="py-1.5 px-3">4</td>
                      <td className="py-1.5 px-3">Intermediate</td>
                      <td className="py-1.5 px-3 text-right">19.9%</td>
                    </tr>
                    <tr className={timiScore === 5 ? 'bg-rose-950/60 font-bold text-rose-300' : 'text-slate-400'}>
                      <td className="py-1.5 px-3">5</td>
                      <td className="py-1.5 px-3">High</td>
                      <td className="py-1.5 px-3 text-right">26.2%</td>
                    </tr>
                    <tr className={timiScore >= 6 ? 'bg-rose-950/60 font-bold text-rose-300' : 'text-slate-400'}>
                      <td className="py-1.5 px-3">6 – 7</td>
                      <td className="py-1.5 px-3">High</td>
                      <td className="py-1.5 px-3 text-right">40.9%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------- */}
      {/* 3. STEPWISE HFA-PEFF DIAGNOSTIC STRATIFICATION FRAMEWORK (HFpEF) */}
      {/* ----------------------------------------------------------------------------- */}
      {activeCalc === 'hfpeff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 3-Domain Multi-Tiered Scoring Wizard (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>HFA-PEFF Stepwise Diagnostic Algorithm</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Systematic ESC Heart Failure Association framework for diagnosing HFpEF. Max 2 points per domain (6 total).
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-2xl font-extrabold text-white">{hfaTotalScore}</span>
                  <span className="text-xs text-slate-400"> / 6 pts</span>
                </div>
              </div>

              {/* Rhythm Selector: Sinus vs AF (shifts biomarker & LAVI thresholds) */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Baseline Cardiac Rhythm</span>
                  <span className="text-[11px] text-slate-400">Atrial fibrillation elevates baseline filling pressures and natriuretic cutoffs.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHfpeffState({ ...hfpeffState, isAtrialFibrillation: false })}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                      !hfpeffState.isAtrialFibrillation
                        ? 'bg-rose-600 text-white border-rose-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Sinus Rhythm
                  </button>
                  <button
                    type="button"
                    onClick={() => setHfpeffState({ ...hfpeffState, isAtrialFibrillation: true })}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                      hfpeffState.isAtrialFibrillation
                        ? 'bg-rose-600 text-white border-rose-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Atrial Fibrillation
                  </button>
                </div>
              </div>

              {/* Domain 1: Functional Echo Doppler */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold font-mono">
                      F
                    </span>
                    <span className="text-xs font-bold text-white">Domain 1: Functional (Echo Doppler)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {hfaFunctionalPoints} / 2 pts
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hfpeffState.functionalMajor}
                      onChange={(e) => setHfpeffState({ ...hfpeffState, functionalMajor: e.target.checked, functionalMinor: e.target.checked ? false : hfpeffState.functionalMinor })}
                      className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Major Criteria (+2 pts)</span>
                      <p className="text-[11px] text-slate-400">
                        Septal e' &lt;7 cm/s or lateral e' &lt;10 cm/s AND average E/e' ratio ≥ 15, OR peak Tricuspid Regurgitation (TR) velocity &gt; 2.8 m/s (PASP &gt; 35 mmHg).
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hfpeffState.functionalMinor}
                      disabled={hfpeffState.functionalMajor}
                      onChange={(e) => setHfpeffState({ ...hfpeffState, functionalMinor: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700 mt-0.5 disabled:opacity-30"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Minor Criteria (+1 pt)</span>
                      <p className="text-[11px] text-slate-400">
                        Average E/e' ratio 9–14, OR LV Global Longitudinal Strain (GLS) &lt; 16%.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Domain 2: Morphological Remodeling */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs font-bold font-mono">
                      M
                    </span>
                    <span className="text-xs font-bold text-white">Domain 2: Morphological (Structural Remodeling)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {hfaMorphologicPoints} / 2 pts
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hfpeffState.morphologicMajor}
                      onChange={(e) => setHfpeffState({ ...hfpeffState, morphologicMajor: e.target.checked, morphologicMinor: e.target.checked ? false : hfpeffState.morphologicMinor })}
                      className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Major Criteria (+2 pts)</span>
                      <p className="text-[11px] text-slate-400">
                        Left Atrial Volume Index (LAVI) &gt; {hfpeffState.isAtrialFibrillation ? '40 mL/m² (AF)' : '34 mL/m² (Sinus)'}, OR LV Mass Index ≥ 149 g/m² (men) / ≥ 122 g/m² (women) with RWT &gt; 0.42, OR wall thickness ≥ 12 mm.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hfpeffState.morphologicMinor}
                      disabled={hfpeffState.morphologicMajor}
                      onChange={(e) => setHfpeffState({ ...hfpeffState, morphologicMinor: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700 mt-0.5 disabled:opacity-30"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Minor Criteria (+1 pt)</span>
                      <p className="text-[11px] text-slate-400">
                        LAVI {hfpeffState.isAtrialFibrillation ? '34–40 mL/m²' : '29–34 mL/m²'}, OR LVMI ≥ 115 g/m² (men) / ≥ 95 g/m² (women), OR Relative Wall Thickness (RWT) &gt; 0.42 without marked mass elevation.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Domain 3: Biomarkers (Natriuretic Peptides) */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold font-mono">
                      B
                    </span>
                    <span className="text-xs font-bold text-white">Domain 3: Biomarkers (NT-proBNP / BNP)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {hfaBiomarkerPoints} / 2 pts
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hfpeffState.biomarkerMajor}
                      onChange={(e) => setHfpeffState({ ...hfpeffState, biomarkerMajor: e.target.checked, biomarkerMinor: e.target.checked ? false : hfpeffState.biomarkerMinor })}
                      className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Major Criteria (+2 pts)</span>
                      <p className="text-[11px] text-slate-400">
                        {hfpeffState.isAtrialFibrillation 
                          ? 'In Atrial Fibrillation: NT-proBNP > 660 pg/mL (or BNP > 240 pg/mL).'
                          : 'In Sinus Rhythm: NT-proBNP > 220 pg/mL (or BNP > 80 pg/mL).'}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hfpeffState.biomarkerMinor}
                      disabled={hfpeffState.biomarkerMajor}
                      onChange={(e) => setHfpeffState({ ...hfpeffState, biomarkerMinor: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-500 bg-slate-950 border-slate-700 mt-0.5 disabled:opacity-30"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Minor Criteria (+1 pt)</span>
                      <p className="text-[11px] text-slate-400">
                        {hfpeffState.isAtrialFibrillation 
                          ? 'In Atrial Fibrillation: NT-proBNP 365–660 pg/mL (or BNP 105–240 pg/mL).'
                          : 'In Sinus Rhythm: NT-proBNP 125–220 pg/mL (or BNP 35–80 pg/mL).'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Diagnostic Probability & Stepwise Pathway (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Probability Output Card */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  <span>Diagnostic Stratification</span>
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${hfaInterpretation.scoreBadge}`}>
                  {hfaTotalScore >= 5 ? 'Score ≥ 5' : hfaTotalScore >= 2 ? 'Score 2–4' : 'Score ≤ 1'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-mono block">FUNCTIONAL</span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">{hfaFunctionalPoints}</span>
                  <span className="text-[10px] text-slate-500">/2</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-mono block">MORPHOLOGIC</span>
                  <span className="text-lg font-extrabold text-cyan-400 font-mono">{hfaMorphologicPoints}</span>
                  <span className="text-[10px] text-slate-500">/2</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-mono block">BIOMARKER</span>
                  <span className="text-lg font-extrabold text-amber-400 font-mono">{hfaBiomarkerPoints}</span>
                  <span className="text-[10px] text-slate-500">/2</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-200">
                  Clinical Diagnosis: <strong className="text-white">{hfaInterpretation.status}</strong>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {hfaInterpretation.recommendation}
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Required Next Step:</span>
                  <span className="font-mono font-bold text-cyan-400">{hfaInterpretation.nextStep}</span>
                </div>
              </div>

              {/* Recommended Actions Checklist */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-300 block">Guideline Action Items:</span>
                <div className="space-y-1.5">
                  {hfaInterpretation.actions.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stepwise Reference Architecture */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 text-xs text-slate-400 space-y-2">
              <span className="font-bold text-slate-200 block">The 4-Step HFA-PEFF Framework (ESC):</span>
              <div className="space-y-1 text-[11px] font-mono">
                <div>• <strong className="text-slate-300">Step 1:</strong> Pre-test Assessment (Dyspnea, signs/symptoms, ECG, Echo LVEF ≥ 50%)</div>
                <div>• <strong className="text-slate-300">Step 2:</strong> Diagnostic Score (Functional, Morphological, Biomarkers: 0-6 pts)</div>
                <div>• <strong className="text-slate-300">Step 3:</strong> Functional Testing in Uncertainty (Diastolic Exercise Stress Echo / RHC)</div>
                <div>• <strong className="text-slate-300">Step 4:</strong> Final Etiological Workup (Amyloidosis, Hypertrophic, Fabry, CAD)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
