import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PatientProfile } from '../types';
import { CLINICAL_CASES } from '../data/clinicalCases';
import { playEmergencyPopSound } from '../utils/audioAlert';

export interface EmergencyEvaluationResult {
  needed: boolean;
  priority: 'CRITICAL' | 'URGENT' | 'STABLE';
  reason: string;
  recommendedAction: string;
}

export interface EmergencyAlertData {
  patientName: string;
  patientAge: number;
  patientGender: string;
  reason: string;
  priority: 'CRITICAL' | 'URGENT';
  vitalSignsSummary: string;
  recommendedAction: string;
  timestamp: string;
}

interface PatientContextType {
  patient: PatientProfile;
  setPatient: React.Dispatch<React.SetStateAction<PatientProfile>>;
  selectedCaseId: string;
  setSelectedCaseId: (id: string) => void;
  // Live Chatbot state
  isChatbotOpen: boolean;
  setIsChatbotOpen: (open: boolean) => void;
  openChatbotWithPrompt: (promptText?: string) => void;
  pendingChatPrompt: string | null;
  clearPendingChatPrompt: () => void;
  // Emergency Pop Alert state
  isEmergencyAlertActive: boolean;
  emergencyAlertEnabled: boolean;
  setEmergencyAlertEnabled: (enabled: boolean) => void;
  emergencyAlertData: EmergencyAlertData | null;
  triggerEmergencyAlert: (reason: string, details?: Partial<EmergencyAlertData>) => void;
  dismissEmergencyAlert: () => void;
  turnOffEmergencyAlertsCompletely: () => void;
  evaluatePatientEmergencyHospitalization: (pt?: PatientProfile) => EmergencyEvaluationResult;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(CLINICAL_CASES[0].id);
  const [patient, setPatient] = useState<PatientProfile>(CLINICAL_CASES[0].patient);

  // Chatbot drawer/modal state
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  // Emergency Hospitalization Pop Alert state
  const [isEmergencyAlertActive, setIsEmergencyAlertActive] = useState<boolean>(false);
  const [emergencyAlertEnabled, setEmergencyAlertEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cardiopulse_alert_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [emergencyAlertData, setEmergencyAlertData] = useState<EmergencyAlertData | null>(null);

  // Save toggle preference
  useEffect(() => {
    try {
      localStorage.setItem('cardiopulse_alert_enabled', String(emergencyAlertEnabled));
    } catch {}
  }, [emergencyAlertEnabled]);

  // Clinical algorithm to determine if emergency hospitalization is needed
  const evaluatePatientEmergencyHospitalization = useCallback(
    (ptToEval?: PatientProfile): EmergencyEvaluationResult => {
      const pt = ptToEval || patient;
      const sbp = pt.vitals.sbp;
      const hr = pt.vitals.heartRate;
      const spo2 = pt.vitals.spo2;
      const troponin = pt.labs.troponin;
      const bnp = pt.labs.bnp;
      const st = (pt.ecgSummary.stSegment || '').toLowerCase();
      const rhythm = (pt.ecgSummary.rhythm || '').toLowerCase();
      const chief = (pt.chiefComplaint || '').toLowerCase();

      // Condition 1: Acute STEMI / Massive Myocardial Necrosis
      if (st.includes('elevation') || (troponin >= 0.5 && (chief.includes('chest') || chief.includes('pressure')))) {
        return {
          needed: true,
          priority: 'CRITICAL',
          reason: `Acute ST-Elevation Myocardial Infarction (STEMI) or High-Risk ACS with hs-cTnI of ${troponin} ng/mL and active ischemic symptoms.`,
          recommendedAction: 'Immediate activation of Cardiac Catheterization Laboratory for primary PCI within 90 minutes. Continuous telemetry and dual antiplatelet therapy STAT.'
        };
      }

      // Condition 2: Cardiogenic Shock / Severe Hypotension
      if (sbp < 90 || (sbp < 100 && hr > 115)) {
        return {
          needed: true,
          priority: 'CRITICAL',
          reason: `Hemodynamic Instability / Impending Cardiogenic Shock (SBP ${sbp} mmHg, HR ${hr} bpm, MAP ${Math.round((sbp + 2 * pt.vitals.dbp) / 3)} mmHg).`,
          recommendedAction: 'Immediate ICU admission, invasive arterial line monitoring, inotropic or mechanical circulatory support (Impella/IABP) evaluation.'
        };
      }

      // Condition 3: Acute Decompensated Heart Failure with Flash Pulmonary Edema / Respiratory Distress
      if (spo2 < 90 || (bnp > 1500 && (pt.vitals.respiratoryRate > 24 || chief.includes('orthopnea')))) {
        return {
          needed: true,
          priority: 'CRITICAL',
          reason: `Acute Decompensated Heart Failure with Acute Pulmonary Edema (SpO₂ ${spo2}%, Resp Rate ${pt.vitals.respiratoryRate}/min, BNP ${bnp} pg/mL).`,
          recommendedAction: 'Immediate emergency department / CCU transfer, high-flow oxygen / non-invasive positive pressure ventilation (BiPAP), IV loop diuretics.'
        };
      }

      // Condition 4: Malignant Arrhythmia / Syncope with High Risk
      if (
        rhythm.includes('ventricular tachycardia') || 
        rhythm.includes('torsades') || 
        pt.ecgSummary.qtc > 520 ||
        (rhythm.includes('fibrillation') && hr > 140 && sbp < 105)
      ) {
        return {
          needed: true,
          priority: 'CRITICAL',
          reason: `Life-Threatening Arrhythmia / Sudden Cardiac Death Risk (${pt.ecgSummary.rhythm}, QTc ${pt.ecgSummary.qtc} ms, HR ${hr} bpm).`,
          recommendedAction: 'Immediate emergency admission, synchronized cardioversion / defibrillator pads standby, continuous telemetry, IV magnesium/amiodarone as indicated.'
        };
      }

      // Condition 5: Hypertensive Emergency with End-Organ Symptoms
      if (sbp >= 180 || pt.vitals.dbp >= 120) {
        if (chief.includes('chest') || chief.includes('headache') || chief.includes('breath') || troponin > 0.04) {
          return {
            needed: true,
            priority: 'URGENT',
            reason: `Hypertensive Emergency (BP ${sbp}/${pt.vitals.dbp} mmHg) with acute cardiac/cerebral end-organ strain.`,
            recommendedAction: 'Immediate emergency department admission, titratable IV antihypertensives (e.g. Nicardipine, Labetalol) to safely lower MAP by 20-25% in the first hour.'
          };
        }
      }

      // Condition 6: Moderate Troponin Leak with Unstable Angina
      if (troponin > 0.08) {
        return {
          needed: true,
          priority: 'URGENT',
          reason: `High-Risk NSTE-ACS (Positive hs-Troponin ${troponin} ng/mL with ongoing myocardial damage).`,
          recommendedAction: 'Urgent hospital admission to Cardiac Telemetry / CCU, early invasive angiography within 24 hours, parenteral anticoagulation.'
        };
      }

      return {
        needed: false,
        priority: 'STABLE',
        reason: 'Hemodynamically compensated, no acute high-risk ischemic or arrhythmogenic red flags currently present.',
        recommendedAction: 'Outpatient cardiology surveillance, GDMT optimization, and scheduled follow-up.'
      };
    },
    [patient]
  );

  // Trigger the emergency pop alert
  const triggerEmergencyAlert = useCallback(
    (reason: string, details?: Partial<EmergencyAlertData>) => {
      if (!emergencyAlertEnabled) {
        console.log('[Emergency Alert] Alert is disabled by user.');
        return;
      }

      const vitalsSummary = `BP ${patient.vitals.sbp}/${patient.vitals.dbp} mmHg • HR ${patient.vitals.heartRate} bpm • SpO₂ ${patient.vitals.spo2}% • hs-cTn ${patient.labs.troponin} ng/mL`;
      
      setEmergencyAlertData({
        patientName: details?.patientName || patient.name,
        patientAge: details?.patientAge || patient.age,
        patientGender: details?.patientGender || patient.gender,
        reason: reason,
        priority: details?.priority || 'CRITICAL',
        vitalSignsSummary: details?.vitalSignsSummary || vitalsSummary,
        recommendedAction: details?.recommendedAction || 'Immediate ICU / Cardiac Catheterization Laboratory activation required.',
        timestamp: new Date().toLocaleTimeString()
      });

      setIsEmergencyAlertActive(true);

      // Play the emergency pop audio sound!
      playEmergencyPopSound();
    },
    [emergencyAlertEnabled, patient]
  );

  // Dismiss current alert
  const dismissEmergencyAlert = useCallback(() => {
    setIsEmergencyAlertActive(false);
  }, []);

  // Turn off pop alerts completely
  const turnOffEmergencyAlertsCompletely = useCallback(() => {
    setIsEmergencyAlertActive(false);
    setEmergencyAlertEnabled(false);
  }, []);

  // Open the chatbot with optional auto-filled prompt
  const openChatbotWithPrompt = useCallback((promptText?: string) => {
    if (promptText) {
      setPendingChatPrompt(promptText);
    }
    setIsChatbotOpen(true);
  }, []);

  const clearPendingChatPrompt = useCallback(() => {
    setPendingChatPrompt(null);
  }, []);

  // Automatically monitor patient state whenever it changes
  // If patient has critical STEMI or severe instability, trigger emergency pop alert once per patient ID
  useEffect(() => {
    if (!emergencyAlertEnabled) return;
    const evalResult = evaluatePatientEmergencyHospitalization(patient);
    if (evalResult.needed && evalResult.priority === 'CRITICAL') {
      // Trigger the pop alert!
      triggerEmergencyAlert(evalResult.reason, {
        recommendedAction: evalResult.recommendedAction
      });
    } else if (!evalResult.needed && isEmergencyAlertActive) {
      // If values changed back to normal, dismiss alert
      setIsEmergencyAlertActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id, patient.vitals.sbp, patient.vitals.heartRate, patient.vitals.spo2, patient.labs.troponin, patient.ecgSummary.stSegment]);

  return (
    <PatientContext.Provider
      value={{
        patient,
        setPatient,
        selectedCaseId,
        setSelectedCaseId,
        isChatbotOpen,
        setIsChatbotOpen,
        openChatbotWithPrompt,
        pendingChatPrompt,
        clearPendingChatPrompt,
        isEmergencyAlertActive,
        emergencyAlertEnabled,
        setEmergencyAlertEnabled,
        emergencyAlertData,
        triggerEmergencyAlert,
        dismissEmergencyAlert,
        turnOffEmergencyAlertsCompletely,
        evaluatePatientEmergencyHospitalization
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatientContext = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};
