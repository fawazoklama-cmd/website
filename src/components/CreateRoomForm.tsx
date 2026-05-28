/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { GameMode, Continent } from '../types';
import { playSound } from '../utils/audio';
import { Settings, Award, Users, RefreshCw, Layers, Globe, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateRoomFormProps {
  onBack: () => void;
}

export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ onBack }) => {
  const { createRoom, t } = useGame();
  
  const [roomName, setRoomName] = useState('');
  const [targetPoints, setTargetPoints] = useState<number>(50); // standard 50 points to win
  const [answerChances, setAnswerChances] = useState<number>(3); // 1-3 times
  const [maxPlayers, setMaxPlayers] = useState<number>(5); // 2-5 players
  const [mode, setMode] = useState<GameMode>('world');
  const [selectedContinent, setSelectedContinent] = useState<Continent | 'All'>('All');

  const continentsList: (Continent | 'All')[] = [
    'All',
    'Europe',
    'Asia',
    'Africa',
    'North America',
    'South America',
    'Oceania'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('victory');
    createRoom(
      roomName,
      targetPoints,
      answerChances,
      maxPlayers,
      mode,
      selectedContinent
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#E1F0FF] shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-[#F0F7FF] to-[#E5F1FF] border-b border-[#E1F0FF]">
        <button
          id="create_room_back_btn"
          onClick={() => {
            playSound('click');
            onBack();
          }}
          className="p-1.5 text-slate-500 hover:text-[#4F9EFF] hover:bg-white rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {t.createRoom}
          </h2>
          <p className="text-xs text-slate-500">Configure your flag matching playground</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Name */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              {t.roomName}
            </label>
            <input
              id="room_name_input"
              type="text"
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. FawDev's Flag Club"
              maxLength={24}
              className="w-full px-5 py-3 text-sm font-semibold text-slate-700 bg-[#F4F9FF] focus:bg-white rounded-2xl border-2 border-[#E1F0FF] focus:border-[#4F9EFF] outline-none transition-all"
            />
          </div>

          {/* Config Parameters: Target Score & Answer Chances */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-3.5 h-3.5" />
              {t.targetPoints}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="target_points_slider"
                type="range"
                min="20"
                max="150"
                step="10"
                value={targetPoints}
                onChange={(e) => setTargetPoints(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#4F9EFF]"
              />
              <span className="w-12 text-center text-sm font-bold text-[#4F9EFF] bg-[#F4F9FF] py-1 px-2 rounded-lg shrink-0">
                {targetPoints}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              {t.answerChances}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((val) => {
                const isSelected = answerChances === val;
                return (
                  <button
                    id={`chances_opt_${val}`}
                    key={val}
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setAnswerChances(val);
                    }}
                    className={`py-2 text-sm font-bold rounded-xl border border-[#E1F0FF] transition-all ${
                      isSelected
                        ? 'bg-[#4F9EFF] text-white'
                        : 'bg-[#F4F9FF] text-slate-600 hover:bg-[#E5F1FF]'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Players (2-5) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              {t.maxPlayers}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((val) => {
                const isSelected = maxPlayers === val;
                return (
                  <button
                    id={`max_players_opt_${val}`}
                    key={val}
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setMaxPlayers(val);
                    }}
                    className={`py-2 text-sm font-bold rounded-xl border border-[#E1F0FF] transition-all ${
                      isSelected
                        ? 'bg-[#4F9EFF] text-white'
                        : 'bg-[#F4F9FF] text-slate-600 hover:bg-[#E5F1FF]'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selector (World or Continent) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              {t.gameModes}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="mode_btn_world"
                type="button"
                onClick={() => {
                  playSound('click');
                  setMode('world');
                  setSelectedContinent('All');
                }}
                className={`py-2.5 text-xs font-bold rounded-xl border border-[#E1F0FF] flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'world'
                    ? 'bg-[#4F9EFF] text-white'
                    : 'bg-[#F4F9FF] text-slate-600 hover:bg-[#E5F1FF]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                {t.worldMode}
              </button>
              <button
                id="mode_btn_continent"
                type="button"
                onClick={() => {
                  playSound('click');
                  setMode('continent');
                  setSelectedContinent('Europe'); // Initial Continent
                }}
                className={`py-2.5 text-xs font-bold rounded-xl border border-[#E1F0FF] flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'continent'
                    ? 'bg-[#4F9EFF] text-white'
                    : 'bg-[#F4F9FF] text-slate-600 hover:bg-[#E5F1FF]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {t.continentMode}
              </button>
            </div>
          </div>

          {/* Continent Choice Card */}
          {mode === 'continent' && (
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                {t.modeSelection}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {continentsList.filter((c) => c !== 'All').map((continent) => {
                  const isSelected = selectedContinent === continent;
                  return (
                    <button
                      id={`continent_opt_${continent.replace(/\s+/g, '_')}`}
                      key={continent}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedContinent(continent);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border border-[#E1F0FF] transition-all ${
                        isSelected
                          ? 'bg-[#4F9EFF] text-white shadow-soft'
                          : 'bg-[#F4F9FF] text-slate-600 hover:bg-[#E5F1FF]'
                      }`}
                    >
                      {continent}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          id="submit_create_room_btn"
          type="submit"
          className="w-full py-4 text-sm font-bold text-white bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] hover:from-[#3D8BE0] hover:to-[#5DA6F0] rounded-2xl shadow-md transition-all scale-100 hover:scale-[1.01] active:scale-[0.99] mt-4"
        >
          {t.createRoom}
        </button>
      </form>
    </motion.div>
  );
};
