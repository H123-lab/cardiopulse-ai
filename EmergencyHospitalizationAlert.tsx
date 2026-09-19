import React from 'react';
import { 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  X, 
  ArrowRight, 
  Ambulance, 
  ShieldAlert, 
  MessageSquare,
  Sparkles,
  BellOff
} from 'lucide-react';
import { usePatientContext } from '../context/PatientContext';
import { playEmergencyPopSound } from '../utils/audioAlert';

export const EmergencyHospitalizationAlert: React.FC = () => {
  const { 
    isEmergencyAlertActive, 
    emergencyAlertData, 
    emergencyAlertEnabled, 
    setEmergencyAlertEnabled,
    dismissEmergencyAlert,
    turnOffEmergencyAlertsCompletely,
    openChatbotWithPrompt
  } = usePatientContext();

  if (!isEmergencyAlertActive || !emergencyAlertData || !emergencyAlertEnabled) {
    return null;
  }

  const handleOpenEmergencyChat = () => {
    openChatbotWithPrompt(
      `CRITICAL EMERGENCY HOSPITALIZATION CONSULT: This patient (${emergencyAlertData.patientName}, ${emergencyAlertData.patientAge}y) has an emergency hospitalization alert: "${emergencyAlertData.reason}". What is the immediate step-by-step emergency stabilization, medication doses with timing, and inpatient admission protocol?`
    );
  };

  return (
    <div 
      id="emergency-hospitalization-pop-alert"
      role="alert"
      className="fixed top-0 inset-x-0 z-50 animate-in slide-in-from-top duration-300 pointer-events-auto shadow-2xl"
    >
      {/* Top Animated Scrolling Marquee Ticker */}
      <div className="bg-red-950 text-red-200 border-b border-red-800/80 px-4 py-1 text-[11px] font-mono uppercase tracking-wider overflow-hidden flex items-center justify-between">
        <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
          <span className="inline-flex items-center px-2 py-0.2 rounded bg-red-600 text-white font-bold text-[10px] animate-pulse">
            HIGH URGENCY
          </span>
          <div className="flex gap-4 animate-marquee font-semibold text-white">
            <span>🚨 CASE IMMEDIATELY NEEDS EMERGENCY HOSPITALIZATION 🚨</span>
            <span className="text-red-300">• {emergencyAlertData.patientName} ({emergencyAlertData.patientAge}y)</span>
            <span className="text-red-200">• ACTIVATE ICU / CATH LAB STAT</span>
            <span>🚨 CASE IMMEDIATELY NEEDS EMERGENCY HOSPITALIZATION 🚨</span>
            <span className="text-red-300">• {emergencyAlertData.vitalSignsSummary}</span>
          </div>
        </div>

        {/* Quick Audio Mute / Replay Control */}
        <div className="flex items-center gap-2 pl-3">
          <button
            onClick={playEmergencyPopSound}
            title="Replay Emergency Alert Pop Sound"
            className="p-1 text-red-300 hover:text-white hover:bg-red-900/60 rounded transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-red-800">|</span>
          <button
            onClick={turnOffEmergencyAlertsCompletely}
            title="Turn off emergency pop alerts completely"
            className="text-[10px] text-red-300 hover:text-white flex items-center gap-1 hover:underline"
          >
            <BellOff className="w-3 h-3" />
            <span className="hidden sm:inline">Turn Off Alerts</span>
          </button>
        </div>
      </div>

      {/* Main Red Pop Alert Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-3 sm:px-6 shadow-xl border-b-2 border-red-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: Icon & Critical Reason */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <Ambulance className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-black/40 text-yellow-300 px-2 py-0.5 rounded border border-yellow-400/40">
                  IMMEDIATELY NEED EMERGENCY HOSPITALIZATION
                </span>
                <span className="text-xs font-semibold text-white/90">
                  {emergencyAlertData.patientName} ({emergencyAlertData.patientAge}y {emergencyAlertData.patientGender})
                </span>
                <span className="text-[11px] font-mono text-white/80 bg-red-800/40 px-1.5 py-0.5 rounded hidden lg:inline">
                  {emergencyAlertData.vitalSignsSummary}
                </span>
              </div>
              <p className="text-sm font-medium text-white/95 leading-snug">
                {emergencyAlertData.reason}
              </p>
              <p className="text-xs text-yellow-100 font-mono flex items-center gap-1.5 pt-0.5">
                <AlertOctagon className="w-3.5 h-3.5 text-yellow-300 inline shrink-0" />
                <span><strong>Required Action:</strong> {emergencyAlertData.recommendedAction}</span>
              </p>
            </div>
          </div>

          {/* Right: Actions (Open Chatbot, Dismiss, Turn Off) */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-1 md:pt-0">
            <button
              onClick={handleOpenEmergencyChat}
              className="px-3 py-1.5 rounded-lg bg-white text-red-700 hover:bg-red-50 text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-red-600" />
              <span>Ask AI Chatbot Protocol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={dismissEmergencyAlert}
              title="Dismiss this emergency alert banner"
              className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1"
            >
              <span>Dismiss</span>
              <X className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={turnOffEmergencyAlertsCompletely}
              title="Turn off future pop alerts"
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all text-xs"
            >
              <span className="sr-only">Turn off pop alert</span>
              <BellOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
