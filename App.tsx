/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AICopilotView } from './components/AICopilotView';
import { ECGAnalyzerView } from './components/ECGAnalyzerView';
import { EchoSimulatorView } from './components/EchoSimulatorView';
import { CalculatorsView } from './components/CalculatorsView';
import { GDMTView } from './components/GDMTView';
import { ResearchLabView } from './components/ResearchLabView';
import { DeveloperPromptModal } from './components/DeveloperPromptModal';
import { EmergencyHospitalizationAlert } from './components/EmergencyHospitalizationAlert';
import { LiveChatbotModal } from './components/LiveChatbotModal';
import { FloatingChatbotButton } from './components/FloatingChatbotButton';
import { PatientProvider } from './context/PatientContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ActiveTab } from './types';
import { 
  Heart, 
  Sparkles, 
  ShieldAlert, 
  ExternalLink,
  Award,
  Stethoscope
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('copilot');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [aiAvailable, setAiAvailable] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.aiAvailable) {
          setAiAvailable(true);
        }
      })
      .catch((err) => console.log('API health check error:', err));
  }, []);

  return (
    <PatientProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-rose-500/20 selection:text-rose-200">
        {/* Red Scrolling Down Emergency Hospitalization Pop Alert */}
        <EmergencyHospitalizationAlert />

        {/* Top Application Header with Navigation and Single-Click Live Chatbot button */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenPromptModal={() => setIsPromptModalOpen(true)}
          aiStatus={aiAvailable}
        />

        {/* Main Clinical & Research Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary fallbackTitle="Clinical Module View">
            {activeTab === 'copilot' && <AICopilotView />}
            {activeTab === 'ecg' && <ECGAnalyzerView />}
            {activeTab === 'echo' && <EchoSimulatorView />}
            {activeTab === 'calculators' && <CalculatorsView />}
            {activeTab === 'gdmt' && <GDMTView />}
            {activeTab === 'research' && <ResearchLabView />}
          </ErrorBoundary>
        </main>

        {/* Bottom Sticky Innovation / Developer Prompt Quick-Callout */}
        <div className="border-t border-slate-900 bg-slate-950/90 py-3 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>
                <strong className="text-slate-200">CardioPulse AI</strong> • Designed by an MD, PhD Physician-Scientist for 2026 Academic Innovation & Investor Commercialization.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="text-rose-300 hover:text-rose-200 flex items-center gap-1 font-semibold underline underline-offset-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Get Developer Prompt & $10M+ Pitch Deck</span>
              </button>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Grounded in 2024–2026 ACC/AHA & ESC Guidelines
              </span>
            </div>
          </div>
        </div>

        {/* Full Developer & Grant Prompt Modal */}
        <DeveloperPromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
        />

        {/* Floating Persistent Single-Click Chatbot Button */}
        <FloatingChatbotButton />

        {/* Live Interactive AI Copilot Chatbot Modal / Drawer */}
        <LiveChatbotModal />
      </div>
    </PatientProvider>
  );
}
