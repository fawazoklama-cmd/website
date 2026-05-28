/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as Icons from 'lucide-react';

interface AvatarImageProps {
  avatarKey: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isTalking?: boolean;
  volumeLevel?: number; // 0 to 100
}

interface PresetConfig {
  gradient: string;
  icon: keyof typeof Icons;
  color: string;
}

export const AVATAR_PRESETS: { [key: string]: PresetConfig } = {
  'preset-1': { gradient: 'from-[#E0F2FE] to-[#BAE6FD]', icon: 'Compass', color: 'text-[#0284C7]' },
  'preset-2': { gradient: 'from-[#FEE2E2] to-[#FECACA]', icon: 'Flame', color: 'text-[#DC2626]' },
  'preset-3': { gradient: 'from-[#DCFCE7] to-[#BBF7D0]', icon: 'Trophy', color: 'text-[#16A34A]' },
  'preset-4': { gradient: 'from-[#FEF9C3] to-[#FEF08A]', icon: 'Crown', color: 'text-[#CA8A04]' },
  'preset-5': { gradient: 'from-[#F3E8FF] to-[#E9D5FF]', icon: 'Sparkles', color: 'text-[#9333EA]' },
  'preset-6': { gradient: 'from-[#E0FDF4] to-[#99F6E4]', icon: 'Shield', color: 'text-[#0D9488]' },
  'preset-7': { gradient: 'from-[#FFEDD5] to-[#FED7AA]', icon: 'Gamepad2', color: 'text-[#EA580C]' },
  'preset-8': { gradient: 'from-[#ECEFF1] to-[#CFD8DC]', icon: 'Globe', color: 'text-[#455A64]' }
};

export const AvatarImage: React.FC<AvatarImageProps> = ({
  avatarKey,
  size = 'md',
  isTalking = false,
  volumeLevel = 0
}) => {
  const pSize = {
    sm: 'w-10 h-10 text-sm border-2',
    md: 'w-16 h-16 text-lg border-2',
    lg: 'w-24 h-24 text-2xl border-4',
    xl: 'w-32 h-32 text-4xl border-4'
  };

  const isCustom = avatarKey && avatarKey.startsWith('data:');
  const preset = AVATAR_PRESETS[avatarKey] || AVATAR_PRESETS['preset-1'];

  // Talking volumetric pulse ring styling
  const outlinePulse = isTalking 
    ? {
        boxShadow: `0 0 ${8 + (volumeLevel / 10)}px ${3 + (volumeLevel / 15)}px rgba(79, 158, 255, ${0.4 + (volumeLevel / 150)})`
      } 
    : {};

  if (isCustom) {
    return (
      <div 
        className={`relative inline-block overflow-hidden bg-white border-[#e0e7ff] rounded-full shrink-0 transition-all duration-150 ${pSize[size]}`}
        style={outlinePulse}
      >
        <img 
          src={avatarKey} 
          alt="User Profile" 
          className="object-cover w-full h-full"
          referrerPolicy="no-referrer"
        />
        {isTalking && (
          <span className="absolute bottom-0 right-0 block w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
        )}
      </div>
    );
  }

  const IconComponent = Icons[preset.icon] as React.ComponentType<any>;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 border-white bg-gradient-to-tr ${preset.gradient} ${preset.color} ${pSize[size]} transition-all duration-150 shadow-sm`}
      style={outlinePulse}
    >
      {IconComponent && <IconComponent className={`w-1/2 h-1/2`} />}
      {isTalking && (
        <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full animate-pulse" />
      )}
    </div>
  );
};
