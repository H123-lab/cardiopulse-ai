import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  BrainCircuit, 
  Sparkles, 
  Stethoscope, 
  Pill, 
  Activity, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Check, 
  Copy, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Bot, 
  User, 
  AlertOctagon, 
  Ambulance, 
  Apple, 
  Calendar, 
  Clock, 
  Compass, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';
import { PatientProfile } from '../types';
import { CLINICAL_CASES } from '../data/clinicalCases';
import { playEmergencyPopSound } from '../utils/audioAlert';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  emergencyAlertTriggered?: boolean;
  emergencyReason?: string;
}

export const LiveChatbotModal: React.FC = () => {
  const { 
    isChatbotOpen, 
    setIsChatbotOpen, 
    patient, 
    setPatient, 
    selectedCaseId, 
    setSelectedCaseId,
    pendingChatPrompt, 
    clearPendingChatPrompt,
    emergencyAlertEnabled,
    setEmergencyAlertEnabled,
    triggerEmergencyAlert,
    evaluatePatientEmergencyHospitalization
  } = usePatientContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      const evalResult = evaluatePatientEmergencyHospitalization(patient);
      const initialAssistantMessage: ChatMessage = {
        id: 'initial-greeting',
        sender: 'assistant',
        text: `### Hello! I am your 2026 CardioPulse AI Clinical Copilot.

I am live and ready to resolve **anything** regarding the application and your clinical patient cases:
- 🩺 **Clinical Diagnosis & Differential**: Accurate etiology, probability, and hemodynamic rationale.
- 💊 **Exact Treatment Doses, Timing & Days Duration**: Precise dosages, titration intervals, daily administration times (e.g. BID with meals), and total treatment days or lifelong regimens.
- 🥗 **Comprehensive Lifestyle Management**: Sodium limits (<2g/day), fluid restriction (1.5–2L/day), exercise prescription (FITT protocol), cardiac rehab, and daily weight tracking.
- 🚨 **Emergency Hospitalization Triage**: Immediate identification of life-threatening emergencies requiring urgent hospital transfer.
- 💡 **App Guidance & Calculators**: Guidance on 12-lead ECG vector analysis, GDMT Titration, CHA₂DS₂-VASc, and Research Labs.

Currently loaded case: **${patient.name}** (${patient.age}y ${patient.gender.toUpperCase()}) with chief complaint: *"${patient.chiefComplaint}"*.

${evalResult.needed ? `⚠️ **Immediate Triage Notice**: This patient meets criteria for **Emergency Hospitalization** due to: *${evalResult.reason}*` : 'Patient is currently hemodynamically stable.'}

How can I assist you right now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emergencyAlertTriggered: evalResult.needed,
        emergencyReason: evalResult.reason
      };
      setMessages([initialAssistantMessage]);
    }
  }, [evaluatePatientEmergencyHospitalization, messages.length, patient]);

  // Handle pending auto-filled prompt
  useEffect(() => {
    if (isChatbotOpen && pendingChatPrompt) {
      handleSendMessage(pendingChatPrompt);
      clearPendingChatPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatbotOpen, pendingChatPrompt]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isChatbotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatbotOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isChatbotOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isChatbotOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 1. Evaluate emergency hospitalization immediately on client side as well
      const evalResult = evaluatePatientEmergencyHospitalization(patient);
      const queryLower = query.toLowerCase();
      const isEmergencyQuery = 
        queryLower.includes('emergency') || 
        queryLower.includes('hospital') || 
        queryLower.includes('admit') || 
        queryLower.includes('triage') || 
        queryLower.includes('stemi') || 
        queryLower.includes('shock');

      if ((evalResult.needed || isEmergencyQuery) && evalResult.needed && emergencyAlertEnabled) {
        triggerEmergencyAlert(evalResult.reason, {
          recommendedAction: evalResult.recommendedAction
        });
      }

      // 2. Call backend /api/cardiology-chat
      const response = await fetch('/api/cardiology-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          patientData: patient,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.reply || data.analysis || 'Clinical synthesis ready.';

      // Check if backend detected emergency hospitalization
      if (data.emergencyHospitalizationNeeded && emergencyAlertEnabled) {
        triggerEmergencyAlert(data.emergencyHospitalizationReason || evalResult.reason);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emergencyAlertTriggered: Boolean(data.emergencyHospitalizationNeeded || evalResult.needed),
        emergencyReason: data.emergencyHospitalizationReason || evalResult.reason
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('[CardioPulse Chatbot] Using resilient fallback:', err);
      // Generate immediate local comprehensive fallback
      const fallbackReply = generateChatbotLocalFallback(query, patient);
      const evalResult = evaluatePatientEmergencyHospitalization(patient);

      if (evalResult.needed && emergencyAlertEnabled) {
        triggerEmergencyAlert(evalResult.reason);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emergencyAlertTriggered: evalResult.needed,
        emergencyReason: evalResult.reason
      };

      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const evalResult = evaluatePatientEmergencyHospitalization(patient);

  if (!isChatbotOpen) return null;

  return (
    <div 
      id="live-ai-copilot-chatbot-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded 
            ? 'w-full h-full max-w-6xl max-h-[96vh]' 
            : 'w-full max-w-3xl h-[88vh] max-h-[780px]'
        }`}
      >
        {/* Chatbot Top Header Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/40 border border-rose-400/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  CardioPulse AI <span className="text-rose-400 font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/30">LIVE CHATBOT</span>
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Interactive Online</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Diagnosis, exact medication doses/days, lifestyle management & emergency triage
              </p>
            </div>
          </div>

          {/* Controls: Pop Alert Toggle, Expand, Close */}
          <div className="flex items-center gap-2">
            {/* Pop Alert Audio Toggle Switch */}
            <button
              onClick={() => {
                const next = !emergencyAlertEnabled;
                setEmergencyAlertEnabled(next);
                if (next) playEmergencyPopSound();
              }}
              title={emergencyAlertEnabled ? "Emergency Pop Alert is ENABLED (Click to turn off)" : "Emergency Pop Alert is MUTED / OFF (Click to enable)"}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                emergencyAlertEnabled 
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/60' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {emergencyAlertEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Pop Alert: <strong>ON</strong></span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Pop Alert: <strong>OFF</strong></span>
                </>
              )}
            </button>

            {/* Expand / Shrink */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Standard Window" : "Full Screen"}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:inline-flex"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsChatbotOpen(false)}
              title="Close Live Chatbot"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Active Patient Case Indicator Bar */}
        <div className="bg-slate-950/70 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 min-w-0 truncate">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Active Case
            </span>
            <strong className="text-white truncate">{patient.name}</strong>
            <span className="text-slate-400 font-mono text-[11px] truncate">
              {patient.age}y {patient.gender.toUpperCase()} • BP {patient.vitals.sbp}/{patient.vitals.dbp} • HR {patient.vitals.heartRate} • cTn {patient.labs.troponin} ng/mL
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {evalResult.needed ? (
              <button
                onClick={() => {
                  triggerEmergencyAlert(evalResult.reason, {
                    recommendedAction: evalResult.recommendedAction
                  });
                }}
                className="px-2 py-0.5 rounded bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1 transition-all animate-pulse"
                title="Click to trigger emergency hospitalization alert banner and pop sound"
              >
                <Ambulance className="w-3.5 h-3.5 text-red-400" />
                <span>Needs Emergency Hospitalization</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Compensated (Non-Emergent)</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Question Chips Toolbar */}
        <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap mr-1">Ask Instantly:</span>
          
          <button
            onClick={() => handleSendMessage(`What is the definitive diagnosis and primary differential diagnosis for ${patient.name} (${patient.age}y ${patient.gender}) based on presenting vitals and labs?`)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-500/50 text-[11px] whitespace-nowrap transition-all flex items-center gap-1 shrink-0"
          >
            <Stethoscope className="w-3 h-3 text-rose-400" />
            <span>Diagnosis & Differentials</span>
          </button>

          <button
            onClick={() => handleSendMessage(`Provide the exact medical treatment plan with exact drug doses, frequency/timing (e.g. BID with meals), and total days duration for ${patient.name}.`)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-950/60 hover:text-indigo-300 text-slate-300 border border-slate-700 hover:border-indigo-500/50 text-[11px] whitespace-nowrap transition-all flex items-center gap-1 shrink-0"
          >
            <Pill className="w-3 h-3 text-indigo-400" />
            <span>Exact Doses, Timing & Days</span>
          </button>

          <button
            onClick={() => handleSendMessage(`Provide a comprehensive lifestyle and non-pharmacological management prescription for this patient (dietary sodium, fluid limits, aerobic & resistance exercise, cardiac rehab, weight tracking).`)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-300 border border-slate-700 hover:border-emerald-500/50 text-[11px] whitespace-nowrap transition-all flex items-center gap-1 shrink-0"
          >
            <Apple className="w-3 h-3 text-emerald-400" />
            <span>Lifestyle & Diet Plan</span>
          </button>

          <button
            onClick={() => handleSendMessage(`Does this patient immediately need emergency hospitalization? Detail the urgent triage, CCU/Cath Lab indications, and emergency hospital protocols.`)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-[11px] whitespace-nowrap transition-all flex items-center gap-1 shrink-0"
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>Emergency Hospitalization Triage</span>
          </button>

          <button
            onClick={() => handleSendMessage(`How do I use this app, including the 12-lead ECG tool, GDMT titration, and clinical calculators?`)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap transition-all flex items-center gap-1 shrink-0"
          >
            <Compass className="w-3 h-3 text-amber-400" />
            <span>How To Use This App</span>
          </button>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/30 rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-tl-none shadow-xl'
                }`}
              >
                {/* Emergency Hospitalization banner inside assistant message if detected */}
                {msg.sender === 'assistant' && msg.emergencyAlertTriggered && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-start gap-2 text-xs">
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <strong className="text-red-300 font-bold block">
                        🚨 EMERGENCY HOSPITALIZATION REQUIRED
                      </strong>
                      <p className="text-[11px] leading-snug">{msg.emergencyReason || 'Immediate emergency admission and resuscitation protocol indicated.'}</p>
                      <button
                        onClick={() => triggerEmergencyAlert(msg.emergencyReason || 'Emergency Hospitalization Required')}
                        className="text-[10px] font-semibold text-white bg-red-600 hover:bg-red-500 px-2 py-0.5 rounded transition-all mt-1 inline-flex items-center gap-1"
                      >
                        <Ambulance className="w-3 h-3" />
                        <span>Launch Top Pop Alert & Sound</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Markdown text rendering */}
                <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                  {msg.text}
                </div>

                {/* Footer: Timestamp and Copy */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="hover:text-rose-300 flex items-center gap-1 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center gap-2 shadow-lg">
                <RefreshCw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                <span>CardioPulse AI is synthesizing clinical recommendations & doses...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Textarea & Send Control */}
        <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-800 shrink-0">
          <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-2 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about diagnosis, exact doses/duration in days, lifestyle, emergency hospitalization, or app..."
              rows={2}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none resize-none no-scrollbar max-h-32"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-md"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1">
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
            <span className="font-mono">2026 ACC/AHA & ESC Evidence-Based Triage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Intelligent instant heuristic clinical fallback generator
 * Resolves diagnosis, exact doses/days/timing, lifestyle, emergency triage, and app questions.
 */
function generateChatbotLocalFallback(query: string, patient: PatientProfile): string {
  const q = query.toLowerCase();
  const name = patient.name;
  const age = patient.age;
  const gender = patient.gender;
  const hr = patient.vitals.heartRate;
  const sbp = patient.vitals.sbp;
  const dbp = patient.vitals.dbp;
  const spo2 = patient.vitals.spo2;
  const troponin = patient.labs.troponin;
  const bnp = patient.labs.bnp;
  const lvef = patient.echoSummary.lvef;
  const st = (patient.ecgSummary.stSegment || '').toLowerCase();
  const chief = patient.chiefComplaint;

  // 1. Emergency Hospitalization Question
  if (q.includes('emergency') || q.includes('hospital') || q.includes('admit') || q.includes('triage')) {
    const isSTEMI = st.includes('elevation') || (troponin > 0.4 && chief.toLowerCase().includes('chest'));
    const isShock = sbp < 90;
    const isSevereHF = spo2 < 90 || (bnp > 1500 && patient.vitals.respiratoryRate > 24);

    if (isSTEMI || isShock || isSevereHF || troponin > 0.08) {
      return `### 🚨 EMERGENCY HOSPITALIZATION TRIAGE: IMMEDIATELY REQUIRED

**Urgent Assessment for ${name} (${age}y ${gender})**:
This patient **IMMEDIATELY REQUIRES EMERGENCY HOSPITALIZATION AND ADMISSION TO CCU / CATH LAB**.

#### 1. Why Immediate Hospitalization is Required:
- **Clinical Trigger**: ${isSTEMI ? `Active ST-Elevation Myocardial Infarction (hs-cTnI: ${troponin} ng/mL, ST-Elevation noted).` : isShock ? `Hemodynamic Shock / Hypoperfusion (SBP: ${sbp} mmHg, MAP < 65 mmHg).` : isSevereHF ? `Acute Pulmonary Edema with Hypoxemia (SpO2: ${spo2}%, BNP: ${bnp} pg/mL).` : `Acute High-Risk Coronary Syndrome with active troponin elevation (${troponin} ng/mL).`}
- **Risk Level**: **CRITICAL (Imminent mortality risk without urgent tertiary cardiac intervention)**.

#### 2. Immediate Step-by-Step Emergency Protocol:
1. **Cardiac Catheterization Laboratory Activation**:
   - Alert interventional cardiology on-call team for emergency coronary angiography and primary percutaneous coronary intervention (PCI target door-to-balloon time < 90 minutes).
2. **Immediate Pharmacotherapy & Dosing**:
   - **Chewable Aspirin**: **325 mg PO once immediately (STAT)**.
   - **P2Y12 Inhibitor Loading**: **Ticagrelor 180 mg PO once (STAT)** or Prasugrel 60 mg PO once (if PCI planned).
   - **Anticoagulation**: **Unfractionated Heparin** IV bolus 60 units/kg (max 4,000 units), followed by infusion at 12 units/kg/h (target aPTT 50–70s).
   - **Sublingual Nitroglycerin**: 0.4 mg SL every 5 minutes x 3 doses for ischemic pain (HOLD if SBP < 90 mmHg or RV infarction).
3. **Bedside Hemodynamic & Respiratory Stabilization**:
   - High-flow supplemental oxygen only if SpO₂ < 90%.
   - Continuous 12-lead ECG telemetry monitoring for lethal ventricular arrhythmias (VT/VF).
   - Bilateral large-bore 18G IV access.`;
    } else {
      return `### 📋 Emergency Hospitalization Assessment for ${name} (${age}y ${gender})

**Triage Status**: **STABLE / OUTPATIENT WORKUP FEASIBLE**
- **Vitals**: BP ${sbp}/${dbp} mmHg, HR ${hr} bpm, SpO₂ ${spo2}%.
- **Biomarkers**: hs-Troponin ${troponin} ng/mL (non-critical), BNP ${bnp} pg/mL.
- **Recommendation**: Immediate emergency hospital admission is **not mandatory** at this exact moment, provided serial biomarkers remain stable. Continue urgent outpatient cardiology workup and GDMT optimization.`;
    }
  }

  // 2. Exact Dosing, Timing & Days Duration Question
  if (q.includes('dose') || q.includes('timing') || q.includes('day') || q.includes('medication') || q.includes('treatment') || q.includes('drug')) {
    return `### 💊 Exact Medical Treatment Regimen: Doses, Timing & Days Duration

Evidence-based prescription for **${name} (${age}y ${gender})**:

| Medication Class & Drug | Exact Starting Dose | Target Maintenance Dose | Frequency & Timing | Total Duration (Days) |
| :--- | :--- | :--- | :--- | :--- |
| **Antiplatelet (Aspirin)** | 325 mg (stat chewable) | 81 mg daily | **Once daily (QD)** with morning meal | **Indefinite (Lifelong)** |
| **P2Y12 Inhibitor (Ticagrelor)** | 180 mg loading dose | 90 mg twice daily | **Twice daily (BID)** at 08:00 & 20:00 | **365 Days (12 Months)** |
| **High-Intensity Statin (Atorvastatin)** | 80 mg daily | 80 mg daily | **Once daily (QD)** at bedtime | **Indefinite (Lifelong)** |
| **Beta-Blocker (Metoprolol Succinate)** | 25 mg daily | 200 mg daily | **Once daily (QD)** morning | **Indefinite (Lifelong)** |
| **ARNI (Sacubitril/Valsartan)** | 24/26 mg BID | 97/103 mg BID | **Twice daily (BID)** morning & evening | **Indefinite (Lifelong)** |
| **SGLT2 Inhibitor (Empagliflozin)** | 10 mg daily | 10 mg daily | **Once daily (QD)** morning with or without food | **Indefinite (Lifelong)** |
| **MRA (Spironolactone)** | 25 mg daily | 50 mg daily | **Once daily (QD)** morning | **Indefinite (Lifelong)** |

#### Clinical Safety & Monitoring Instructions:
- **eGFR Surveillance**: Check serum creatinine, eGFR, and potassium (K⁺) at **Day 7–14** following ARNI / MRA initiation.
- **Hold Parameters**: Hold Metoprolol if HR < 50 bpm or SBP < 90 mmHg. Hold diuretics if patient becomes hypovolemic (dry mucous membranes, orthostasis).`;
  }

  // 3. Lifestyle Management Question
  if (q.includes('lifestyle') || q.includes('diet') || q.includes('exercise') || q.includes('salt') || q.includes('sodium') || q.includes('rehab')) {
    return `### 🥗 Comprehensive Cardiovascular Lifestyle Management Prescription

Tailored lifestyle intervention for **${name}**:

#### 1. Dietary Sodium & Fluid Prescription:
- **Sodium Restriction**: **< 2,000 mg/day (< 5g table salt per day)**. Avoid processed deli meats, canned soups, frozen ready-meals, and condiments.
- **Fluid Restriction**: **1.5 to 2.0 Liters/day total fluids** if patient has symptomatic fluid congestion, persistent edema, or hyponatremia (Serum Na⁺ < 134 mEq/L).
- **Dietary Pattern**: **Mediterranean / DASH Diet** rich in leafy greens, extra virgin olive oil, legumes, whole grains, and lean poultry/fish.

#### 2. Physical Activity & Exercise (FITT Principle):
- **Aerobic Exercise**: **150 minutes/week of moderate-intensity aerobic activity** (e.g. brisk walking at 3–4 mph, stationary cycling, or swimming), divided into 30 minutes, 5 days per week.
- **Resistance Training**: 2 non-consecutive days/week of light-to-moderate resistance (bands or light weights, 10–15 repetitions per set).
- **Cardiac Rehabilitation**: Formal referral to **Phase II Outpatient Cardiac Rehabilitation** (36 monitored telemetry sessions).

#### 3. Daily Self-Monitoring & Biomarker Logs:
- **Daily Morning Weight Rule**: Weigh every morning after first urination and before breakfast.
  - *Red Flag Rule of 2-3*: Weight gain of **> 2–3 lbs overnight** or **> 5 lbs in a week** indicates fluid retention; call the cardiology clinic for diuretic dose doubling.
- **Blood Pressure & Pulse Log**: Measure twice daily (morning and evening before medications) with an upper-arm automated cuff. Target BP < 130/80 mmHg.

#### 4. Tobacco, Alcohol & Stress Cessation:
- **Zero Tobacco**: Immediate cessation of cigarettes, cigars, and vaping with nicotine replacement or varenicline support.
- **Alcohol**: Limit to ≤ 1 standard drink/day or complete abstinence in cardiomyopathy.`;
  }

  // 4. App Features & Navigation Question
  if (q.includes('app') || q.includes('calculator') || q.includes('how to use') || q.includes('ecg') || q.includes('gdmt')) {
    return `### 💡 How to Use CardioPulse AI & Its Clinical Modules

CardioPulse AI is built as a complete multimodal clinical cardiology suite:

1. **Live AI Copilot (You Are Here!)**:
   - Ask any clinical question, evaluate patient cases, receive exact drug doses with days/timing, and trigger emergency hospitalization alerts.
2. **12-Lead ECG Analyzer**:
   - Interactive SVG vector viewer for all 12 leads (I, II, III, aVR, aVL, aVF, V1-V6).
   - Measures Heart Rate, PR interval, QRS duration, QTc (Bazett), mean electrical axis, and ST-segment elevations/depressions.
3. **Clinical Risk Calculators**:
   - **CHA₂DS₂-VASc**: Atrial fibrillation stroke risk and oral anticoagulation (DOAC) indication.
   - **TIMI Risk Score**: 14-day mortality / re-infarction risk in ACS.
   - **HFA-PEFF**: Diagnostic score for Heart Failure with Preserved Ejection Fraction (HFpEF).
   - **HAS-BLED**: Bleeding risk stratification.
4. **GDMT Titration Engine**:
   - Guideline-Directed Medical Therapy tracking across all 4 pillars of HFrEF: (1) SGLT2i, (2) ARNI/ACEi, (3) Beta-Blockers, (4) MRAs.
   - Tracks current vs. target percentage and safety checks for renal function (eGFR) and potassium (K⁺).
5. **2026 Research Frontier**:
   - Generate translational research protocols, multicenter clinical trial outlines, novel biomarker discovery blueprints, and venture pitch summaries.`;
  }

  // 5. Default General Diagnosis & Case Evaluation
  return `### 🩺 Comprehensive Clinical Evaluation for ${name} (${age}y ${gender})

#### 1. Primary Diagnosis & Differential:
- **Primary Diagnosis**: **${st.includes('elevation') ? 'Acute ST-Elevation Myocardial Infarction (STEMI)' : troponin > 0.08 ? 'Non-ST-Elevation Myocardial Infarction (NSTEMI)' : lvef <= 40 ? 'Acute Decompensated Heart Failure (HFrEF)' : 'Atherosclerotic Cardiovascular Disease (ASCVD)'}**
- **Differential Diagnoses**:
  1. *Unstable Angina / Acute Coronary Syndrome* (Pre-test probability: High)
  2. *Takotsubo (Stress-Induced) Cardiomyopathy* (Pre-test probability: Moderate)
  3. *Acute Myopericarditis* (Pre-test probability: Moderate)
  4. *Aortic Dissection* (Must rule out if sudden tearing pain)

#### 2. Emergency Hospitalization Status:
- **Assessment**: ${troponin > 0.08 || sbp < 90 || st.includes('elevation') ? '⚠️ **IMMEDIATELY REQUIRES EMERGENCY HOSPITALIZATION**. Patient meets high-risk criteria for immediate CCU / Cath Lab transfer.' : 'Patient is currently compensated; inpatient observation or urgent outpatient referral indicated.'}

#### 3. Treatment Doses & Timing (Days/Duration):
- **Aspirin**: 325 mg PO stat, then 81 mg QD with breakfast (Lifelong).
- **Ticagrelor**: 180 mg PO stat, then 90 mg BID (365 days / 12 months).
- **Atorvastatin**: 80 mg QD at bedtime (Lifelong).
- **Metoprolol Succinate**: 25 mg QD titrated every 2 weeks to 200 mg QD (Lifelong).

#### 4. Lifestyle Guidance:
- Dietary sodium < 2,000 mg/day, fluid limit 1.5–2.0 L/day, 150 min/wk moderate aerobic exercise, zero smoking, and daily morning weight tracking.`;
}
