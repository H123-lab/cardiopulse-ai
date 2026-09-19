export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string[];
  vitals: {
    heartRate: number;
    sbp: number;
    dbp: number;
    respiratoryRate: number;
    spo2: number;
    temperature: number;
  };
  labs: {
    troponin: number; // ng/mL (hs-cTnI)
    troponinBaseline?: number;
    bnp: number; // pg/mL (or NT-proBNP)
    creatinine: number; // mg/dL
    egfr: number; // mL/min/1.73m²
    potassium: number; // mEq/L
    sodium: number; // mEq/L
    hemoglobin: number; // g/dL
    dDimer?: number; // ng/mL
    ldl: number; // mg/dL
    hba1c: number; // %
  };
  ecgSummary: {
    rhythm: string;
    prInterval: number;
    qrsDuration: number;
    qtc: number;
    axis: string;
    stSegment: string;
    findings: string;
  };
  echoSummary: {
    lvef: number;
    wallMotionAbnormality: string;
    valvularFindings: string;
    lvedd: number; // mm
    eOverEPrime: number;
    pasP: number; // Pulmonary artery systolic pressure (mmHg)
  };
  currentMedications: string[];
}

export interface ClinicalCase {
  id: string;
  title: string;
  category: 'Coronary' | 'Heart Failure' | 'Arrhythmia' | 'Valvular' | 'Emergency';
  difficulty: 'Fellow' | 'Resident' | 'Student';
  brief: string;
  patient: PatientProfile;
  expectedDiagnosis: string;
  pearl: string;
}

export type ActiveTab = 'copilot' | 'ecg' | 'echo' | 'calculators' | 'gdmt' | 'research';
