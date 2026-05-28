/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { AvatarImage } from './AvatarImage';
import { ChatBox } from './ChatBox';
import { playSound } from '../utils/audio';
import { Users, Copy, Check, Bot, Mic, MicOff, LogOut, Play, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const Lobby: React.FC = () => {
  const {
    activeRoom,
    currentPlayer,
    leaveRoom,
    startGame,
    addBotPlayer,
    removeBotPlayer,
    toggleMic,
    micVolume,
    t
  } = useGame();

  const [copied, setCopied] = useState(false);

  if (!activeRoom) return null;

  const copyCode = () => {
    playSound('victory');
    navigator.clipboard.writeText(activeRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = currentPlayer.isHost;
  const canStart = activeRoom.players.length >= 1; // Can start solo with bots, or multiplayer

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Room Details Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6 md:col-span-1"
      >
        <div className="bg-white rounded-3xl border border-[#E1F0FF] shadow-soft p-6 space-y-6">
          <div>
            <span className="px-3 py-1 bg-[#4F9EFF]/10 text-[#4F9EFF] rounded-full text-xs font-bold uppercase tracking-wider">
              {activeRoom.mode === 'world' ? t.worldMode : t.continentMode}
            </span>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-2 outline-none">
              {activeRoom.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Region: {activeRoom.selectedContinent}</p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">{t.targetPoints}:</span>
              <span className="text-slate-800 font-bold">{activeRoom.targetPoints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">{t.answerChances}:</span>
              <span className="text-slate-800 font-bold">{activeRoom.answerChances}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">{t.maxPlayers}:</span>
              <span className="text-slate-800 font-bold">
                {activeRoom.players.length} / {activeRoom.maxPlayers}
              </span>
            </div>
          </div>

          {/* Copy-Code widget */}
          <div className="p-4 bg-[#F4F9FF] rounded-2xl border border-[#E5F1FF] space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.roomCode}
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-center font-mono text-xl font-bold tracking-widest text-[#4F9EFF]">
                {activeRoom.id}
              </span>
              <button
                id="copy_room_code_btn"
                onClick={copyCode}
                className="p-2 bg-white hover:bg-[#EDF5FF] text-[#4F9EFF] border border-[#E1F0FF] rounded-xl transition-all shadow-sm shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Local microphone check */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                {currentPlayer.isMicActive ? (
                  <Mic className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                Voice Check
              </span>
              <button
                id="lobby_mic_toggle"
                onClick={() => {
                  playSound('click');
                  toggleMic();
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                  currentPlayer.isMicActive
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {currentPlayer.isMicActive ? 'Mute' : 'Enable'}
              </button>
            </div>
            {currentPlayer.isMicActive && (
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.max(5, micVolume)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Lobby Chat System */}
        <ChatBox />

        {/* Exit Button */}
        <button
          id="leave_room_lobby_btn"
          onClick={() => {
            playSound('click');
            leaveRoom();
          }}
          className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-soft"
        >
          <LogOut className="w-4 h-4" />
          Leave Lobby
        </button>
      </motion.div>

      {/* Players list card & bots controllers */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        className="md:col-span-2 space-y-6"
      >
        <div className="bg-white rounded-3xl border border-[#E1F0FF] shadow-soft p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
              <Users className="w-5 h-5 text-[#4F9EFF]" />
              {t.playersLobby}
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {activeRoom.players.length} / {activeRoom.maxPlayers} Max
            </span>
          </div>

          <div className="space-y-3">
            {activeRoom.players.map((p, idx) => {
              const isCurrentUser = p.id === currentPlayer.id;
              // Visual mock volume animation for active bot voice chats or real local mics
              const showVolumeWave = p.isMicActive && isCurrentUser && micVolume > 15;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    isCurrentUser ? 'border-[#4F9EFF] bg-[#F4F9FF]' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <AvatarImage 
                      avatarKey={p.avatar} 
                      size="sm" 
                      isTalking={p.isMicActive} 
                      volumeLevel={isCurrentUser ? micVolume : 0} 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {p.name} {isCurrentUser && <span className="text-xs text-[#4F9EFF] font-bold">(You)</span>}
                        </span>
                        {p.isHost && (
                          <span className="px-2 py-0.5 bg-[#4F9EFF]/10 text-xs font-bold text-[#4F9EFF] rounded-md scale-90">
                            Host
                          </span>
                        )}
                        {p.isBot && (
                          <span className="px-2 py-0.5 bg-purple-100 text-xs font-bold text-purple-700 rounded-md scale-90 flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            Bot
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {p.isBot ? 'Simulating guesses' : 'Connected'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Bot cleanup if host */}
                    {isHost && p.isBot && (
                      <button
                        id={`remove_bot_btn_${p.id}`}
                        onClick={() => {
                          playSound('click');
                          removeBotPlayer(p.id);
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all"
                      >
                        Remove
                      </button>
                    )}

                    {/* Mic Indicator */}
                    {p.isMicActive ? (
                      <div className="flex items-end gap-0.5 h-3">
                        <span className={`w-0.5 h-2 bg-emerald-500 rounded-full ${showVolumeWave ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }} />
                        <span className={`w-0.5 h-3 bg-emerald-500 rounded-full ${showVolumeWave ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.2s' }} />
                        <span className={`w-0.5 h-1.5 bg-emerald-500 rounded-full ${showVolumeWave ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.3s' }} />
                      </div>
                    ) : (
                      <MicOff className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Empty Spot placeholders */}
            {Array.of(...Array(Math.max(0, activeRoom.maxPlayers - activeRoom.players.length))).map((_, i) => (
              <div
                key={`empty_${i}`}
                className="p-4 bg-dashed border-2 border-dashed border-[#E1F0FF] rounded-2xl flex items-center justify-center text-xs text-slate-400 font-semibold"
              >
                Waiting for competitor...
              </div>
            ))}
          </div>

          {/* Bottom actions list */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            {/* Spawn bot option */}
            {isHost && (
              <button
                id="add_bot_player_btn"
                onClick={() => {
                  playSound('click');
                  addBotPlayer();
                }}
                disabled={activeRoom.players.length >= activeRoom.maxPlayers}
                className="flex-1 py-3.5 border-2 border-[#E1F0FF] hover:border-[#4F9EFF] bg-white hover:bg-[#F4F9FF] text-[#4F9EFF] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <Bot className="w-4 h-4" />
                {t.addBot}
              </button>
            )}

            {/* Launch trigger button */}
            {isHost ? (
              <button
                id="host_start_game_launch_btn"
                onClick={() => {
                  playSound('victory');
                  startGame();
                }}
                disabled={!canStart}
                className="flex-[2] py-3.5 bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] hover:from-[#3D8BE0] hover:to-[#5DA6F0] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md scale-100 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                {t.startGame}
              </button>
            ) : (
              <div className="w-full py-4 text-center text-sm font-semibold text-slate-500 bg-[#F4F9FF] rounded-2xl flex items-center justify-center gap-2.5 animate-pulse border border-[#E5F1FF]">
                <ShieldAlert className="w-4 h-4 text-[#4F9EFF]" />
                Waiting for host to start matching...
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
