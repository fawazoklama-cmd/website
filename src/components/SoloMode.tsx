/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Country, Question, Continent } from '../types';
import { COUNTRIES, getFlagUrl } from '../data/flags';
import { playSound } from '../utils/audio';
import { 
  ArrowLeft, Globe, Zap, Timer, CheckCircle2, XCircle, Award, 
  Sparkles, RefreshCw, Layers, TimerOff, Check, X, Compass 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SoloModeProps {
  onBack: () => void;
}

export const SoloMode: React.FC<SoloModeProps> = ({ onBack }) => {
  const { language, t } = useGame();

  // Settings State
  const [gameState, setGameState] = useState<'settings' | 'playing' | 'summary'>('settings');
  const [category, setCategory] = useState<'world' | 'continent'>('world');
  const [selectedContinent, setSelectedContinent] = useState<Continent>('Asia');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timerSetting, setTimerSetting] = useState<'off' | '5s' | '10s' | '15s'>('10s');
  const [isEndless, setIsEndless] = useState<boolean>(false);

  // Gameplay State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswerCode, setSelectedAnswerCode] = useState<string | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState<boolean>(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [streak, setStreak] = useState<number>(0);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Difficulty configurations: Easy (3 options), Medium (4 options), Hard (4 options, incorrect answers deduct points)
  const getOptionsCount = () => {
    if (difficulty === 'easy') return 3;
    return 4;
  };

  // Generate customized questions list
  const generateSoloQuestions = () => {
    let pool = COUNTRIES;
    if (category === 'continent') {
      pool = COUNTRIES.filter((c) => c.continent === selectedContinent);
    }

    if (pool.length < 4) {
      pool = COUNTRIES; // Safety fallback
    }

    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const questionsCount = isEndless ? 100 : 15; // Set a large limit for endless, or standard 15 rounds
    const generated: Question[] = [];

    const numQuestions = Math.min(questionsCount, shuffledPool.length);

    for (let i = 0; i < numQuestions; i++) {
      const correctCountry = shuffledPool[i];
      const optionsCount = getOptionsCount();

      // Filter pool for wrong country pool
      const wrongPool = pool.filter((c) => c.code !== correctCountry.code);
      const shuffledWrong = [...wrongPool].sort(() => Math.random() - 0.5);
      const wrongCountries = shuffledWrong.slice(0, optionsCount - 1);

      const options = [correctCountry, ...wrongCountries].sort(() => Math.random() - 0.5);

      generated.push({
        flagUrl: getFlagUrl(correctCountry.code),
        emoji: correctCountry.emoji,
        correctCountry,
        options
      });
    }

    return generated;
  };

  // Start Solo game loop
  const handleStartGame = () => {
    playSound('click');
    const questionList = generateSoloQuestions();
    setQuestions(questionList);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswerCode(null);
    setShowAnswerFeedback(false);
    setFeedbackStatus(null);
    
    // Set initial timer duration
    const initialSeconds = getTimerSeconds();
    setTimeLeft(initialSeconds);
    setGameState('playing');
  };

  const getTimerSeconds = () => {
    if (timerSetting === '5s') return 5;
    if (timerSetting === '10s') return 10;
    if (timerSetting === '15s') return 15;
    return 999; // off
  };

  // Timer countdown hook during play
  useEffect(() => {
    if (gameState !== 'playing' || timerSetting === 'off' || showAnswerFeedback) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    const initialSeconds = getTimerSeconds();
    setTimeLeft(initialSeconds);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          handleTimeout();
          return 0;
        }
        if (prev <= 4) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentIndex, gameState, showAnswerFeedback]);

  // Handle choice selection
  const handleAnswerSelect = (code: string) => {
    if (showAnswerFeedback) return;

    setSelectedAnswerCode(code);
    setShowAnswerFeedback(true);
    const activeQuestion = questions[currentIndex];

    if (!activeQuestion) return;

    const isCorrect = code === activeQuestion.correctCountry.code;

    if (isCorrect) {
      playSound('correct');
      setFeedbackStatus('correct');
      setCorrectCount((prev) => prev + 1);
      
      // Calculate multiplier depending on speed and streak
      const speedBonus = timerSetting !== 'off' ? Math.max(1, Math.round(timeLeft / 2)) : 0;
      const streakBonus = Math.floor(streak / 3) * 5;
      const basePoints = 10;
      const earned = basePoints + speedBonus + streakBonus;

      setScore((prev) => prev + earned);
      setStreak((prev) => prev + 1);
    } else {
      playSound('wrong');
      setFeedbackStatus('wrong');
      setIncorrectCount((prev) => prev + 1);
      setStreak(0);

      // Deduct penalty on Hard difficulty
      if (difficulty === 'hard') {
        setScore((prev) => Math.max(0, prev - 5));
      }
    }
  };

  // Handle timer exhaustion
  const handleTimeout = () => {
    if (showAnswerFeedback) return;
    playSound('wrong');
    setSelectedAnswerCode('none');
    setShowAnswerFeedback(true);
    setFeedbackStatus('timeout');
    setIncorrectCount((prev) => prev + 1);
    setStreak(0);
    
    if (difficulty === 'hard') {
      setScore((prev) => Math.max(0, prev - 5));
    }
  };

  // Progress to next screen / next card
  const handleNextQuestion = () => {
    playSound('click');
    setShowAnswerFeedback(false);
    setSelectedAnswerCode(null);
    setFeedbackStatus(null);

    const nextIdx = currentIndex + 1;
    const isGameOver = isEndless 
      ? nextIdx >= questions.length // For endless, play through the large buffer of questions
      : nextIdx >= Math.min(15, questions.length);

    if (isGameOver) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      playSound('victory');
      setGameState('summary');
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  // End game early
  const handleExitToSummary = () => {
    playSound('victory');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameState('summary');
  };

  // Get accuracy percentage
  const getAccuracy = () => {
    const total = correctCount + incorrectCount;
    if (total === 0) return 0;
    return Math.round((correctCount / total) * 100);
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* 1. CONFIGURATION SCREEN */}
      {gameState === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-[#D4E8FF] rounded-3xl p-6 sm:p-10 shadow-soft space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EDF5FF] pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#4F9EFF]/10 text-[#4F9EFF] rounded-2xl">
                <Globe className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase">
                  {t.soloMode}
                </h2>
                <p className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-0.5">
                  Singleplayer Flag Training
                </p>
              </div>
            </div>
            <button
              id="solo_back_home_btn"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-[#F4F9FF] text-slate-500 hover:text-[#4F9EFF] border border-slate-100 hover:border-[#D4E8FF] rounded-xl transition-all text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>{language === 'en' ? 'Back' : 'Kembali'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Category selection */}
            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                🗺️ {language === 'en' ? 'Select Mode / Region' : 'Pilih Mode / Wilayah'}
              </label>

              <div className="grid grid-cols-1 gap-3">
                {/* World Mode Selection button */}
                <button
                  id="solo_category_world"
                  onClick={() => { playSound('click'); setCategory('world'); }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    category === 'world'
                      ? 'border-[#4F9EFF] bg-[#F4F9FF]'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#4F9EFF]" />
                      {t.worldMode}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'en' 
                        ? 'Practice with all 195 nations worldwide.' 
                        : 'Latihan menggunakan seluruh 195 negara dunia.'}
                    </p>
                  </div>
                  {category === 'world' && <div className="w-5 h-5 rounded-full bg-[#4F9EFF] flex items-center justify-center text-white"><Check className="w-3.5 h-3.5" /></div>}
                </button>

                {/* Continent Mode Selection button */}
                <button
                  id="solo_category_continent"
                  onClick={() => { playSound('click'); setCategory('continent'); }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    category === 'continent'
                      ? 'border-[#4F9EFF] bg-[#F4F9FF]'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#4F9EFF]" />
                      {t.continentMode}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'en'
                        ? 'Target flags from a specific continent.'
                        : 'Target bendera-bendera dari benua tertentu.'}
                    </p>
                  </div>
                  {category === 'continent' && <div className="w-5 h-5 rounded-full bg-[#4F9EFF] flex items-center justify-center text-white"><Check className="w-3.5 h-3.5" /></div>}
                </button>
              </div>

              {/* Continent Sub-dropdown */}
              <AnimatePresence>
                {category === 'continent' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2 pt-2"
                  >
                    <label className="block text-[11px] text-slate-400 font-extrabold uppercase">
                      Select Continent
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Asia', 'Europe', 'Africa', 'North America', 'South America', 'Oceania'] as Continent[]).map((cont) => (
                        <button
                          id={`solo_continent_pick_${cont.replace(/\s+/g, '_')}`}
                          key={cont}
                          onClick={() => { playSound('click'); setSelectedContinent(cont); }}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                            selectedContinent === cont
                              ? 'bg-[#4F9EFF] text-white border-[#4F9EFF] shadow-soft'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          {cont}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Custom Settings */}
            <div className="space-y-6">
              
              {/* Difficulty setting slider */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  ⚡ {t.selectDifficulty}
                </label>
                <div className="flex bg-[#F4F9FF] p-1.5 rounded-2xl border border-[#D4E8FF]">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      id={`solo_difficulty_select_${diff}`}
                      key={diff}
                      type="button"
                      onClick={() => { playSound('click'); setDifficulty(diff); }}
                      className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                        difficulty === diff
                          ? 'bg-[#4F9EFF] text-white shadow-soft'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {diff === 'easy' ? t.easy : diff === 'medium' ? t.medium : t.hard}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  {difficulty === 'easy' && (language === 'en' ? '🟢 Easy Mode: Guesses are selected from 3 country choices.' : '🟢 Mode Mudah: Tebakan dipilih dari 3 pilihan negara.')}
                  {difficulty === 'medium' && (language === 'en' ? '🟡 Medium Mode: Standard 4 multiple-choice options.' : '🟡 Mode Sedang: Pengaturan standar 4 pilihan negara.')}
                  {difficulty === 'hard' && (language === 'en' ? '🔴 Hard Mode: 4 options, plus wrong answers deduct 5 points!' : '🔴 Mode Sulit: 4 pilihan negara kaku, dan salah menjawab mengurangi 5 poin!')}
                </p>
              </div>

              {/* Timer Settings */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  ⏱️ {t.timerSetting}
                </label>
                <div className="flex bg-[#F4F9FF] p-1.5 rounded-2xl border border-[#D4E8FF]">
                  {(['off', '5s', '10s', '15s'] as const).map((tVal) => (
                    <button
                      id={`solo_timer_select_${tVal}`}
                      key={tVal}
                      type="button"
                      onClick={() => { playSound('click'); setTimerSetting(tVal); }}
                      className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                        timerSetting === tVal
                          ? 'bg-[#4F9EFF] text-white shadow-soft'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tVal === 'off' ? t.off : tVal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endless Toggle option */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-[#4F9EFF] text-xs uppercase flex items-center gap-1.5">
                    ♾️ {t.endlessMode}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {language === 'en' 
                      ? 'Play endlessly without round limits or victory scoreboards.' 
                      : 'Bermain terus menerus tanpa batasan soal.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="solo_endless_checkbox"
                    type="checkbox"
                    checked={isEndless}
                    onChange={(e) => { playSound('click'); setIsEndless(e.target.checked); }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F9EFF]"></div>
                </label>
              </div>

            </div>

          </div>

          {/* Action trigger button */}
          <div className="pt-4 text-center">
            <button
              id="solo_start_lobby_game_btn"
              onClick={handleStartGame}
              className="w-full sm:w-80 px-8 py-4 bg-gradient-to-r from-[#98C9FF] to-[#4F9EFF] text-white hover:opacity-95 font-black uppercase text-sm tracking-wider rounded-2xl shadow-md border-b-4 border-blue-600/40 hover:scale-[1.01] active:translate-y-0.5 transition-all"
            >
              🚀 {language === 'en' ? 'Start Training Mode' : 'Mulai Mode Latihan'}
            </button>
          </div>

        </motion.div>
      )}


      {/* 2. DYNAMIC PLAYING SCREEN */}
      {gameState === 'playing' && currentQ && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border-2 border-[#D4E8FF] rounded-3xl p-6 md:p-8 shadow-soft space-y-6 relative overflow-hidden"
        >
          {/* Header Progress widgets */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-3.5 py-1 bg-[#4F9EFF]/10 text-[#4F9EFF] rounded-full text-xs font-black font-mono">
                Q: {currentIndex + 1} {isEndless ? '' : '/ 15'}
              </span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase">
                <span>Score:</span>
                <strong className="text-slate-700 font-extrabold">{score} pts</strong>
              </div>
            </div>

            {/* Live Streak indicator */}
            {streak >= 3 && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-200 text-[10px] font-black uppercase animate-bounce"
              >
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-300" />
                <span>{streak} Streak!</span>
              </motion.div>
            )}

            {/* Timer visual widget */}
            {timerSetting !== 'off' ? (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                timeLeft <= 3 ? 'border-rose-100 bg-rose-50 text-rose-600 font-bold animate-pulse' : 'border-[#EDF5FF] bg-[#F4F9FF] text-[#4F9EFF]'
              }`}>
                <Timer className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono text-xs font-black">{timeLeft}s</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 text-xs font-bold">
                <TimerOff className="w-3.5 h-3.5" />
                <span>Practice</span>
              </div>
            )}
          </div>

          {/* Central country flag display */}
          <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-[#F4F9FF] to-white rounded-2xl border border-[#EDF5FF] relative min-h-[200px]">
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-52 h-32 bg-slate-50 border-4 border-white shadow-soft rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
            >
              <img
                src={currentQ.flagUrl}
                alt="Solo Country Flag"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <h3 className="text-xs font-black text-slate-500 text-center tracking-tight mt-6 uppercase">
              {t.practiceQuestion}
            </h3>
          </div>

          {/* Dynamic state feedback cards */}
          <AnimatePresence mode="wait">
            {showAnswerFeedback && feedbackStatus && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`p-4 rounded-xl border flex items-center justify-between font-semibold text-xs ${
                  feedbackStatus === 'correct'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                    : 'border-rose-100 bg-rose-50 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedbackStatus === 'correct' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {feedbackStatus === 'correct' 
                      ? (language === 'en' ? `Correct! +10 Points!` : `Benar! +10 Poin!`)
                      : feedbackStatus === 'timeout' 
                        ? (language === 'en' ? `Time is up! Correct was ${currentQ.correctCountry.name[language]}` : `Waktu habis! Jawaban yang benar: ${currentQ.correctCountry.name[language]}`)
                        : (language === 'en' ? `Wrong answer! Correct: ${currentQ.correctCountry.name[language]}` : `Tebakan salah! Yang benar: ${currentQ.correctCountry.name[language]}`)}
                  </span>
                </div>
                
                <button
                  id="solo_next_question_trigger"
                  onClick={handleNextQuestion}
                  className="px-4 py-1.5 bg-[#4F9EFF] hover:bg-[#3D8EEF] text-white font-extrabold rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>{language === 'en' ? 'Next' : 'Lanjut'}</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180 shrink-0" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answers Grid selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            {currentQ.options.map((option, index) => {
              const alphabet = ['A', 'B', 'C', 'D'][index];
              const isSelected = selectedAnswerCode === option.code;
              const isCorrectAnswer = option.code === currentQ.correctCountry.code;

              let btnStyle = 'border-slate-100 bg-white hover:bg-[#F4F9FF] text-slate-700 hover:border-[#4F9EFF]/50';
              if (showAnswerFeedback) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-md pointer-events-none font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500 text-white border-rose-500 shadow-md pointer-events-none font-bold';
                } else {
                  btnStyle = 'opacity-40 bg-slate-50 text-slate-400 border-slate-50 pointer-events-none';
                }
              }

              return (
                <button
                  id={`solo_option_btn_${alphabet}`}
                  key={option.code}
                  disabled={showAnswerFeedback}
                  onClick={() => handleAnswerSelect(option.code)}
                  className={`px-5 py-3.5 rounded-2xl border-2 text-xs font-bold tracking-tight text-left flex items-center justify-between transition-all scale-100 active:scale-95 disabled:pointer-events-none ${btnStyle}`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'border-white bg-white/20'
                        : 'border-slate-100 bg-slate-50 text-[#4F9EFF]'
                    }`}>
                      {alphabet}
                    </span>
                    <span className="truncate">{option.name[language]}</span>
                  </span>
                  {showAnswerFeedback && isCorrectAnswer && <Check className="w-4 h-4 text-white shrink-0" />}
                  {showAnswerFeedback && isSelected && !isCorrectAnswer && <X className="w-4 h-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick exit control panels */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Correct: <strong className="text-emerald-500 font-extrabold">{correctCount}</strong></span>
              <span className="ml-1">Wrong: <strong className="text-rose-500 font-extrabold">{incorrectCount}</strong></span>
            </div>
            
            <button
              id="solo_abort_match_btn"
              onClick={handleExitToSummary}
              className="px-3 py-1 bg-rose-50 hover:bg-rose-150 text-rose-500 border border-rose-150 rounded-xl transition-all font-bold"
            >
              {language === 'en' ? 'Exit Training' : 'Akhiri Latihan'}
            </button>
          </div>

        </motion.div>
      )}


      {/* 3. PERFORMANCE SUMMARY SCREEN */}
      {gameState === 'summary' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-[#D4E8FF] rounded-3xl p-6 sm:p-10 shadow-soft space-y-6 text-center"
        >
          {/* Trophy & Congrats Header */}
          <div className="space-y-3">
            <div className="inline-flex p-4 bg-[#F4F9FF] border border-[#D4E8FF] rounded-full text-[#4F9EFF] mb-2 animate-bounce">
              <Award className="w-12 h-12 fill-blue-150" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {t.scoreSummary}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {getAccuracy() >= 75 
                ? (language === 'en' ? 'Incredible knowledge! You are well on your way to becoming a Flag Master!' : 'Pengetahuan yang luar biasa! Kamu berada di jalur yang benar untuk menjadi Master Bendera!')
                : (language === 'en' ? 'Solid practice round. Keep playing to memorize more regional details!' : 'Latihan yang baik. Terus bermain untuk menghafal detail bendera dunia!')}
            </p>
          </div>

          {/* Standard grid analytics values */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {/* Total Points */}
            <div className="p-4 bg-[#F4F9FF] rounded-2xl border border-[#EDF5FF]">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">
                🏆 Score
              </span>
              <strong className="block text-xl font-black text-[#4F9EFF] mt-1 font-mono">
                {score} pts
              </strong>
            </div>

            {/* Correct Answers */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">
                {t.correctAnswers}
              </span>
              <strong className="block text-xl font-black text-emerald-600 mt-1 font-mono">
                {correctCount}
              </strong>
            </div>

            {/* Wrong Answers */}
            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">
                {t.wrongAnswers}
              </span>
              <strong className="block text-xl font-black text-rose-500 mt-1 font-mono">
                {incorrectCount}
              </strong>
            </div>

            {/* Accuracy percentage */}
            <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">
                {t.accuracy}
              </span>
              <strong className="block text-xl font-black text-amber-600 mt-1 font-mono">
                {getAccuracy()}%
              </strong>
            </div>
          </div>

          {/* Quick choices list */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 items-center justify-center">
            <button
              id="solo_replay_btn"
              onClick={handleStartGame}
              className="w-full sm:w-auto px-6 py-3 bg-[#4F9EFF] hover:bg-[#3D8EEF] text-white rounded-xl text-xs font-black uppercase transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.playPracticeAgain}</span>
            </button>

            <button
              id="solo_back_home_after_btn"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-black uppercase transition-all"
            >
              <span>{t.returnHome}</span>
            </button>
          </div>

        </motion.div>
      )}

    </div>
  );
};
