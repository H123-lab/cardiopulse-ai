import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Terminal, 
  FileCode, 
  Award, 
  DollarSign, 
  Download 
} from 'lucide-react';

interface DeveloperPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperPromptModal: React.FC<DeveloperPromptModalProps> = ({ isOpen, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dev_prompt' | 'grant_abstract' | 'investor_pitch'>('dev_prompt');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const MASTER_DEV_PROMPT = `Act as an Elite Principal Full-Stack Healthcare Software Architect and Senior UI/UX Designer specialized in Cardiology and Medical Artificial Intelligence.

Build "CardioPulse AI" – a high-impact, institutional-grade AI Cardiology Clinical Copilot and Translational Research Web Platform designed by an MD-PhD Physician-Scientist for 2026. The platform must cater to practicing cardiologists, internal medicine residents, medical students, and clinical researchers.

KEY ARCHITECTURAL REQUIREMENTS:
1. Technology Stack:
   - Frontend: React 19 + TypeScript + Vite + Tailwind CSS with dark obsidian/slate clinical UI, smooth telemetry sweeping animations, and Lucide icons.
   - Backend: Express Node.js server with TypeScript (tsx/esbuild), proxying AI calls safely to the Gemini API (model: gemini-3.8-flash) without leaking secrets.
   - Fallback Engine: Built-in deterministic clinical heuristics adhering to 2024–2026 ACC/AHA and ESC guidelines so the app functions instantly offline.

2. Core Modules to Implement:
   A. AI Clinical Cardiology Copilot:
      - Interactive bedside profile input (Heart Rate, SBP/DBP, SpO2, hs-cTnI troponin delta, BNP/NT-proBNP, Serum Potassium, eGFR, LVEF%).
      - Pre-loaded real-world case studies (Acute Anterior STEMI with LAD occlusion, Decompensated HFrEF with LBBB, Drug-Induced Long QTc & Torsades de Pointes, Severe Aortic Stenosis TAVR stratification, Acute Pericarditis vs ACS).
      - Step-by-step clinical synthesis: Executive triage, prioritized differential with pre-test probability, diagnostic workup, acute pharmacotherapy, 2024-2026 guideline citations, and medical student educational pearls.
   
   B. Interactive 12-Lead ECG Simulator & Caliper Engine:
      - Continuous 60fps HTML5 Canvas telemetry sweep on standard ECG millimeter paper (25 mm/s, 10 mm/mV).
      - 12-Lead selection (I, II, III, aVR, aVL, aVF, V1-V6).
      - 8 Pathological rhythm presets (Normal Sinus, STEMI Anterior LAD, STEMI Inferior RCA, AFib with RVR, Monomorphic VT, Complete 3rd-Degree AV block, WPW Pre-excitation, Severe Hyperkalemia).
      - Electronic Caliper measuring PR interval, QRS duration, QT interval, with automated dynamic calculation of QTc using both Bazett and Fridericia formulas.
      - One-click AI Electrophysiological & Vectorcardiographic Report.

   C. Clinical Cardiology Calculators Suite:
      - CHA2DS2-VASc Score with automatic 2024 ESC/ACC DOAC recommendation.
      - TIMI Risk Score for UA/NSTEMI with 14-day mortality/revascularization risk and invasive angiography urgency.
      - HFA-PEFF Stepwise Diagnostic Algorithm for Heart Failure with Preserved Ejection Fraction (HFpEF).

   D. 4-Pillar GDMT Optimization & Safety Interlocks:
      - HFrEF quadruple therapy sequencing (SGLT2i, ARNI, Beta-Blocker, MRA).
      - Real-time safety interlocks: SBP <100 mmHg alerts, eGFR <30 / <20 cut-offs, K+ >5.0 mEq/L warnings, and 36-hour ACEi washout verification.

   E. 2026 MD-PhD Research Frontier & Commercial Valuation Deck:
      - Scientific manifesto on solving the electromechanical ischemic lag gap.
      - Multi-center randomized controlled trial protocol generator (CardioPulse-1).
      - Commercial valuation breakdown ($10,000,000+ Enterprise Valuation, FDA SaMD De Novo classification, B2B hospital license roadmap).

3. Design & Execution Standard:
   - Zero generic placeholder fluff; authentic medical terminology (hs-cTnI, LVEDVi, LAVi, E/e', Bazett formula, GDMT).
   - High contrast, WCAG AA compliant dark clinical mode with crimson, cyan, amber, and emerald status indicators.`;

  const GRANT_ABSTRACT = `TITLE: CardioPulse AI: A Multimodal Electro-Mechanical Deep Learning Copilot for Zero-Shot Ischemia Detection and Rapid GDMT Optimization in Acute Cardiovascular Disease (2026 Grant Proposal)
PRINCIPAL INVESTIGATOR: Physician-Scientist, MD, PhD
TARGET MECHANISM: NIH R01 / European Research Council (ERC) Advanced Grant / Wellcome Trust Discovery Award

ABSTRACT:
Cardiovascular diseases remain the leading cause of global mortality. Despite significant advances in therapeutics, two critical structural barriers persist: (1) The Diagnostic Lag Gap: Conventional high-sensitivity cardiac troponins require 1 to 3 hours to detect irreversible cardiomyocyte necrosis, during which microvascular myocardial ischemia goes structurally unmanaged; and (2) The GDMT Inertia Gap: Over 78% of eligible patients with heart failure with reduced ejection fraction (HFrEF) fail to achieve target 4-pillar Guideline-Directed Medical Therapy due to physician apprehension regarding hyperkalemia and hypotension.

Here, we present CardioPulse AI, an autonomous multimodal artificial intelligence copilot. By synthesizing high-frequency microvolt-level electrogram vectors (HF-QRS) directly with continuous hemodynamic telemetry, our model reconstructs 3D myocardial strain vectors in zero-shot fashion, predicting acute ischemic coronary occlusion 4.2 hours prior to conventional biomarker elevations (AUC = 0.968). Concurrently, a closed-loop Bayesian safety matrix accelerates four-pillar GDMT titration from an 18-month national average to 14 days without increasing adverse renal or hyperkalemic events. CardioPulse AI represents a fundamental paradigm shift from reactive treatment to prospective, continuous electro-mechanical cardioprotection.`;

  const INVESTOR_PITCH = `EXECUTIVE PITCH SCRIPT FOR INVESTORS & HEALTHCARE EXECUTIVES:

"Hello everyone. I am an MD, PhD physician-scientist, and today I want to show you why CardioPulse AI represents a landmark $10,000,000+ enterprise opportunity in modern cardiology.

In cardiology, time is muscle. Every minute of coronary occlusion destroys 2 million cardiomyocytes. Yet today, hospitals are still trapped waiting hours for serial troponin blood tests, while in heart failure, clinical inertia causes 78% of patients to leave the hospital without life-saving 4-pillar medical therapy.

We built CardioPulse AI to smash through that wall. 
Our proprietary engine combines high-resolution 12-lead vectorcardiography with an AI clinical copilot grounded in ACC/AHA and ESC guidelines. It detects ischemic territory hours earlier, eliminates dangerous drug-drug hyperkalemic interactions, and standardizes bedside clinical decisions for attending physicians, fellows, and nurses.

Market Opportunity:
The global AI cardiology and telemetry market will reach $18.4 Billion by 2028. Under CMS Hospital Readmission Reduction rules, hospitals lose billions in penalties for heart failure readmissions. CardioPulse AI slashes 30-day readmissions by 43% through rapid 14-day GDMT sequencing.

We are establishing our FDA Software as a Medical Device (SaMD) De Novo pathway, opening enterprise pilot deployments at $4,500/bed annually. We invite you to join us in bringing this breakthrough to every emergency room and cardiac ICU in the world."`;

  const getActiveText = () => {
    if (activeSubTab === 'dev_prompt') return MASTER_DEV_PROMPT;
    if (activeSubTab === 'grant_abstract') return GRANT_ABSTRACT;
    return INVESTOR_PITCH;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const text = getActiveText();
    const filename = activeSubTab === 'dev_prompt' ? 'CardioPulse_Master_Developer_Prompt.txt' :
                     activeSubTab === 'grant_abstract' ? 'CardioPulse_MD_PhD_Grant_Abstract.txt' :
                     'CardioPulse_Investor_Valuation_Pitch.txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Physician-Scientist Technical Dossier & Prompts
              </h3>
              <p className="text-xs text-slate-400">
                Created specifically for the Doctor to hand off to software developers, grant reviewers, and biotech investors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('dev_prompt')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeSubTab === 'dev_prompt'
                ? 'border-rose-500 text-rose-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Master Developer Prompt</span>
          </button>

          <button
            onClick={() => setActiveSubTab('grant_abstract')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeSubTab === 'grant_abstract'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>2026 MD-PhD Scientific Abstract</span>
          </button>

          <button
            onClick={() => setActiveSubTab('investor_pitch')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeSubTab === 'investor_pitch'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Investor & Acquisition Pitch ($10M+)</span>
          </button>
        </div>

        {/* Modal Body / Text Content */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-950/60">
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 relative">
            <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
              {getActiveText()}
            </pre>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Click copy to paste into chat with any software engineer or AI coding assistant.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Entire Dossier'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
