
import {ROWS, COLUMNS, GRID_SIZE, MIN_WORD_LENGTH} from '../constants/grid';
import { useReducer } from 'react';
import { Word } from '../types';

export type Move =
  | {type: 'up'}
  | {type: 'down'}
  | {type: 'left'}
  | {type: 'right'}
  | {type: 'set', row: number, column: number}
  | {type: 'clear'}
  | {type: 'append', character: string}
  | {type: 'backspace'}
  | {type: 'flip'};


export default function useWordReducer(): [Word, (move: Move) => void] {
  return useReducer(wordReducer, {
    word: '',
    column: 0,
    row: 0,
    direction: 'horizontal'
  });
}

function wordReducer(state: Word, move: Move): Word {
  switch (move.type) {
    case 'up':
      return {
        ...state,
        row: Math.max(state.row - 1, 0),
      };
    case 'down':
      return clampWordPosition({
        ...state,
        row: Math.min(state.row + 1, ROWS.length - 1),
      });
    case 'left':
      return {
        ...state,
        column: Math.max(state.column - 1, 0),
      };
    case 'right':
      return clampWordPosition({
        ...state,
        column: Math.min(state.column + 1, COLUMNS.length - 1),
      });
    case 'set':
      return clampWordPosition({...state, row: move.row, column: move.column});
    case 'clear':
      return {...state, word: ''};
    case 'append':
      return clampWordPosition(state.word.length < GRID_SIZE ? {...state, word: state.word + move.character} : state);
    case 'backspace':
      if (!state.word) return state;
      return {
        ...state,
        word: state.word.slice(0, state.word.length - 1),
      };
    case 'flip':
      const updated: Word = {...state, direction: state.direction === 'horizontal' ? 'vertical' : 'horizontal'};
      return clampWordPosition(updated);
    default:
      throw new Error(`Move ${move} is not valid`);
  }
}

function clampWordPosition(state: Word) {
  const minLength = Math.max(state.word.length, MIN_WORD_LENGTH);
  if (state.direction === 'horizontal') {
    state.column = Math.min(GRID_SIZE - minLength, state.column);
  } else {
    state.row = Math.min(GRID_SIZE - minLength, state.row);
  }
  return state;
}
