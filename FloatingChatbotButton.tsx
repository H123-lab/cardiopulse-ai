import React from 'react';
import { Bot, Sparkles, MessageSquare, Ambulance } from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';

export const FloatingChatbotButton: React.FC = () => {
  const { isChatbotOpen, setIsChatbotOpen, patient, evaluatePatientEmergencyHospitalization } = usePatientContext();

  // If chatbot is already open, keep button subtle or hidden
  if (isChatbotOpen) return null;

  const evalResult = evaluatePatientEmergencyHospitalization(patient);

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        id="floating-live-ai-chatbot-btn"
        onClick={() => setIsChatbotOpen(true)}
        className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border ${
          evalResult.needed
            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-400 shadow-red-900/50 animate-pulse'
            : 'bg-gradient-to-r from-rose-600 to-red-700 text-white border-rose-400/40 shadow-rose-950/60 hover:shadow-rose-900/80'
        }`}
        title="Click to open Live AI Cardiology Chatbot (Instant Q&A, Doses, Days, Lifestyle & Hospitalization Alerts)"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {evalResult.needed ? (
              <Ambulance className="w-4 h-4 text-white animate-bounce" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping"></span>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
        </div>

        <div className="text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-wide">Live AI Chatbot</span>
            <Sparkles className="w-3 h-3 text-yellow-300" />
          </div>
          <p className="text-[10px] text-rose-100 font-medium leading-none">
            {evalResult.needed ? '⚠️ Emergency Triage Alert' : 'Ask Anything • Single Click'}
          </p>
        </div>
      </button>
    </div>
  );
};
