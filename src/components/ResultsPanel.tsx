/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { AvatarImage } from './AvatarImage';
import { playSound } from '../utils/audio';
import { Trophy, RefreshCw, Home, Award } from 'lucide-react';
import { motion } from 'motion/react';

export const ResultsPanel: React.FC = () => {
  const { activeRoom, currentPlayer, startGame, leaveRoom, t } = useGame();

  useEffect(() => {
    playSound('victory');
  }, []);

  if (!activeRoom) return null;

  // Sort players to find the rankings
  const rankedPlayers = [...activeRoom.players].sort((a, b) => b.score - a.score);
  const winner = rankedPlayers[0];

  const handlePlayAgain = () => {
    playSound('victory');
    startGame();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto bg-white rounded-3xl border border-[#E1F0FF] shadow-soft overflow-hidden"
    >
      {/* Celebration Banner */}
      <div className="bg-gradient-to-br from-[#4F9EFF] to-[#6CB7FF] p-8 text-center text-white space-y-4 relative">
        <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none" />
        <div className="inline-flex p-4 bg-white/20 rounded-full border border-white/20 animate-bounce">
          <Trophy className="w-12 h-12 text-[#FFD700] drop-shadow-md fill-current" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">
            {t.gameOver}
          </h2>
          <p className="text-sm text-blue-50/90 font-medium">
            {t.winnerIs}
          </p>
        </div>

        {/* Big Podium for Winner */}
        {winner && (
          <div className="flex flex-col items-center mt-6">
            <AvatarImage avatarKey={winner.avatar} size="lg" />
            <h3 className="text-xl font-extrabold mt-3 tracking-tight">
              {winner.name}
            </h3>
            <span className="mt-1 px-3 py-1 bg-white/25 border border-white/20 rounded-full text-xs font-bold font-mono">
              {winner.score} pts
            </span>
          </div>
        )}
      </div>

      {/* Complete Rankings list */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
            Final scoreboard
          </label>
          <div className="space-y-2.5">
            {rankedPlayers.map((player, idx) => {
              const isFirst = idx === 0;
              const isUser = player.id === currentPlayer.id;

              return (
                <div
                  id={`ranking_row_${idx + 1}`}
                  key={player.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                    isUser ? 'border-[#4F9EFF] bg-[#F4F9FF]' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      isFirst
                        ? 'bg-amber-100 text-amber-700 font-bold border border-amber-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <AvatarImage avatarKey={player.avatar} size="sm" />
                    <span className="font-bold text-slate-700 truncate text-sm">
                      {player.name} {isUser && <span className="text-[#4F9EFF] text-xs font-normal">(You)</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span className="font-extrabold text-slate-800 text-sm">
                      {player.score} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {currentPlayer.isHost && (
            <button
              id="results_play_again_btn"
              onClick={handlePlayAgain}
              className="flex-1 py-4 bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] hover:from-[#3D8BE0] hover:to-[#5DA6F0] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md scale-100 hover:scale-[1.01] active:scale-[0.99]"
            >
              <RefreshCw className="w-4 h-4" />
              {t.playAgain}
            </button>
          )}

          <button
            id="results_return_home_btn"
            onClick={() => {
              playSound('click');
              leaveRoom();
            }}
            className="flex-1 py-4 border-2 border-slate-200 hover:border-[#4F9EFF] hover:bg-[#F4F9FF] text-slate-600 hover:text-[#4F9EFF] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-soft"
          >
            <Home className="w-4 h-4" />
            {t.returnHome}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
