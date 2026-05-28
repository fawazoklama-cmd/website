/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import { Hash, KeyRound, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface JoinRoomFormProps {
  onBack: () => void;
}

export const JoinRoomForm: React.FC<JoinRoomFormProps> = ({ onBack }) => {
  const { joinRoom, t } = useGame();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    playSound('click');
    setLoading(true);
    
    // Simulate initial handshaking
    setTimeout(() => {
      const sanitized = code.trim().toUpperCase();
      const success = joinRoom(sanitized);
      setLoading(false);
      if (success) {
        playSound('victory');
      }
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="max-w-md mx-auto bg-white rounded-3xl border border-[#E1F0FF] shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-[#F0F7FF] to-[#E5F1FF] border-b border-[#E1F0FF]">
        <button
          id="join_room_back_btn"
          type="button"
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
            {t.joinRoom}
          </h2>
          <p className="text-xs text-slate-500">Enter a peer's lobby code</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <div className="text-center p-4 bg-[#F4F9FF] rounded-2xl border border-[#E5F1FF] flex flex-col items-center gap-2">
            <KeyRound className="w-8 h-8 text-[#4F9EFF] animate-pulse" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Open the game in separate browser tabs or windows to test real-time synchronization natively!
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" />
              {t.roomCode}
            </label>
            <input
              id="room_code_input"
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A4FB8X"
              maxLength={6}
              className="w-full px-5 py-4 text-center text-xl font-mono font-bold tracking-widest text-[#4F9EFF] bg-[#F4F9FF] focus:bg-white rounded-2xl border-2 border-[#E1F0FF] focus:border-[#4F9EFF] outline-none transition-all placeholder:text-slate-300 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal"
            />
          </div>
        </div>

        <button
          id="submit_join_room_btn"
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full py-4 text-sm font-bold text-white bg-gradient-to-r from-[#4F9EFF] to-[#6CB7FF] hover:from-[#3D8BE0] hover:to-[#5DA6F0] rounded-2xl shadow-md transition-all scale-100 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.connecting}
            </span>
          ) : (
            t.joinRoom
          )}
        </button>
      </form>
    </motion.div>
  );
};
