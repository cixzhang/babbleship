
import type {StableRowAndColumn} from './utils/getStableRowAndColumn';

export type PlayerID = string;

export interface Word {
  word: string,
  column: number,
  row: number,
  direction: 'horizontal' | 'vertical',
}

export interface GameMap {
  words: Array<Word>,
}

export interface CellState {
  hit: string,
  near: Set<string>,
  miss: Set<string>,
}

export interface RowAndColumn {
  row: number,
  column: number,
}

export type GridState = Map<StableRowAndColumn, CellState>;

export type JoinResponse = 'accepted' | 'rejected';

export interface RemoteClient {
  sendWord(word: Word, grid: GridState): void;
  onWord(cb: (word: Word, grid: GridState) => void): void;

  sendGrid(grid: GridState): void;
  onGrid(cb: (grid: GridState) => void): void;

  sendWin(): void;
  onWin(cb: () => void): void;

  sendPlaced(): void;
  onPlaced(cb: () => void): void;

  sendJoin(id: string, lastGrid?: GridState): void;
  onJoin(cb: (id: string, lastGrid?: GridState) => void): void;

  sendRejectJoin(message: string): void;
  onRejected(cb: (message: string) => void): void;

  sendAcceptJoin(id: string): void;
  onAccepted(cb: (id: string) => void): void;

  sendPing(id: string): void;
  onPing(cb: (id: string) => void): void;
}
