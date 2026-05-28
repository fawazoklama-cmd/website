/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Player, Room, Country, Question, GameMode, Continent, BroadcastMessage, Translation, ChatMessage } from '../types';
import { COUNTRIES, getFlagUrl } from '../data/flags';
import { TRANSLATIONS } from '../data/lang';

interface GameContextType {
  language: 'en' | 'id';
  setLanguage: (lang: 'en' | 'id') => void;
  t: Translation;
  currentPlayer: Player;
  updateCurrentPlayer: (updates: Partial<Player>) => void;
  activeRoom: Room | null;
  questions: Question[];
  currentQuestion: Question | null;
  createRoom: (name: string, targetPoints: number, answerChances: number, maxPlayers: number, mode: GameMode, continent: Continent | 'All') => Room;
  joinRoom: (code: string) => boolean;
  leaveRoom: () => void;
  startGame: () => void;
  submitGuess: (country: Country) => boolean;
  nextQuestion: () => void;
  addBotPlayer: () => void;
  removeBotPlayer: (botId: string) => void;
  toggleMic: () => void;
  micVolume: number;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  clearChatMessages: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Generate random safe room code
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Predefined fun bots
const BOT_TEMPLATES = [
  { name: 'SultanFlag', avatar: 'preset-2', skill: 'hard' },
  { name: 'MegaGlobe 🇮🇩', avatar: 'preset-4', skill: 'medium' },
  { name: 'Vexillologist 🗺️', avatar: 'preset-6', skill: 'hard' },
  { name: 'AtlasExplorer', avatar: 'preset-8', skill: 'easy' },
  { name: 'MapWizard', avatar: 'preset-1', skill: 'medium' }
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Localization state
  const [language, setLanguage] = useState<'en' | 'id'>('en');
  const t = TRANSLATIONS[language];

  // Chat message state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Current user's persistent profile (saved to localStorage)
  const [currentPlayer, setCurrentPlayer] = useState<Player>(() => {
    const saved = localStorage.getItem('world_flag_guessing_game_p_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          score: 0,
          guessesLeft: 3,
          hasGuessedCorrectly: false,
          isHost: false,
          isMicActive: false
        };
      } catch (e) {
        // Fallback
      }
    }
    const randomId = 'p_' + Math.random().toString(36).substring(2, 9);
    const defaultPlayer: Player = {
      id: randomId,
      name: `Player_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      avatar: 'preset-1',
      isHost: false,
      score: 0,
      guessesLeft: 3,
      hasGuessedCorrectly: false,
      isMicActive: false
    };
    localStorage.setItem('world_flag_guessing_game_p_profile', JSON.stringify(defaultPlayer));
    return defaultPlayer;
  });

  const updateCurrentPlayer = (updates: Partial<Player>) => {
    setCurrentPlayer((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('world_flag_guessing_game_p_profile', JSON.stringify(updated));
      return updated;
    });
  };

  // Game/room structures
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const questionsRef = useRef<Question[]>([]);
  const activeRoomRef = useRef<Room | null>(null);

  // Keep references updated for async callbacks (like timeouts & broadcast listeners)
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Real micro-interactions: Web Audio microphone levels
  const [micVolume, setMicVolume] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Broadcast Channel for true multi-tab real-time sync!
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel('world_flag_guessing_game_p2p');
    
    // Broadcast player updates to any listening tab
    broadcastChannelRef.current.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data;
      const currentRoom = activeRoomRef.current;
      
      if (!currentRoom || msg.roomId !== currentRoom.id) return;

      if (msg.type === 'PLAYER_JOIN') {
        // If we are host, append the new player and coordinate room configuration updates
        if (currentPlayer.isHost) {
          const exists = currentRoom.players.some((p) => p.id === msg.player.id);
          if (!exists) {
            const updatedPlayers = [...currentRoom.players, { ...msg.player, score: 0 }];
            const updatedRoom: Room = { ...currentRoom, players: updatedPlayers };
            setActiveRoom(updatedRoom);
            broadcastRoomUpdate(updatedRoom, questionsRef.current);
          }
        }
      } 
      else if (msg.type === 'PLAYER_LEAVE') {
        // Remove player on leave
        const updatedPlayers = currentRoom.players.filter((p) => p.id !== msg.playerId);
        
        let shouldBeHost = currentPlayer.isHost;
        // Host migration: if the leaving player was host, the first surviving player becomes host!
        const leavingHost = currentRoom.players.find((p) => p.id === msg.playerId)?.isHost;
        if (leavingHost && updatedPlayers.length > 0) {
          if (updatedPlayers[0].id === currentPlayer.id) {
            shouldBeHost = true;
            updateCurrentPlayer({ isHost: true });
          }
          updatedPlayers[0].isHost = true;
        }

        const updatedRoom: Room = { ...currentRoom, players: updatedPlayers };
        setActiveRoom(updatedRoom);

        if (shouldBeHost) {
          broadcastRoomUpdate(updatedRoom, questionsRef.current);
        }
      } 
      else if (msg.type === 'ROOM_UPDATE') {
        // Non-hosts synchronize their complete room states and question cards
        if (!currentPlayer.isHost) {
          setActiveRoom(msg.room);
          setQuestions(msg.questions);
          
          // Keep current user status in sync with room representation
          const localRep = msg.room.players.find((p) => p.id === currentPlayer.id);
          if (localRep) {
            setCurrentPlayer((prev) => ({
              ...prev,
              score: localRep.score,
              guessesLeft: localRep.guessesLeft,
              hasGuessedCorrectly: localRep.hasGuessedCorrectly,
              isHost: localRep.isHost
            }));
          }
        }
      } 
      else if (msg.type === 'PLAYER_ACTION') {
        // Receive guessing or volume status changes from other connected peers
        if (currentPlayer.isHost) {
          const { playerId, action, payload } = msg;
          const updatedPlayers = currentRoom.players.map((p) => {
            if (p.id === playerId) {
              if (action === 'guess') {
                return {
                  ...p,
                  score: payload.score,
                  guessesLeft: payload.guessesLeft,
                  hasGuessedCorrectly: payload.hasGuessedCorrectly
                };
              }
              if (action === 'mic_toggle') {
                return { ...p, isMicActive: payload.isMicActive };
              }
            }
            return p;
          });

          const updatedRoom: Room = { ...currentRoom, players: updatedPlayers };
          setActiveRoom(updatedRoom);
          broadcastRoomUpdate(updatedRoom, questionsRef.current);
        }
      }
      else if (msg.type === 'CHAT_MESSAGE') {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.message.id)) return prev;
          return [...prev, msg.message];
        });
      }
    };

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [currentPlayer.isHost, currentPlayer.id]);

  // Share room state
  const broadcastRoomUpdate = (room: Room, questList: Question[]) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'ROOM_UPDATE',
        roomId: room.id,
        room,
        questions: questList
      });
    }
  };

  // Helper to send action to host
  const sendActionToHost = (action: 'guess' | 'timer_tick' | 'mic_toggle', payload: any) => {
    if (activeRoom && broadcastChannelRef.current) {
      if (currentPlayer.isHost) {
        // Host processes locally immediately
        handleHostLocalAction(currentPlayer.id, action, payload);
      } else {
        broadcastChannelRef.current.postMessage({
          type: 'PLAYER_ACTION',
          roomId: activeRoom.id,
          playerId: currentPlayer.id,
          action,
          payload
        });
      }
    }
  };

  const handleHostLocalAction = (pId: string, action: 'guess' | 'timer_tick' | 'mic_toggle', payload: any) => {
    const r = activeRoomRef.current;
    if (!r) return;
    const updatedPlayers = r.players.map((p) => {
      if (p.id === pId) {
        if (action === 'guess') {
          return {
            ...p,
            score: payload.score,
            guessesLeft: payload.guessesLeft,
            hasGuessedCorrectly: payload.hasGuessedCorrectly
          };
        }
        if (action === 'mic_toggle') {
          return { ...p, isMicActive: payload.isMicActive };
        }
      }
      return p;
    });
    const updatedRoom = { ...r, players: updatedPlayers };
    setActiveRoom(updatedRoom);
    broadcastRoomUpdate(updatedRoom, questionsRef.current);
  };

  // --- AUDIO INPUT METER ---
  const toggleMic = async () => {
    const isNowMuted = currentPlayer.isMicActive;
    const nextMicState = !isNowMuted;

    updateCurrentPlayer({ isMicActive: nextMicState });
    sendActionToHost('mic_toggle', { isMicActive: nextMicState });

    if (nextMicState) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Scale to 0 - 100
          const level = Math.min(100, Math.round((average / 128) * 100));
          setMicVolume(level);
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (err) {
        console.warn('Microphone permission blocked or soundcard unavailable:', err);
        updateCurrentPlayer({ isMicActive: false });
        sendActionToHost('mic_toggle', { isMicActive: false });
      }
    } else {
      cleanupMicrophone();
    }
  };

  const cleanupMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setMicVolume(0);
  };

  useEffect(() => {
    return () => cleanupMicrophone();
  }, []);

  // --- BOT BEHAVIORS ---
  // Core bot automated guessing handler managed by the active room Host!
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'playing' || !currentPlayer.isHost) return;

    const currentQ = questions[activeRoom.currentQuestionIndex];
    if (!currentQ) return;

    const botsInRoom = activeRoom.players.filter((p) => p.isBot);
    const botTimerRefs: { [botId: string]: NodeJS.Timeout } = {};

    botsInRoom.forEach((bot) => {
      // Check if bot already guessed
      if (bot.hasGuessedCorrectly || bot.guessesLeft <= 0) return;

      const botConfig = BOT_TEMPLATES.find((b) => b.avatar === bot.avatar) || { skill: 'medium' };
      let delay = 6000; // default response speed
      let accuracy = 0.65; // medium accuracy

      if (botConfig.skill === 'hard') {
        delay = Math.floor(Math.random() * 3000) + 2000; // 2-5s
        accuracy = 0.88;
      } else if (botConfig.skill === 'easy') {
        delay = Math.floor(Math.random() * 5000) + 8000; // 8-13s
        accuracy = 0.35;
      } else {
        delay = Math.floor(Math.random() * 4000) + 5000; // 5-9s
        accuracy = 0.65;
      }

      botTimerRefs[bot.id] = setTimeout(() => {
        // Re-get latest room and question state before making moves
        const r = activeRoomRef.current;
        if (!r || r.status !== 'playing') return;
        const currentBot = r.players.find((p) => p.id === bot.id);
        if (!currentBot || currentBot.hasGuessedCorrectly || currentBot.guessesLeft <= 0) return;

        const willBeCorrect = Math.random() < accuracy;
        let score = currentBot.score;
        let guessesLeft = currentBot.guessesLeft;
        let hasGuessedCorrectly = false;

        if (willBeCorrect) {
          score += 10;
          hasGuessedCorrectly = true;
        } else {
          guessesLeft -= 1;
        }

        const updatedPlayers = r.players.map((p) => {
          if (p.id === bot.id) {
            return { ...p, score, guessesLeft, hasGuessedCorrectly };
          }
          return p;
        });

        const nextRoomState: Room = { ...r, players: updatedPlayers };
        setActiveRoom(nextRoomState);
        broadcastRoomUpdate(nextRoomState, questionsRef.current);

        // Check if all players guessed to trigger next question
        checkRoundProgress(nextRoomState);
      }, delay);
    });

    return () => {
      Object.values(botTimerRefs).forEach((timer) => clearTimeout(timer));
    };
  }, [activeRoom?.currentQuestionIndex, activeRoom?.status]);

  // Check if all players finished guessing the current question
  const checkRoundProgress = (currRoom: Room) => {
    // Only host drives the slide progression
    if (!currentPlayer.isHost) return;

    const allFinished = currRoom.players.every(
      (p) => p.hasGuessedCorrectly || p.guessesLeft <= 0
    );

    if (allFinished) {
      // Small interval before auto progressing to show who got it right!
      setTimeout(() => {
        const r = activeRoomRef.current;
        if (!r || r.status !== 'playing') return;
        
        // Check if anyone hit target points
        const targetMet = r.players.some((p) => p.score >= r.targetPoints);

        if (targetMet || r.currentQuestionIndex >= questionsRef.current.length - 1) {
          // Game ends! Transition to Results tab
          const endRoom: Room = { ...r, status: 'results' };
          setActiveRoom(endRoom);
          broadcastRoomUpdate(endRoom, questionsRef.current);
        } else {
          // Progress to custom next question cards
          const nextIndex = r.currentQuestionIndex + 1;
          const resetPlayers = r.players.map((p) => ({
            ...p,
            guessesLeft: r.answerChances,
            hasGuessedCorrectly: false
          }));

          const nextRoom: Room = {
            ...r,
            currentQuestionIndex: nextIndex,
            players: resetPlayers,
            roundTimerSeconds: 30
          };
          setActiveRoom(nextRoom);
          broadcastRoomUpdate(nextRoom, questionsRef.current);
        }
      }, 3000);
    }
  };

  // --- GAMEPLAY TRIGGERS ---

  // Generate customized Question list using selected Country list
  const generateQuestionsList = (mode: GameMode, continent: Continent | 'All', count: number = 20): Question[] => {
    // Filter country pool
    let pool = COUNTRIES;
    if (mode === 'continent' && continent !== 'All') {
      pool = COUNTRIES.filter((c) => c.continent === continent);
    }

    if (pool.length < 4) {
      pool = COUNTRIES; // Safety fallback
    }

    // Shuffle pool copies
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const questionsList: Question[] = [];

    const numQuestions = Math.min(count, shuffledPool.length);

    for (let i = 0; i < numQuestions; i++) {
      const correctCountry = shuffledPool[i];
      
      // Get 3 wrong countries from whole pool
      const wrongPool = pool.filter((c) => c.code !== correctCountry.code);
      const shuffledWrong = [...wrongPool].sort(() => Math.random() - 0.5);
      const wrongCountries = shuffledWrong.slice(0, 3);

      const options = [correctCountry, ...wrongCountries].sort(() => Math.random() - 0.5);

      questionsList.push({
        flagUrl: getFlagUrl(correctCountry.code),
        emoji: correctCountry.emoji,
        correctCountry,
        options
      });
    }

    return questionsList;
  };

  const createRoom = (
    name: string,
    targetPoints: number,
    answerChances: number,
    maxPlayers: number,
    mode: GameMode,
    continent: Continent | 'All'
  ): Room => {
    const roomId = generateRoomCode();
    
    // Set host local status
    const hostPlayer: Player = {
      ...currentPlayer,
      isHost: true,
      score: 0,
      guessesLeft: answerChances,
      hasGuessedCorrectly: false,
      isMicActive: currentPlayer.isMicActive
    };
    
    updateCurrentPlayer({ isHost: true });
    setChatMessages([]);

    const newRoom: Room = {
      id: roomId,
      name: name || `${currentPlayer.name}'s Arena`,
      targetPoints,
      answerChances,
      maxPlayers,
      mode,
      selectedContinent: continent,
      players: [hostPlayer],
      status: 'lobby',
      currentQuestionIndex: 0,
      roundTimerSeconds: 30
    };

    setActiveRoom(newRoom);
    
    // Pre-generate standard 20 questions
    const generated = generateQuestionsList(mode, continent, 20);
    setQuestions(generated);

    // Broadcast setup so tabs find us
    broadcastRoomUpdate(newRoom, generated);

    return newRoom;
  };

  const joinRoom = (code: string): boolean => {
    if (!broadcastChannelRef.current) return false;

    // Send a JOIN notification event to find any existing host with that room ID!
    const incomingPlayer: Player = {
      ...currentPlayer,
      isHost: false,
      score: 0,
      guessesLeft: 3,
      hasGuessedCorrectly: false
    };

    updateCurrentPlayer({ isHost: false });
    setChatMessages([]);

    // Instantly mock visual room setup wait state
    setActiveRoom({
      id: code,
      name: 'Game Room',
      targetPoints: 50,
      maxPlayers: 5,
      answerChances: 3,
      mode: 'world',
      selectedContinent: 'All',
      players: [incomingPlayer],
      status: 'lobby',
      currentQuestionIndex: 0,
      roundTimerSeconds: 30
    });

    // Notify Host to append us and send full ROOM_UPDATE message
    broadcastChannelRef.current.postMessage({
      type: 'PLAYER_JOIN',
      roomId: code,
      player: incomingPlayer
    });

    return true;
  };

  const leaveRoom = () => {
    if (activeRoom && broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PLAYER_LEAVE',
        roomId: activeRoom.id,
        playerId: currentPlayer.id
      });
    }
    cleanupMicrophone();
    setChatMessages([]);
    setActiveRoom(null);
    setQuestions([]);
    updateCurrentPlayer({ isHost: false, score: 0 });
  };

  const startGame = () => {
    if (!activeRoom || !currentPlayer.isHost) return;

    // Shuffles players, resets scores
    const resetPlayers = activeRoom.players.map((p) => ({
      ...p,
      score: 0,
      guessesLeft: activeRoom.answerChances,
      hasGuessedCorrectly: false
    }));

    const launchedRoom: Room = {
      ...activeRoom,
      players: resetPlayers,
      status: 'playing',
      currentQuestionIndex: 0,
      roundTimerSeconds: 30
    };

    setActiveRoom(launchedRoom);
    broadcastRoomUpdate(launchedRoom, questions);
  };

  const submitGuess = (country: Country): boolean => {
    if (!activeRoom) return false;

    const currentQ = questions[activeRoom.currentQuestionIndex];
    if (!currentQ || currentPlayer.hasGuessedCorrectly || currentPlayer.guessesLeft <= 0) return false;

    const isCorrect = country.code === currentQ.correctCountry.code;
    let score = currentPlayer.score;
    let guessesLeft = currentPlayer.guessesLeft;
    let hasGuessedCorrectly = currentPlayer.hasGuessedCorrectly;

    if (isCorrect) {
      score += 10;
      hasGuessedCorrectly = true;
    } else {
      guessesLeft -= 1;
    }

    const updatedPlayer = { score, guessesLeft, hasGuessedCorrectly };
    updateCurrentPlayer(updatedPlayer);

    // Notify Room Host to synchronize this guess across all connected observers
    sendActionToHost('guess', updatedPlayer);

    if (currentPlayer.isHost) {
      // Check if all players have completed guessing
      setTimeout(() => {
        const latestRoom = activeRoomRef.current;
        if (latestRoom) {
          checkRoundProgress(latestRoom);
        }
      }, 100);
    }

    return isCorrect;
  };

  const nextQuestion = () => {
    if (!activeRoom || !currentPlayer.isHost) return;
    const nextIndex = activeRoom.currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      const endRoom: Room = { ...activeRoom, status: 'results' };
      setActiveRoom(endRoom);
      broadcastRoomUpdate(endRoom, questions);
    } else {
      const resetPlayers = activeRoom.players.map((p) => ({
        ...p,
        guessesLeft: activeRoom.answerChances,
        hasGuessedCorrectly: false
      }));

      const nextRoom: Room = {
        ...activeRoom,
        currentQuestionIndex: nextIndex,
        players: resetPlayers,
        roundTimerSeconds: 30
      };
      setActiveRoom(nextRoom);
      broadcastRoomUpdate(nextRoom, questions);
    }
  };

  const addBotPlayer = () => {
    if (!activeRoom || !currentPlayer.isHost) return;
    if (activeRoom.players.length >= activeRoom.maxPlayers) return;

    // Pick a template not yet in room
    const currentNames = activeRoom.players.map((p) => p.name);
    const availableTemp = BOT_TEMPLATES.filter((b) => !currentNames.includes(b.name));

    if (availableTemp.length === 0) return;

    const matchedTemplate = availableTemp[Math.floor(Math.random() * availableTemp.length)];
    const newBot: Player = {
      id: 'bot_' + Math.random().toString(36).substring(2, 9),
      name: matchedTemplate.name,
      avatar: matchedTemplate.avatar,
      isHost: false,
      score: 0,
      guessesLeft: activeRoom.answerChances,
      hasGuessedCorrectly: false,
      isBot: true,
      isMicActive: false
    };

    const updatedRoom: Room = {
      ...activeRoom,
      players: [...activeRoom.players, newBot]
    };

    setActiveRoom(updatedRoom);
    broadcastRoomUpdate(updatedRoom, questions);
  };

  const removeBotPlayer = (botId: string) => {
    if (!activeRoom || !currentPlayer.isHost) return;

    const updatedRoom: Room = {
      ...activeRoom,
      players: activeRoom.players.filter((p) => p.id !== botId)
    };

    setActiveRoom(updatedRoom);
    broadcastRoomUpdate(updatedRoom, questions);
  };

  const sendChatMessage = (text: string) => {
    const r = activeRoomRef.current;
    if (!r) return;
    const newMessage: ChatMessage = {
      id: 'chat_' + Math.random().toString(36).substring(2, 9),
      senderId: currentPlayer.id,
      senderName: currentPlayer.name,
      senderAvatar: currentPlayer.avatar,
      text,
      timestamp: Date.now()
    };
    setChatMessages((prev) => [...prev, newMessage]);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'CHAT_MESSAGE',
        roomId: r.id,
        message: newMessage
      });
    }
  };

  const clearChatMessages = () => {
    setChatMessages([]);
  };

  const currentQuestion = questions[activeRoom?.currentQuestionIndex ?? -1] || null;

  return (
    <GameContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentPlayer,
        updateCurrentPlayer,
        activeRoom,
        questions,
        currentQuestion,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        submitGuess,
        nextQuestion,
        addBotPlayer,
        removeBotPlayer,
        toggleMic,
        micVolume,
        chatMessages,
        sendChatMessage,
        clearChatMessages
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
