
import type {RowAndColumn} from '../types';

export type StableRowAndColumn = string;

export default function getStableRowAndColumn({row, column}: RowAndColumn): StableRowAndColumn {
  return `${row}-${column}`;
}
