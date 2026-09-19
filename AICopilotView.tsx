import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Stethoscope, 
  Flame, 
  FileText, 
  ShieldAlert, 
  Sliders, 
  BookOpen, 
  Copy, 
  Check,
  Activity,
  Heart,
  User,
  Dices,
  Sparkles,
  RotateCcw,
  Plus,
  X,
  Edit3,
  Pill,
  ChevronDown,
  ChevronUp,
  Bot,
  Ambulance,
  MessageSquare,
  Zap
} from 'lucide-react';
import { PatientProfile } from '../types';
import { CLINICAL_CASES } from '../data/clinicalCases';
import { generateRandomPatientProfile } from '../data/randomPatientGenerator';
import { usePatientContext } from '../context/PatientContext';
import { CathLabInterventionPanel } from './CathLabInterventionPanel';

export const AICopilotView: React.FC = () => {
  const {
    patient,
    setPatient,
    selectedCaseId,
    setSelectedCaseId,
    setIsChatbotOpen,
    openChatbotWithPrompt,
    triggerEmergencyAlert,
    evaluatePatientEmergencyHospitalization
  } = usePatientContext();

  const [activeSubTab, setActiveSubTab] = useState<'consult' | 'cath_lab'>('consult');
  const [clinicalNarrative, setClinicalNarrative] = useState<string>(
    `${patient.chiefComplaint} — ${patient.historyOfPresentIllness}`
  );
  const [customQuery, setCustomQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [responseSource, setResponseSource] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [consultMode, setConsultMode] = useState<string>('comprehensive_consult');

  // Input states for dynamically added PMH comorbidities and baseline medications
  const [newPmhInput, setNewPmhInput] = useState<string>('');
  const [newMedInput, setNewMedInput] = useState<string>('');
  const [isEditingDiagnostics, setIsEditingDiagnostics] = useState<boolean>(false);

  const evalResult = evaluatePatientEmergencyHospitalization(patient);

  // Synchronize dropdown selection with both narrative text area and vitals/labs state
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    const foundCase = CLINICAL_CASES.find(c => c.id === caseId);
    if (foundCase) {
      const clonedPatient = JSON.parse(JSON.stringify(foundCase.patient)) as PatientProfile;
      setPatient(clonedPatient);
      setClinicalNarrative(`${clonedPatient.chiefComplaint} — ${clonedPatient.historyOfPresentIllness}`);
      setCopilotResponse(null);
    }
  };

  // Select a random case from the preset clinical cases
  const handleSelectRandomCase = () => {
    const otherCases = CLINICAL_CASES.filter(c => c.id !== selectedCaseId);
    const pool = otherCases.length > 0 ? otherCases : CLINICAL_CASES;
    const randomCase = pool[Math.floor(Math.random() * pool.length)];
    handleSelectCase(randomCase.id);
  };

  // Generate a completely randomized cardiovascular case with realistic pathophysiology
  const handleGenerateRandomPatient = () => {
    const generated = generateRandomPatientProfile();
    setSelectedCaseId('custom-random');
    setPatient(generated.patient);
    setClinicalNarrative(`${generated.patient.chiefComplaint} — ${generated.patient.historyOfPresentIllness}`);
    setCopilotResponse(null);
  };

  // Reset the current case back to initial default parameters
  const handleResetCurrentCase = () => {
    const foundCase = CLINICAL_CASES.find(c => c.id === selectedCaseId);
    if (foundCase) {
      const cloned = JSON.parse(JSON.stringify(foundCase.patient)) as PatientProfile;
      setPatient(cloned);
      setClinicalNarrative(`${cloned.chiefComplaint} — ${cloned.historyOfPresentIllness}`);
    } else {
      handleSelectCase(CLINICAL_CASES[0].id);
    }
  };

  // Add comorbidity to past medical history
  const handleAddPmh = () => {
    const trimmed = newPmhInput.trim();
    if (!trimmed) return;
    if (!patient.pastMedicalHistory.includes(trimmed)) {
      setPatient(prev => ({
        ...prev,
        pastMedicalHistory: [...prev.pastMedicalHistory, trimmed]
      }));
    }
    setNewPmhInput('');
  };

  // Add medication to current medications
  const handleAddMed = () => {
    const trimmed = newMedInput.trim();
    if (!trimmed) return;
    if (!patient.currentMedications.includes(trimmed)) {
      setPatient(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, trimmed]
      }));
    }
    setNewMedInput('');
  };

  // State updater handlers for vitals and laboratory metrics
  const updateVital = (key: keyof PatientProfile['vitals'], value: number) => {
    setPatient((prev) => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [key]: value,
      },
    }));
  };

  const updateLab = (key: keyof PatientProfile['labs'], value: number) => {
    setPatient((prev) => ({
      ...prev,
      labs: {
        ...prev.labs,
        [key]: value,
      },
    }));
  };

  // Run AI Copilot consultation with dynamic live state payload synthesis
  const handleRunConsultation = async (presetQuery?: string, modeOverride?: string) => {
    if (isLoading) return;
    setIsLoading(true);
    const queryToUse = presetQuery || customQuery || clinicalNarrative || 'Provide full clinical synthesis, differential diagnosis, risk stratification, and acute/chronic management plan.';
    const modeToUse = modeOverride || consultMode;

    const payload = {
      query: queryToUse,
      patientData: {
        ...patient,
        name: patient.name ? `${patient.name} (${patient.age}y ${patient.gender.toUpperCase()})` : `${patient.age}y ${patient.gender.toUpperCase()}`,
        chiefComplaint: patient.chiefComplaint,
        historyOfPresentIllness: clinicalNarrative,
        vitals: {
          heartRate: Number(patient.vitals.heartRate),
          sbp: Number(patient.vitals.sbp),
          dbp: Number(patient.vitals.dbp),
          spo2: Number(patient.vitals.spo2),
        },
        labs: {
          ...patient.labs,
          troponin: Number(patient.labs.troponin),
          bnp: Number(patient.labs.bnp),
          potassium: Number(patient.labs.potassium),
          eGFR: Number(patient.labs.egfr),
          egfr: Number(patient.labs.egfr),
        },
      },
      mode: modeToUse,
    };

    try {
      const response = await fetch('/api/cardiology-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setCopilotResponse(data.analysis);
        setResponseSource(data.source || 'gemini-3.8-flash');
      } else {
        setCopilotResponse('Unable to process consultation. Please verify connection.');
      }
    } catch (err: any) {
      console.error(err);
      setCopilotResponse('Network or server error encountered during clinical consultation.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!copilotResponse) return;
    navigator.clipboard.writeText(copilotResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Prominent Single-Click Live AI Chatbot Launch Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 p-4 rounded-2xl border border-rose-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40 border border-rose-400/40 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Interactive Live AI Cardiology Chatbot</h3>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Ready</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Single-click conversational Q&A: Ask anything regarding diagnoses, exact doses, timing & duration in days, lifestyle management, and emergency hospitalization alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {evalResult.needed && (
            <button
              onClick={() => triggerEmergencyAlert(evalResult.reason, { recommendedAction: evalResult.recommendedAction })}
              className="px-3 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/50 text-xs font-bold flex items-center gap-1.5 transition-all animate-pulse"
              title="Click to trigger emergency hospitalization alert banner with pop sound"
            >
              <Ambulance className="w-4 h-4 text-red-400" />
              <span>Hospitalize (Alert)</span>
            </button>
          )}

          <button
            id="copilot-open-live-chatbot-btn"
            onClick={() => setIsChatbotOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/50 border border-rose-400/40 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bot className="w-4 h-4 text-white" />
            <span>Open Live Chatbot</span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </button>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Clinical Cardiology Copilot
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ACC / AHA / ESC 2024–2026 Grounded
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Real-time differential diagnosis, myocardial injury kinetics, 4-pillar GDMT titration safety thresholds, and high-yield cardiology pearls for attending physicians, fellows, and medical students.
          </p>
        </div>

        {/* Quick Case Switcher & Randomizer Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium whitespace-nowrap">Clinical Case:</label>
            <select
              value={selectedCaseId}
              onChange={(e) => handleSelectCase(e.target.value)}
              className="bg-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-rose-500"
            >
              {CLINICAL_CASES.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.category}] {c.title}
                </option>
              ))}
              {selectedCaseId === 'custom-random' && (
                <option value="custom-random">
                  [Custom / Random Case] {patient.name} ({patient.age}y {patient.gender.toUpperCase()})
                </option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSelectRandomCase}
              title="Pick a random case from the clinical case database"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-rose-500 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Dices className="w-3.5 h-3.5 text-rose-400" />
              <span>Random Case</span>
            </button>
            <button
              onClick={handleGenerateRandomPatient}
              title="Generate a completely randomized clinical patient scenario"
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Shuffle Profile</span>
            </button>
            <button
              onClick={handleResetCurrentCase}
              title="Reset current case to default parameters"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-View Navigation Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('consult')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'consult'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-950/40 border border-rose-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Clinical Copilot &amp; Profile</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cath_lab')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'cath_lab'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-950/40 border border-sky-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Cath Lab Angiography &amp; Primary PCI</span>
            {(selectedCaseId === 'stemi-anterior' || selectedCaseId === 'stemi-inferior' || patient.labs.troponin > 0.1) && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Quick context info & 1-click launch */}
        <div className="flex items-center justify-between sm:justify-end gap-3 px-2 text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-300">
            Active: <strong className="text-rose-400">{patient.name || 'Patient'}</strong> ({patient.age}y {patient.gender.toUpperCase()})
          </span>
          {activeSubTab === 'consult' && (selectedCaseId === 'stemi-anterior' || selectedCaseId === 'stemi-inferior') && (
            <button
              onClick={() => setActiveSubTab('cath_lab')}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Launch Cath Lab PCI &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'cath_lab' ? (
        <CathLabInterventionPanel
          patient={patient}
          selectedCaseId={selectedCaseId}
          onUpdatePatient={setPatient}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Profile & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Patient Card */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Patient Clinical Profile</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  Editable Profile
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Edit3 className="w-3 h-3 text-rose-400" />
                <span>Customize any parameter</span>
              </div>
            </div>

            {/* Editable Demographics: Name, Age, Gender */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-3">
              <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>Patient Demographics</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Patient Name */}
                <div className="sm:col-span-6">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={patient.name}
                    onChange={(e) => setPatient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Arthur P., Elena R."
                    className="w-full bg-slate-900 border border-slate-700/90 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Patient Age */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={105}
                    value={patient.age}
                    onChange={(e) => setPatient(prev => ({ ...prev, age: Number(e.target.value) || 18 }))}
                    className="w-full bg-slate-900 border border-slate-700/90 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Patient Gender */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">
                    Sex
                  </label>
                  <select
                    value={patient.gender}
                    onChange={(e) => setPatient(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    className="w-full bg-slate-900 border border-slate-700/90 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">
                  Chief Complaint (Presenting Symptom)
                </label>
                <input
                  type="text"
                  value={patient.chiefComplaint}
                  onChange={(e) => {
                    const newCC = e.target.value;
                    setPatient(prev => ({ ...prev, chiefComplaint: newCC }));
                    setClinicalNarrative(`${newCC} — ${patient.historyOfPresentIllness}`);
                  }}
                  placeholder="e.g. Severe retrosternal crushing chest pain radiating to left arm..."
                  className="w-full bg-slate-900 border border-slate-700/90 rounded-lg px-2.5 py-1.5 text-xs text-rose-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Controlled Clinical Narrative Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider block">
                  Case Narrative & Emergency HPI
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Live Controlled Input</span>
              </div>
              <textarea
                value={clinicalNarrative}
                onChange={(e) => {
                  setClinicalNarrative(e.target.value);
                  setPatient((prev) => ({ ...prev, historyOfPresentIllness: e.target.value }));
                }}
                rows={3}
                placeholder="Type or edit patient history of present illness, acute symptom onset, and emergency narrative..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans resize-none transition-colors"
              />
            </div>

            {/* Editable Comorbidities / Past Medical History */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Past Medical History & Comorbidities
                </label>
                <span className="text-[10px] text-slate-500 font-mono">{patient.pastMedicalHistory.length} listed</span>
              </div>
              
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {patient.pastMedicalHistory.map((item, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => {
                          setPatient(prev => ({
                            ...prev,
                            pastMedicalHistory: prev.pastMedicalHistory.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="text-slate-400 hover:text-rose-400 ml-0.5"
                        title="Remove comorbidity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {patient.pastMedicalHistory.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">No background comorbidities entered.</span>
                  )}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newPmhInput}
                    onChange={(e) => setNewPmhInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPmh()}
                    placeholder="Add comorbidity (e.g. T2D, Prior PCI)..."
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPmh}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Quick Add Comorbidity Chips */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 mr-1 self-center">Quick Add:</span>
                  {['Hypertension', 'Dyslipidemia', 'T2D', 'Prior MI', 'CKD 3', 'Smoking', 'Afib'].map((comorb) => (
                    <button
                      key={comorb}
                      type="button"
                      disabled={patient.pastMedicalHistory.includes(comorb)}
                      onClick={() => {
                        if (!patient.pastMedicalHistory.includes(comorb)) {
                          setPatient(prev => ({ ...prev, pastMedicalHistory: [...prev.pastMedicalHistory, comorb] }));
                        }
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-40"
                    >
                      +{comorb}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editable Baseline Medications */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-indigo-400" />
                  Baseline Medications
                </label>
                <span className="text-[10px] text-slate-500 font-mono">{patient.currentMedications.length} listed</span>
              </div>
              
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {patient.currentMedications.map((item, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-950/40 text-indigo-200 border border-indigo-800/50"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => {
                          setPatient(prev => ({
                            ...prev,
                            currentMedications: prev.currentMedications.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="text-indigo-400 hover:text-rose-400 ml-0.5"
                        title="Remove medication"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {patient.currentMedications.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">No medications documented.</span>
                  )}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newMedInput}
                    onChange={(e) => setNewMedInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMed()}
                    placeholder="Add medication (e.g. Metoprolol 25mg BID)..."
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 rounded border border-indigo-800/60 text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Quick Add Med Chips */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 mr-1 self-center">Quick Add:</span>
                  {['Aspirin 81mg QD', 'Atorvastatin 40mg', 'Metoprolol 25mg', 'Lisinopril 10mg', 'Empagliflozin 10mg', 'Apixaban 5mg BID'].map((med) => (
                    <button
                      key={med}
                      type="button"
                      disabled={patient.currentMedications.includes(med)}
                      onClick={() => {
                        if (!patient.currentMedications.includes(med)) {
                          setPatient(prev => ({ ...prev, currentMedications: [...prev.currentMedications, med] }));
                        }
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-40"
                    >
                      +{med.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Vitals Sliders & Numerical Indicators */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  Bedside Vitals Sliders
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Live Calibration</span>
              </div>
              
              <div className="space-y-2.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                {/* Heart Rate Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium">Heart Rate</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={40}
                        max={180}
                        value={patient.vitals.heartRate}
                        onChange={(e) => updateVital('heartRate', Number(e.target.value))}
                        className="w-14 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-[10px] text-slate-400">bpm</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={180}
                    step={1}
                    value={patient.vitals.heartRate}
                    onChange={(e) => updateVital('heartRate', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>40</span>
                    <span>100</span>
                    <span>180</span>
                  </div>
                </div>

                {/* Systolic BP Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium">Systolic BP (SBP)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={70}
                        max={220}
                        value={patient.vitals.sbp}
                        onChange={(e) => updateVital('sbp', Number(e.target.value))}
                        className="w-14 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-slate-400">mmHg</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={220}
                    step={1}
                    value={patient.vitals.sbp}
                    onChange={(e) => updateVital('sbp', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>70 (Shock)</span>
                    <span>120 (Optimal)</span>
                    <span>220 (Crisis)</span>
                  </div>
                </div>

                {/* Diastolic BP Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium">Diastolic BP (DBP)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={40}
                        max={120}
                        value={patient.vitals.dbp}
                        onChange={(e) => updateVital('dbp', Number(e.target.value))}
                        className="w-14 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-[10px] text-slate-400">mmHg</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={120}
                    step={1}
                    value={patient.vitals.dbp}
                    onChange={(e) => updateVital('dbp', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>40</span>
                    <span>80</span>
                    <span>120</span>
                  </div>
                </div>

                {/* SpO2 Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium">Oxygen Saturation (SpO₂)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={75}
                        max={100}
                        value={patient.vitals.spo2}
                        onChange={(e) => updateVital('spo2', Number(e.target.value))}
                        className="w-14 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={75}
                    max={100}
                    step={1}
                    value={patient.vitals.spo2}
                    onChange={(e) => updateVital('spo2', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>75% (Hypoxia)</span>
                    <span>95%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Key Cardiac Biomarkers & Chemistry Sliders */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Key Cardiac Biomarkers & Chemistry Sliders
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Laboratory Calibration</span>
              </div>

              <div className="space-y-2.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                {/* hs-cTnI Troponin Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                      hs-cTnI Troponin
                      {patient.labs.troponin > 0.04 && (
                        <span className="px-1 py-0.2 text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">Injury</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0.0}
                        max={10.0}
                        step={0.01}
                        value={patient.labs.troponin}
                        onChange={(e) => updateLab('troponin', Number(e.target.value))}
                        className="w-16 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-[10px] text-slate-400">ng/mL</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={10.0}
                    step={0.01}
                    value={patient.labs.troponin}
                    onChange={(e) => updateLab('troponin', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>0.0 (Normal)</span>
                    <span>0.04 (Threshold)</span>
                    <span>10.0 ng/mL</span>
                  </div>
                </div>

                {/* BNP / NT-proBNP Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                      BNP / NT-proBNP
                      {patient.labs.bnp > 400 && (
                        <span className="px-1 py-0.2 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">Strain</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={10}
                        max={5000}
                        step={10}
                        value={patient.labs.bnp}
                        onChange={(e) => updateLab('bnp', Number(e.target.value))}
                        className="w-16 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400">pg/mL</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={5000}
                    step={10}
                    value={patient.labs.bnp}
                    onChange={(e) => updateLab('bnp', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>10</span>
                    <span>400 (Cutoff)</span>
                    <span>5000 pg/mL</span>
                  </div>
                </div>

                {/* Serum Potassium K+ Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                      Serum Potassium (K⁺)
                      {(patient.labs.potassium < 3.5 || patient.labs.potassium > 5.2) && (
                        <span className="px-1 py-0.2 text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 rounded">Alert</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={2.5}
                        max={7.0}
                        step={0.1}
                        value={patient.labs.potassium}
                        onChange={(e) => updateLab('potassium', Number(e.target.value))}
                        className="w-14 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-[10px] text-slate-400">mEq/L</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={2.5}
                    max={7.0}
                    step={0.1}
                    value={patient.labs.potassium}
                    onChange={(e) => updateLab('potassium', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>2.5 (Hypo)</span>
                    <span>4.0 - 5.0 (GDMT Target)</span>
                    <span>7.0 (Hyper)</span>
                  </div>
                </div>

                {/* eGFR Renal Clearance Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                      eGFR Renal Clearance
                      {patient.labs.egfr < 30 && (
                        <span className="px-1 py-0.2 text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 rounded">&lt;30 Alert</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={10}
                        max={120}
                        step={1}
                        value={patient.labs.egfr}
                        onChange={(e) => updateLab('egfr', Number(e.target.value))}
                        className="w-14 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-[10px] text-slate-400">mL/min</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={1}
                    value={patient.labs.egfr}
                    onChange={(e) => updateLab('egfr', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>10 (Dialysis)</span>
                    <span>30 (MRA Stop)</span>
                    <span>120 (Normal)</span>
                  </div>
                </div>

                {/* Echo LVEF Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                      Echocardiogram LVEF
                      {patient.echoSummary.lvef <= 40 && (
                        <span className="px-1 py-0.2 text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">HFrEF</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={10}
                        max={75}
                        step={1}
                        value={patient.echoSummary.lvef}
                        onChange={(e) => setPatient({ ...patient, echoSummary: { ...patient.echoSummary, lvef: Number(e.target.value) } })}
                        className="w-14 text-right bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={75}
                    step={1}
                    value={patient.echoSummary.lvef}
                    onChange={(e) => setPatient({ ...patient, echoSummary: { ...patient.echoSummary, lvef: Number(e.target.value) } })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>10% (Severe)</span>
                    <span>40% (HFrEF Cutoff)</span>
                    <span>75% (Preserved)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Summaries with Editable Toggle */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  Diagnostic Studies (ECG & Echo)
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingDiagnostics(!isEditingDiagnostics)}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingDiagnostics ? 'Done Editing' : 'Edit Diagnostics'}</span>
                  {isEditingDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {isEditingDiagnostics ? (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-3">
                  {/* ECG Edit Fields */}
                  <div className="space-y-1.5 border-b border-slate-800/80 pb-2.5">
                    <span className="font-semibold text-rose-300 text-[11px] block">12-Lead ECG Findings:</span>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">ST Segment / T-Wave Description</label>
                      <input
                        type="text"
                        value={patient.ecgSummary.stSegment}
                        onChange={(e) => setPatient(prev => ({
                          ...prev,
                          ecgSummary: { ...prev.ecgSummary, stSegment: e.target.value }
                        }))}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Rhythm</label>
                        <input
                          type="text"
                          value={patient.ecgSummary.rhythm}
                          onChange={(e) => setPatient(prev => ({
                            ...prev,
                            ecgSummary: { ...prev.ecgSummary, rhythm: e.target.value }
                          }))}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">QTc Interval (ms)</label>
                        <input
                          type="number"
                          value={patient.ecgSummary.qtc}
                          onChange={(e) => setPatient(prev => ({
                            ...prev,
                            ecgSummary: { ...prev.ecgSummary, qtc: Number(e.target.value) || 440 }
                          }))}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Echo Edit Fields */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-indigo-300 text-[11px] block">Echocardiogram (TTE) Findings:</span>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Regional Wall Motion</label>
                      <input
                        type="text"
                        value={patient.echoSummary.wallMotionAbnormality}
                        onChange={(e) => setPatient(prev => ({
                          ...prev,
                          echoSummary: { ...prev.echoSummary, wallMotionAbnormality: e.target.value }
                        }))}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Valvular & Hemodynamic Findings</label>
                      <input
                        type="text"
                        value={patient.echoSummary.valvularFindings}
                        onChange={(e) => setPatient(prev => ({
                          ...prev,
                          echoSummary: { ...prev.echoSummary, valvularFindings: e.target.value }
                        }))}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-300 text-[11px] block">12-Lead ECG Summary:</span>
                      <span className="text-[10px] font-mono text-rose-400/80">{patient.ecgSummary.rhythm}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5">{patient.ecgSummary.stSegment}</p>
                    <p className="text-slate-400 text-[10px] font-mono mt-0.5">Axis: {patient.ecgSummary.axis} | QRS: {patient.ecgSummary.qrsDuration}ms | QTc: {patient.ecgSummary.qtc}ms | PR: {patient.ecgSummary.prInterval}ms</p>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-indigo-300 text-[11px] block">Transthoracic Echo (TTE):</span>
                    <p className="text-slate-300 text-[11px] mt-0.5">{patient.echoSummary.wallMotionAbnormality}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{patient.echoSummary.valvularFindings} (E/e': {patient.echoSummary.eOverEPrime}, PASP: {patient.echoSummary.pasP} mmHg)</p>
                  </div>
                </>
              )}
            </div>

            {/* Quick Consultation Trigger Chips */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Targeted AI Cardiology Queries:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleRunConsultation('Evaluate acute myocardial ischemia versus non-ischemic etiologies. Assess high-sensitivity troponin kinetics, ECG lead localization, and immediate cath lab activation criteria.', 'acs_triage')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-rose-500 transition-all"
                >
                  ⚡ ACS / STEMI vs Mimic
                </button>
                <button
                  onClick={() => handleRunConsultation('Analyze Heart Failure status. Formulate complete 4-pillar GDMT sequencing plan (SGLT2i, ARNI, BB, MRA) with strict renal/potassium safety checks.', 'gdmt_optimization')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500 transition-all"
                >
                  💊 4-Pillar GDMT Optimization
                </button>
                <button
                  onClick={() => handleRunConsultation('Assess arrhythmia risk, QTc prolongation, Torsades de Pointes risk, and drug-drug interactions with electrolyte thresholds.', 'arrhythmia_risk')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500 transition-all"
                >
                  ⚠️ Arrhythmia & QTc Risk
                </button>
                <button
                  onClick={() => handleRunConsultation('Provide a cardiology fellow and medical student clinical grand rounds breakdown of the underlying electrophysiology and hemodynamic mechanisms in this case.', 'fellow_education')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500 transition-all"
                >
                  🎓 Fellow / Student Grand Rounds
                </button>
              </div>
            </div>

            {/* Custom Query Box & Main Consult Button */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Ask specific cardiology question (e.g. 'Can we start Sacubitril/Valsartan today?')"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunConsultation()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                id="btn-consult-cardiopulse"
                onClick={() => handleRunConsultation()}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/30"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isLoading ? 'Consulting...' : 'Consult CardioPulse AI'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Clinical Synthesis Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 min-h-[560px] flex flex-col justify-between">
            <div>
              {/* Output Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                  <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                    CardioPulse Clinical Synthesis & Decision Support
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {responseSource && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Engine: {responseSource}
                    </span>
                  )}
                  {copilotResponse && (
                    <button
                      onClick={copyToClipboard}
                      className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                      title="Copy consultation report"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Consultation Body */}
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-rose-500 border-t-transparent animate-spin"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Synthesizing Multimodal Cardiology Data...
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Cross-referencing 2024–2026 ACC/AHA/ESC guidelines, troponin delta kinetics, and hemodynamic safety thresholds.
                    </p>
                  </div>
                </div>
              ) : copilotResponse ? (
                <div className="space-y-4 text-slate-200 text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-[580px] pr-2">
                  <div className="whitespace-pre-line prose prose-invert max-w-none prose-headings:text-rose-300 prose-headings:font-bold prose-headings:text-sm sm:prose-headings:text-base prose-strong:text-white prose-li:my-0.5">
                    {copilotResponse}
                  </div>
                  <div className="pt-3 mt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl">
                    <span className="text-xs text-slate-300">
                      Need live Q&A for exact medication doses, timing, duration, lifestyle, or emergency triage?
                    </span>
                    <button
                      onClick={() => openChatbotWithPrompt(`Based on this consultation for ${patient.name || 'the patient'}, provide exact medication doses with timing, duration in days, and lifestyle management plan.`)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40 shrink-0"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Ask Live Chatbot</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <BrainCircuit className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="text-base font-semibold text-white">
                      Cardiology Decision Support Ready
                    </h4>
                    <p className="text-xs text-slate-400 leading-normal">
                      Adjust vitals and biomarker sliders on the left, then click <strong className="text-rose-300 font-medium">"Consult CardioPulse AI"</strong> or select a targeted query to generate an ACC/AHA/ESC guideline-grounded treatment plan.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunConsultation()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs shadow-lg shadow-rose-900/40 transition-all"
                  >
                    Run Complete Case Evaluation
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Disclaimer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-300">Physician-Scientist Notice:</strong> CardioPulse AI is an advanced clinical decision support and educational research tool. Clinical decisions must always be corroborated with direct patient examination, bedside hemodynamics, and institutional protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default AICopilotView;
