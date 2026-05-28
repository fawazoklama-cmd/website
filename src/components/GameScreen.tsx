/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { AvatarImage } from './AvatarImage';
import { ChatBox } from './ChatBox';
import { playSound } from '../utils/audio';
import { Award, Timer, RefreshCw, Mic, MicOff, AlertCircle, Sparkles, Check, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GameScreen: React.FC = () => {
  const {
    activeRoom,
    currentPlayer,
    currentQuestion,
    submitGuess,
    nextQuestion,
    toggleMic,
    micVolume,
    leaveRoom,
    t
  } = useGame();

  const [timer, setTimer] = useState<number>(30);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedBack, setFeedBack] = useState<{ status: 'correct' | 'wrong' | null; message: string }>({
    status: null,
    message: ''
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset local selection when question increments
    setSelectedOption(null);
    setFeedBack({ status: null, message: '' });
    setTimer(30);
  }, [activeRoom?.currentQuestionIndex]);

  // Round Timer countdown tick
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          
          // Auto LOCK wrong choice upon timeout
          if (!currentPlayer.hasGuessedCorrectly) {
            setFeedBack({
              status: 'wrong',
              message: currentQuestion ? `Time out! It was ${currentQuestion.correctCountry.name[activeRoom.players[0].isHost ? 'en' : 'id']}` : 'Time out!'
            });
            playSound('wrong');
            // Complete guess as empty/wrong to sync with Host
            submitGuess({ code: 'none', name: { en: '', id: '' }, emoji: '', continent: 'Asia' });
          }
          return 0;
        }

        // Ticking audio alarm in the final 5 seconds to build game atmosphere!
        if (prev <= 5 && prev > 1) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeRoom?.currentQuestionIndex, activeRoom?.status, currentPlayer.hasGuessedCorrectly]);

  if (!activeRoom || !currentQuestion) return null;

  const handleOptionSelect = (code: string) => {
    if (selectedOption || currentPlayer.guessesLeft <= 0 || currentPlayer.hasGuessedCorrectly || timer === 0) return;

    setSelectedOption(code);
    const countryObj = currentQuestion.options.find((opt) => opt.code === code);
    
    if (!countryObj) return;

    const isCorrect = submitGuess(countryObj);

    if (isCorrect) {
      playSound('correct');
      setFeedBack({
        status: 'correct',
        message: t.correctAnswer
      });
    } else {
      playSound('wrong');
      setFeedBack({
        status: 'wrong',
        message: currentPlayer.guessesLeft - 1 > 0 ? t.incorrectAnswer : `No more attempts left! Correct: ${currentQuestion.correctCountry.name[activeRoom.players[0].isHost ? 'en' : 'id']}`
      });
      
      // Allow them to guess again after 1.5 seconds if they have chances remaining
      if (currentPlayer.guessesLeft - 1 > 0) {
        setTimeout(() => {
          setSelectedOption(null);
          setFeedBack({ status: null, message: '' });
        }, 1200);
      }
    }
  };

  // Scoreboard ranking ordering
  const sortedPlayers = [...activeRoom.players].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Quiz Area */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-3xl border border-[#E1F0FF] shadow-soft p-6 md:p-8 space-y-6 relative overflow-hidden">
          
          {/* Header Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#4F9EFF]/10 text-[#4F9EFF] rounded-full text-xs font-bold font-mono">
                Q: {activeRoom.currentQuestionIndex + 1} / 20
              </span>
              <p className="text-xs text-slate-400 max-w-[150px] truncate sm:max-w-none">
                Target Score: <strong className="text-slate-600 font-bold">{activeRoom.targetPoints} pts</strong>
              </p>
            </div>

            {/* Timer visual */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all ${
              timer <= 5 ? 'border-rose-100 bg-rose-50 text-rose-600 font-bold animate-pulse' : 'border-[#E1F0FF] bg-[#F4F9FF] text-[#4F9EFF]'
            }`}>
              <Timer className="w-4 h-4 shrink-0" />
              <span className="font-mono text-sm font-bold">{timer}s</span>
            </div>
          </div>

          {/* Central Flag Display */}
          <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-[#F4F9FF] to-white rounded-2xl border border-[#EDF5FF] relative min-h-[220px]">
            <motion.div
              key={activeRoom.currentQuestionIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-56 h-36 bg-slate-50 border-4 border-white shadow-soft rounded-2xl overflow-hidden shrink-0 flex items-center justify-center group"
            >
              <img
                src={currentQuestion.flagUrl}
                alt="Country Flag"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback of country emoji flag in large scale ifcdn fails
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('emoji_flag_fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div
                id="emoji_flag_fallback"
                className="hidden text-7xl font-sans"
              >
                {currentQuestion.emoji}
              </div>
            </motion.div>
            <h3 className="text-sm font-bold text-slate-500 text-center tracking-tight mt-6">
              {t.guessTheCountry}
            </h3>
          </div>

          {/* FeedBack notification */}
          <AnimatePresence mode="wait">
            {feedBack.status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
                  feedBack.status === 'correct'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                    : 'border-rose-100 bg-rose-50 text-rose-800'
                }`}
              >
                {feedBack.status === 'correct' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedBack.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer choices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentQuestion.options.map((option, index) => {
              const alphabet = ['A', 'B', 'C', 'D'][index];
              const isSelected = selectedOption === option.code;
              const hasGuessed = currentPlayer.hasGuessedCorrectly || currentPlayer.guessesLeft <= 0 || timer === 0;

              let btnStyle = 'border-slate-200 bg-white hover:bg-[#F4F9FF] text-slate-700 hover:border-[#4F9EFF]';
              if (isSelected) {
                const isCorrect = option.code === currentQuestion.correctCountry.code;
                btnStyle = isCorrect
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                  : 'bg-rose-500 text-white border-rose-500 shadow-lg';
              } else if (hasGuessed) {
                const isCorrect = option.code === currentQuestion.correctCountry.code;
                if (isCorrect) {
                  btnStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                } else {
                  btnStyle = 'opacity-45 bg-slate-50 text-slate-400 border-slate-100 pointer-events-none';
                }
              }

              return (
                <button
                  id={`option_btn_${alphabet}`}
                  key={option.code}
                  disabled={hasGuessed}
                  onClick={() => handleOptionSelect(option.code)}
                  className={`px-5 py-4 rounded-2xl border-2 text-sm font-bold tracking-tight text-left flex items-center justify-between transition-all duration-150 relative scale-100 active:scale-95 disabled:pointer-events-none ${btnStyle}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'border-white bg-white/20'
                        : 'border-slate-100 bg-slate-50 text-[#4F9EFF]'
                    }`}>
                      {alphabet}
                    </span>
                    <span className="truncate">{option.name[activeRoom.players[0].isHost ? 'en' : 'id']}</span>
                  </span>
                  
                  {isSelected && (
                    option.code === currentQuestion.correctCountry.code ? (
                      <Check className="w-5 h-5 text-white shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-white shrink-0" />
                    )
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer stats panel */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.chancesLeft}: <strong className="text-[#4F9EFF] font-bold">{currentPlayer.guessesLeft}</strong></span>
            </div>
            {currentPlayer.isHost && (
              <button
                id="host_skip_question_btn"
                onClick={() => {
                  playSound('click');
                  nextQuestion();
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-[#F0F7FF] hover:text-[#4F9EFF] rounded-xl font-bold transition-all"
              >
                Skip Question
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Score board Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl border border-[#E1F0FF] shadow-soft p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-rose-50 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#4F9EFF]" />
              Scoreboard
            </h3>
            <span className="text-[10px] bg-slate-100 py-0.5 px-2 rounded-md font-bold text-slate-500">
              Live
            </span>
          </div>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto no-scrollbar">
            {sortedPlayers.map((player, index) => {
              const isMe = player.id === currentPlayer.id;
              const hasFinished = player.hasGuessedCorrectly || player.guessesLeft <= 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isMe ? 'border-[#4F9EFF] bg-[#F4F9FF]' : 'border-slate-50 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-xs font-mono font-black text-[#4F9EFF] text-center">
                      #{index + 1}
                    </span>
                    <AvatarImage
                      avatarKey={player.avatar}
                      size="sm"
                      isTalking={player.isMicActive}
                      volumeLevel={isMe ? micVolume : 0}
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-700 truncate">
                        {player.name}
                      </span>
                      {hasFinished ? (
                        <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                          player.hasGuessedCorrectly ? 'text-emerald-500' : 'text-rose-400'
                        }`}>
                          {player.hasGuessedCorrectly ? 'Answered' : 'Locked'}
                        </span>
                      ) : (
                        <span className="text-[9px] text-amber-500 font-semibold animate-pulse">
                          Thinking...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-extrabold text-slate-800">
                      {player.score} pt
                    </span>
                    <span className="block text-[8px] text-slate-400">
                      {player.guessesLeft} tries left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mic controls & quitter */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              id="game_mic_toggle_btn"
              onClick={() => {
                playSound('click');
                toggleMic();
              }}
              className={`p-2.5 rounded-xl transition-all border ${
                currentPlayer.isMicActive
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
              title={currentPlayer.isMicActive ? t.voiceActive : t.voiceMuted}
            >
              {currentPlayer.isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              id="game_quit_btn"
              onClick={() => {
                playSound('click');
                leaveRoom();
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 rounded-xl transition-all"
              title="Quit match"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live game chat box */}
        <ChatBox />
      </div>
    </div>
  );
};
