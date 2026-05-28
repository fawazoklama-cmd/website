/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { ProfileCard } from './components/ProfileCard';
import { CreateRoomForm } from './components/CreateRoomForm';
import { JoinRoomForm } from './components/JoinRoomForm';
import { FlagAlbum } from './components/FlagAlbum';
import { SoloMode } from './components/SoloMode';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';
import { ResultsPanel } from './components/ResultsPanel';
import { TutorialModal } from './components/TutorialModal';
import { playSound } from './utils/audio';
import { Globe, Plus, LogIn, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ScreenView = 'home' | 'create_room' | 'join_room' | 'album' | 'solo';

function AppBody() {
  const { activeRoom, language, t } = useGame();
  const [view, setView] = useState<ScreenView>('home');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // If player is connected to a lobby or live game, display corresponding screen instead of dashboard
  const renderActiveGameScreen = () => {
    if (!activeRoom) return null;

    switch (activeRoom.status) {
      case 'lobby':
        return <Lobby />;
      case 'playing':
        return <GameScreen />;
      case 'results':
        return <ResultsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F9FF] font-sans flex flex-col selection:bg-[#4F9EFF]/20 selection:text-[#4F9EFF]">
      <Navbar
        currentView={view}
        onViewChange={(v) => setView(v)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      <main className="flex-grow p-6 sm:p-10 max-w-7xl w-full mx-auto flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeRoom ? (
            <motion.div
              key="game_session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {renderActiveGameScreen()}
            </motion.div>
          ) : (
            <div className="w-full">
              {view === 'home' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                  
                  {/* Hero Intro Columns */}
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="lg:col-span-3 space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4F9EFF]/10 text-[#4F9EFF] rounded-full text-xs font-bold leading-normal border border-[#4F9EFF]/25">
                        <Globe className="w-4 h-4 animate-spin-slow text-[#4F9EFF]" />
                        <span>Interactive Flag Odyssey</span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight leading-none uppercase">
                        {t.title}
                      </h2>
                      <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line max-w-xl">
                        {t.subtitle}
                      </p>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Solo Practice */}
                      <button
                        id="home_solo_mode_btn"
                        onClick={() => {
                          playSound('click');
                          setView('solo');
                        }}
                        className="p-6 bg-white hover:bg-[#F4F9FF] border border-[#E1F0FF] hover:border-[#4F9EFF] rounded-3xl text-left transition-all duration-150 shadow-soft group flex flex-col h-full justify-between"
                      >
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl w-fit group-hover:scale-105 transition-transform duration-100 mb-6 shrink-0">
                          <Globe className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base">{t.soloMode}</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {language === 'en' 
                              ? 'Practice guessing flags independently with customized timers.' 
                              : 'Latihan menebak bendera dunia mandiri dengan timer kustom.'}
                          </p>
                        </div>
                      </button>

                      {/* Create Room */}
                      <button
                        id="home_create_room_btn"
                        onClick={() => {
                          playSound('click');
                          setView('create_room');
                        }}
                        className="p-6 bg-white hover:bg-[#F4F9FF] border border-[#E1F0FF] hover:border-[#4F9EFF] rounded-3xl text-left transition-all duration-150 shadow-soft group flex flex-col h-full justify-between"
                      >
                        <div className="p-3 bg-[#F0F7FF] text-[#4F9EFF] rounded-2xl w-fit group-hover:scale-105 transition-transform duration-100 mb-6 shrink-0">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base">{t.createRoom}</h3>
                          <p className="text-xs text-slate-400 mt-1">Host and invite peers into customizable region leagues.</p>
                        </div>
                      </button>

                      {/* Join Room */}
                      <button
                        id="home_join_room_btn"
                        onClick={() => {
                          playSound('click');
                          setView('join_room');
                        }}
                        className="p-6 bg-white hover:bg-[#F4F9FF] border border-[#E1F0FF] hover:border-[#4F9EFF] rounded-3xl text-left transition-all duration-150 shadow-soft group flex flex-col h-full justify-between"
                      >
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl w-fit group-hover:scale-105 transition-transform duration-100 mb-6 shrink-0">
                          <LogIn className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base">{t.joinRoom}</h3>
                          <p className="text-xs text-slate-400 mt-1">Paste a lobby code to sync guessing results in real-time.</p>
                        </div>
                      </button>
                    </div>

                    {/* Quick Info Alerts */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#4F9EFF] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs">{t.rules} & Guideline Notes</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                          Open the link in secondary browser tabs side-by-side to act as your fellow players. You can also click <strong className="text-[#4F9EFF]" onClick={() => setIsTutorialOpen(true)}>How to Play</strong> to configure bots.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Profile Cards */}
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="lg:col-span-2 space-y-4"
                  >
                    <ProfileCard />

                    {/* Tab and mobile How to play quick link */}
                    <button
                      id="home_phone_rules_btn"
                      onClick={() => {
                        playSound('click');
                        setIsTutorialOpen(true);
                      }}
                      className="sm:hidden w-full py-4 bg-white border border-[#E1F0FF] text-slate-700 hover:text-[#4F9EFF] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-soft"
                    >
                      <BookOpen className="w-4 h-4" />
                      {t.tutorial} / {t.rules}
                    </button>
                  </motion.div>
                </div>
              )}

              {view === 'create_room' && (
                <CreateRoomForm onBack={() => setView('home')} />
              )}

              {view === 'join_room' && (
                <JoinRoomForm onBack={() => setView('home')} />
              )}

              {view === 'album' && (
                <FlagAlbum />
              )}

              {view === 'solo' && (
                <SoloMode onBack={() => setView('home')} />
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Modern credit footer */}
      <footer className="w-full bg-[#E5F1FF] border-t border-[#D4E8FF] py-5 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
        <span>“Created by FawDev”</span>
      </footer>

      {/* Global Rules Dialog */}
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppBody />
    </GameProvider>
  );
}
