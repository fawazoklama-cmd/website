/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import { BookOpen, Trophy, Mic, Users, HeartHandshake, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { t } = useGame();
  const [activeTab, setActiveTab] = useState<'how' | 'scoring' | 'rooms' | 'voice' | 'bots' | 'credits'>('how');

  const tabs = [
    { id: 'how', label: t.howToPlayTitle, icon: BookOpen },
    { id: 'scoring', label: t.scoringTitle, icon: Trophy },
    { id: 'rooms', label: t.roomGuideTitle, icon: Users },
    { id: 'voice', label: t.voiceChatTitle, icon: Mic },
    { id: 'bots', label: t.botsTitle, icon: HeartHandshake }
  ] as const;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="tutorial_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          id="tutorial_modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E1F0FF]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#F0F7FF] to-[#E5F1FF] border-b border-[#E1F0FF]">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#4F9EFF]" />
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {t.tutorial} & {t.rules}
              </h2>
            </div>
            <button
              id="close_tutorial_btn"
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row h-[55vh] md:h-[500px]">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-60 bg-[#F8FAFC] border-r border-[#E1F0FF] p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    id={`tab_btn_${tab.id}`}
                    key={tab.id}
                    onClick={() => {
                      playSound('hover');
                      setActiveTab(tab.id);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 md:whitespace-normal w-auto md:w-full ${
                      isSelected
                        ? 'bg-[#4F9EFF] text-white shadow-soft font-semibold'
                        : 'text-slate-600 hover:bg-[#F0F7FF] hover:text-[#4F9EFF]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content pane */}
            <div className="flex-1 p-8 overflow-y-auto min-w-0 bg-white">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {activeTab === 'how' && (
                  <div className="space-y-4 text-slate-600">
                    <h3 className="text-lg font-bold text-slate-800">{t.howToPlayTitle}</h3>
                    <p className="leading-relaxed whitespace-pre-line">{t.howToPlayDesc}</p>
                    <div className="p-4 bg-[#F4F9FF] rounded-2xl border border-[#E5F1FF] space-y-2 mt-4">
                      <div className="flex items-center gap-2 font-semibold text-[#4F9EFF]">
                        <BookOpen className="w-4 h-4" />
                        <span>{t.gameModes}:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>{t.worldMode}:</strong> 195 standard official countries from across the entire globe.</li>
                        <li><strong>{t.continentMode}:</strong> Customize to Africa, Asia, Europe, North America, South America, or Oceania pools.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'scoring' && (
                  <div className="space-y-4 text-slate-600">
                    <h3 className="text-lg font-bold text-slate-800">{t.scoringTitle}</h3>
                    <p className="leading-relaxed">{t.scoringDesc}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                        <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl font-bold">10pt</span>
                        <div>
                          <h4 className="font-semibold text-emerald-800">Correct Guess</h4>
                          <p className="text-xs text-emerald-600">Points awarded instantly. Answers lock correctly.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                        <span className="p-2 bg-amber-100 text-amber-600 rounded-xl font-bold">-1</span>
                        <div>
                          <h4 className="font-semibold text-amber-800">Chances Lost</h4>
                          <p className="text-xs text-amber-600">Lose 1 chance on wrong guess. Locked status upon running out.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'rooms' && (
                  <div className="space-y-4 text-slate-600">
                    <h3 className="text-lg font-bold text-slate-800">{t.roomGuideTitle}</h3>
                    <p className="leading-relaxed">{t.roomGuideDesc}</p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mt-4 font-mono text-xs">
                      <div className="font-bold text-slate-700 mb-2">💡 Local Real-Time Multiplayer Sync</div>
                      <p>{t.p2pStatus}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'voice' && (
                  <div className="space-y-4 text-slate-600">
                    <h3 className="text-lg font-bold text-slate-800">{t.voiceChatTitle}</h3>
                    <p className="leading-relaxed">{t.voiceChatDesc}</p>
                    <div className="flex items-center gap-3 p-4 bg-[#F4F9FF] rounded-2xl border border-[#E5F1FF] text-sm text-[#4F9EFF]">
                      <Mic className="w-5 h-5 shrink-0" />
                      <span>Sound indicators will visually react to your physical voice input using standard Web Audio APIs!</span>
                    </div>
                  </div>
                )}

                {activeTab === 'bots' && (
                  <div className="space-y-4 text-slate-600">
                    <h3 className="text-lg font-bold text-slate-800">{t.botsTitle}</h3>
                    <p className="leading-relaxed">{t.botsDesc}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-semibold">SultanFlag (Hard)</span>
                      <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-semibold">MegaGlobe (Medium)</span>
                      <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-semibold">Vexillologist (Hard)</span>
                      <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-semibold">AtlasExplorer (Easy)</span>
                      <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-center text-xs font-semibold">MapWizard (Medium)</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-[#E1F0FF] flex items-center justify-between text-xs text-slate-500">
            <span>{t.creditsTitle}: {t.creditsDesc}</span>
            <span className="font-semibold text-[#4F9EFF]">{t.createdBy}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
