/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import { AvatarImage } from './AvatarImage';
import { Send, Smile, Volume2, VolumeX, ShieldAlert, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ChatBox: React.FC = () => {
  const { chatMessages, sendChatMessage, activeRoom, currentPlayer, language } = useGame();
  
  const [inputText, setInputText] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [mutedPlayers, setMutedPlayers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Quick Emoji Presets
  const EMOJI_PRESETS = ['👍', '😂', '😎', '❓', '🎉', '🔥', '😮', '🧠', '🇮🇩', '🗺️'];

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, mutedPlayers]);

  const handleSendMessage = (textToSend?: string) => {
    const finalMsg = (textToSend || inputText).trim();
    if (!finalMsg) return;

    if (cooldown) {
      playSound('wrong');
      return;
    }

    playSound('click');
    sendChatMessage(finalMsg);
    setInputText('');
    setShowEmojiPicker(false);

    // Dynamic anti-spam triggering: 1.5 seconds cooldown
    setCooldown(true);
    setCooldownTime(1.5);
    
    const interval = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          setCooldown(false);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleMutePlayer = (playerId: string) => {
    playSound('click');
    setMutedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  if (!activeRoom) return null;

  // Filter out messages from players muted by local client
  const visibleMessages = chatMessages.filter((msg) => !mutedPlayers.includes(msg.senderId));

  return (
    <div className="bg-white border-2 border-[#D4E8FF] rounded-3xl shadow-soft flex flex-col h-[350px] overflow-hidden">
      
      {/* Visual Header */}
      <div className="bg-[#E5F1FF] border-b border-[#D4E8FF] px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <span>💬 {language === 'en' ? 'Lobby Live Chat' : 'Obrolan Lobi'}</span>
          {cooldown && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold animate-pulse">
              {cooldownTime}s Wait
            </span>
          )}
        </h3>

        {mutedPlayers.length > 0 && (
          <span className="text-[9px] bg-rose-100 text-[#F65555] font-black px-2 py-0.5 rounded-lg">
            {mutedPlayers.length} {language === 'en' ? 'Muted' : 'Dibisukan'}
          </span>
        )}
      </div>

      {/* Messages Scroll Panel */}
      <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto min-h-0 text-[#2B2B2B]">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Smile className="w-8 h-8 text-slate-350 stroke-1 mb-2 animate-pulse" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              {language === 'en' ? 'No messages. Be the first!' : 'Belum ada obrolan. Sapa temanmu!'}
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMe = msg.senderId === currentPlayer.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar sender info */}
                <div className="shrink-0">
                  <AvatarImage avatarKey={msg.senderAvatar} size="xs" />
                </div>

                <div className={`max-w-[70%] select-none ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Sender Name tag */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black text-slate-500 truncate max-w-[80px]">
                      {isMe ? (language === 'en' ? 'You' : 'Kamu') : msg.senderName}
                    </span>
                    
                    {/* Local mute toggler option */}
                    {!isMe && (
                      <button
                        onClick={() => toggleMutePlayer(msg.senderId)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                        title={language === 'en' ? 'Mute/Unmute Player' : 'Bisukan/Buka Bisukan Pemain'}
                      >
                        {mutedPlayers.includes(msg.senderId) ? (
                          <VolumeX className="w-3 h-3 text-[#F65555]" />
                        ) : (
                          <Volume2 className="w-3 h-3 hover:scale-110" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Text bubble body */}
                  <div className={`px-3 py-2 text-xs rounded-2xl break-words leading-snug font-bold ${
                    isMe 
                      ? 'bg-[#4F9EFF] text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-2 border-t border-[#EDF4FF] space-y-2 bg-slate-50/50">
        
        {/* Quick Emoji line helper */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5 px-1 bg-white rounded-lg border border-slate-100">
          <div className="flex items-center gap-1">
            {EMOJI_PRESETS.map((em) => (
              <button
                key={em}
                disabled={cooldown}
                onClick={() => handleSendMessage(em)}
                className="w-6 h-6 text-sm hover:scale-125 transition-transform flex items-center justify-center rounded-md hover:bg-[#F4F9FF] disabled:opacity-40"
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Action inputs rows */}
        <div className="flex items-center gap-1.5">
          <input
            id="chatbox_text_input"
            type="text"
            placeholder={cooldown ? (language === 'en' ? 'Please wait...' : 'Harap tunggu...') : (language === 'en' ? 'Say something...' : 'Ketik sesuatu...')}
            disabled={cooldown}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 px-3 py-2 bg-white border border-[#D4E8FF] focus:border-[#4F9EFF] rounded-xl text-xs font-bold outline-none placeholder:text-slate-400 font-sans transition-all disabled:opacity-50"
          />

          <button
            id="chatbox_send_btn"
            disabled={cooldown || !inputText.trim()}
            onClick={() => handleSendMessage()}
            className="p-2 bg-[#4F9EFF] hover:bg-[#398EEF] text-white disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
