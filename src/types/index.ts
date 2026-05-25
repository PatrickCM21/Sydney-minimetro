// Shared TypeScript types for the Sydney Minimetro game

export type LineId = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'M1' | 'M2';

export interface TrainLine {
  id: LineId;
  name: string;
  color: string;        // hex color string
  textColor: string;    // for contrast on badge
}

export interface Station {
  id: string;           // e.g. 'central', 'chatswood'
  name: string;         // display name e.g. 'Central'
  lines: LineId[];      // which lines stop here
  x: number;           // schematic X (0–1400)
  y: number;           // schematic Y (0–900)
}

export interface Edge {
  from: string;         // station id
  to: string;           // station id
  line: LineId;         // which line this edge belongs to
}

export interface GameState {
  mode: 'daily' | 'practice';
  startId: string;
  targetId: string;
  guessedIds: string[];            // ordered list of guessed station ids
  revealedEdgeKeys: Set<string>;   // "from-to-line" strings
  isComplete: boolean;
  optimalPath: string[];           // filled when game ends
  userPath: string[];              // the user's path (connected chain if valid)
  date?: string;                   // ISO date string for daily mode
}

export interface DailyChallenge {
  start: string;  // station id
  target: string; // station id
  date: string;   // YYYY-MM-DD
}
