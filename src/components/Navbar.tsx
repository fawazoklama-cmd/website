/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import { Globe, BookOpen, Menu, X, Landmark, Plus, LogIn, Heart, Compass } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'create_room' | 'join_room' | 'album' | 'solo';
  onViewChange: (view: 'home' | 'create_room' | 'join_room' | 'album' | 'solo') => void;
  onOpenTutorial: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, onOpenTutorial }) => {
  const { language, setLanguage, activeRoom, leaveRoom, t } = useGame();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLangToggle = (lang: 'en' | 'id') => {
    playSound('click');
    setLanguage(lang);
  };

  const handleNavClick = (view: 'home' | 'create_room' | 'join_room' | 'album' | 'solo') => {
    playSound('click');
    setIsMobileMenuOpen(false);
    
    if (activeRoom) {
      const confirmLeave = window.confirm(
        language === 'en'
          ? 'Leaving this page will disconnect you from the current room. Proceed?'
          : 'Meninggalkan halaman ini akan memutuskan koneksi lobi aktif. Lanjutkan?'
      );
      if (confirmLeave) {
        leaveRoom();
        onViewChange(view);
      }
    } else {
      onViewChange(view);
    }
  };

  return (
    <header className="w-full bg-[#E5F1FF] border-b border-[#D4E8FF] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* Brand identity */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 select-none shrink-0"
        >
          <div className="p-2 bg-white text-[#4F9EFF] rounded-2xl shadow-sm border border-[#E1F0FF] flex items-center justify-center">
            <Globe className="w-6 h-6 animate-spin-slow text-[#4F9EFF]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-none uppercase">
              {t.title}
            </h1>
            <p className="text-[9px] text-[#4F9EFF] font-black tracking-widest uppercase mt-0.5">
              Multiplayer Quiz Arena
            </p>
          </div>
        </div>

        {/* --- DESKTOP NAVIGATION MENU LIST --- */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-white/50 p-1 rounded-2xl border border-[#D4E8FF]">
          
          {/* Home Link */}
          <button
            id="nav_link_home"
            onClick={() => handleNavClick('home')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              currentView === 'home' && !activeRoom
                ? 'bg-[#4F9EFF] text-white shadow-soft font-black'
                : 'text-slate-600 hover:text-[#4F9EFF] hover:bg-[#F4F9FF]'
            }`}
          >
            {language === 'en' ? 'Home' : 'Beranda'}
          </button>

          {/* Practice/Play Game Link */}
          <button
            id="nav_link_solo"
            onClick={() => handleNavClick('solo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              currentView === 'solo'
                ? 'bg-[#4F9EFF] text-white shadow-soft font-black'
                : 'text-slate-600 hover:text-[#4F9EFF] hover:bg-[#F4F9FF]'
            }`}
          >
            {language === 'en' ? 'Solo Practice' : 'Latihan Mandiri'}
          </button>

          {/* Quick Create Link */}
          <button
            id="nav_link_create"
            onClick={() => handleNavClick('create_room')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              currentView === 'create_room'
                ? 'bg-[#4F9EFF] text-white shadow-soft font-black'
                : 'text-slate-600 hover:text-[#4F9EFF] hover:bg-[#F4F9FF]'
            }`}
          >
            {t.createRoom}
          </button>

          {/* Quick Join Link */}
          <button
            id="nav_link_join"
            onClick={() => handleNavClick('join_room')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              currentView === 'join_room'
                ? 'bg-[#4F9EFF] text-white shadow-soft font-black'
                : 'text-slate-600 hover:text-[#4F9EFF] hover:bg-[#F4F9FF]'
            }`}
          >
            {t.joinRoom}
          </button>

          {/* Flag Album Menu Link */}
          <button
            id="nav_link_album"
            onClick={() => handleNavClick('album')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentView === 'album'
                ? 'bg-[#4F9EFF] text-white shadow-soft font-black'
                : 'text-slate-600 hover:text-[#4F9EFF] hover:bg-[#F4F9FF]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>{t.flagAlbum}</span>
          </button>
        </nav>

        {/* Dynamic header widgets (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          
          {/* Tutorial rules dialog picker */}
          <button
            id="navbar_tutorial_btn"
            onClick={() => {
              playSound('click');
              onOpenTutorial();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#4F9EFF] bg-white hover:bg-[#F4F9FF] px-3.5 py-2 rounded-xl border border-[#E1F0FF] shadow-sm transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#4F9EFF]" />
            <span>{t.tutorial} / {t.rules}</span>
          </button>

          {/* Lang selector button toggles */}
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-[#E1F0FF] shadow-inner">
            <button
              id="lang_toggle_en"
              onClick={() => handleLangToggle('en')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black tracking-wider transition-all ${
                language === 'en'
                  ? 'bg-[#4F9EFF] text-white shadow-soft'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              EN
            </button>
            <button
              id="lang_toggle_id"
              onClick={() => handleLangToggle('id')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black tracking-wider transition-all ${
                language === 'id'
                  ? 'bg-[#4F9EFF] text-white shadow-soft'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              ID
            </button>
          </div>
        </div>

        {/* Mobile Hamburger toggle button */}
        <div className="flex items-center gap-2 lg:hidden">
          
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-[#E1F0FF]">
            <button
              onClick={() => handleLangToggle('en')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                language === 'en' ? 'bg-[#4F9EFF] text-white' : 'text-slate-400'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLangToggle('id')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                language === 'id' ? 'bg-[#4F9EFF] text-white' : 'text-slate-400'
              }`}
            >
              ID
            </button>
          </div>

          <button
            id="mobile_hamburger_toggle"
            onClick={() => {
              playSound('click');
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="p-2 bg-white text-slate-600 active:text-[#4F9EFF] border border-[#E1F0FF] rounded-xl hover:bg-slate-50 flex items-center justify-center shadow-sm"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* --- MOBILE ACCORDION DRAWER LIST --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D4E8FF] bg-white text-slate-800 px-4 py-3.5 space-y-2 animate-fade-in shadow-inner">
          <button
            id="mobile_nav_home"
            onClick={() => handleNavClick('home')}
            className="w-full text-left py-2 px-3 hover:bg-[#F4F9FF] hover:text-[#4F9EFF] rounded-xl text-xs font-bold transition-all block"
          >
            🏠 {language === 'en' ? 'Home' : 'Beranda'}
          </button>

          <button
            id="mobile_nav_solo"
            onClick={() => handleNavClick('solo')}
            className={`w-full text-left py-2 px-3 hover:bg-[#F4F9FF] hover:text-[#4F9EFF] rounded-xl text-xs font-bold transition-all block ${
              currentView === 'solo' ? 'bg-[#F4F9FF] text-[#4F9EFF]' : ''
            }`}
          >
            🎯 {language === 'en' ? 'Solo Practice' : 'Latihan Mandiri'}
          </button>

          <button
            id="mobile_nav_create"
            onClick={() => handleNavClick('create_room')}
            className="w-full text-left py-2 px-3 hover:bg-[#F4F9FF] hover:text-[#4F9EFF] rounded-xl text-xs font-bold transition-all block"
          >
            ➕ {t.createRoom}
          </button>

          <button
            id="mobile_nav_join"
            onClick={() => handleNavClick('join_room')}
            className="w-full text-left py-2 px-3 hover:bg-[#F4F9FF] hover:text-[#4F9EFF] rounded-xl text-xs font-bold transition-all block"
          >
            🚪 {t.joinRoom}
          </button>

          <button
            id="mobile_nav_album"
            onClick={() => handleNavClick('album')}
            className="w-full text-left py-2 px-3 hover:bg-[#F4F9FF] hover:text-[#4F9EFF] rounded-xl text-xs font-bold transition-all block bg-[#F4F9FF] border border-[#E1F0FF] text-[#4F9EFF]"
          >
            🗺️ {t.flagAlbum}
          </button>

          <button
            id="mobile_nav_tutorial"
            onClick={() => {
              playSound('click');
              setIsMobileMenuOpen(false);
              onOpenTutorial();
            }}
            className="w-full text-left py-2 px-3 hover:bg-[#F4F9FF] hover:text-[#4F9EFF] rounded-xl text-xs font-bold transition-all block"
          >
            📖 {t.tutorial} / {t.rules}
          </button>
        </div>
      )}
    </header>
  );
};
