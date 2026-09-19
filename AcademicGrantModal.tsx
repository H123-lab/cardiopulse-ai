import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Printer,
  Download,
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
  Activity,
  Award
} from 'lucide-react';
import type { EchoPreset } from './EchoSimulatorView';

interface AcademicGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset?: EchoPreset;
  hemodynamics?: {
    calculatedEF: number;
    strokeVolumeMl: number;
    cardiacOutputLMin: number;
    cardiacIndex: number;
  };
  heartRate?: number;
  ischemiaDurationMinutes?: number;
  fourSegments?: {
    basalSeptal: { score: number; scoreLabel: string; excursion: number; thickening: number };
    midSeptal: { score: number; scoreLabel: string; excursion: number; thickening: number };
    apicalSeptal: { score: number; scoreLabel: string; excursion: number; thickening: number };
    lateral: { score: number; scoreLabel: string; excursion: number; thickening: number };
  };
  calculatedWMSI?: number;
  patient?: any;
}

export const AcademicGrantModal: React.FC<AcademicGrantModalProps> = ({
  isOpen,
  onClose,
  preset,
  hemodynamics,
  heartRate = 64,
  ischemiaDurationMinutes = 35,
  fourSegments,
  calculatedWMSI,
  patient,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'formatted' | 'raw'>('formatted');

  if (!isOpen) return null;

  const effPreset = preset || ({
    name: 'Acute Anterior STEMI (LAD Occlusion)',
    expectedLVEF: 38,
    edv: 135,
    esv: 84,
    wmsi: 2.25,
    mrSeverity: 'Moderate',
    valvularFindings: 'Ischemic leaflet tethering with moderate regurgitation',
    clinicalSignificance: 'Immediate primary percutaneous coronary intervention indicated',
    coronaryArtery: 'Proximal Left Anterior Descending (LAD) Artery',
  } as any);

  const effHemo = hemodynamics || {
    calculatedEF: 38,
    strokeVolumeMl: 51,
    cardiacOutputLMin: 3.26,
    cardiacIndex: 1.72,
  };

  const effFour = fourSegments || {
    basalSeptal: { score: 1, scoreLabel: 'Normal / Collateral Reserve', excursion: 1.0, thickening: 1.0 },
    midSeptal: { score: 3, scoreLabel: 'Akinetic', excursion: 0.05, thickening: 0.05 },
    apicalSeptal: { score: 3, scoreLabel: 'Akinetic (Frozen)', excursion: 0.04, thickening: 0.04 },
    lateral: { score: 1, scoreLabel: 'Hyperdynamic Compensatory', excursion: 1.35, thickening: 1.35 },
  };

  const effWmsi = calculatedWMSI ?? 2.0;

  const patientName = patient?.name || 'Elena V.';
  const patientAge = patient?.age || 34;
  const patientGender = patient?.gender ? (String(patient.gender).toLowerCase().startsWith('f') ? 'Female' : 'Male') : 'Female';
  const sbp = patient?.vitals?.sbp || 118;
  const dbp = patient?.vitals?.dbp || 76;
  const map = Math.round((Number(sbp) + 2 * Number(dbp)) / 3);

  const isHOCM = effPreset.id === 'hocm';
  const isTamponade = effPreset.id === 'pericardial-tamponade';
  const isDissection = effPreset.id === 'aortic-dissection-type-a';
  const isFlail = effPreset.id === 'papillary-muscle-rupture';

  const grantTitle = isHOCM
    ? 'TRANSLATIONAL CHARACTERIZATION OF HYPERTROPHIC OBSTRUCTIVE CARDIOMYOPATHY (HOCM) SUB-AORTIC DYNAMICS, SYSTOLIC ANTERIOR MOTION (SAM), AND SUDDEN CARDIAC DEATH STRATIFICATION'
    : isTamponade
    ? 'MULTICENTER EVALUATION OF HIGH-FREQUENCY VECTOR ECHOCARDIOGRAPHY IN RAPID DETECTION OF ACUTE PERICARDIAL TAMPONADE AND DIASTOLIC CHAMBER COLLAPSE DYNAMICS'
    : isDissection
    ? 'HYPER-ACUTE MULTIMODAL DETECTION OF AORTIC ROOT DISSECTION FLAP KINEMATICS AND RETROGRADE REGURGITANT FLUID DYNAMICS IN STANFORD TYPE A DISSECTION'
    : isFlail
    ? 'TRANSLATIONAL MAPPING OF POST-INFARCTION MECHANICAL COMPLICATIONS: PAPILLARY MUSCLE TRANSECTION, CATASTROPHIC COAPTATION FAILURE, AND ACUTE MR SURVEILLANCE'
    : 'TRANSLATIONAL MAPPING OF HIGH-FIDELITY VECTOR ECHOCARDIOGRAPHY AND ELECTRO-MECHANICAL ISCHEMIC COUPLING DYNAMICS IN ACUTE MYOCARDIAL INJURY';

  const chiefPresentation = isHOCM
    ? 'Severe exertional dyspnea, lightheadedness, and exertional presyncope in an active athletic subject.'
    : isTamponade
    ? 'Subacute pleuritic chest tightness progressing rapidly to air hunger, tachycardia, and profound hypotension (Beck’s triad).'
    : isDissection
    ? 'Catastrophic, tearing retrosternal chest pain radiating through to the interscapular thoracic spine with upper extremity pulse differential.'
    : isFlail
    ? 'Sudden respiratory collapse, acute flash pulmonary edema, and wide pulse pressure shock 4 days post-inferior infarction.'
    : 'Acute retrosternal ischemic discomfort radiating to left anterior thorax and jaw.';

  // Generate complete, structured NSFC academic grant submission dossier
  const dossierText = `================================================================================
NATIONAL NATURAL SCIENCE FOUNDATION OF CHINA (NSFC) / MULTICENTER TRIAL DOSSIER
PROJECT APPLICATION DOSSIER — DIVISION OF MEDICAL SCIENCES (H02: CARDIOVASCULAR SYSTEM)
TITLE: ${grantTitle}
================================================================================
Generated Date: ${new Date().toISOString().split('T')[0]} | Accreditation: IAC & ASE 17-Segment Model

--------------------------------------------------------------------------------
PART I: INDEX PATIENT BEDSIDE PHENOTYPE & CLINICAL PRESENTATION
--------------------------------------------------------------------------------
1.1 Demographics & Vital Telemetry:
  - Subject Identifier: ${patientName} (${patientAge}y ${patientGender})
  - Blood Pressure: ${sbp}/${dbp} mmHg (Mean Arterial Pressure: ${map} mmHg)
  - Resting Heart Rate: ${heartRate} BPM (${isTamponade || isFlail ? 'Compensatory sinus tachycardia' : 'Sinus rhythm, regular RR intervals'})
  - Pulse Oximetry: ${patient?.vitals?.spo2 || (isFlail || isTamponade ? 88 : 98)}% on room air
  - Body Surface Area (BSA): 1.90 m²

1.2 Presenting Symptomatology & Narrative:
  - Chief Presentation: ${chiefPresentation}
  - Active Diagnostic Preset: ${effPreset.name} (${effPreset.category || 'Cardiovascular Pathology'})
  - Presumed Culprit Anatomical Territory: ${effPreset.coronaryArtery || (isHOCM ? 'Genetic Sarcomeric Mutation (MYH7/MYBPC3)' : isTamponade ? 'Pericardial Sac & Mesothelial Cavity' : isDissection ? 'Ascending Aorta / Aortic Root' : isFlail ? 'Posteromedial Papillary Muscle (Dominant RCA/LCx)' : 'Left Anterior Descending (LAD)')}
  - Modeled Timeline: ${ischemiaDurationMinutes} minutes elapsed from acute event onset.
  - Pathophysiological Phase: ${
    isHOCM
      ? 'Dynamic LVOT Obstruction with SAM and Exercise-Induced Gradient Spike'
      : isTamponade
      ? 'Critical Intrapericardial Pressure Elevation with Diastolic Chamber Compromise and Obstructive Shock'
      : isDissection
      ? 'Transmural Aortic Intimal Tear with False Lumen Propagation and Torrential Aortic Valve Regurgitation'
      : isFlail
      ? 'Acute Papillary Muscle Head Transection with Flail Leaflet and Torrential Mitral Volume Overload'
      : ischemiaDurationMinutes <= 10
      ? 'Electro-Mechanical Lag Phase (Concordant ST deviation, sub-macroscopic mechanical preservation)'
      : ischemiaDurationMinutes <= 20
      ? 'Transitional Subendocardial Energy Failure (Progressive ATP depletion and hypokinesis)'
      : 'Transmural Infarction & Akinesis (Cellular necrosis, calcium overload, akinetic acoustic freezing)'
  }

--------------------------------------------------------------------------------
PART II: RAW ULTRASOUND TELEMETRY & QUANTITATIVE ECHOCARDIOGRAPHIC ARRAY
--------------------------------------------------------------------------------
2.1 Biplane Simpson's Volumetric Analysis:
  - Left Ventricular Ejection Fraction (LVEF): ${effHemo.calculatedEF}%
  - End-Diastolic Volume (EDV): ${effPreset.edv} mL (Indexed: ${(effPreset.edv / 1.9).toFixed(1)} mL/m²)
  - End-Systolic Volume (ESV): ${effPreset.esv} mL (Indexed: ${(effPreset.esv / 1.9).toFixed(1)} mL/m²)
  - Stroke Volume (SV): ${effHemo.strokeVolumeMl} mL
  - Cardiac Output (CO): ${effHemo.cardiacOutputLMin} L/min
  - Cardiac Index (CI): ${effHemo.cardiacIndex} L/min/m² (Normal physiological range: 2.5 - 4.0)

2.2 Regional Segmental Kinematics (ASE 17-Segment Standard Model):
  - Overall Wall Motion Score Index (WMSI): ${effWmsi.toFixed(2)} (1.00 = Normal, >1.70 = Extensive necrosis)
  - Segmental Telemetry Matrix:
    [1] Basal-Septal Wall:
        * Wall Motion Score: ${effFour.basalSeptal.score} (${effFour.basalSeptal.scoreLabel})
        * Radial Inward Excursion: ${effFour.basalSeptal.excursion.toFixed(2)}x
        * Systolic Thickening Ratio: ${(effFour.basalSeptal.thickening * 100).toFixed(1)}%
    [2] Mid-Anteroseptal Wall:
        * Wall Motion Score: ${effFour.midSeptal.score} (${effFour.midSeptal.scoreLabel})
        * Radial Inward Excursion: ${effFour.midSeptal.excursion.toFixed(2)}x
        * Systolic Thickening Ratio: ${(effFour.midSeptal.thickening * 100).toFixed(1)}%
    [3] Apical-Septal & Apex:
        * Wall Motion Score: ${effFour.apicalSeptal.score} (${effFour.apicalSeptal.scoreLabel})
        * Radial Inward Excursion: ${effFour.apicalSeptal.excursion.toFixed(2)}x
        * Systolic Thickening Ratio: ${(effFour.apicalSeptal.thickening * 100).toFixed(1)}%
    [4] Mid/Basal-Lateral Free Wall:
        * Wall Motion Score: ${effFour.lateral.score} (${effFour.lateral.scoreLabel})
        * Radial Inward Excursion: ${effFour.lateral.excursion.toFixed(2)}x
        * Systolic Thickening Ratio: ${(effFour.lateral.thickening * 100).toFixed(1)}%

2.3 Valvular & Color Doppler Telemetry:
  - Regurgitation Assessment: ${effPreset.mrSeverity}
  - Inflow E/A Ratio: ${isTamponade ? 'Pulsus paradoxus >30% respiratory delta' : '1.25'} | Medial Tissue Doppler E/e' Ratio: ${isHOCM ? '15.4' : ischemiaDurationMinutes > 20 ? '12.8' : '8.4'}
  - Valvular Coaptation Assessment: ${effPreset.valvularFindings}

--------------------------------------------------------------------------------
PART III: HIGH-SENSITIVITY BIOMARKER & KINETIC ACCELERATION MODELING
--------------------------------------------------------------------------------
3.1 Release Kinetics Dynamics:
  - Baseline hs-cTnI: ${isHOCM ? '0.008 ng/mL (Non-ischemic baseline)' : isDissection ? '0.045 ng/mL (Aortic root shear stress)' : isFlail ? '8.450 ng/mL (Acute transmural MI with papillary rupture)' : '0.012 ng/mL'} (99th percentile URL: 0.014 ng/mL)
  - Acceleration Delta: ${isFlail ? '+2.450 ng/mL/hr (Catastrophic necrosis)' : isDissection ? '+0.035 ng/mL/hr' : ischemiaDurationMinutes >= 20 ? '+0.428 ng/mL/hr (Rule-In Pathway)' : '+0.015 ng/mL/hr (Observation Window)'}
  - BNP / NT-proBNP: ${isTamponade || isFlail ? '1,840 pg/mL (Acute ventricular stretch)' : isHOCM ? '680 pg/mL (Diastolic filling pressure elevation)' : '110 pg/mL'}

--------------------------------------------------------------------------------
PART IV: PROSPECTIVE TRANSLATIONAL TRIAL PROTOCOL FOR NSFC GRANT APPLICATION
--------------------------------------------------------------------------------
4.1 Scientific Rationale & Unmet Clinical Challenge:
  ${isHOCM
    ? 'HOCM remains the leading cause of sudden cardiac death in young athletes. Dynamic subaortic obstruction caused by SAM and septal bulge is exquisitely preload-dependent. High-frame-rate 60 FPS vector speckle tracking enables quantitative micro-gradient mapping and non-invasive shear stress calculation.'
    : isTamponade
    ? 'Acute pericardial tamponade requires ultra-rapid bedside identification before fatal pulseless electrical activity (PEA) arrest occurs. Automated recognition of early-diastolic RV free wall buckling and late-diastolic RA collapse affords critical minutes for ultrasound-guided pericardiocentesis.'
    : isDissection
    ? 'Stanford Type A acute aortic dissection carries a mortality of 1-2% per hour after symptom onset. Rapid point-of-care vector TTE confirmation of root flap kinematics and acute AR severity dramatically shortens the door-to-operating-room interval.'
    : isFlail
    ? 'Post-MI papillary muscle rupture represents a lethal mechanical complication carrying >50% mortality without emergent surgical repair. Distinguishing flail leaflet with torrential MR from secondary ischemic tethering is critical for surgical activation versus medical stabilization.'
    : 'Traditional management relies on delayed serological markers or static 12-lead ECGs. The critical "electro-mechanical lag phase" represents an unexploited therapeutic window where subendocardial ischemia has triggered surface electrical shifts while macroscopic contractility remains temporarily salvageable.'
  }

4.2 Mechanistic Hypotheses:
  - Hypothesis 1: ${isHOCM ? 'Real-time vector Doppler tracking of LVOT velocity-time integral predicts resting gradients >50 mmHg with an AUC of 0.96.' : isTamponade ? 'Automated chamber contour edge detection identifies diastolic RA/RV collapse 14 minutes earlier than conventional blood pressure paradoxus measurement.' : isDissection ? 'High-frequency echogenic intimal boundary tracking detects root dissection flaps with >98% sensitivity compared with multi-detector contrast CT.' : isFlail ? 'Chaotic systolic LA leaflet excursion mapping differentiates flail leaflet from functional ischemic MR with 99% specificity.' : 'Real-time regional radial excursion tracking detects acute transmural ischemia with an AUC of 0.94, outperforming conventional door-to-balloon triage by an average of 38.4 minutes.'}
  - Hypothesis 2: ${isHOCM ? 'SAM leaflet contact duration correlates directly with non-sustained VT burden on 24-hour ambulatory Holter monitoring.' : isTamponade ? 'Resolution of RV diastolic collapse post-pericardiocentesis quantitatively mirrors systemic cardiac index normalization (r = 0.88).' : isDissection ? 'Aortic root true lumen collapse index predicts immediate malperfusion syndrome requiring emergent fenestration.' : isFlail ? 'Surgical revascularization combined with mitral replacement within 4 hours of flail leaflet identification reduces 30-day mortality from 62% to 18%.' : 'Preservation of basal lateral compensatory hyperkinesis (>1.20x excursion) correlates inversely with 30-day post-infarct left ventricular adverse remodeling.'}

4.3 Clinical Trial Architecture (CardioPulse-NSFC Prospective Registry):
  - Design: Prospective, multicenter, randomized controlled pragmatic trial across 8 academic heart centers.
  - Patient Cohorts:
    * Cohort A (Intervention): Vector-Echocardiography-guided rapid clinical decision protocol.
    * Cohort B (Control): Standard-of-care institutional algorithm.
  - Primary Endpoint: ${isHOCM ? 'Reduction in exercise-induced LVOT peak gradient and prevention of malignant ventricular tachyarrhythmias at 12 months.' : isTamponade ? 'Time to successful pericardiocentesis and survival to hospital discharge without secondary hypoxic encephalopathy.' : isDissection ? 'Door-to-surgical-cannulation time and 30-day all-cause operative survival.' : isFlail ? 'Survival to emergency operative repair and 90-day hemodynamic stability without end-organ dysfunction.' : 'Infarct size as a percentage of LV myocardial mass measured via contrast-enhanced Cardiac Magnetic Resonance (CMR) at 90 days post-revascularization.'}
  - Secondary Endpoints:
    1. Incidence of 30-day Major Adverse Cardiac Events (MACE: cardiovascular mortality, re-infarction, shock).
    2. Restoration of organ perfusion and normalized cardiac index (>2.2 L/min/m²).
    3. 6-Month Quality-of-Life Index (KCCQ-12 score).

4.4 Statistical Power & Sample Size Justification:
  - Targeted clinical effect size with alpha = 0.05 (two-tailed) and power = 0.90 requires 178 evaluable patients per arm (total N = 392 accounting for 10% attrition).

4.5 Expected National Strategic Innovation & Translational Impact:
  - Development of indigenous, open-source AI vector echocardiography algorithms compliant with IAC standards.
  - Transferable intellectual property for emergency room edge computing devices in primary healthcare centers.
================================================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(dossierText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([dossierText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const downloadId = effPreset.id || 'case';
    link.download = `NSFC_Grant_Dossier_${downloadId}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>NSFC Grant Submission Dossier</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                font-size: 11pt;
                line-height: 1.5;
                color: #111;
                margin: 25mm 20mm;
              }
              pre {
                white-space: pre-wrap;
                font-family: "Courier New", Courier, monospace;
                font-size: 9.5pt;
              }
            </style>
          </head>
          <body>
            <pre>${dossierText}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Academic Grant Submission Dossier
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  NSFC / NIH Format
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured translation of patient telemetry, 2D echo kinematics, and prospective trial protocol for academic funding applications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher & Action Bar */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveView('formatted')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeView === 'formatted'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structured Clinical View
            </button>
            <button
              onClick={() => setActiveView('raw')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeView === 'raw'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Text Dossier
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40 border border-indigo-400/30'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Dossier Copied!' : 'Copy Dossier'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Download text dossier file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download (.txt)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Print formatted dossier or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Dossier Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs leading-relaxed space-y-4 font-sans scrollbar-thin">
          {activeView === 'raw' ? (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap selection:bg-indigo-600 selection:text-white">
              {dossierText}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Section 1: Clinical Header & Demographics */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-sm text-white">Section 1: Bedside Vignette & Demographics</h4>
                  </div>
                  <span className="font-mono text-[11px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                    NSFC Primary Phenotype
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Subject</span>
                    <span className="font-bold text-slate-100">{patientName} ({patientAge}y {patientGender})</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Vitals</span>
                    <span className="font-bold text-slate-100">HR {heartRate} | BP {sbp}/{dbp}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Ischemia Window</span>
                    <span className="font-bold text-cyan-400 font-mono">{ischemiaDurationMinutes} minutes</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Culprit Vessel</span>
                    <span className="font-bold text-rose-400 truncate block">{effPreset.coronaryArtery}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Quantitative 2D Echo Telemetry Array */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">Section 2: Quantitative 2D Echo Telemetry Array</h4>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                    Simpson's Biplane
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">LVEF</span>
                    <span className="font-extrabold text-base text-emerald-400 font-mono">{effHemo.calculatedEF}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">EDV</span>
                    <span className="font-extrabold text-base text-slate-200 font-mono">{effPreset.edv} mL</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">ESV</span>
                    <span className="font-extrabold text-base text-slate-200 font-mono">{effPreset.esv} mL</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Stroke Vol</span>
                    <span className="font-extrabold text-base text-sky-400 font-mono">{effHemo.strokeVolumeMl} mL</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Cardiac Out</span>
                    <span className="font-extrabold text-base text-sky-400 font-mono">{effHemo.cardiacOutputLMin} L/m</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">WMSI</span>
                    <span className="font-extrabold text-base text-amber-400 font-mono">{effWmsi.toFixed(2)}</span>
                  </div>
                </div>

                {/* Segmental Matrix Table */}
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left font-mono text-[11px] border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[9px]">
                      <tr>
                        <th className="p-2">ASE Segment</th>
                        <th className="p-2">Score</th>
                        <th className="p-2">Motion Status</th>
                        <th className="p-2">Excursion</th>
                        <th className="p-2">Systolic Thickening</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="p-2 font-sans font-medium text-slate-200">Basal Septal (#1)</td>
                        <td className="p-2">{effFour.basalSeptal.score}</td>
                        <td className="p-2 text-emerald-400">{effFour.basalSeptal.scoreLabel}</td>
                        <td className="p-2">{effFour.basalSeptal.excursion.toFixed(2)}x</td>
                        <td className="p-2">{(effFour.basalSeptal.thickening * 100).toFixed(0)}%</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium text-slate-200">Mid-Septal (#2)</td>
                        <td className="p-2">{effFour.midSeptal.score}</td>
                        <td className="p-2 text-amber-400">{effFour.midSeptal.scoreLabel}</td>
                        <td className="p-2">{effFour.midSeptal.excursion.toFixed(2)}x</td>
                        <td className="p-2">{(effFour.midSeptal.thickening * 100).toFixed(0)}%</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium text-slate-200">Apical Septal & Apex (#13/#17)</td>
                        <td className="p-2">{effFour.apicalSeptal.score}</td>
                        <td className="p-2 text-rose-400">{effFour.apicalSeptal.scoreLabel}</td>
                        <td className="p-2">{effFour.apicalSeptal.excursion.toFixed(2)}x</td>
                        <td className="p-2">{(effFour.apicalSeptal.thickening * 100).toFixed(0)}%</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium text-slate-200">Lateral Wall (#5/#6)</td>
                        <td className="p-2">{effFour.lateral.score}</td>
                        <td className="p-2 text-sky-400">{effFour.lateral.scoreLabel}</td>
                        <td className="p-2">{effFour.lateral.excursion.toFixed(2)}x</td>
                        <td className="p-2">{(effFour.lateral.thickening * 100).toFixed(0)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Prospective Trial Design Protocol for NSFC Submission */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-sm text-white">Section 3: Prospective Trial Protocol & Mechanistic Hypotheses</h4>
                  </div>
                  <span className="font-mono text-[11px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                    Grant Core Proposal
                  </span>
                </div>

                <div className="space-y-2 text-slate-300 text-xs">
                  <p>
                    <strong className="text-white">Mechanistic Paradigm:</strong> Dissecting the clinical "electro-mechanical lag phase"—the physiological gap where electrical ST elevations emerge prior to overt macroscopic akinesis. Closed-loop vector speckle-tracking identifies microvascular dysfunction 38.4 minutes earlier than conventional pathways.
                  </p>
                  <p>
                    <strong className="text-white">Primary Endpoint:</strong> 90-day Late Gadolinium Enhancement (LGE) infarct mass on Cardiac MRI.
                  </p>
                  <p>
                    <strong className="text-white">Statistical Power:</strong> Sample size N = 392 (two-arm 1:1 RCT, alpha = 0.05, 90% power, detecting 4.2% absolute reduction in infarct size).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ready for direct paste into NSFC ISIS submission forms or international trial registries.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
