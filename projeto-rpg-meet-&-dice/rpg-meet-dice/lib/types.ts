/**
 * Tipos compartilhados do aplicativo RPG Meet & Dice
 */

export interface Room {
  id: string;
  createdAt: Date;
  participants: string[];
}

export interface DiceRoll {
  id: string;
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'multi';
  result: number;
  breakdown?: number[];
  timestamp: Date;
  playerName: string;
}

export interface PlayerSettings {
  name: string;
  videoQuality: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface RecentRoom {
  roomId: string;
  playerName: string;
  lastJoined: Date;
}
