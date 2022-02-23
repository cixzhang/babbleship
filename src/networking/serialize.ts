
import { CellState, GridState } from "../types";

export function serializeCellState(state: CellState) {
  return {
    near: Array.from(state.near),
    miss: Array.from(state.miss),
    hit: state.hit,
  };
}

export type SerializedCellState = ReturnType<typeof serializeCellState>;
export type SerializedGridState = Array<[string, SerializedCellState]>;


export function deserializeCellState(state: SerializedCellState): CellState {
  return {
    near: new Set(state.near),
    miss: new Set(state.miss),
    hit: state.hit,
  }
}

export function serializeGridState(grid: GridState): SerializedGridState {
  return Array.from(grid.entries()).map(x => [x[0], serializeCellState(x[1])]);
}

export function deserializeGridState(serialized: Array<[string, SerializedCellState]>): GridState {
  return new Map(serialized.map(x => [x[0], deserializeCellState(x[1])]));
}
