import React from 'react';
import { 
  Activity, 
  BrainCircuit, 
  Calculator, 
  Pill, 
  Sparkles, 
  FileText, 
  Heart,
  Stethoscope,
  ChevronRight,
  Bot,
  Volume2,
  VolumeX,
  Ambulance,
  MessageSquare,
  ScanLine
} from 'lucide-react';
import { ActiveTab } from '../types';
import { usePatientContext } from '../context/PatientContext';
import { playEmergencyPopSound } from '../utils/audioAlert';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenPromptModal: () => void;
  aiStatus: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenPromptModal,
  aiStatus,
}) => {
  const { 
    setIsChatbotOpen, 
    emergencyAlertEnabled, 
    setEmergencyAlertEnabled,
    patient,
    evaluatePatientEmergencyHospitalization
  } = usePatientContext();

  const evalResult = evaluatePatientEmergencyHospitalization(patient);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-slate-100 shadow-xl">
      {/* Top Clinical Innovation Announcement Bar */}
      <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-indigo-950/70 border-b border-rose-500/20 px-4 py-1 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-4xl truncate">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            2026 MD-PhD INNOVATION
          </span>
          <span className="text-slate-300 truncate hidden sm:inline">
            CardioPulse AI: The First Multimodal Electro-Mechanical Cardiology Copilot & Translational Research Engine
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Emergency Alert Sound & Banner Toggle */}
          <button
            onClick={() => {
              const next = !emergencyAlertEnabled;
              setEmergencyAlertEnabled(next);
              if (next) playEmergencyPopSound();
            }}
            title={emergencyAlertEnabled ? "Emergency Pop Alert is ACTIVE (Click to turn off)" : "Emergency Pop Alert is MUTED / OFF (Click to turn on)"}
            className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded transition-all border ${
              emergencyAlertEnabled 
                ? 'bg-red-950/80 text-red-300 border-red-500/40 hover:bg-red-900/80' 
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {emergencyAlertEnabled ? (
              <>
                <Volume2 className="w-3 h-3 text-red-400" />
                <span className="hidden md:inline">Emergency Pop Alert: <strong>ON</strong></span>
                <span className="md:hidden">Alert: <strong>ON</strong></span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-slate-400" />
                <span className="hidden md:inline">Emergency Pop Alert: <strong>OFF</strong></span>
                <span className="md:hidden">Alert: <strong>OFF</strong></span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className={`inline-block w-2 h-2 rounded-full ${aiStatus ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="font-mono hidden sm:inline">{aiStatus ? 'Gemini 3.8 Flash Active' : 'Heuristic Expert Engine'}</span>
          </div>

          <button
            onClick={onOpenPromptModal}
            className="flex items-center gap-1 text-[11px] font-medium text-rose-300 hover:text-rose-200 transition-colors bg-rose-950/50 hover:bg-rose-900/60 px-2.5 py-0.5 rounded-md border border-rose-500/40"
            title="View the comprehensive developer prompt and scientific blueprint"
          >
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span className="hidden lg:inline">Developer Prompt & Blueprint</span>
            <span className="lg:hidden">Prompt</span>
            <ChevronRight className="w-3 h-3 text-rose-400" />
          </button>
        </div>
      </div>

      {/* Main Header & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-lg shadow-rose-900/40 border border-rose-400/30">
              <Heart className="w-5 h-5 text-white fill-white/80 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  CardioPulse <span className="text-rose-400 font-mono font-medium text-xs px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/30">AI COPILOT</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                ACC / AHA / ESC 2026 Clinical Decision Support & Research Lab
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Single-Click Chatbot Button */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                id="nav-copilot-tab"
                onClick={() => {
                  setActiveTab('copilot');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'copilot'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="View Clinical Copilot Case Manager"
              >
                <BrainCircuit className="w-4 h-4 text-rose-200" />
                <span>AI Copilot</span>
              </button>

              <button
                id="nav-ecg-tab"
                onClick={() => setActiveTab('ecg')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'ecg'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4 text-rose-200" />
                <span>12-Lead ECG</span>
              </button>

              <button
                id="nav-echo-tab"
                onClick={() => setActiveTab('echo')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'echo'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="View Transthoracic Echocardiogram (TTE) 2D Vector Simulator"
              >
                <ScanLine className="w-4 h-4 text-rose-200" />
                <span>TTE Echo</span>
              </button>

              <button
                id="nav-calculators-tab"
                onClick={() => setActiveTab('calculators')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'calculators'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calculator className="w-4 h-4 text-rose-200" />
                <span className="hidden md:inline">Calculators</span>
                <span className="md:hidden">Risk</span>
              </button>

              <button
                id="nav-gdmt-tab"
                onClick={() => setActiveTab('gdmt')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'gdmt'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Pill className="w-4 h-4 text-rose-200" />
                <span className="hidden lg:inline">GDMT Titration</span>
                <span className="lg:hidden">GDMT</span>
              </button>

              <button
                id="nav-research-tab"
                onClick={() => setActiveTab('research')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'research'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-indigo-300" />
                <span className="hidden xl:inline">2026 Research Frontier</span>
                <span className="xl:hidden">Research</span>
              </button>
            </nav>

            {/* Single-Click Instant Open Chatbot Button */}
            <button
              id="header-open-chatbot-btn"
              onClick={() => setIsChatbotOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-950/50 border border-rose-400/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              title="Click to immediately open Live Interactive AI Chatbot"
            >
              <div className="relative">
                <Bot className="w-4 h-4 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <span>Live AI Chatbot</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 hidden sm:inline" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

