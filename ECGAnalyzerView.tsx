import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  Cpu, 
  AlertCircle, 
  FileCheck2, 
  CheckCircle2, 
  Grid, 
  MoveHorizontal, 
  MoveVertical, 
  Crosshair, 
  Info, 
  HeartPulse, 
  User, 
  ShieldAlert,
  Sliders,
  Sparkles,
  Link,
  Target
} from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';

export type LeadName = 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6';

export type WaveShape = 
  | 'normal' 
  | 'stemi_anterior' 
  | 'stemi_inferior' 
  | 'afib' 
  | 'vt' 
  | 'av_block_3' 
  | 'wpw' 
  | 'hyperkalemia'
  | 'long_qt'
  | 'lbbb'
  | 'lvh_strain'
  | 'pericarditis';

export interface RhythmPreset {
  id: string;
  name: string;
  category: string;
  rate: number;
  pr: number;
  qrs: number;
  qt: number;
  axis: string;
  stSegment: string;
  leadsAffected: string[];
  description: string;
  waveShape: WaveShape;
  pathophysiology: string;
}

export const RHYTHM_PRESETS: RhythmPreset[] = [
  {
    id: 'normal-sinus',
    name: 'Normal Sinus Rhythm (NSR)',
    category: 'Normal Baseline',
    rate: 72,
    pr: 160,
    qrs: 88,
    qt: 390,
    axis: '+55° (Normal Axis)',
    stSegment: 'Isoelectric ST segment; normal physiologic T-wave vector aligned with QRS.',
    leadsAffected: [],
    description: 'Each P wave followed by normal narrow QRS complex; textbook dipole conduction.',
    waveShape: 'normal',
    pathophysiology: 'Normal cardiac depolarization originating at SA node, progressing through AV node, His-Purkinje network, and ventricles.',
  },
  {
    id: 'stemi-anterior',
    name: 'Acute Anterior STEMI (LAD Occlusion)',
    category: 'Ischemia / ACS',
    rate: 98,
    pr: 155,
    qrs: 98,
    qt: 430,
    axis: '+30° (Normal Axis)',
    stSegment: 'Severe J-point 3.5mm to 6.0mm convex ST elevation (tombstoning) in V1-V4 with reciprocal horizontal ST depression in II, III, aVF.',
    leadsAffected: ['V1', 'V2', 'V3', 'V4', 'II', 'III', 'aVF'],
    description: 'Acute thrombotic occlusion of Proximal LAD. Massive transmural anteroseptal and apical ischemia.',
    waveShape: 'stemi_anterior',
    pathophysiology: 'Transmural ischemic injury current causing monophasic tombstoning ST-T fusion waves in anteroseptal precordial leads and reciprocal injury vector depression in inferior leads.',
  },
  {
    id: 'stemi-inferior',
    name: 'Acute Inferior STEMI (RCA Occlusion)',
    category: 'Ischemia / ACS',
    rate: 64,
    pr: 190,
    qrs: 94,
    qt: 420,
    axis: '+110° (Right Axis Deviation)',
    stSegment: 'Marked ST elevation in inferior leads (II, III, aVF) with reciprocal horizontal ST depression in high lateral leads (I, aVL).',
    leadsAffected: ['II', 'III', 'aVF', 'I', 'aVL'],
    description: 'Right Coronary Artery (RCA) occlusion. High risk of AV block and RV infarction (check V4R).',
    waveShape: 'stemi_inferior',
    pathophysiology: 'Inferior wall epicardial injury vector directed downward and rightward toward leads II, III, and aVF, casting reciprocal injury vectors toward I and aVL.',
  },
  {
    id: 'severe-hyperkalemia',
    name: 'Severe Hyperkalemia (K⁺ = 7.4 mEq/L)',
    category: 'Metabolic Emergency',
    rate: 62,
    pr: 220,
    qrs: 145,
    qt: 450,
    axis: '+40° (Normal)',
    stSegment: 'Tall, narrow, tented symmetrical peaked T-waves across precordium; flattened P-waves; widened QRS complex.',
    leadsAffected: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'II', 'III'],
    description: 'Urgent membrane stabilization needed (IV Calcium Gluconate) to prevent sine-wave arrest or VF.',
    waveShape: 'hyperkalemia',
    pathophysiology: 'Accelerated Phase 3 repolarization due to altered myocyte potassium conductance producing narrow tented T waves; depression of Phase 0 conduction widening QRS.',
  },
  {
    id: 'long-qt-torsades',
    name: 'Acquired Long QT & Torsades Risk',
    category: 'Arrhythmia Risk',
    rate: 54,
    pr: 170,
    qrs: 92,
    qt: 540,
    axis: '+45° (Normal)',
    stSegment: 'Marked QT prolongation (>500ms) with bifid, notched T-U wave fusion; dangerous R-on-T vulnerability.',
    leadsAffected: ['II', 'V4', 'V5', 'V6'],
    description: 'Drug-induced or electrolyte-mediated hERG K+ channel blockade. High risk of Torsades de Pointes.',
    waveShape: 'long_qt',
    pathophysiology: 'Impaired IKr potassium rectifier current prolongs ventricular action potential duration, promoting early afterdepolarizations (EADs) and polymorphic VT.',
  },
  {
    id: 'afib-rvr',
    name: 'Atrial Fibrillation with RVR',
    category: 'Arrhythmia',
    rate: 135,
    pr: 0,
    qrs: 90,
    qt: 340,
    axis: '+45° (Normal)',
    stSegment: 'Irregularly irregular baseline with fine fibrillatory (f) waves; absence of discrete P-waves.',
    leadsAffected: ['All Leads'],
    description: 'Rapid ventricular response due to disorganized chaotic atrial firing. Risk of thromboembolism.',
    waveShape: 'afib',
    pathophysiology: 'Multiple re-entrant wavelets in left and right atria discharging at 400-600 bpm, with variable decremental AV nodal conduction producing chaotic RR intervals.',
  },
  {
    id: 'monomorphic-vt',
    name: 'Sustained Monomorphic Ventricular Tachycardia',
    category: 'Malignant Arrhythmia',
    rate: 175,
    pr: 0,
    qrs: 168,
    qt: 490,
    axis: '-90° (Extreme Northwest Axis)',
    stSegment: 'Broad, bizarre, concordant monomorphic QRS complexes (>160ms) with discordant secondary ST-T waves and AV dissociation.',
    leadsAffected: ['All Leads'],
    description: 'Medical emergency. Assess pulse immediately: synchronized cardioversion if unstable, antiarrhythmics if stable.',
    waveShape: 'vt',
    pathophysiology: 'Ventricular myocardial scar re-entry circuit propagating outside the specialized His-Purkinje system, creating wide, slow ventricular activation.',
  },
  {
    id: 'complete-heart-block',
    name: 'Third-Degree (Complete) AV Block',
    category: 'Conduction Block',
    rate: 38,
    pr: 0,
    qrs: 134,
    qt: 510,
    axis: '+15° (Normal)',
    stSegment: 'Regular sinus P-waves (rate 85 bpm) marching through completely independent of slow wide escape rhythm (rate 38 bpm).',
    leadsAffected: ['All Leads'],
    description: 'Complete AV dissociation. High risk of syncope (Stokes-Adams attack). Urgent transvenous pacing.',
    waveShape: 'av_block_3',
    pathophysiology: 'Total anatomic or functional interruption of impulse transmission from atria to ventricles; ventricles driven by an idioventricular or junctional escape pacemaker.',
  },
  {
    id: 'lvh-strain',
    name: 'Severe LVH with Secondary Strain Pattern',
    category: 'Chamber Hypertrophy',
    rate: 70,
    pr: 190,
    qrs: 106,
    qt: 435,
    axis: '-15° (Leftward)',
    stSegment: 'Deep S-wave in V1-V2, massive tall R-wave in V5-V6 (>35mm combined); asymmetrical downsloping ST depression and inverted T-waves in lateral leads (I, aVL, V5-V6).',
    leadsAffected: ['I', 'aVL', 'V1', 'V2', 'V5', 'V6'],
    description: 'Severe left ventricular pressure overload (e.g., Aortic Stenosis, Chronic Hypertension).',
    waveShape: 'lvh_strain',
    pathophysiology: 'Increased left ventricular wall thickness generates massive electrical dipole vectors; subendocardial relative ischemia creates repolarization strain patterns.',
  },
  {
    id: 'pericarditis-acute',
    name: 'Acute Viral Pericarditis (Stage 1)',
    category: 'Pericardial Disease',
    rate: 88,
    pr: 165,
    qrs: 88,
    qt: 400,
    axis: '+50° (Normal)',
    stSegment: 'Diffuse concave upward ST-segment elevation across limb and precordial leads with PR segment depression; reciprocal PR elevation and ST depression in aVR.',
    leadsAffected: ['I', 'II', 'aVF', 'V2', 'V3', 'V4', 'V5', 'V6', 'aVR'],
    description: 'Widespread subepicardial inflammation of pericardium; distinguishes from localized STEMI by lack of reciprocal ST depression.',
    waveShape: 'pericarditis',
    pathophysiology: 'Superficial epicardial myocarditis causing widespread current of injury, alongside atrial subepicardial injury causing PR segment displacement.',
  }
];

// Physical calibration constants
// Standard Paper Speed: 25 mm/s (1s = 25mm, 1 large box = 5mm = 0.20s = 200ms, 1 small box = 1mm = 0.04s = 40ms)
// Standard Voltage Gain: 10 mm/mV (1mV = 10mm, 1 large box = 5mm = 0.5mV, 1 small box = 1mm = 0.1mV)
const PIXELS_PER_MM = 4; // 1mm = 4px, 5mm large box = 20px, 10mm = 40px

interface LeadVectorConfig {
  lead: LeadName;
  angleDeg: number;
  anatomicRegion: string;
  primaryCoronary: string;
  description: string;
}

const LEAD_VECTOR_METADATA: Record<LeadName, LeadVectorConfig> = {
  I: { lead: 'I', angleDeg: 0, anatomicRegion: 'High Lateral Wall', primaryCoronary: 'Circumflex / Diagonal', description: 'Bipolar limb lead (Right Arm - to Left Arm +).' },
  II: { lead: 'II', angleDeg: 60, anatomicRegion: 'Inferior Wall (Apex)', primaryCoronary: 'Right Coronary Artery (RCA)', description: 'Bipolar limb lead aligned with normal ventricular cardiac axis (+60°).' },
  III: { lead: 'III', angleDeg: 120, anatomicRegion: 'Inferior Wall', primaryCoronary: 'Right Coronary Artery (RCA)', description: 'Bipolar limb lead (Left Arm - to Left Leg +).' },
  aVR: { lead: 'aVR', angleDeg: -150, anatomicRegion: 'Cavity / Basal Septum', primaryCoronary: 'Left Main / Global Ischemia', description: 'Augmented unipolar lead looking directly into the cardiac cavity; all deflections normally negative.' },
  aVL: { lead: 'aVL', angleDeg: -30, anatomicRegion: 'High Lateral Wall', primaryCoronary: 'Circumflex / LAD diagonal', description: 'Augmented unipolar lead facing the left upper ventricular wall.' },
  aVF: { lead: 'aVF', angleDeg: 90, anatomicRegion: 'Inferior Wall', primaryCoronary: 'Right Coronary Artery (RCA)', description: 'Augmented unipolar lead facing the inferior diaphragmatic surface.' },
  V1: { lead: 'V1', angleDeg: 120, anatomicRegion: 'Septal Wall / RV', primaryCoronary: 'Proximal LAD (Septal perforators)', description: '4th ICS right sternal border. Normal rS pattern (small r, deep S).' },
  V2: { lead: 'V2', angleDeg: 90, anatomicRegion: 'Septal Wall', primaryCoronary: 'Proximal LAD (Septal perforators)', description: '4th ICS left sternal border. Classic rS pattern, highly sensitive to anterior STEMI.' },
  V3: { lead: 'V3', angleDeg: 60, anatomicRegion: 'Anterior Transition Zone', primaryCoronary: 'Mid LAD', description: 'Midway between V2 and V4. Transition zone where R and S waves are equiphasic.' },
  V4: { lead: 'V4', angleDeg: 45, anatomicRegion: 'Anterior / Apical Wall', primaryCoronary: 'Mid/Distal LAD', description: '5th ICS left midclavicular line. Normal Rs complex; apex of left ventricle.' },
  V5: { lead: 'V5', angleDeg: 20, anatomicRegion: 'Low Lateral Wall', primaryCoronary: 'Distal LAD / Circumflex', description: '5th ICS left anterior axillary line. Dominant tall R wave (qR pattern).' },
  V6: { lead: 'V6', angleDeg: 0, anatomicRegion: 'Low Lateral Wall', primaryCoronary: 'Circumflex / Diagonal', description: '5th ICS left midaxillary line. Dominant tall R wave, upright T wave.' },
};

export const ECGAnalyzerView: React.FC = () => {
  const { patient } = usePatientContext();

  // State definitions
  const [selectedPreset, setSelectedPreset] = useState<RhythmPreset>(RHYTHM_PRESETS[0]);
  const [selectedLead, setSelectedLead] = useState<LeadName>('II');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sweepSpeed, setSweepSpeed] = useState<number>(25); // mm/s (Standard 25, Alternate 50)
  const [amplitude, setAmplitude] = useState<number>(10); // mm/mV (Standard 10, Half 5, Double 20)
  const [showCalipers, setShowCalipers] = useState<boolean>(true);
  const [is12LeadOverview, setIs12LeadOverview] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Caliper interval targets and values
  const [caliperTarget, setCaliperTarget] = useState<'QT' | 'PR' | 'QRS' | 'FREE'>('QT');
  const [caliperPR, setCaliperPR] = useState<number>(selectedPreset.pr);
  const [caliperQRS, setCaliperQRS] = useState<number>(selectedPreset.qrs);
  const [caliperQT, setCaliperQT] = useState<number>(selectedPreset.qt);

  // Interactive on-canvas caliper drag coordinates (pixels relative to canvas)
  const [caliperX1, setCaliperX1] = useState<number>(140);
  const [caliperX2, setCaliperX2] = useState<number>(300);
  const [caliperY1, setCaliperY1] = useState<number>(100);
  const [caliperY2, setCaliperY2] = useState<number>(220);
  const [draggingHandle, setDraggingHandle] = useState<'X1' | 'X2' | 'Y1' | 'Y2' | null>(null);

  // Canvas and animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Auto-synchronize preset when active patient changes
  useEffect(() => {
    if (patient) {
      const match = RHYTHM_PRESETS.find(p => {
        if (patient.id === 'pt-001' && p.id === 'stemi-anterior') return true;
        if (patient.id === 'pt-003' && p.id === 'long-qt-torsades') return true;
        if (patient.id === 'pt-004' && p.id === 'lvh-strain') return true;
        if (patient.id === 'pt-005' && p.id === 'pericarditis-acute') return true;
        return false;
      });

      if (match) {
        setSelectedPreset(match);
        setCaliperPR(patient.ecgSummary?.prInterval || match.pr);
        setCaliperQRS(patient.ecgSummary?.qrsDuration || match.qrs);
        setCaliperQT(patient.ecgSummary?.qtc ? Math.round(patient.ecgSummary.qtc * 0.9) : match.qt);
        if (match.id === 'stemi-anterior') {
          setSelectedLead('V2'); // Default to hallmark tombstone lead
        } else if (match.id === 'stemi-inferior') {
          setSelectedLead('II'); // Default to inferior lead
        }
      }
    }
  }, [patient]);

  // Sync intervals whenever preset changes
  useEffect(() => {
    setCaliperPR(selectedPreset.pr);
    setCaliperQRS(selectedPreset.qrs);
    setCaliperQT(selectedPreset.qt);
    setAiReport(null);

    // Reposition calipers conveniently on the center of the screen
    const defaultWidth = canvasRef.current?.width || 800;
    const center = defaultWidth / 2;
    // Map selectedPreset.qt to pixel width: qt(ms) * (speed / 1000) * PIXELS_PER_MM
    const pxDelta = Math.max(40, Math.min(280, (selectedPreset.qt / 1000) * sweepSpeed * PIXELS_PER_MM));
    setCaliperX1(Math.round(center - pxDelta / 2));
    setCaliperX2(Math.round(center + pxDelta / 2));
  }, [selectedPreset, sweepSpeed]);

  // Derived physiological calculations: Bazett, Fridericia, and Framingham QTc
  const currentHeartRate = selectedPreset.rate;
  const rrSeconds = 60 / Math.max(currentHeartRate, 25);
  
  // Bazett Formula: QTc = QT / sqrt(RR in seconds)
  const qtcBazett = useMemo(() => {
    if (caliperQT <= 0 || rrSeconds <= 0) return 0;
    return Math.round(caliperQT / Math.sqrt(rrSeconds));
  }, [caliperQT, rrSeconds]);

  // Fridericia Formula: QTc = QT / (RR in seconds)^(1/3)
  const qtcFridericia = useMemo(() => {
    if (caliperQT <= 0 || rrSeconds <= 0) return 0;
    return Math.round(caliperQT / Math.cbrt(rrSeconds));
  }, [caliperQT, rrSeconds]);

  // Framingham Formula: QTc = QT + 0.154 * (1 - RR in seconds) in seconds converted to ms
  const qtcFramingham = useMemo(() => {
    if (caliperQT <= 0 || rrSeconds <= 0) return 0;
    return Math.round(caliperQT + 154 * (1 - rrSeconds));
  }, [caliperQT, rrSeconds]);

  // Clinical QTc Risk Assessment
  const qtcStatus = useMemo(() => {
    const isFemale = patient?.gender === 'female';
    const prolongedCutoff = isFemale ? 470 : 450;
    const borderlineCutoff = isFemale ? 450 : 440;

    if (qtcBazett >= 500) {
      return {
        level: 'CRITICAL',
        badge: 'CRITICAL: Severe QTc Prolongation (≥500 ms)',
        color: 'bg-red-950 text-red-300 border-red-500',
        detail: 'High danger of R-on-T degeneration into polymorphic Ventricular Tachycardia (Torsades de Pointes). Stop all QT-prolonging medications; replete K⁺ > 4.5 mEq/L and Mg²⁺ > 2.0 mg/dL.'
      };
    }
    if (qtcBazett > prolongedCutoff) {
      return {
        level: 'PROLONGED',
        badge: `Prolonged QTc (> ${prolongedCutoff} ms)`,
        color: 'bg-amber-950 text-amber-300 border-amber-500',
        detail: `Exceeds ACC/AHA gender threshold (> ${prolongedCutoff} ms for ${isFemale ? 'females' : 'males'}). Increased arrhythmogenic risk requiring cardiac telemetry monitoring.`
      };
    }
    if (qtcBazett >= borderlineCutoff) {
      return {
        level: 'BORDERLINE',
        badge: `Borderline QTc (${borderlineCutoff}–${prolongedCutoff} ms)`,
        color: 'bg-yellow-950 text-yellow-300 border-yellow-500',
        detail: 'Upper limit of normal. Exercise caution when combining macrolides, fluoroquinolones, psychotropics, or antiemetics.'
      };
    }
    return {
      level: 'NORMAL',
      badge: 'Normal QTc Conduction (≤440 ms)',
      color: 'bg-emerald-950 text-emerald-300 border-emerald-500',
      detail: 'Ventricular repolarization interval is within standard physiologic boundaries.'
    };
  }, [qtcBazett, patient?.gender]);

  // Real-time canvas measurement delta calculation
  // Exact coordinate mapping: pxDiff / (PIXELS_PER_MM * sweepSpeed) * 1000
  const measuredTimeDeltaMs = useMemo(() => {
    const pxDiff = Math.abs(caliperX2 - caliperX1);
    const mm = pxDiff / PIXELS_PER_MM;
    const seconds = mm / sweepSpeed;
    return Math.round(seconds * 1000);
  }, [caliperX1, caliperX2, sweepSpeed]);

  const measuredVoltageDeltaMv = useMemo(() => {
    const pxDiff = Math.abs(caliperY2 - caliperY1);
    const mm = pxDiff / PIXELS_PER_MM;
    const mv = mm / amplitude;
    return Number(mv.toFixed(2));
  }, [caliperY1, caliperY2, amplitude]);

  // Expected J-point shift for the selected lead and preset (in mm and mV)
  const jPointMetrics = useMemo(() => {
    const shape = selectedPreset.waveShape;
    let shiftMv = 0;

    if (shape === 'stemi_anterior') {
      if (selectedLead === 'V1') shiftMv = 0.35;
      else if (selectedLead === 'V2') shiftMv = 0.55;
      else if (selectedLead === 'V3') shiftMv = 0.60;
      else if (selectedLead === 'V4') shiftMv = 0.45;
      else if (selectedLead === 'V5') shiftMv = 0.18;
      else if (selectedLead === 'V6') shiftMv = 0.08;
      else if (selectedLead === 'II') shiftMv = -0.22;
      else if (selectedLead === 'III') shiftMv = -0.28;
      else if (selectedLead === 'aVF') shiftMv = -0.25;
      else if (selectedLead === 'aVR') shiftMv = 0.12;
    } else if (shape === 'stemi_inferior') {
      if (selectedLead === 'II') shiftMv = 0.42;
      else if (selectedLead === 'III') shiftMv = 0.52;
      else if (selectedLead === 'aVF') shiftMv = 0.46;
      else if (selectedLead === 'I') shiftMv = -0.26;
      else if (selectedLead === 'aVL') shiftMv = -0.32;
      else if (selectedLead === 'V1' || selectedLead === 'V2') shiftMv = -0.12;
    } else if (shape === 'pericarditis') {
      if (selectedLead === 'aVR') shiftMv = -0.15;
      else shiftMv = 0.18;
    } else if (shape === 'lvh_strain') {
      if (selectedLead === 'V5' || selectedLead === 'V6' || selectedLead === 'I' || selectedLead === 'aVL') {
        shiftMv = -0.18;
      }
    }

    const shiftMm = Number((shiftMv * 10).toFixed(1)); // 1mV = 10mm
    return {
      shiftMv,
      shiftMm,
      isElevation: shiftMm >= 1.0,
      isDepression: shiftMm <= -1.0,
      isIsoelectric: Math.abs(shiftMm) < 1.0,
    };
  }, [selectedPreset.waveShape, selectedLead]);

  // Lead-Specific Vector Projection & Waveform Distortion Engine
  // Transforms cardiac cycle phase t in [0, 1) into exact millivolt deflections for the active lead & clinical state
  const computeLeadDeflection = useCallback((
    t: number,
    lead: LeadName,
    shape: WaveShape,
    cycleIndex: number
  ): number => {
    // Standard Lead Projections (Einthoven's triangle & Precordial axis progression)
    let pAmp = 0.15; // mV
    let qAmp = -0.05; // mV
    let rAmp = 1.0; // mV
    let sAmp = -0.2; // mV
    let stOffset = 0.0; // mV
    let tAmp = 0.3; // mV
    let tInverted = false;
    let wideQrsFactor = 1.0;
    let deltaWave = false;

    // 1. Base Anatomical Vector Projections (Normal Sinus Baseline)
    switch (lead) {
      case 'I':
        pAmp = 0.12; qAmp = -0.05; rAmp = 0.85; sAmp = -0.15; tAmp = 0.25;
        break;
      case 'II':
        // Maximum positive QRS in normal +60° axis
        pAmp = 0.18; qAmp = -0.08; rAmp = 1.45; sAmp = -0.25; tAmp = 0.38;
        break;
      case 'III':
        pAmp = 0.08; qAmp = -0.10; rAmp = 0.65; sAmp = -0.35; tAmp = 0.16;
        break;
      case 'aVR':
        // Cavitary lead: completely inverted P-QRS-T complex!
        pAmp = -0.15; qAmp = 0.08; rAmp = -0.15; sAmp = -1.10; tAmp = -0.28; tInverted = true;
        break;
      case 'aVL':
        pAmp = 0.07; qAmp = -0.04; rAmp = 0.60; sAmp = -0.20; tAmp = 0.18;
        break;
      case 'aVF':
        pAmp = 0.14; qAmp = -0.06; rAmp = 1.05; sAmp = -0.22; tAmp = 0.28;
        break;
      case 'V1':
        // Precordial septal: small r, deep S (rS pattern)
        pAmp = 0.08; qAmp = 0.0; rAmp = 0.25; sAmp = -1.25; tAmp = 0.15;
        break;
      case 'V2':
        // Septal: small r, prominent deep S (rS pattern)
        pAmp = 0.10; qAmp = 0.0; rAmp = 0.40; sAmp = -1.55; tAmp = 0.35;
        break;
      case 'V3':
        // Transition zone: equiphasic RS (R ~= S)
        pAmp = 0.12; qAmp = -0.04; rAmp = 0.90; sAmp = -0.90; tAmp = 0.42;
        break;
      case 'V4':
        // Anterior / apex: dominant tall R (Rs pattern)
        pAmp = 0.14; qAmp = -0.06; rAmp = 1.45; sAmp = -0.30; tAmp = 0.45;
        break;
      case 'V5':
        // Lateral: tall R, small q (qR pattern)
        pAmp = 0.13; qAmp = -0.10; rAmp = 1.60; sAmp = -0.18; tAmp = 0.38;
        break;
      case 'V6':
        // Lateral: tall R, small q (qR pattern)
        pAmp = 0.12; qAmp = -0.08; rAmp = 1.30; sAmp = -0.12; tAmp = 0.30;
        break;
    }

    // 2. Ischemic Vector Logic & Dynamic Pathology Morphing
    if (shape === 'stemi_anterior') {
      // Acute Anterior STEMI (LAD Occlusion):
      // Leads V1, V2, V3, and V4 MUST display severe J-point ST-segment elevation (2mm to 5mm tombstoning curves).
      // Inferior leads (II, III, aVF) MUST simultaneously project reciprocal horizontal ST-segment depression.
      if (lead === 'V1') {
        rAmp = 0.20; sAmp = -0.30; stOffset = 0.35; tAmp = 0.55; // 3.5mm ST elevation
      } else if (lead === 'V2') {
        rAmp = 0.35; sAmp = -0.15; stOffset = 0.55; tAmp = 0.85; // 5.5mm Tombstoning ST elevation
      } else if (lead === 'V3') {
        rAmp = 0.45; sAmp = -0.10; stOffset = 0.60; tAmp = 0.90; // 6.0mm Tombstoning ST elevation
      } else if (lead === 'V4') {
        rAmp = 0.65; sAmp = -0.15; stOffset = 0.45; tAmp = 0.70; // 4.5mm ST elevation
      } else if (lead === 'V5') {
        stOffset = 0.18; tAmp = 0.50; // Mild lateral ST elevation
      } else if (lead === 'V6') {
        stOffset = 0.08; tAmp = 0.35;
      } else if (lead === 'II') {
        // Reciprocal horizontal ST depression in inferior leads!
        stOffset = -0.22; tAmp = -0.15; tInverted = true;
      } else if (lead === 'III') {
        // Reciprocal horizontal ST depression!
        stOffset = -0.28; tAmp = -0.20; tInverted = true;
      } else if (lead === 'aVF') {
        // Reciprocal horizontal ST depression!
        stOffset = -0.25; tAmp = -0.18; tInverted = true;
      } else if (lead === 'aVR') {
        stOffset = 0.12; // Reciprocal aVR ST elevation
      } else if (lead === 'I' || lead === 'aVL') {
        stOffset = 0.08;
      }
    } else if (shape === 'stemi_inferior') {
      // Acute Inferior STEMI (RCA Occlusion):
      // Leads II, III, and aVF MUST render acute ST-elevation.
      // Leads I and aVL MUST render dynamic reciprocal horizontal ST-depression.
      if (lead === 'II') {
        qAmp = -0.20; rAmp = 0.95; stOffset = 0.42; tAmp = 0.75; // 4.2mm ST elevation
      } else if (lead === 'III') {
        qAmp = -0.35; rAmp = 0.70; stOffset = 0.52; tAmp = 0.85; // 5.2mm ST elevation & pathologic Q
      } else if (lead === 'aVF') {
        qAmp = -0.25; rAmp = 0.85; stOffset = 0.46; tAmp = 0.78; // 4.6mm ST elevation
      } else if (lead === 'I') {
        // Dynamic reciprocal horizontal depression in high lateral leads!
        stOffset = -0.26; tAmp = -0.18; tInverted = true;
      } else if (lead === 'aVL') {
        // Dynamic reciprocal horizontal depression!
        stOffset = -0.32; tAmp = -0.22; tInverted = true;
      } else if (lead === 'V1' || lead === 'V2') {
        stOffset = -0.12; // Posterior reciprocal depression
      } else if (lead === 'V3') {
        stOffset = -0.06;
      }
    } else if (shape === 'hyperkalemia') {
      // Hyperkalemia:
      // Morph all waveforms to display tall, symmetrically tented T-waves and flattened P-waves with widened QRS.
      pAmp = pAmp * 0.10; // Flattened / absent P wave
      wideQrsFactor = 1.45; // Widened QRS complex
      rAmp = rAmp * 0.85;
      // Tall, narrow, symmetric tented T-wave
      tAmp = Math.max(tAmp * 2.3, 0.85);
      if (lead === 'V2' || lead === 'V3' || lead === 'V4') {
        tAmp = 1.40; // Peak tented T-wave in mid-precordial leads
      }
    } else if (shape === 'long_qt') {
      tAmp = 0.45;
    } else if (shape === 'lvh_strain') {
      if (lead === 'V1') {
        rAmp = 0.20; sAmp = -2.60; // Deep S in V1
      } else if (lead === 'V2') {
        rAmp = 0.30; sAmp = -2.90;
      } else if (lead === 'V5') {
        rAmp = 2.80; sAmp = -0.10; stOffset = -0.18; tAmp = -0.28; tInverted = true; // LV Strain
      } else if (lead === 'V6') {
        rAmp = 2.40; sAmp = -0.10; stOffset = -0.16; tAmp = -0.24; tInverted = true;
      } else if (lead === 'I' || lead === 'aVL') {
        stOffset = -0.15; tAmp = -0.20; tInverted = true;
      }
    } else if (shape === 'pericarditis') {
      if (lead === 'aVR') {
        pAmp = -0.15; stOffset = -0.15; // PR elevation, ST depression in aVR
      } else {
        stOffset = 0.18; // Diffuse concave ST elevation
      }
    } else if (shape === 'wpw') {
      deltaWave = true;
      wideQrsFactor = 1.35;
    }

    // 3. Mathematical Waveform Synthesis across cardiac cycle phase t
    let dy = 0;

    // Specialized Arrhythmia Generators
    if (shape === 'afib') {
      const fWave = Math.sin(t * 38 * Math.PI + cycleIndex * 1.7) * 0.07 + 
                    Math.cos(t * 72 * Math.PI) * 0.05;
      dy = fWave;
      if (t >= 0.30 && t < 0.34) {
        dy += rAmp * Math.sin(((t - 0.30) / 0.04) * Math.PI);
      } else if (t >= 0.34 && t < 0.38) {
        dy += sAmp * Math.sin(((t - 0.34) / 0.04) * Math.PI);
      } else if (t >= 0.44 && t < 0.64) {
        dy += tAmp * Math.sin(((t - 0.44) / 0.20) * Math.PI);
      }
      return dy;
    }

    if (shape === 'vt') {
      const vtPolarity = (lead === 'V1' || lead === 'V2' || lead === 'aVR') ? -1 : 1;
      dy = vtPolarity * 1.4 * Math.sin(t * 2 * Math.PI);
      if (t > 0.45 && t < 0.85) {
        dy -= vtPolarity * 0.35 * Math.sin(((t - 0.45) / 0.40) * Math.PI);
      }
      return dy;
    }

    if (shape === 'av_block_3') {
      const pPhase = (t * 2.25) % 1;
      if (pPhase >= 0.15 && pPhase < 0.27) {
        dy += pAmp * Math.sin(((pPhase - 0.15) / 0.12) * Math.PI);
      }
      if (t >= 0.38 && t < 0.52) {
        dy += rAmp * 0.8 * Math.sin(((t - 0.38) / 0.14) * Math.PI);
      } else if (t >= 0.52 && t < 0.58) {
        dy += sAmp * 1.1 * Math.sin(((t - 0.52) / 0.06) * Math.PI);
      } else if (t >= 0.65 && t < 0.85) {
        dy += tAmp * 0.7 * Math.sin(((t - 0.65) / 0.20) * Math.PI);
      }
      return dy;
    }

    // Dynamic QRS boundary calculation based on widening factor
    const qrsStart = 0.28;
    const rDuration = 0.05 * wideQrsFactor;
    const sDuration = 0.05 * wideQrsFactor;
    const jPointPhase = qrsStart + 0.03 + rDuration + sDuration;

    // Standard P Wave
    if (t >= 0.10 && t < 0.20) {
      const pTheta = (t - 0.10) / 0.10;
      dy = pAmp * Math.sin(pTheta * Math.PI);
    } 
    // PR Segment
    else if (t >= 0.20 && t < qrsStart) {
      if (shape === 'pericarditis' && lead !== 'aVR') {
        dy = -0.06; // PR segment depression
      } else if (shape === 'pericarditis' && lead === 'aVR') {
        dy = +0.06; // PR segment elevation in aVR
      } else {
        dy = 0;
      }
    }
    // Delta Wave (WPW Pre-excitation)
    else if (deltaWave && t >= 0.24 && t < qrsStart + 0.03) {
      const deltaTheta = (t - 0.24) / 0.07;
      dy = (rAmp * 0.4) * deltaTheta;
    }
    // Q Wave
    else if (t >= qrsStart && t < qrsStart + 0.03) {
      const qTheta = (t - qrsStart) / 0.03;
      dy = qAmp * Math.sin(qTheta * Math.PI);
    }
    // R Wave
    else if (t >= qrsStart + 0.03 && t < qrsStart + 0.03 + rDuration) {
      const rTheta = (t - (qrsStart + 0.03)) / rDuration;
      dy = rAmp * Math.sin(rTheta * Math.PI);
    }
    // S Wave
    else if (t >= qrsStart + 0.03 + rDuration && t < jPointPhase) {
      const sTheta = (t - (qrsStart + 0.03 + rDuration)) / sDuration;
      dy = sAmp * Math.sin(sTheta * Math.PI);
    }
    // ST Segment & T Wave (Beginning strictly at J-Point)
    else if (t >= jPointPhase && t < 0.76) {
      if (shape === 'stemi_anterior' && (lead === 'V1' || lead === 'V2' || lead === 'V3' || lead === 'V4')) {
        // High-takeoff tombstone monophasic curve
        const stTheta = (t - jPointPhase) / (0.76 - jPointPhase);
        dy = stOffset + tAmp * Math.sin(stTheta * Math.PI);
      } else if (shape === 'stemi_inferior' && (lead === 'II' || lead === 'III' || lead === 'aVF')) {
        // Hyperacute inferior ST-T dome
        const stTheta = (t - jPointPhase) / (0.76 - jPointPhase);
        dy = stOffset + tAmp * Math.sin(stTheta * Math.PI);
      } else if (shape === 'hyperkalemia') {
        // Peaked, narrow, symmetrically tented T-wave
        const centerT = 0.58;
        const widthT = 0.075;
        if (Math.abs(t - centerT) < widthT) {
          const tentTheta = (t - (centerT - widthT)) / (2 * widthT);
          // High power exponent creates sharp symmetrical tented peak
          dy = tAmp * Math.pow(Math.sin(tentTheta * Math.PI), 2.5);
        } else {
          dy = 0;
        }
      } else if (shape === 'long_qt') {
        const lqtTheta = (t - jPointPhase) / (0.76 - jPointPhase);
        if (lqtTheta >= 0 && lqtTheta <= 1) {
          dy = tAmp * (Math.sin(lqtTheta * Math.PI) + 0.35 * Math.sin(lqtTheta * 2 * Math.PI));
        }
      } else {
        // Standard ST segment running into T-wave
        const tStartPhase = jPointPhase + 0.09;
        if (t < tStartPhase) {
          dy = stOffset;
        } else {
          const tTheta = (t - tStartPhase) / (0.76 - tStartPhase);
          const tComponent = (tInverted ? -tAmp : tAmp) * Math.sin(tTheta * Math.PI);
          dy = stOffset + tComponent;
        }
      }
    }

    return dy;
  }, []);

  // Main 60fps Canvas Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 360 * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = '360px';
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      // Deep telemetry dark background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Draw standard ECG millivolt calibration grid
      drawTelemetryGrid(ctx, w, h);

      // Draw standard 1mV calibration pulse on left margin
      drawCalibrationPulse(ctx, h, amplitude);

      // Draw main physiological lead-specific wave trace
      drawLeadTrace(
        ctx, 
        w, 
        h, 
        selectedLead, 
        selectedPreset.waveShape, 
        selectedPreset.rate, 
        phaseRef.current, 
        amplitude, 
        sweepSpeed
      );

      // Draw interactive mechanical calipers if enabled
      if (showCalipers) {
        drawMechanicalCalipers(
          ctx, 
          w, 
          h, 
          caliperX1, 
          caliperX2, 
          caliperY1, 
          caliperY2, 
          measuredTimeDeltaMs, 
          measuredVoltageDeltaMv
        );
      }

      // Advance wave sweep phase if live
      if (isPlaying) {
        const speedIncrement = (selectedPreset.rate / 60) * (sweepSpeed / 25) * 0.0035;
        phaseRef.current = (phaseRef.current + speedIncrement) % 1000;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    selectedPreset, 
    selectedLead, 
    isPlaying, 
    sweepSpeed, 
    amplitude, 
    showCalipers, 
    caliperX1, 
    caliperX2, 
    caliperY1, 
    caliperY2, 
    measuredTimeDeltaMs, 
    measuredVoltageDeltaMv,
    computeLeadDeflection
  ]);

  // Standard ECG Paper Matrix Drawing Function
  // 1 small box = 1mm = 0.04s / 0.1mV (PIXELS_PER_MM px)
  // 1 large box = 5mm = 0.20s / 0.5mV (5 * PIXELS_PER_MM px)
  const drawTelemetryGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const smallBoxPx = PIXELS_PER_MM;
    const largeBoxPx = PIXELS_PER_MM * 5;

    // Minor grid lines (1mm)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.08)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += smallBoxPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += smallBoxPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Major grid lines (5mm = 0.20s / 0.5mV)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.22)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += largeBoxPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += largeBoxPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Isoelectric baseline (0 mV)
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.38)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  };

  // Standard clinical 10 mm/mV (1.0 mV) calibration step pulse
  const drawCalibrationPulse = (ctx: CanvasRenderingContext2D, h: number, gainMmPerMv: number) => {
    const baselineY = h / 2;
    const pulseHeightPx = gainMmPerMv * PIXELS_PER_MM;
    const startX = 16;
    const stepWidth = 20;

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(startX, baselineY);
    ctx.lineTo(startX + 8, baselineY);
    ctx.lineTo(startX + 8, baselineY - pulseHeightPx);
    ctx.lineTo(startX + 8 + stepWidth, baselineY - pulseHeightPx);
    ctx.lineTo(startX + 8 + stepWidth, baselineY);
    ctx.lineTo(startX + 8 + stepWidth + 8, baselineY);
    ctx.stroke();

    ctx.fillStyle = '#7dd3fc';
    ctx.font = '9px monospace';
    ctx.fillText('1.0 mV', startX + 4, baselineY - pulseHeightPx - 6);
    ctx.restore();
  };

  // Draw continuous lead trace across canvas
  const drawLeadTrace = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    lead: LeadName,
    shape: WaveShape,
    rate: number,
    phase: number,
    gainMmPerMv: number,
    speedMmPerSec: number
  ) => {
    const baselineY = h / 2;
    const mvToPx = gainMmPerMv * PIXELS_PER_MM;
    const pixelsPerSecond = speedMmPerSec * PIXELS_PER_MM;
    const cycleLengthPx = pixelsPerSecond / (rate / 60);

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2.4;
    
    // Choose trace color based on acute ischemic elevation vs standard telemetry cyan
    const isAcuteElevation = (shape === 'stemi_anterior' && (lead === 'V1' || lead === 'V2' || lead === 'V3' || lead === 'V4')) ||
                            (shape === 'stemi_inferior' && (lead === 'II' || lead === 'III' || lead === 'aVF'));
    const isReciprocalDepression = (shape === 'stemi_anterior' && (lead === 'II' || lead === 'III' || lead === 'aVF')) ||
                                  (shape === 'stemi_inferior' && (lead === 'I' || lead === 'aVL'));

    if (isAcuteElevation) {
      ctx.strokeStyle = '#ff2b55'; // High-visibility crimson for active transmural injury
      ctx.shadowColor = 'rgba(255, 43, 85, 0.7)';
      ctx.shadowBlur = 8;
    } else if (isReciprocalDepression) {
      ctx.strokeStyle = '#f59e0b'; // Amber for reciprocal depression
      ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 6;
    } else {
      ctx.strokeStyle = '#38bdf8'; // High-contrast telemetry cyan
      ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
      ctx.shadowBlur = 6;
    }

    const sampleStep = 2;
    let isFirst = true;

    for (let x = 0; x < w; x += sampleStep) {
      const continuousTheta = (x / cycleLengthPx) + phase;
      const cycleIndex = Math.floor(continuousTheta);
      const t = continuousTheta % 1;

      const mvDeflection = computeLeadDeflection(t, lead, shape, cycleIndex);
      const y = baselineY - (mvDeflection * mvToPx);

      if (isFirst) {
        ctx.moveTo(x, y);
        isFirst = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  };

  // Draw interactive mechanical measurement calipers with crosshairs & HUD readout
  const drawMechanicalCalipers = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    x1: number,
    x2: number,
    y1: number,
    y2: number,
    timeMs: number,
    voltageMv: number
  ) => {
    ctx.save();

    // Vertical Time Calipers (T1 & T2)
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#f59e0b'; // Amber-Gold
    
    ctx.beginPath();
    ctx.moveTo(x1, 0);
    ctx.lineTo(x1, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, 0);
    ctx.lineTo(x2, h);
    ctx.stroke();

    ctx.setLineDash([]);

    // T1 & T2 drag handles
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
    ctx.shadowBlur = 6;

    [x1, x2].forEach((x, idx) => {
      ctx.beginPath();
      ctx.arc(x, 24, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, h - 24, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#060a12';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(idx === 0 ? 'T1' : 'T2', x - 5, 27);
      ctx.fillText(idx === 0 ? 'T1' : 'T2', x - 5, h - 21);
      ctx.fillStyle = '#f59e0b';
    });

    // Time Caliper Horizontal Span Bar with Arrowheads
    const spanY = 48;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(minX, spanY);
    ctx.lineTo(maxX, spanY);
    ctx.moveTo(minX + 6, spanY - 4);
    ctx.lineTo(minX, spanY);
    ctx.lineTo(minX + 6, spanY + 4);
    ctx.moveTo(maxX - 6, spanY - 4);
    ctx.lineTo(maxX, spanY);
    ctx.lineTo(maxX - 6, spanY + 4);
    ctx.stroke();

    // Time HUD Badge
    const midX = (x1 + x2) / 2;
    ctx.fillStyle = 'rgba(6, 10, 18, 0.9)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.fillRect(midX - 52, spanY - 14, 104, 22);
    ctx.strokeRect(midX - 52, spanY - 14, 104, 22);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Δt: ${timeMs} ms`, midX, spanY + 1);

    // Horizontal Voltage Calipers (V1 & V2)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ec4899'; // Rose
    
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(w, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y2);
    ctx.lineTo(w, y2);
    ctx.stroke();

    ctx.setLineDash([]);

    // V1 & V2 Side Handles
    ctx.fillStyle = '#ec4899';
    [y1, y2].forEach((y, idx) => {
      ctx.beginPath();
      ctx.arc(w - 24, y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#060a12';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(idx === 0 ? 'V1' : 'V2', w - 29, y + 3);
      ctx.fillStyle = '#ec4899';
    });

    // Voltage Span Bar
    const spanX = w - 48;
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spanX, minY);
    ctx.lineTo(spanX, maxY);
    ctx.moveTo(spanX - 4, minY + 6);
    ctx.lineTo(spanX, minY);
    ctx.lineTo(spanX + 4, minY + 6);
    ctx.moveTo(spanX - 4, maxY - 6);
    ctx.lineTo(spanX, maxY);
    ctx.lineTo(spanX + 4, maxY - 6);
    ctx.stroke();

    // Voltage HUD Badge
    const midY = (y1 + y2) / 2;
    ctx.fillStyle = 'rgba(6, 10, 18, 0.9)';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.fillRect(spanX - 52, midY - 11, 104, 22);
    ctx.strokeRect(spanX - 52, midY - 11, 104, 22);

    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ΔV: ${voltageMv} mV`, spanX, midY + 4);

    ctx.restore();
  };

  // Canvas Mouse & Touch Drag Event Handlers with Continuous Dynamic Caliper Feed
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCalipers || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const threshold = 16;

    if (Math.abs(mouseX - caliperX1) < threshold) {
      setDraggingHandle('X1');
    } else if (Math.abs(mouseX - caliperX2) < threshold) {
      setDraggingHandle('X2');
    } else if (Math.abs(mouseY - caliperY1) < threshold) {
      setDraggingHandle('Y1');
    } else if (Math.abs(mouseY - caliperY2) < threshold) {
      setDraggingHandle('Y2');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCalipers || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const threshold = 16;
    if (Math.abs(mouseX - caliperX1) < threshold || Math.abs(mouseX - caliperX2) < threshold) {
      canvasRef.current.style.cursor = 'col-resize';
    } else if (Math.abs(mouseY - caliperY1) < threshold || Math.abs(mouseY - caliperY2) < threshold) {
      canvasRef.current.style.cursor = 'row-resize';
    } else {
      canvasRef.current.style.cursor = draggingHandle ? 'grabbing' : 'crosshair';
    }

    if (!draggingHandle) return;

    let newX1 = caliperX1;
    let newX2 = caliperX2;

    if (draggingHandle === 'X1') {
      newX1 = Math.max(10, Math.min(rect.width - 10, mouseX));
      setCaliperX1(newX1);
    } else if (draggingHandle === 'X2') {
      newX2 = Math.max(10, Math.min(rect.width - 10, mouseX));
      setCaliperX2(newX2);
    } else if (draggingHandle === 'Y1') {
      setCaliperY1(Math.max(10, Math.min(rect.height - 10, mouseY)));
    } else if (draggingHandle === 'Y2') {
      setCaliperY2(Math.max(10, Math.min(rect.height - 10, mouseY)));
    }

    // Dynamic Live Feed: If actively dragging horizontal calipers, continuously recalculate interval!
    if (draggingHandle === 'X1' || draggingHandle === 'X2') {
      const pxDiff = Math.abs(newX2 - newX1);
      const mm = pxDiff / PIXELS_PER_MM;
      const seconds = mm / sweepSpeed;
      const updatedDeltaMs = Math.round(seconds * 1000);

      if (caliperTarget === 'QT') {
        setCaliperQT(updatedDeltaMs);
      } else if (caliperTarget === 'PR') {
        setCaliperPR(updatedDeltaMs);
      } else if (caliperTarget === 'QRS') {
        setCaliperQRS(updatedDeltaMs);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingHandle(null);
  };

  // One-click caliper measurement assignment
  const applyCaliperToPR = () => {
    setCaliperPR(measuredTimeDeltaMs);
  };

  const applyCaliperToQRS = () => {
    setCaliperQRS(measuredTimeDeltaMs);
  };

  const applyCaliperToQT = () => {
    setCaliperQT(measuredTimeDeltaMs);
  };

  // AI Electrophysiology Consultation Call
  const handleAnalyzeECG = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ecg-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecgParameters: {
            heartRate: selectedPreset.rate,
            rhythm: selectedPreset.name,
            prInterval: caliperPR,
            qrsDuration: caliperQRS,
            qtc: qtcBazett,
            axis: selectedPreset.axis,
            stSegment: selectedPreset.stSegment,
            leadsAffected: selectedPreset.leadsAffected,
            additionalFindings: `${selectedPreset.description} Lead analyzed: Lead ${selectedLead} (${LEAD_VECTOR_METADATA[selectedLead].anatomicRegion}). Measured Fridericia QTc: ${qtcFridericia} ms. Measured ST shift: ${jPointMetrics.shiftMm} mm.`,
          },
          patientContext: {
            id: patient?.id,
            name: patient?.name,
            age: patient?.age,
            gender: patient?.gender,
            chiefComplaint: patient?.chiefComplaint,
            vitals: patient?.vitals,
            labs: patient?.labs,
            echoSummary: patient?.echoSummary
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiReport(data.ecgInterpretation);
      } else {
        setAiReport(data.ecgInterpretation || 'Unable to complete AI interpretation.');
      }
    } catch (err) {
      console.error('ECG analysis error:', err);
      setAiReport('Failed to connect to electrophysiology server. Local heuristic calculations active.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentVector = LEAD_VECTOR_METADATA[selectedLead];

  return (
    <div className="space-y-6">
      {/* Top Header & Telemetry Configuration Banner */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              12-Lead Electrophysiology Vector Simulator & Caliper Engine
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              60 FPS Vector Canvas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Dynamic lead-specific cardiac dipole projection, standard 25 mm/s & 10 mm/mV paper calibration, mechanical calipers, and synchronized dual Bazett & Fridericia QTc calculators.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Freeze Telemetry' : 'Resume Live Sweep'}</span>
          </button>

          <button
            onClick={() => setShowCalipers(!showCalipers)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              showCalipers 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle on-canvas mechanical calipers"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{showCalipers ? 'Calipers Active' : 'Show Calipers'}</span>
          </button>

          <button
            onClick={() => setIs12LeadOverview(!is12LeadOverview)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              is12LeadOverview 
                ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-900/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle 12-lead simultaneous matrix"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{is12LeadOverview ? '12-Lead Grid (On)' : '12-Lead Matrix'}</span>
          </button>

          <button
            onClick={handleAnalyzeECG}
            disabled={isAnalyzing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-rose-900/40 border border-rose-400/40 disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isAnalyzing ? 'Analyzing Vector...' : 'AI Lead Consultation'}</span>
          </button>
        </div>
      </div>

      {/* Patient & Preset Case Synchronization Bar */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-rose-400" />
          <span className="text-slate-400">Active Patient Profile:</span>
          <strong className="text-white font-semibold">{patient?.name || 'Arthur P.'} ({patient?.age || 58}y {patient?.gender || 'male'})</strong>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 italic truncate max-w-md">{patient?.chiefComplaint || 'Acute chest pain'}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 font-mono">Heart Rate:</span>
          <span className="font-bold text-emerald-400 font-mono">{selectedPreset.rate} bpm</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono">RR Interval:</span>
          <span className="font-bold text-sky-400 font-mono">{Math.round(rrSeconds * 1000)} ms</span>
        </div>
      </div>

      {/* Clinical Rhythm Presets Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Diagnostic Vector Patterns (Click to Load):
          </span>
          <span className="text-[11px] text-slate-400">
            Selected: <strong className="text-white">{selectedPreset.name}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {RHYTHM_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset);
                  if (preset.id === 'stemi-anterior') setSelectedLead('V2');
                  else if (preset.id === 'stemi-inferior') setSelectedLead('II');
                  else if (preset.id === 'severe-hyperkalemia') setSelectedLead('V3');
                }}
                className={`text-xs px-3 py-2 rounded-xl whitespace-nowrap transition-all border font-medium flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950/50 font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {preset.category === 'Ischemia / ACS' && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                {preset.category === 'Metabolic Emergency' && <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />}
                {preset.category === 'Normal Baseline' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 12-Lead Simultaneous Matrix Overview (Optional 3x4 layout toggle) */}
      {is12LeadOverview && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/30 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Simultaneous 12-Lead Vector Matrix (Standard 3x4 Layout)</h3>
            </div>
            <span className="text-xs text-slate-400">Click any lead to focus high-resolution calipers</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'] as LeadName[]).map((lead) => {
              const isSelected = selectedLead === lead;
              const meta = LEAD_VECTOR_METADATA[lead];
              const isLeadInjured = selectedPreset.leadsAffected.includes(lead);
              return (
                <button
                  key={lead}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-sky-950/80 border-sky-400 shadow-md shadow-sky-950/50'
                      : isLeadInjured
                      ? 'bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/30'
                      : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${isSelected ? 'text-sky-300' : isLeadInjured ? 'text-rose-400' : 'text-slate-200'}`}>
                      Lead {lead}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{meta.angleDeg}°</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">{meta.anatomicRegion}</span>
                  {isLeadInjured && (
                    <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Injury Vector
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Single-Lead Caliper & Telemetry Canvas Screen */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl relative overflow-hidden space-y-3">
        {/* Monitor Telemetry Controls & Lead Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          {/* 12 Lead Switcher Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono font-semibold mr-1">Lead:</span>
            <div className="flex flex-wrap gap-1">
              {(['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'] as LeadName[]).map((lead) => {
                const isSelected = selectedLead === lead;
                const isAffected = selectedPreset.leadsAffected.includes(lead);
                return (
                  <button
                    key={lead}
                    onClick={() => setSelectedLead(lead)}
                    className={`text-xs font-mono px-2 py-1 rounded-lg transition-all border ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-md shadow-sky-500/30'
                        : isAffected
                        ? 'bg-rose-950/60 text-rose-300 border-rose-500/50 hover:bg-rose-900/60'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {lead}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Telemetry Calibration Settings */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Speed:</span>
              <button
                onClick={() => setSweepSpeed(25)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${sweepSpeed === 25 ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                25 mm/s
              </button>
              <button
                onClick={() => setSweepSpeed(50)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${sweepSpeed === 50 ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                50 mm/s
              </button>
            </div>

            {/* Gain Selector */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Gain:</span>
              {[5, 10, 20].map((g) => (
                <button
                  key={g}
                  onClick={() => setAmplitude(g)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${amplitude === g ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  {g === 5 ? '0.5x' : g === 10 ? '1.0x (10mm/mV)' : '2.0x'}
                </button>
              ))}
            </div>

            {/* Electrical Axis */}
            <div className="hidden lg:flex items-center gap-1 text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <span>Axis:</span>
              <span className="text-white font-bold">{selectedPreset.axis}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Anatomic Lead & Vector Description Banner */}
        <div className="bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sky-400">Lead {selectedLead}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-200">{currentVector.anatomicRegion} ({currentVector.angleDeg}°)</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400 italic">Culprit: {currentVector.primaryCoronary}</span>
          </div>
          <p className="text-[11px] text-slate-400">{currentVector.description}</p>
        </div>

        {/* 60 FPS Telemetry Canvas */}
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#060a12] select-none shadow-inner">
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full h-[360px] block"
          />

          {/* Top-Left Lead Badge */}
          <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-400 font-mono text-sm">LEAD {selectedLead}</span>
              <span className="text-slate-400 font-mono">| {selectedPreset.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Standard 25 mm/s • 10 mm/mV Matrix
            </div>
          </div>

          {/* Top-Right J-Point Elevation/Depression Indicator Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {jPointMetrics.isElevation && (
              <div className="bg-rose-950/90 text-rose-300 border border-rose-500/60 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/60 animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>J-POINT: +{jPointMetrics.shiftMm} mm ({jPointMetrics.shiftMv} mV) ST ELEVATION</span>
              </div>
            )}
            {jPointMetrics.isDepression && (
              <div className="bg-amber-950/90 text-amber-300 border border-amber-500/60 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/60">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>J-POINT: {jPointMetrics.shiftMm} mm RECIPROCAL ST DEPRESSION</span>
              </div>
            )}
            {selectedPreset.waveShape === 'hyperkalemia' && (
              <div className="bg-amber-950/90 text-amber-300 border border-amber-500/60 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/60 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>TENTED PEAKED T-WAVE</span>
              </div>
            )}
          </div>

          {/* Caliper HUD Overlay Bar (Bottom Canvas) */}
          {showCalipers && (
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <MoveHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Time Caliper: <strong className="text-amber-300 font-bold">{measuredTimeDeltaMs} ms</strong></span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <MoveVertical className="w-3.5 h-3.5 text-pink-400" />
                  <span>Voltage Caliper: <strong className="text-pink-300 font-bold">{measuredVoltageDeltaMv} mV</strong></span>
                </span>
              </div>

              {/* Dynamic Caliper Binding Target Mode */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" />
                  <span>Auto-feed:</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                  <button
                    onClick={() => {
                      setCaliperTarget('QT');
                      setCaliperQT(measuredTimeDeltaMs);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      caliperTarget === 'QT' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Live QTc drag feed (Bazett & Fridericia update continuously)"
                  >
                    QT (Live QTc)
                  </button>
                  <button
                    onClick={() => {
                      setCaliperTarget('PR');
                      setCaliperPR(measuredTimeDeltaMs);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      caliperTarget === 'PR' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PR
                  </button>
                  <button
                    onClick={() => {
                      setCaliperTarget('QRS');
                      setCaliperQRS(measuredTimeDeltaMs);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      caliperTarget === 'QRS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    QRS
                  </button>
                  <button
                    onClick={() => setCaliperTarget('FREE')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      caliperTarget === 'FREE' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Free
                  </button>
                </div>

                {/* Quick Manual Assignment Buttons */}
                <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                  <button
                    onClick={applyCaliperToPR}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-mono border border-slate-700 transition-all"
                  >
                    Set PR
                  </button>
                  <button
                    onClick={applyCaliperToQRS}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-mono border border-slate-700 transition-all"
                  >
                    Set QRS
                  </button>
                  <button
                    onClick={applyCaliperToQT}
                    className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/50 transition-all"
                  >
                    Set QT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Caliper Interval Slots & Bi-Directional Form */}
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* PR Interval */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">PR Interval</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={caliperPR}
                onChange={(e) => setCaliperPR(Number(e.target.value))}
                className="w-16 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 font-mono text-sm font-bold text-sky-400 focus:outline-none focus:border-sky-500"
              />
              <span className="text-xs text-slate-400 font-mono">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {caliperPR === 0 ? 'Absent / Dissociated' : caliperPR > 200 ? '1° AV Block (>200ms)' : caliperPR < 120 ? 'Pre-excitation / WPW' : 'Normal: 120-200ms'}
            </span>
          </div>

          {/* QRS Duration */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">QRS Duration</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={caliperQRS}
                onChange={(e) => setCaliperQRS(Number(e.target.value))}
                className={`w-16 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 font-mono text-sm font-bold ${caliperQRS > 120 ? 'text-rose-400' : 'text-emerald-400'} focus:outline-none focus:border-emerald-500`}
              />
              <span className="text-xs text-slate-400 font-mono">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {caliperQRS > 120 ? 'Widened QRS (>120ms)' : 'Normal Narrow (<120ms)'}
            </span>
          </div>

          {/* Measured Raw QT */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Raw QT Interval</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                value={caliperQT}
                onChange={(e) => setCaliperQT(Number(e.target.value))}
                className="w-16 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 font-mono text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-400 font-mono">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Start of Q to end of T wave</span>
          </div>

          {/* Bazett QTc */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 relative">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">QTc (Bazett)</span>
            <div className="flex items-center gap-1 mt-1">
              <span className={`font-mono text-base font-extrabold ${qtcBazett >= 500 ? 'text-red-400' : qtcBazett > 460 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {qtcBazett}
              </span>
              <span className="text-xs text-slate-400 font-mono">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">QT / √(RR in sec)</span>
          </div>

          {/* Fridericia QTc */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">QTc (Fridericia)</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="font-mono text-base font-extrabold text-indigo-300">
                {qtcFridericia}
              </span>
              <span className="text-xs text-slate-400 font-mono">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">QT / ∛(RR in sec)</span>
          </div>

          {/* Anatomic Territory */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Affected Leads</span>
            <div className="mt-1 font-mono text-xs text-rose-300 font-bold truncate">
              {selectedPreset.leadsAffected.length > 0 ? selectedPreset.leadsAffected.join(', ') : 'None (Diffuse)'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Coronary ischemia distribution</span>
          </div>
        </div>
      </div>

      {/* Dual Bazett & Fridericia QTc Comparative Clinical Analysis Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-white text-base">
              Synchronized Bazett & Fridericia QTc Analysis Framework
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${qtcStatus.color}`}>
            {qtcStatus.badge}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {qtcStatus.detail}
        </p>

        {/* Side-by-Side Dual Mathematical Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Bazett Card */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-sky-300 font-mono">1. Bazett Formula (1920)</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                Traditional Standard
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
              QTc = QT / √(RR) = {caliperQT} / √({rrSeconds.toFixed(3)}) = <strong className="text-white">{qtcBazett} ms</strong>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              <strong>Clinical Limitation:</strong> Heavily overcorrects at elevated heart rates (tachycardia) and undercorrects at bradycardia. Often creates false-positive QTc alerts during sinus tachycardia.
            </p>
          </div>

          {/* Fridericia Card */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 space-y-2 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-300 font-mono">2. Fridericia Formula (1920)</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                ACC / FDA Recommended
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
              QTc = QT / ∛(RR) = {caliperQT} / ∛({rrSeconds.toFixed(3)}) = <strong className="text-white">{qtcFridericia} ms</strong>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              <strong>Clinical Strength:</strong> Employs the cube root of RR. Far superior stability at extremes of heart rate. Required by FDA and pharmaceutical clinical trials for evaluating drug-induced repolarization toxicity.
            </p>
          </div>

          {/* Framingham Linear Card */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-300 font-mono">3. Framingham Linear Formula</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Epidemiological
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
              QTc = QT + 154 × (1 - RR) = {caliperQT} + 154 × (1 - {rrSeconds.toFixed(2)}) = <strong className="text-white">{qtcFramingham} ms</strong>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              <strong>Clinical Utility:</strong> Linear regression model validated across large population cohorts. Highly robust across normal adult physiological ranges (60–100 bpm).
            </p>
          </div>
        </div>
      </div>

      {/* Pathophysiology & Bedside pearls */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400" />
          <h4 className="text-sm font-bold text-white">Electrophysiological Mechanism & Pathophysiology</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {selectedPreset.pathophysiology}
        </p>
      </div>

      {/* AI Electrophysiological Consultation Report */}
      {aiReport && (
        <div className="bg-slate-900/90 rounded-2xl border border-rose-500/40 p-5 sm:p-6 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-white text-base">
                CardioPulse AI Electrophysiology & Vectorcardiography Consultation
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Analyzed on Lead {selectedLead} + Global Spatial Dipole
            </span>
          </div>

          <div className="text-slate-200 text-xs sm:text-sm whitespace-pre-line prose prose-invert max-w-none leading-relaxed prose-headings:text-rose-300 prose-headings:font-bold prose-strong:text-white">
            {aiReport}
          </div>
        </div>
      )}
    </div>
  );
};
