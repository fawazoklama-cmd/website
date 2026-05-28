/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { COUNTRIES, getFlagUrl } from '../data/flags';
import { Country, Continent } from '../types';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Heart, ArrowLeftRight, Play, RefreshCw, X, 
  Check, Award, BookOpen, Layers, Sparkles, Filter, Info, InfoIcon 
} from 'lucide-react';

type SubTab = 'browse' | 'flashcards' | 'compare' | 'practice';

export const FlagAlbum: React.FC = () => {
  const { language, t } = useGame();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('browse');

  // --- FA VORITES STATE (Persistent) ---
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('world_flag_guessing_game_favs');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (countryCode: string) => {
    playSound('click');
    setFavorites((prev) => {
      const updated = prev.includes(countryCode)
        ? prev.filter((c) => c !== countryCode)
        : [...prev, countryCode];
      localStorage.setItem('world_flag_guessing_game_favs', JSON.stringify(updated));
      return updated;
    });
  };

  // --- EXPLORE / BROWSE STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<Continent | 'All'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'continent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [favoritesOnlyFilter, setFavoritesOnlyFilter] = useState(false);
  const [selectedCountryDetails, setSelectedCountryDetails] = useState<Country | null>(null);

  // --- FLASHCARDS STATE ---
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- COMPARISON STATE ---
  const [compareCodeA, setCompareCodeA] = useState<string>('id'); // Indonesia
  const [compareCodeB, setCompareCodeB] = useState<string>('pl'); // Poland
  
  // --- PRACTICE QUIZ STATE ---
  const [practiceContinent, setPracticeContinent] = useState<Continent | 'All'>('All');
  const [practiceStatus, setPracticeStatus] = useState<'setup' | 'playing' | 'ended'>('setup');
  const [practiceQuestions, setPracticeQuestions] = useState<{
    flagUrl: string;
    correctCountry: Country;
    options: Country[];
  }[]>([]);
  const [currentPracticeIdx, setCurrentPracticeIdx] = useState(0);
  const [practiceScore, setPracticeScore] = useState(0);
  const [selectedPracticeAnswer, setSelectedPracticeAnswer] = useState<string | null>(null);
  const [hasCheckedPracticeAnswer, setHasCheckedPracticeAnswer] = useState(false);

  // --- FILTER & SORT COUNTRIES ---
  const filteredCountries = COUNTRIES.filter((c) => {
    const nameMatch = (language === 'en' ? c.name.en : c.name.id)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const continentMatch = selectedContinent === 'All' || c.continent === selectedContinent;
    const favoriteMatch = !favoritesOnlyFilter || favorites.includes(c.code);
    return nameMatch && continentMatch && favoriteMatch;
  }).sort((a, b) => {
    if (sortBy === 'continent') {
      const contCompare = a.continent.localeCompare(b.continent);
      if (contCompare !== 0) return contCompare;
    }
    const nameA = language === 'en' ? a.name.en : a.name.id;
    const nameB = language === 'en' ? b.name.en : b.name.id;
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  // Reset Flashcards when filtered list changes or sub-tab toggles
  useEffect(() => {
    setFlashcardIndex(0);
    setIsFlipped(false);
  }, [activeSubTab, selectedContinent, favoritesOnlyFilter]);

  // Handle flashcard navigation
  const handleNextFlashcard = () => {
    playSound('click');
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % Math.max(1, filteredCountries.length));
    }, 150);
  };

  const handlePrevFlashcard = () => {
    playSound('click');
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev - 1 + filteredCountries.length) % Math.max(1, filteredCountries.length));
    }, 150);
  };

  // --- PRACTICE QUIZ IMPLEMENTATION ---
  const startNewPractice = (continent: Continent | 'All') => {
    playSound('click');
    let pool = COUNTRIES;
    if (continent !== 'All') {
      pool = COUNTRIES.filter((c) => c.continent === continent);
    }
    
    // Pick 10 random countries
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    const questionsList = shuffled.map((correctCountry) => {
      const wrongPool = pool.filter((c) => c.code !== correctCountry.code);
      const shuffledWrong = [...wrongPool].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctCountry, ...shuffledWrong].sort(() => Math.random() - 0.5);
      return {
        flagUrl: getFlagUrl(correctCountry.code),
        correctCountry,
        options,
      };
    });

    setPracticeQuestions(questionsList);
    setCurrentPracticeIdx(0);
    setPracticeScore(0);
    setSelectedPracticeAnswer(null);
    setHasCheckedPracticeAnswer(false);
    setPracticeStatus('playing');
  };

  const handleSelectPracticeAnswer = (code: string) => {
    if (hasCheckedPracticeAnswer) return;
    setSelectedPracticeAnswer(code);
  };

  const checkPracticeAnswer = () => {
    if (!selectedPracticeAnswer || hasCheckedPracticeAnswer) return;
    
    const currentQ = practiceQuestions[currentPracticeIdx];
    const isCorrect = selectedPracticeAnswer === currentQ.correctCountry.code;

    if (isCorrect) {
      playSound('victory');
      setPracticeScore((prev) => prev + 1);
    } else {
      playSound('victory'); // uses feedback channel
    }

    setHasCheckedPracticeAnswer(true);
  };

  const nextPracticeQuestion = () => {
    playSound('click');
    if (currentPracticeIdx + 1 >= practiceQuestions.length) {
      setPracticeStatus('ended');
    } else {
      setCurrentPracticeIdx((prev) => prev + 1);
      setSelectedPracticeAnswer(null);
      setHasCheckedPracticeAnswer(false);
    }
  };

  // --- HELPERS FOR FLAG COMPARISON ---
  const countryA = COUNTRIES.find((c) => c.code === compareCodeA) || COUNTRIES[0];
  const countryB = COUNTRIES.find((c) => c.code === compareCodeB) || COUNTRIES[1];

  const checkResemblance = (codeA: string, codeB: string): 'very_similar' | 'different' => {
    const pairs = [
      ['id', 'pl'], ['id', 'mc'], ['pl', 'mc'], // Indonesia, Poland, Monaco
      ['ro', 'td'], // Romania, Chad
      ['ie', 'ci'], // Ireland, Ivory Coast
      ['nz', 'au'], // New Zealand, Australia
      ['nl', 'lu'], // Netherlands, Luxembourg
      ['ru', 'sk', 'si'], // Slavic horizontal tricolors
      ['no', 'is'], // Norway, Iceland structural inversion
    ];
    
    const isMatched = pairs.some((p) => p.includes(codeA) && p.includes(codeB));
    return isMatched ? 'very_similar' : 'different';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-soft">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
              <span>{t.flagAlbum}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {t.flagAlbum} / {language === 'en' ? 'Flag Library' : 'Pustaka Bendera'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-50/90 font-medium leading-relaxed">
              {language === 'en' 
                ? 'Master all 195 Sovereign UN-recognized nation flags with interactive modules. Bookmark favorites, analyze duplicates, and challenge yourself with quick tests.'
                : 'Kuasai seluruh 195 bendera negara berdaulat dunia sebelum bertanding. Tandai bendera favorit, bandingkan kemiripan visual, dan uji pemahamanmu.'
              }
            </p>
          </div>

          {/* Module Selector tabs inside banner with deep active states */}
          <div className="flex flex-wrap gap-2 shrink-0 bg-white/15 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => { playSound('click'); setActiveSubTab('browse'); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'browse'
                  ? 'bg-white text-[#4F9EFF] shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {language === 'en' ? 'Browse' : 'Jelajahi'}
            </button>
            <button
              onClick={() => { playSound('click'); setActiveSubTab('flashcards'); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'flashcards'
                  ? 'bg-white text-[#4F9EFF] shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {t.flashcards}
            </button>
            <button
              onClick={() => { playSound('click'); setActiveSubTab('compare'); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'compare'
                  ? 'bg-white text-[#4F9EFF] shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {language === 'en' ? 'Compare' : 'Komparasi'}
            </button>
            <button
              onClick={() => { playSound('click'); setActiveSubTab('practice'); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'practice'
                  ? 'bg-white text-[#4F9EFF] shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              {language === 'en' ? 'Quiz Test' : 'Kuis Kustom'}
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA CHOSEN VIA SUB-TABS --- */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: BROWSE ALL FLAGS */}
        {activeSubTab === 'browse' && (
          <motion.div
            key="browse_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* SEARCH & FILTERS CONTROLS PANEL */}
            <div className="bg-white p-5 rounded-3xl border border-[#E1F0FF] shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Clean search element */}
                <div className="w-full md:max-w-md relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F9FF] border border-[#E1F0FF] rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#4F9EFF] transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sub-filters including bookmarks and sorting */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  
                  {/* Bookmark Filter */}
                  <button
                    id="filter_favorites_btn"
                    onClick={() => { playSound('click'); setFavoritesOnlyFilter(!favoritesOnlyFilter); }}
                    className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all ${
                      favoritesOnlyFilter
                        ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-[#4F9EFF]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favoritesOnlyFilter ? 'fill-[#FF5F7E]' : ''}`} />
                    <span>{t.favoritesOnly} ({favorites.length})</span>
                  </button>

                  {/* Ordering Criteria */}
                  <select
                    id="album_sorting_criteria"
                    value={sortBy}
                    onChange={(e) => { playSound('click'); setSortBy(e.target.value as 'name' | 'continent'); }}
                    className="px-3 py-2.5 text-xs font-bold rounded-2xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-[#4F9EFF]"
                  >
                    <option value="name">Sort A-Z (Alphabetical)</option>
                    <option value="continent">Group by Continent</option>
                  </select>

                  {/* Asc / Desc directions */}
                  <button
                    onClick={() => { playSound('click'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                    className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:border-[#4F9EFF] font-bold text-xs"
                    title={sortOrder === 'asc' ? 'Descending Order' : 'Ascending Order'}
                  >
                    {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                  </button>
                </div>
              </div>

              {/* CONTINENT CATEGORIES CHIPS BAR */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {t.filterContinent}
                </span>

                <div className="flex flex-wrap gap-2">
                  {(['All', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'] as const).map((continent) => {
                    const isActive = selectedContinent === continent;
                    return (
                      <button
                        key={continent}
                        onClick={() => { playSound('click'); setSelectedContinent(continent); }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isActive
                            ? 'bg-[#4F9EFF] border-[#4F9EFF] text-white shadow-soft font-black'
                            : 'bg-[#F4F9FF] border-[#E1F0FF] text-slate-500 hover:text-[#4F9EFF] hover:bg-white'
                        }`}
                      >
                        {continent === 'All' ? t.allContinents : continent}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RESULTS BENTO GRID */}
            {filteredCountries.length === 0 ? (
              <div className="text-center bg-white border border-[#E1F0FF] rounded-3xl p-16 space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-slate-700 text-lg">{t.noFlagsFound}</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  {language === 'en'
                    ? 'Try adjusting filters or typing another keyword to browse our 195 country flag archives.'
                    : 'Atur ulang benua pilihan atau hapus kata sandi pencarian untuk mengulang pemindaian.'
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedContinent('All');
                    setFavoritesOnlyFilter(false);
                    playSound('click');
                  }}
                  className="px-5 py-2.5 bg-[#4F9EFF] hover:bg-[#3D8BE0] text-white rounded-2xl text-xs font-bold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredCountries.map((country) => {
                  const isFav = favorites.includes(country.code);
                  const localizedName = language === 'en' ? country.name.en : country.name.id;
                  
                  return (
                    <motion.div
                      layout
                      key={country.code}
                      className="bg-white rounded-3xl border border-[#E1F0FF] hover:border-[#6CB7FF] shadow-soft overflow-hidden group flex flex-col justify-between transition-all"
                    >
                      {/* Flag Image Top Area */}
                      <div className="relative aspect-[3/2] bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden cursor-zoom-in"
                        onClick={() => { playSound('click'); setSelectedCountryDetails(country); }}
                      >
                        <img
                          src={getFlagUrl(country.code)}
                          alt={localizedName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />

                        {/* Top-Right Heart Bookmark Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(country.code);
                          }}
                          className={`absolute top-2.5 right-2.5 p-2 rounded-full border shadow-sm backdrop-blur-md opacity-95 hover:scale-105 active:scale-95 transition-all ${
                            isFav
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'bg-white/80 border-slate-100 text-slate-400 hover:text-rose-500'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        {/* Hover Overlay info label */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-between text-white text-[11px] font-bold">
                          <span>Continent: {country.continent}</span>
                          <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" /> Info
                          </span>
                        </div>
                      </div>

                      {/* Decriptive lower tags */}
                      <div className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-[#4F9EFF] bg-[#F4F9FF] px-2.5 py-1 rounded-lg border border-[#E1F0FF] font-mono leading-none">
                            {country.code.toUpperCase()}
                          </span>
                          <span className="text-sm font-bold" title="Flag Emoji">
                            {country.emoji}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm truncate pt-1 leading-tight">
                          {localizedName}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold leading-none">
                          {country.continent}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: STUDY / FLASHCARDS MODE */}
        {activeSubTab === 'flashcards' && (
          <motion.div
            key="flashcards_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-xl mx-auto space-y-6"
          >
            {filteredCountries.length === 0 ? (
              <div className="text-center bg-white p-12 border border-[#E1F0FF] rounded-3xl">
                <p className="text-slate-500 text-xs font-bold leading-normal">
                  {language === 'en' 
                    ? 'No bookmarks available. Bookmark some flags from the Browse tab to review them as flashcards!' 
                    : 'Tidak ada filter tersimpan. Sukai / favoritkan beberapa bendera di tab Jelajah untuk melatih pemahamanmu!'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Visual statistics counter */}
                <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400">
                  <span>
                    Card {flashcardIndex + 1} of {filteredCountries.length}
                  </span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                    {filteredCountries[flashcardIndex].continent}
                  </span>
                </div>

                {/* ANIMATED FLIP FLASHCARD STAGE */}
                <div
                  className="w-full aspect-[4/3] rounded-[32px] cursor-pointer relative preserve-3d"
                  style={{ perspective: '1000px' }}
                  onClick={() => {
                    playSound('click');
                    setIsFlipped(!isFlipped);
                  }}
                >
                  <motion.div
                    className="w-full h-full relative transition-transform duration-500 rounded-[32px]"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                  >
                    
                    {/* CARD FRONT: Large Country Flag Image */}
                    <div 
                      className="absolute inset-0 bg-white border border-[#E1F0FF] rounded-[32px] overflow-hidden flex flex-col justify-between p-6 shadow-soft"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {t.studyMode} • {filteredCountries[flashcardIndex].continent}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {filteredCountries[flashcardIndex].emoji}
                        </span>
                      </div>

                      <div className="w-full flex-grow flex items-center justify-center p-4">
                        <img
                          src={getFlagUrl(filteredCountries[flashcardIndex].code)}
                          alt="Flag"
                          className="max-h-32 rounded-xl object-contain shadow-md"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-center text-slate-300 text-xs font-bold animate-pulse">
                        💡 {language === 'en' ? 'Click card to flip & reveal name' : 'Klik kartu untuk membalik & melisir nama'}
                      </div>
                    </div>

                    {/* CARD BACK: Translations & Continent info */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-[#E1F0FF] to-white border-2 border-[#4F9EFF] rounded-[32px] p-6 flex flex-col justify-between text-center shadow-md select-none"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#4F9EFF]">
                          Vexillological Card Back
                        </span>
                        <Heart 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(filteredCountries[flashcardIndex].code);
                          }}
                          className={`w-5 h-5 transition-transform hover:scale-110 active:scale-95 ${
                            favorites.includes(filteredCountries[flashcardIndex].code)
                              ? 'text-rose-500 fill-current'
                              : 'text-slate-400'
                          }`}
                        />
                      </div>

                      <div className="space-y-4">
                        <span className="inline-block px-3.5 py-1.5 bg-[#4F9EFF]/10 border border-[#4F9EFF]/25 text-[#4F9EFF] text-xs font-extrabold rounded-full font-mono">
                          ISO: {filteredCountries[flashcardIndex].code.toUpperCase()}
                        </span>
                        <div className="space-y-2">
                          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            {filteredCountries[flashcardIndex].name.en}
                          </h2>
                          {filteredCountries[flashcardIndex].name.id !== filteredCountries[flashcardIndex].name.en && (
                            <h3 className="text-lg font-bold text-slate-500">
                              🇮🇩 {filteredCountries[flashcardIndex].name.id}
                            </h3>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-semibold uppercase">
                          Continent: {filteredCountries[flashcardIndex].continent}
                        </p>
                      </div>

                      <div className="text-[#4F9EFF] text-[11px] font-bold">
                        {language === 'en' ? 'Click once more to verify flag' : 'Klik sekali lagi untuk memverifikasi bendera'}
                      </div>
                    </div>

                  </motion.div>
                </div>

                {/* FLASHCARD CONTROLS */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handlePrevFlashcard}
                    className="flex-1 py-3.5 bg-white border border-[#E1F0FF] hover:bg-[#F4F9FF] text-slate-700 px-6 rounded-2xl text-xs font-bold transition-all"
                  >
                    ← {t.prevCard}
                  </button>
                  <button
                    onClick={handleNextFlashcard}
                    className="flex-1 py-3.5 bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] text-white px-6 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    {t.nextCard} →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 3: FLAG COMPARISON MODE */}
        {activeSubTab === 'compare' && (
          <motion.div
            key="compare_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header explanation */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-[#4F9EFF] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800">{t.comparisonTitle}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.comparisonChoosePrompt}
                </p>
              </div>
            </div>

            {/* TWO COLUMNS COMPARATOR STAGE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* COMPARAND A */}
              <div className="bg-white p-5 rounded-3xl border border-[#E1F0FF] space-y-4 shadow-soft">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Flag Comparand A
                  </label>
                  <select
                    id="compare_selector_a"
                    value={compareCodeA}
                    onChange={(e) => { playSound('click'); setCompareCodeA(e.target.value); }}
                    className="w-full px-3 py-2.5 text-xs font-bold bg-[#F4F9FF] border border-[#E1F0FF] rounded-2xl outline-none focus:border-[#4F9EFF]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={`comp_a_${c.code}`} value={c.code}>
                        {c.emoji} {language === 'en' ? c.name.en : c.name.id} ({c.continent})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="aspect-[3/2] bg-slate-50 border border-slate-100 rounded-2xl bg-grid-pattern p-4 flex items-center justify-center">
                  <img
                    src={getFlagUrl(countryA.code)}
                    alt={countryA.name.en}
                    className="max-h-36 rounded-lg shadow-md object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center justify-between">
                    <span>{language === 'en' ? countryA.name.en : countryA.name.id}</span>
                    <span className="font-normal font-mono text-xs">{countryA.code.toUpperCase()}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <span className="bg-[#F4F9FF] p-2 rounded-xl">Continent: <strong>{countryA.continent}</strong></span>
                    <span className="bg-[#F4F9FF] p-2 rounded-xl">Symbol: <strong>{countryA.emoji}</strong></span>
                  </div>
                </div>
              </div>

              {/* COMPARAND B */}
              <div className="bg-white p-5 rounded-3xl border border-[#E1F0FF] space-y-4 shadow-soft">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Flag Comparand B
                  </label>
                  <select
                    id="compare_selector_b"
                    value={compareCodeB}
                    onChange={(e) => { playSound('click'); setCompareCodeB(e.target.value); }}
                    className="w-full px-3 py-2.5 text-xs font-bold bg-[#F4F9FF] border border-[#E1F0FF] rounded-2xl outline-none focus:border-[#4F9EFF]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={`comp_b_${c.code}`} value={c.code}>
                        {c.emoji} {language === 'en' ? c.name.en : c.name.id} ({c.continent})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="aspect-[3/2] bg-slate-50 border border-slate-100 rounded-2xl bg-grid-pattern p-4 flex items-center justify-center">
                  <img
                    src={getFlagUrl(countryB.code)}
                    alt={countryB.name.en}
                    className="max-h-36 rounded-lg shadow-md object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center justify-between">
                    <span>{language === 'en' ? countryB.name.en : countryB.name.id}</span>
                    <span className="font-normal font-mono text-xs">{countryB.code.toUpperCase()}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <span className="bg-[#F4F9FF] p-2 rounded-xl">Continent: <strong>{countryB.continent}</strong></span>
                    <span className="bg-[#F4F9FF] p-2 rounded-xl">Symbol: <strong>{countryB.emoji}</strong></span>
                  </div>
                </div>
              </div>

            </div>

            {/* RESEMBLANCE SUMMARY REPORT */}
            <div className="p-6 rounded-3xl border text-center transition-all shadow-soft bg-white border-[#E1F0FF]">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                Vexillology Analysis
              </h3>
              
              <div className="mt-3 flex flex-col items-center justify-center space-y-2">
                {checkResemblance(countryA.code, countryB.code) === 'very_similar' ? (
                  <div className="inline-flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-rose-500 fill-current" />
                    <span>Highly Resembling Duo!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Distinct layouts</span>
                  </div>
                )}

                <p className="text-xs text-slate-500 max-w-lg leading-relaxed pt-1">
                  {checkResemblance(countryA.code, countryB.code) === 'very_similar'
                    ? t.comparisonResultSimilar
                    : t.comparisonResultDifferent
                  }
                </p>
              </div>
            </div>

          </motion.div>
        )}

        {/* VIEW 4: SELF PRACTICE AREA */}
        {activeSubTab === 'practice' && (
          <motion.div
            key="practice_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-xl mx-auto"
          >
            {/* SETUP STATE */}
            {practiceStatus === 'setup' && (
              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#E1F0FF] shadow-soft space-y-6 text-center">
                <div className="p-4 bg-[#F4F9FF] text-[#4F9EFF] rounded-3xl w-fit mx-auto border border-[#E1F0FF]">
                  <Award className="w-10 h-10 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {t.testYourself}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                    {language === 'en'
                      ? 'Test your flag recognition skills on a short, casual 10-question quiz. No player competition, no lobbies, pure study!'
                      : 'Latihlah memorimu dengan kuis kasual 10 pertanyaan tanpa diburu waktu. Bebas persaingan untuk mengukur kemajuan belajarmu!'}
                  </p>
                </div>

                {/* Choose practice scope */}
                <div className="space-y-3 pt-3 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Choose Practice Continent Group
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['All', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'] as const).map((continent) => {
                      const isActive = practiceContinent === continent;
                      return (
                        <button
                          key={`practice_sc_${continent}`}
                          onClick={() => { playSound('click'); setPracticeContinent(continent); }}
                          className={`px-3 py-2.5 rounded-2xl text-xs font-bold border transition-all text-center ${
                            isActive
                              ? 'bg-[#4F9EFF] border-[#4F9EFF] text-white shadow-soft font-black'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-[#4F9EFF]'
                          }`}
                        >
                          {continent === 'All' ? 'All (World Mode)' : continent}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  id="album_start_practice_btn"
                  onClick={() => startNewPractice(practiceContinent)}
                  className="w-full py-4 bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] text-white rounded-2xl text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t.startPractice}
                </button>
              </div>
            )}

            {/* LIVE PLAYING PRACTICE STATE */}
            {practiceStatus === 'playing' && practiceQuestions[currentPracticeIdx] && (
              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#E1F0FF] shadow-soft space-y-6">
                
                {/* Stats row headers */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Question {currentPracticeIdx + 1} of {practiceQuestions.length}</span>
                  <div className="flex items-center gap-1 bg-[#F4F9FF] px-2.5 py-1 rounded-xl text-[#4F9EFF] border border-[#E1F0FF]">
                    <Award className="w-3.5 h-3.5" />
                    <span>{practiceScore} pts / {t.scoreLabel}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#F4F9FF] h-2 rounded-full overflow-hidden border border-[#E1F0FF]">
                  <div 
                    className="bg-[#4F9EFF] h-full transition-all duration-300"
                    style={{ width: `${((currentPracticeIdx + 1) / practiceQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Active Question Flag */}
                <div className="aspect-[3/2] bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden bg-grid-pattern shadow-inner">
                  <img
                    src={practiceQuestions[currentPracticeIdx].flagUrl}
                    alt="Identify Flag"
                    className="max-h-36 rounded-lg shadow-md object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="text-center font-extrabold text-slate-700 text-sm">
                  {t.practiceQuestion}
                </h3>

                {/* Options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {practiceQuestions[currentPracticeIdx].options.map((option) => {
                    const isSelected = selectedPracticeAnswer === option.code;
                    const isCorrectOption = option.code === practiceQuestions[currentPracticeIdx].correctCountry.code;
                    
                    let btnStyle = 'border-slate-200 bg-white text-slate-700 hover:border-[#4F9EFF] hover:bg-[#F4F9FF]';
                    
                    if (hasCheckedPracticeAnswer) {
                      if (isCorrectOption) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-700';
                      } else if (isSelected) {
                        btnStyle = 'border-rose-500 bg-rose-50 text-rose-700';
                      } else {
                        btnStyle = 'border-slate-100 bg-slate-50/50 text-slate-400';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-[#4F9EFF] bg-[#F4F9FF] text-[#4F9EFF] border-2';
                    }

                    return (
                      <button
                        key={`pract_opt_${option.code}`}
                        disabled={hasCheckedPracticeAnswer}
                        onClick={() => { playSound('click'); handleSelectPracticeAnswer(option.code); }}
                        className={`p-3.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${btnStyle}`}
                      >
                        {hasCheckedPracticeAnswer && isCorrectOption && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                        {hasCheckedPracticeAnswer && isSelected && !isCorrectOption && <X className="w-4 h-4 text-rose-500 shrink-0" />}
                        <span>{language === 'en' ? option.name.en : option.name.id}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Actions row footer */}
                <div className="pt-4 flex gap-3">
                  {!hasCheckedPracticeAnswer ? (
                    <button
                      disabled={!selectedPracticeAnswer}
                      onClick={checkPracticeAnswer}
                      className={`w-full py-4 text-white rounded-2xl text-xs font-bold shadow-md transition-all ${
                        selectedPracticeAnswer 
                          ? 'bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] active:scale-[0.99]' 
                          : 'bg-slate-300 cursor-not-allowed text-white shadow-none'
                      }`}
                    >
                      {language === 'en' ? 'Check Answer' : 'Periksa Jawban'}
                    </button>
                  ) : (
                    <button
                      onClick={nextPracticeQuestion}
                      className="w-full py-4 bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                    >
                      <span>
                        {currentPracticeIdx + 1 === practiceQuestions.length
                          ? (language === 'en' ? 'Finish' : 'Selesai')
                          : (language === 'en' ? 'Next Question' : 'Pertanyaan Berikutnya')
                        }
                      </span>
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* ENDED PRACTICE STATE */}
            {practiceStatus === 'ended' && (
              <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#E1F0FF] shadow-soft text-center space-y-6">
                
                <div className="relative inline-flex">
                  <div className="p-4 bg-amber-50 text-amber-500 rounded-3xl border border-amber-200 shadow-sm animate-bounce">
                    <Award className="w-12 h-12" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-green-500 border-2 border-white rounded-full w-5 h-5 flex items-center justify-center text-white text-[10px] font-bold">
                    ✓
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {t.practiceComplete}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                    {t.congratsPractice}
                  </p>
                </div>

                {/* Score Summary Box */}
                <div className="p-5 bg-[#F4F9FF] border border-[#E1F0FF] rounded-2xl flex items-center justify-around max-w-xs mx-auto">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {t.correctCount}
                    </span>
                    <span className="text-2xl font-black text-emerald-500">
                      {practiceScore} / {practiceQuestions.length}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Score Rating
                    </span>
                    <span className="text-sm font-extrabold text-slate-700">
                      {Math.round((practiceScore / practiceQuestions.length) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3">
                  <button
                    onClick={() => startNewPractice(practiceContinent)}
                    className="flex-1 py-4 bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t.playPracticeAgain}
                  </button>
                  <button
                    onClick={() => { playSound('click'); setPracticeStatus('setup'); }}
                    className="flex-1 py-4 border border-[#E1F0FF] hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition-all"
                  >
                    Setup Room
                  </button>
                </div>

              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* --- SELECTED CARD POPUP OVERLAY MODAL --- */}
      <AnimatePresence>
        {selectedCountryDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCountryDetails(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl border border-[#E1F0FF] shadow-2xl overflow-hidden z-10"
            >
              {/* Overlay visual border top details */}
              <div className="p-3 bg-[#F4F9FF] border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                  Country Profile Card
                </span>
                <button
                  onClick={() => setSelectedCountryDetails(null)}
                  className="p-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-500 border border-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Large Flag Area */}
              <div className="aspect-[3/2] bg-slate-50 flex items-center justify-center p-4">
                <img
                  src={getFlagUrl(selectedCountryDetails.code)}
                  alt="Flag Details"
                  className="max-h-40 rounded-lg shadow-md object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Translation list and statistics table info */}
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-[#4F9EFF]/10 border border-[#4F9EFF]/25 text-[#4F9EFF] px-2.5 py-1 rounded-lg font-mono">
                      {selectedCountryDetails.code.toUpperCase()}
                    </span>
                    <span className="text-xl">{selectedCountryDetails.emoji}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight pt-1 leading-tight">
                    {selectedCountryDetails.name.en}
                  </h3>
                  
                  {selectedCountryDetails.name.id !== selectedCountryDetails.name.en && (
                    <p className="text-sm text-slate-500 font-bold flex items-center gap-1.5 leading-none">
                      <span>🇮🇩</span> {selectedCountryDetails.name.id}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="bg-[#F4F9FF] p-3 rounded-2xl border border-[#E1F0FF] space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Continent</span>
                    <strong className="text-slate-700 text-xs">{selectedCountryDetails.continent}</strong>
                  </div>
                  <div className="bg-[#F4F9FF] p-3 rounded-2xl border border-[#E1F0FF] space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Favorites Status</span>
                    <button
                      onClick={() => toggleFavorite(selectedCountryDetails.code)}
                      className={`text-xs font-black flex items-center gap-1 ${
                        favorites.includes(selectedCountryDetails.code) ? 'text-rose-500' : 'text-[#4F9EFF]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorites.includes(selectedCountryDetails.code) ? 'fill-current' : ''}`} />
                      <span>{favorites.includes(selectedCountryDetails.code) ? 'Saved' : 'Bookmark'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('click');
                    // Open a comparison tab using this
                    setCompareCodeA(selectedCountryDetails.code);
                    setSelectedCountryDetails(null);
                    setActiveSubTab('compare');
                  }}
                  className="w-full py-3 border border-[#E1F0FF] hover:border-[#4F9EFF] hover:bg-[#F4F9FF] text-[#4F9EFF] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-soft"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Compare This Flag
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
