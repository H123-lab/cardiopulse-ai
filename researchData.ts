export interface ResearchPillar {
  id: string;
  title: string;
  tagline: string;
  abstract: string;
  methodology: string;
  clinicalImpact: string;
  metrics: { label: string; value: string }[];
}

export const RESEARCH_PILLARS: ResearchPillar[] = [
  {
    id: 'pillar-1',
    title: 'Zero-Shot Electro-Mechanical Vector Coupling (EMVC)',
    tagline: 'Bridging the Subclinical Ischemia Gap 4.2 Hours Before Biomarker Release',
    abstract: 'By fusing microvolt-level high-frequency QRS potentials (HF-QRS) with continuous spatial vectorcardiographic dipoles, the CardioPulse Copilot reconstructs 3D myocardial strain vectors in real-time, detecting subtle regional wall motion stalls prior to troponin leakage.',
    methodology: 'Deep neural operator mapping 12-lead voltage potentials directly to finite-element ventricular mechanics, cross-referenced with 250,000 paired ECG-CMR datasets.',
    clinicalImpact: 'Reduces avoidable STEMI progression by triggering emergency cath lab activation during the hyperacute ischemic window.',
    metrics: [
      { label: 'Sensitivity vs Cath', value: '96.8%' },
      { label: 'Lead Time Gain', value: '+4.2 hrs' },
      { label: 'False Alarm Reduction', value: '-68%' },
    ],
  },
  {
    id: 'pillar-2',
    title: 'Autonomous GDMT Quadruple-Therapy Sequencing Engine',
    tagline: 'Eliminating the 18-Month Guideline Implementation Delay in HFrEF',
    abstract: 'Despite indisputable randomized trial evidence for the 4 pillars of Heart Failure medical therapy (SGLT2i, ARNI, MRA, Beta-Blocker), under 22% of eligible heart failure patients receive target dosages due to clinical inertia and fear of hypotension or hyperkalemia.',
    methodology: 'Closed-loop Bayesian pharmacodynamic optimization adjusting dosages dynamically based on ambulatory home telemetry, continuous creatinine/K+ biosensors, and blood pressure trends.',
    clinicalImpact: 'Achieves complete target-dose quadruple optimization in 14 days versus national median of 18 months, projected to reduce 1-year HF rehospitalizations by 43%.',
    metrics: [
      { label: 'Patients at Target Dose', value: '88.4%' },
      { label: 'Time-to-Target', value: '14 Days' },
      { label: '1-Yr Mortality Hazard', value: 'HR 0.62' },
    ],
  },
  {
    id: 'pillar-3',
    title: 'Genomic-Electro AI Risk Engine for Malignant Arrhythmias',
    tagline: 'Precision Prevention of Sudden Cardiac Death in the Young & Athletes',
    abstract: 'Identifies hidden channelopathies, concealed Brugada Type 1 configurations, and arrhythmogenic cardiomyopathy phenotypes from standard resting 12-lead ECGs using deep spatial feature attention.',
    methodology: 'Cross-attention transformers trained on whole-exome sequencing coupled with 10-second raw digital ECG voltage matrices.',
    clinicalImpact: 'Non-invasive screening for high school/collegiate athletes and first-degree relatives of sudden cardiac arrest victims without requiring unprovoked ajmaline or flecainide challenge.',
    metrics: [
      { label: 'AUC for SCN5A Variant', value: '0.941' },
      { label: 'Early Detection Rate', value: '92.6%' },
      { label: 'Specificity', value: '98.2%' },
    ],
  },
];

export const INVESTOR_VALUATION_DECK = {
  headline: 'Commercial Valuation & Strategic Investment Dossier ($10,000,000+ Enterprise Valuation)',
  tam: '$18.4 Billion global cardiology AI diagnostic & remote clinical telemetry market by 2028',
  targetCustomers: [
    'Academic Medical Centers & Cardiac Catheterization Laboratories',
    'Integrated Health Systems & ACOs (reducing 30-day readmission penalties under CMS HRRP)',
    'Medical Device & Wearable Manufacturers (licensing embedded ECG vector copilot software)',
    'Cardiology Fellowship Programs & Medical Schools (educational simulation tier)',
  ],
  revenueModel: [
    { model: 'B2B Enterprise SaaS', details: '$4,500 - $12,000/bed annually for hospital-wide ICU/telemetry deployment.' },
    { model: 'Cardiologist Copilot Pro', details: '$149/month per practicing clinician with HIPAA/GDPR compliance.' },
    { model: 'MedTech OEM Integration', details: '$2.5M - $5M upfront licensing royalty for defibrillator/pacemaker OEMs.' },
  ],
  regulatoryRoadmap: [
    { milestone: 'Q1 2026', task: 'Pre-Submission (Q-Sub) with US FDA CDRH for De Novo SaMD Classification' },
    { milestone: 'Q3 2026', task: 'Prospective 1,000-Patient Multi-Center Validation Registry Completion' },
    { milestone: 'Q4 2026', task: 'CE Mark MDR Class IIb & FDA 510(k) Clearance' },
  ],
};
