/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useGame } from '../context/GameContext';
import { AvatarImage, AVATAR_PRESETS } from './AvatarImage';
import { playSound } from '../utils/audio';
import { Upload, User, Sparkles } from 'lucide-react';

export const ProfileCard: React.FC = () => {
  const { currentPlayer, updateCurrentPlayer, t } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCurrentPlayer({ name: e.target.value });
  };

  const selectPreset = (key: string) => {
    playSound('click');
    updateCurrentPlayer({ avatar: key });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert('Image size must be smaller than 200KB for real-time synchronization.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        playSound('victory');
        updateCurrentPlayer({ avatar: reader.result }); // Save custom base64
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    playSound('click');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-[#E1F0FF] shadow-soft p-6 space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-[#F0F7FF] text-[#4F9EFF] rounded-xl">
          <User className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {t.chooseAvatar}
        </h2>
      </div>

      {/* Main Avatar Selector */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative group">
          <AvatarImage avatarKey={currentPlayer.avatar} size="lg" />
          <button
            id="pfp_upload_overlay_btn"
            onClick={triggerUpload}
            className="absolute -bottom-1 -right-1 p-2 bg-[#4F9EFF] text-white hover:bg-[#3D8BE0] rounded-full shadow-md transition-all scale-95 group-hover:scale-105"
            title={t.uploadPfp}
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            id="pfp_file_input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Name Input */}
        <div className="w-full relative">
          <input
            id="player_name_input"
            type="text"
            value={currentPlayer.name}
            onChange={handleNameChange}
            placeholder={t.enterName}
            maxLength={18}
            className="w-full px-5 py-3 text-center font-semibold text-slate-700 bg-[#F4F9FF] hover:bg-[#EDF5FF] focus:bg-white rounded-2xl border-2 border-[#E1F0FF] focus:border-[#4F9EFF] outline-none transition-all placeholder:text-slate-400 text-sm"
          />
          <Sparkles className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Preset Pick Grid */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Preset Palettes
        </label>
        <div className="grid grid-cols-4 gap-3">
          {Object.keys(AVATAR_PRESETS).map((presetKey) => {
            const isSelected = currentPlayer.avatar === presetKey;
            return (
              <button
                id={`preset_avatar_${presetKey}`}
                key={presetKey}
                onClick={() => selectPreset(presetKey)}
                className={`relative p-0.5 rounded-full transition-all hover:scale-105 active:scale-95 ${
                  isSelected ? 'ring-2 ring-[#4F9EFF] ring-offset-2' : 'hover:opacity-90'
                }`}
              >
                <AvatarImage avatarKey={presetKey} size="sm" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
