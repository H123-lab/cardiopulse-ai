import { PatientProfile } from '../types';

export interface PatientNameSeed {
  name: string;
  gender: 'male' | 'female' | 'other';
}

const DIVERSE_NAMES: PatientNameSeed[] = [
  { name: 'Arthur P.', gender: 'male' },
  { name: 'Elena R.', gender: 'female' },
  { name: 'Marcus V.', gender: 'male' },
  { name: 'Amara O.', gender: 'female' },
  { name: 'Sophia K.', gender: 'female' },
  { name: 'David T.', gender: 'male' },
  { name: 'Lucas M.', gender: 'male' },
  { name: 'Carlos M.', gender: 'male' },
  { name: 'Grace H.', gender: 'female' },
  { name: 'Fatima A.', gender: 'female' },
  { name: 'James W.', gender: 'male' },
  { name: 'Zoe B.', gender: 'female' },
  { name: 'Robert V.', gender: 'male' },
  { name: 'Chloe D.', gender: 'female' },
  { name: 'Tariq N.', gender: 'male' },
  { name: 'Hannah L.', gender: 'female' },
  { name: 'Benjamin K.', gender: 'male' },
  { name: 'Devi P.', gender: 'female' },
  { name: 'Samuel E.', gender: 'male' },
  { name: 'Maria G.', gender: 'female' }
];

interface CaseArchetype {
  title: string;
  category: string;
  chiefComplaints: string[];
  hpiTemplates: string[];
  ageRange: [number, number];
  preferredGender?: 'male' | 'female';
  vitals: {
    hrRange: [number, number];
    sbpRange: [number, number];
    dbpRange: [number, number];
    spo2Range: [number, number];
    rrRange: [number, number];
    tempRange: [number, number];
  };
  labs: {
    troponinRange: [number, number];
    bnpRange: [number, number];
    potassiumRange: [number, number];
    egfrRange: [number, number];
    creatinineRange: [number, number];
    hemoglobinRange: [number, number];
    ldlRange: [number, number];
    hba1cRange: [number, number];
  };
  ecgSummary: {
    rhythm: string;
    stSegment: string;
    findings: string;
    qtcRange: [number, number];
    qrsRange: [number, number];
    axis: string;
  };
  echoSummary: {
    lvefRange: [number, number];
    wallMotionAbnormality: string;
    valvularFindings: string;
    pasPRange: [number, number];
    eOverEPrimeRange: [number, number];
  };
  pmhOptions: string[][];
  medOptions: string[][];
}

const CASE_ARCHETYPES: CaseArchetype[] = [
  {
    title: 'Acute Coronary Syndrome / Anterior Myocardial Infarction',
    category: 'Coronary',
    chiefComplaints: [
      'Crushing substernal chest pressure (9/10), cold diaphoresis radiating to left shoulder',
      'Severe retrosternal squeezing pain of 2 hours duration, nausea, and shortness of breath',
      'Sudden onset heavy pressure over precordium, radiating to the jaw and bilateral arms'
    ],
    hpiTemplates: [
      'Symptoms began abruptly while carrying groceries. Diaphoretic on EMS arrival. Pain is unremitting and unimproved with sublingual nitroglycerin.',
      'Onset occurred at rest 90 minutes prior to arrival. Described as elephant sitting on chest with radiation to jaw. EMS noted hyperacute anterior T-waves on pre-hospital ECG.'
    ],
    ageRange: [48, 76],
    vitals: {
      hrRange: [92, 114],
      sbpRange: [136, 168],
      dbpRange: [84, 98],
      spo2Range: [92, 96],
      rrRange: [20, 24],
      tempRange: [36.6, 37.1]
    },
    labs: {
      troponinRange: [1.10, 4.60],
      bnpRange: [140, 360],
      potassiumRange: [4.1, 4.6],
      egfrRange: [60, 88],
      creatinineRange: [1.0, 1.3],
      hemoglobinRange: [13.5, 15.5],
      ldlRange: [130, 175],
      hba1cRange: [6.2, 7.8]
    },
    ecgSummary: {
      rhythm: 'Sinus Tachycardia',
      stSegment: '3.5 mm ST-elevation in leads V1-V4 with reciprocal ST-depression in II, III, aVF',
      findings: 'Hyperacute T-waves and tombstoning ST segment elevation in anterior leads.',
      qtcRange: [430, 455],
      qrsRange: [92, 104],
      axis: '+20° (Normal)'
    },
    echoSummary: {
      lvefRange: [34, 42],
      wallMotionAbnormality: 'Severe hypokinesis to akinesis of the anterior wall and apex',
      valvularFindings: 'Trace mitral regurgitation, no aortic stenosis',
      pasPRange: [30, 38],
      eOverEPrimeRange: [12.0, 15.0]
    },
    pmhOptions: [
      ['Hypertension', 'Dyslipidemia', '25 pack-year smoking'],
      ['Type 2 Diabetes', 'Hypertension', 'Family history of CAD'],
      ['Prior PCI (LAD 4 yrs ago)', 'Hyperlipidemia', 'Hypertension']
    ],
    medOptions: [
      ['Aspirin 81mg QD', 'Atorvastatin 40mg QD', 'Amlodipine 5mg QD'],
      ['Metformin 1000mg BID', 'Lisinopril 10mg QD', 'Atorvastatin 20mg QD'],
      ['Clopidogrel 75mg QD', 'Rosuvastatin 20mg QD', 'Metoprolol Succinate 25mg QD']
    ]
  },
  {
    title: 'Acute Decompensated Heart Failure (HFrEF) with Volume Overload',
    category: 'Heart Failure',
    chiefComplaints: [
      'Severe progressive dyspnea on minimal exertion, 3-pillow orthopnea, and bilateral lower extremity edema',
      'Worsening shortness of breath, nocturnal paroxysmal cough, and 6 kg fluid weight gain over 2 weeks',
      'Severe bendopnea, profound fatigue, and abdominal fullness with bilateral 3+ pitting leg swelling'
    ],
    hpiTemplates: [
      'Patient with known dilated cardiomyopathy presents with subacute worsening of exertional tolerance. Now unable to lie flat without acute air hunger. Exam reveals jugular venous distention to the angle of the jaw and bibasilar crackles.',
      'Progressive dyspnea over 10 days refractory to outpatient diuretic doses. Has had to sleep upright in an armchair for the past 3 nights.'
    ],
    ageRange: [56, 84],
    vitals: {
      hrRange: [82, 104],
      sbpRange: [102, 126],
      dbpRange: [64, 78],
      spo2Range: [88, 93],
      rrRange: [22, 26],
      tempRange: [36.5, 37.0]
    },
    labs: {
      troponinRange: [0.04, 0.08],
      bnpRange: [1600, 4600],
      potassiumRange: [4.4, 5.2],
      egfrRange: [32, 54],
      creatinineRange: [1.4, 1.8],
      hemoglobinRange: [10.8, 12.6],
      ldlRange: [75, 105],
      hba1cRange: [6.5, 7.9]
    },
    ecgSummary: {
      rhythm: 'Sinus Rhythm with Left Bundle Branch Block (LBBB)',
      stSegment: 'Secondary repolarization abnormalities concordant with wide LBBB morphology',
      findings: 'LBBB with QRS duration 142 ms, negative concordance in V1-V2.',
      qtcRange: [450, 480],
      qrsRange: [136, 154],
      axis: '-30° (Left Axis Deviation)'
    },
    echoSummary: {
      lvefRange: [20, 28],
      wallMotionAbnormality: 'Diffuse global hypokinesis with intraventricular dyssynchrony',
      valvularFindings: 'Moderate functional mitral regurgitation secondary to annular dilatation',
      pasPRange: [44, 56],
      eOverEPrimeRange: [17.0, 22.0]
    },
    pmhOptions: [
      ['Non-ischemic dilated cardiomyopathy', 'Type 2 Diabetes', 'CKD Stage 3a'],
      ['Ischemic cardiomyopathy (prior CABG)', 'Hypertension', 'Atrial Fibrillation'],
      ['Hypertensive heart disease', 'Chronic systolic heart failure', 'Obstructive sleep apnea']
    ],
    medOptions: [
      ['Furosemide 40mg BID', 'Metoprolol Succinate 25mg QD (subtarget)', 'Lisinopril 5mg QD'],
      ['Torsemide 20mg QD', 'Carvedilol 6.25mg BID', 'Empagliflozin 10mg QD'],
      ['Bumetanide 1mg BID', 'Metoprolol Tartrate 25mg BID', 'Spironolactone 12.5mg QD']
    ]
  },
  {
    title: 'Atrial Fibrillation with Rapid Ventricular Response (RVR)',
    category: 'Arrhythmia',
    chiefComplaints: [
      'Sudden onset rapid racing heart flutter, presyncope, and acute chest tightness',
      'Palpitations, lightheadedness, and shortness of breath starting 4 hours ago',
      'Irregular fluttering sensation in chest accompanied by generalized weakness and dizziness'
    ],
    hpiTemplates: [
      'Patient was resting when sudden rapid palpitations began. Describes heart feeling like a flopping fish in chest. Denies prior documented sustained arrhythmias.',
      'Acute onset fluttering pulse while at work. Pulse is irregularly irregular on exam with a heart rate exceeding 140 bpm.'
    ],
    ageRange: [54, 82],
    vitals: {
      hrRange: [135, 165],
      sbpRange: [112, 138],
      dbpRange: [74, 88],
      spo2Range: [94, 98],
      rrRange: [18, 22],
      tempRange: [36.6, 37.0]
    },
    labs: {
      troponinRange: [0.02, 0.05],
      bnpRange: [320, 780],
      potassiumRange: [4.0, 4.5],
      egfrRange: [65, 92],
      creatinineRange: [0.9, 1.2],
      hemoglobinRange: [12.8, 14.8],
      ldlRange: [85, 120],
      hba1cRange: [5.6, 6.8]
    },
    ecgSummary: {
      rhythm: 'Atrial Fibrillation with Rapid Ventricular Response (RVR)',
      stSegment: 'Rate-related non-specific ST depressions in lateral leads (V4-V6)',
      findings: 'Absence of distinct P waves, fibrillatory baseline, irregularly irregular R-R intervals.',
      qtcRange: [420, 445],
      qrsRange: [88, 98],
      axis: '+40° (Normal)'
    },
    echoSummary: {
      lvefRange: [46, 54],
      wallMotionAbnormality: 'Mild global hypokinesis secondary to tachycardia-induced cardiomyopathy',
      valvularFindings: 'Mild left atrial enlargement (LAVI 42 mL/m²), trace tricuspid regurgitation',
      pasPRange: [28, 36],
      eOverEPrimeRange: [10.5, 13.5]
    },
    pmhOptions: [
      ['Hypertension', 'Obstructive Sleep Apnea', 'Mild Obesity'],
      ['CAD s/p elective stent (2022)', 'Hypertension', 'Dyslipidemia'],
      ['Thyroid nodule (euthyroid)', 'Hypertension', 'Moderate alcohol intake']
    ],
    medOptions: [
      ['Diltiazem CD 180mg QD', 'Losartan 50mg QD'],
      ['Metoprolol Succinate 50mg QD', 'Amlodipine 5mg QD', 'Aspirin 81mg QD'],
      ['Hydrochlorothiazide 25mg QD', 'Valsartan 80mg QD']
    ]
  },
  {
    title: 'Acquired Long QT Syndrome & Torsades de Pointes Risk',
    category: 'Arrhythmia',
    chiefComplaints: [
      'Recurrent witnessed syncope with rapid spontaneous recovery, intermittent palpitations',
      'Sudden drop attacks without prodrome, severe lightheadedness following antibiotic initiation',
      'Episodes of presyncope and documented polymorphic ventricular tachycardia'
    ],
    hpiTemplates: [
      'Patient had 2 episodes of sudden loss of consciousness within 18 hours. Telemetry captured a 12-beat run of twisting polymorphic ventricular tachycardia initiated by an R-on-T premature beat.',
      'Recently prescribed macrolide and ondansetron for severe gastroenteritis with prominent emesis and poor oral intake.'
    ],
    ageRange: [32, 65],
    vitals: {
      hrRange: [48, 58],
      sbpRange: [102, 116],
      dbpRange: [64, 74],
      spo2Range: [97, 100],
      rrRange: [14, 18],
      tempRange: [36.7, 37.1]
    },
    labs: {
      troponinRange: [0.01, 0.03],
      bnpRange: [40, 110],
      potassiumRange: [3.0, 3.4],
      egfrRange: [85, 110],
      creatinineRange: [0.8, 1.0],
      hemoglobinRange: [12.5, 14.5],
      ldlRange: [90, 125],
      hba1cRange: [5.2, 5.8]
    },
    ecgSummary: {
      rhythm: 'Sinus Bradycardia with prolonged repolarization',
      stSegment: 'Marked QTc prolongation (>530 ms) with prominent bifid T-U wave fusion',
      findings: 'Dangerous R-on-T ventricular extrasystoles with intermittent pause-dependent QT augmentation.',
      qtcRange: [520, 560],
      qrsRange: [88, 96],
      axis: '+45°'
    },
    echoSummary: {
      lvefRange: [58, 65],
      wallMotionAbnormality: 'Normal biventricular systolic contractility, no regional wall motion defects',
      valvularFindings: 'Normal valves, no structural heart disease identified',
      pasPRange: [20, 26],
      eOverEPrimeRange: [6.5, 8.5]
    },
    pmhOptions: [
      ['Depression (on SSRI)', 'Recent bacterial bronchitis / gastroenteritis'],
      ['Generalized anxiety disorder', 'History of migraine', 'Hypokalemic episodes with dehydration'],
      ['No prior medical history, active runner']
    ],
    medOptions: [
      ['Citalopram 40mg QD', 'Azithromycin 500mg QD', 'Ondansetron 8mg PRN'],
      ['Escitalopram 20mg QD', 'Clarithromycin 500mg BID'],
      ['Fluoxetine 40mg QD', 'Levofloxacin 500mg QD']
    ]
  },
  {
    title: 'Severe Symptomatic Valvular Aortic Stenosis (TAVR Evaluation)',
    category: 'Valvular',
    chiefComplaints: [
      'Exertional lightheadedness, shortness of breath on climbing one flight of stairs, and chest tightness',
      'Exertional near-syncope, progressive dyspnea, and harsh systolic ejection murmur',
      'Fatigue, exertional angina, and diminished exercise tolerance over past 4 months'
    ],
    hpiTemplates: [
      'Patient reports onset of exertional lightheadedness and chest tightness when walking uphill. Auscultation reveals a grade 4/6 crescendo-decrescendo systolic murmur radiating to both carotid arteries with reduced second heart sound (absent A2).',
      'Progressive functional decline. Nearly fainted while carrying groceries up steps. Carotid pulses exhibit classic pulsus parvus et tardus (weak and delayed upstroke).'
    ],
    ageRange: [71, 88],
    vitals: {
      hrRange: [66, 78],
      sbpRange: [126, 142],
      dbpRange: [78, 88],
      spo2Range: [94, 97],
      rrRange: [16, 20],
      tempRange: [36.5, 36.9]
    },
    labs: {
      troponinRange: [0.02, 0.04],
      bnpRange: [320, 650],
      potassiumRange: [4.2, 4.6],
      egfrRange: [46, 64],
      creatinineRange: [1.2, 1.5],
      hemoglobinRange: [12.0, 13.8],
      ldlRange: [85, 115],
      hba1cRange: [5.7, 6.7]
    },
    ecgSummary: {
      rhythm: 'Normal Sinus Rhythm',
      stSegment: 'ST-depression and asymmetric T-wave inversions in lateral leads (I, aVL, V5-V6)',
      findings: 'Left Ventricular Hypertrophy (LVH) with strain pattern (Sokolow-Lyon index >38 mm).',
      qtcRange: [425, 445],
      qrsRange: [98, 108],
      axis: '-15°'
    },
    echoSummary: {
      lvefRange: [50, 56],
      wallMotionAbnormality: 'Concentric left ventricular hypertrophy with preserved ejection fraction',
      valvularFindings: 'Heavily calcified trileaflet aortic valve. Aortic Valve Area (AVA) 0.68 cm², Mean Gradient 48 mmHg, Peak Jet Velocity 4.4 m/s.',
      pasPRange: [34, 42],
      eOverEPrimeRange: [15.0, 18.5]
    },
    pmhOptions: [
      ['Hypertension', 'Dyslipidemia', 'Peripheral Artery Disease'],
      ['Hypertension', 'Mild CKD Stage 3', 'Bilateral knee osteoarthritis'],
      ['Essential Hypertension', 'Type 2 Diabetes']
    ],
    medOptions: [
      ['Amlodipine 5mg QD', 'Atorvastatin 40mg QD', 'Aspirin 81mg QD'],
      ['Losartan 50mg QD', 'Rosuvastatin 10mg QD'],
      ['Chlorthalidone 25mg QD', 'Atorvastatin 20mg QD']
    ]
  },
  {
    title: 'Acute Viral Myopericarditis vs Atypical ACS',
    category: 'Emergency',
    chiefComplaints: [
      'Sharp retrosternal stabbing chest pain aggravated by deep inspiration and lying flat, relieved by sitting forward',
      'Pleuritic anterior chest pain radiating to bilateral trapezius ridges following a flu-like illness',
      'Positional retrosternal chest pain with audible pericardial friction rub and low-grade fever'
    ],
    hpiTemplates: [
      'Patient reports acute onset of sharp chest discomfort 24 hours ago. Pain markedly worsens when lying supine and is noticeably alleviated when leaning forward. Had upper respiratory viral symptoms 6 days ago.',
      'Sharp pleuritic pain (8/10) exacerbated by coughing or taking a deep breath. Triphasic pericardial friction rub heard along the left lower sternal border.'
    ],
    ageRange: [22, 44],
    vitals: {
      hrRange: [84, 98],
      sbpRange: [116, 128],
      dbpRange: [72, 82],
      spo2Range: [98, 100],
      rrRange: [16, 18],
      tempRange: [37.6, 38.2]
    },
    labs: {
      troponinRange: [0.015, 0.045],
      bnpRange: [30, 80],
      potassiumRange: [4.1, 4.5],
      egfrRange: [95, 120],
      creatinineRange: [0.8, 1.0],
      hemoglobinRange: [14.0, 16.0],
      ldlRange: [80, 110],
      hba1cRange: [5.0, 5.5]
    },
    ecgSummary: {
      rhythm: 'Sinus Rhythm',
      stSegment: 'Widespread concave upward ST-segment elevation across leads I, II, aVF, V2-V6 with reciprocal ST-depression only in aVR',
      findings: 'PR-segment depression in lead II and PR-segment elevation in lead aVR (classic Spodick sign).',
      qtcRange: [405, 425],
      qrsRange: [82, 90],
      axis: '+50° (Normal)'
    },
    echoSummary: {
      lvefRange: [60, 66],
      wallMotionAbnormality: 'Normal biventricular systolic function throughout, no regional wall motion abnormalities',
      valvularFindings: 'Structurally normal valves. Small circumferential pericardial effusion (4 mm), no tamponade signs.',
      pasPRange: [18, 24],
      eOverEPrimeRange: [6.0, 7.5]
    },
    pmhOptions: [
      ['Recent viral gastroenteritis / URI 1 week ago', 'Prior healthy non-smoker'],
      ['Mild seasonal allergies', 'Recent viral syndrome'],
      ['No significant medical history']
    ],
    medOptions: [
      ['Ibuprofen 400mg PRN', 'Acetaminophen 500mg PRN'],
      ['Over-the-counter decongestants', 'Multivitamins'],
      ['None']
    ]
  },
  {
    title: 'Stress-Induced (Takotsubo) Cardiomyopathy',
    category: 'Heart Failure',
    chiefComplaints: [
      'Acute retrosternal crushing chest pain and shortness of breath following sudden severe emotional shock',
      'Crushing chest pressure mimicking acute STEMI immediately after intense psychological distress',
      'Acute breathlessness, diaphoresis, and substernal oppression in an elderly patient after devastating news'
    ],
    hpiTemplates: [
      'Patient experienced sudden crushing chest tightness 2 hours after learning of a sudden family tragedy. Presents diaphoretic with mild pulmonary congestion.',
      'Emergency presentation with acute ischemic-like chest pain following profound emotional grief. Initial 12-lead ECG demonstrates precordial ST-elevation.'
    ],
    ageRange: [62, 80],
    preferredGender: 'female',
    vitals: {
      hrRange: [96, 112],
      sbpRange: [110, 132],
      dbpRange: [68, 82],
      spo2Range: [92, 95],
      rrRange: [20, 24],
      tempRange: [36.7, 37.2]
    },
    labs: {
      troponinRange: [0.25, 0.65],
      bnpRange: [750, 1750],
      potassiumRange: [4.0, 4.4],
      egfrRange: [62, 82],
      creatinineRange: [1.0, 1.3],
      hemoglobinRange: [12.2, 14.0],
      ldlRange: [95, 130],
      hba1cRange: [5.6, 6.4]
    },
    ecgSummary: {
      rhythm: 'Sinus Tachycardia',
      stSegment: 'ST-segment elevation in precordial leads V2-V5 followed by deep symmetric T-wave inversion (Wellens-like)',
      findings: 'Marked QTc prolongation (>490 ms) and apical repolarization abnormality without reciprocal depression.',
      qtcRange: [480, 520],
      qrsRange: [88, 98],
      axis: '+30°'
    },
    echoSummary: {
      lvefRange: [30, 38],
      wallMotionAbnormality: 'Classic apical and mid-ventricular ballooning (akinesis) with hypercontractile basal segments',
      valvularFindings: 'Trace to mild MR, dynamic LV outflow tract gradient possible',
      pasPRange: [32, 40],
      eOverEPrimeRange: [14.0, 17.5]
    },
    pmhOptions: [
      ['Postmenopausal state', 'Osteopenia', 'Mild anxiety'],
      ['Hypertension', 'Hypothyroidism (on levothyroxine)'],
      ['Early stage osteoporosis', 'Hypertension']
    ],
    medOptions: [
      ['Levothyroxine 50mcg QD', 'Calcium + Vitamin D'],
      ['Amlodipine 5mg QD', 'Alendronate 70mg weekly'],
      ['Losartan 25mg QD', 'Multivitamins']
    ]
  }
];

function randBetween(min: number, max: number, decimals: number = 0): number {
  const val = min + Math.random() * (max - min);
  return decimals === 0 ? Math.round(val) : Number(val.toFixed(decimals));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomPatientProfile(archetypeOverride?: string): { patient: PatientProfile; archetypeTitle: string; category: string } {
  const archetype = archetypeOverride 
    ? CASE_ARCHETYPES.find(a => a.category.toLowerCase() === archetypeOverride.toLowerCase() || a.title.toLowerCase().includes(archetypeOverride.toLowerCase())) || pickRandom(CASE_ARCHETYPES)
    : pickRandom(CASE_ARCHETYPES);

  // Pick name and gender
  let nameSeed: PatientNameSeed;
  if (archetype.preferredGender) {
    const matching = DIVERSE_NAMES.filter(n => n.gender === archetype.preferredGender);
    nameSeed = pickRandom(matching.length > 0 ? matching : DIVERSE_NAMES);
  } else {
    nameSeed = pickRandom(DIVERSE_NAMES);
  }

  const age = randBetween(archetype.ageRange[0], archetype.ageRange[1]);
  const chiefComplaint = pickRandom(archetype.chiefComplaints);
  const hpi = pickRandom(archetype.hpiTemplates);

  const vitals = {
    heartRate: randBetween(archetype.vitals.hrRange[0], archetype.vitals.hrRange[1]),
    sbp: randBetween(archetype.vitals.sbpRange[0], archetype.vitals.sbpRange[1]),
    dbp: randBetween(archetype.vitals.dbpRange[0], archetype.vitals.dbpRange[1]),
    respiratoryRate: randBetween(archetype.vitals.rrRange[0], archetype.vitals.rrRange[1]),
    spo2: randBetween(archetype.vitals.spo2Range[0], archetype.vitals.spo2Range[1]),
    temperature: randBetween(archetype.vitals.tempRange[0], archetype.vitals.tempRange[1], 1)
  };

  const labs = {
    troponin: randBetween(archetype.labs.troponinRange[0], archetype.labs.troponinRange[1], 2),
    troponinBaseline: 0.01,
    bnp: randBetween(archetype.labs.bnpRange[0], archetype.labs.bnpRange[1]),
    creatinine: randBetween(archetype.labs.creatinineRange[0], archetype.labs.creatinineRange[1], 1),
    egfr: randBetween(archetype.labs.egfrRange[0], archetype.labs.egfrRange[1]),
    potassium: randBetween(archetype.labs.potassiumRange[0], archetype.labs.potassiumRange[1], 1),
    sodium: randBetween(136, 142),
    hemoglobin: randBetween(archetype.labs.hemoglobinRange[0], archetype.labs.hemoglobinRange[1], 1),
    ldl: randBetween(archetype.labs.ldlRange[0], archetype.labs.ldlRange[1]),
    hba1c: randBetween(archetype.labs.hba1cRange[0], archetype.labs.hba1cRange[1], 1)
  };

  const ecgSummary = {
    rhythm: archetype.ecgSummary.rhythm,
    prInterval: randBetween(145, 185),
    qrsDuration: randBetween(archetype.ecgSummary.qrsRange[0], archetype.ecgSummary.qrsRange[1]),
    qtc: randBetween(archetype.ecgSummary.qtcRange[0], archetype.ecgSummary.qtcRange[1]),
    axis: archetype.ecgSummary.axis,
    stSegment: archetype.ecgSummary.stSegment,
    findings: archetype.ecgSummary.findings
  };

  const echoSummary = {
    lvef: randBetween(archetype.echoSummary.lvefRange[0], archetype.echoSummary.lvefRange[1]),
    wallMotionAbnormality: archetype.echoSummary.wallMotionAbnormality,
    valvularFindings: archetype.echoSummary.valvularFindings,
    lvedd: randBetween(46, 62),
    eOverEPrime: randBetween(archetype.echoSummary.eOverEPrimeRange[0], archetype.echoSummary.eOverEPrimeRange[1], 1),
    pasP: randBetween(archetype.echoSummary.pasPRange[0], archetype.echoSummary.pasPRange[1])
  };

  const pastMedicalHistory = [...pickRandom(archetype.pmhOptions)];
  const currentMedications = [...pickRandom(archetype.medOptions)];

  const randomId = `pt-${Math.random().toString(36).substring(2, 7)}`;

  return {
    patient: {
      id: randomId,
      name: nameSeed.name,
      age,
      gender: nameSeed.gender,
      chiefComplaint,
      historyOfPresentIllness: hpi,
      pastMedicalHistory,
      vitals,
      labs,
      ecgSummary,
      echoSummary,
      currentMedications
    },
    archetypeTitle: archetype.title,
    category: archetype.category
  };
}
