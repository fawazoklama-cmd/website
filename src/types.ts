/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'world' | 'continent';

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania';

export interface Country {
  code: string; // ISO 3166-1 alpha-2 (lowercase)
  name: {
    en: string;
    id: string; // Indonesian Name
  };
  emoji: string;
  continent: Continent;
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // base64 or preset key
  isHost: boolean;
  score: number;
  guessesLeft: number;
  hasGuessedCorrectly: boolean;
  isBot?: boolean;
  isMicActive?: boolean;
}

export interface Room {
  id: string;
  name: string;
  targetPoints: number;
  maxPlayers: number;
  answerChances: number;
  mode: GameMode;
  selectedContinent: Continent | 'All';
  players: Player[];
  status: 'lobby' | 'playing' | 'results';
  currentQuestionIndex: number;
  roundTimerSeconds: number;
}

export interface Question {
  flagUrl: string;
  emoji: string;
  correctCountry: Country;
  options: Country[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}

export interface Translation {
  title: string;
  subtitle: string;
  playGame: string;
  createRoom: string;
  joinRoom: string;
  tutorial: string;
  rules: string;
  enterName: string;
  chooseAvatar: string;
  uploadPfp: string;
  roomName: string;
  targetPoints: string;
  answerChances: string;
  maxPlayers: string;
  roomCode: string;
  playersLobby: string;
  startGame: string;
  modeSelection: string;
  allContinents: string;
  guessTheCountry: string;
  pointsToWin: string;
  timeRemaining: string;
  chancesLeft: string;
  correctAnswer: string;
  incorrectAnswer: string;
  gameOver: string;
  winnerIs: string;
  playAgain: string;
  returnHome: string;
  createdBy: string;
  instructions: string;
  howToPlayTitle: string;
  howToPlayDesc: string;
  scoringTitle: string;
  scoringDesc: string;
  voiceChatTitle: string;
  voiceChatDesc: string;
  botsTitle: string;
  botsDesc: string;
  roomGuideTitle: string;
  roomGuideDesc: string;
  creditsTitle: string;
  creditsDesc: string;
  close: string;
  addBot: string;
  removeBot: string;
  voiceActive: string;
  voiceMuted: string;
  totalPoints: string;
  activePlayers: string;
  connecting: string;
  invalidRoom: string;
  gameModes: string;
  continentMode: string;
  worldMode: string;
  p2pStatus: string;
  voiceChatUnavailable: string;
  ready: string;
  notReady: string;
  readyButton: string;
  flagAlbum: string;
  searchPlaceholder: string;
  filterContinent: string;
  favoritesOnly: string;
  studyMode: string;
  flashcards: string;
  showAnswer: string;
  nextCard: string;
  prevCard: string;
  flagComparison: string;
  selectToCompare: string;
  compare: string;
  testYourself: string;
  startQuiz: string;
  correctCount: string;
  incorrectCount: string;
  practiceComplete: string;
  noFlagsFound: string;
  addToFavorites: string;
  removeFromFavorites: string;
  comparisonTitle: string;
  comparisonSelectPlaceholder: string;
  comparisonChoosePrompt: string;
  comparisonResultDifferent: string;
  comparisonResultSimilar: string;
  startPractice: string;
  practiceQuestion: string;
  scoreLabel: string;
  congratsPractice: string;
  playPracticeAgain: string;
  // New features translation types
  soloMode: string;
  multiplayerMode: string;
  selectDifficulty: string;
  easy: string;
  medium: string;
  hard: string;
  timerSetting: string;
  off: string;
  endlessMode: string;
  backToHome: string;
  chatPlaceholder: string;
  mute: string;
  unmute: string;
  scoreSummary: string;
  correctAnswers: string;
  wrongAnswers: string;
  accuracy: string;
  exitGame: string;
  chatHeading: string;
  chatSpamWarning: string;
}

export type BroadcastMessage =
  | { type: 'PLAYER_JOIN'; roomId: string; player: Player }
  | { type: 'PLAYER_LEAVE'; roomId: string; playerId: string }
  | { type: 'ROOM_UPDATE'; roomId: string; room: Room; questions: Question[] }
  | { type: 'PLAYER_ACTION'; roomId: string; playerId: string; action: 'guess' | 'timer_tick' | 'mic_toggle'; payload: any }
  | { type: 'CHAT_MESSAGE'; roomId: string; message: ChatMessage };
