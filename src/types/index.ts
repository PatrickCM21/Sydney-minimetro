// Shared TypeScript types for the Sydney Minimetro game

export type LineId = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'M1';

export interface TrainLine {
  id: LineId;
  name: string;
  color: string;
  textColor: string;
}

export interface Station {
  id: string;
  name: string;
  lines: LineId[];
  lat: number;   // WGS-84 latitude
  lng: number;   // WGS-84 longitude
}

export interface Edge {
  from: string;
  to: string;
  line: LineId;
}

export interface GameState {
  mode: 'daily' | 'practice';
  startId: string;
  targetId: string;
  guessedIds: string[]; // correct guesses
  revealedEdgeKeys: Set<string>;
  isComplete: boolean;
  optimalPath: string[];
  userPath: string[];
  date?: string;
  tripPath: string[];
  tripLines: LineId[];
  wrongGuesses: string[];
}

export interface DailyChallenge {
  start: string;
  target: string;
  date: string;
}
