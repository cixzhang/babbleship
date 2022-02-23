
import type { GameMap} from './types';

export const ownMap: GameMap = {
  words: [{
    word: 'steam',
    row: 1,
    column: 0,
    direction: 'horizontal',
  }, {
    word: 'tame',
    row: 0,
    column: 3,
    direction: 'vertical',
  }, {
    word: 'most',
    row: 1,
    column: 4,
    direction: 'vertical',
  }, {
    word: 'emo',
    row: 2,
    column: 0,
    direction: 'horizontal',
  }],
}

export const opponentMap: GameMap = {
  words: [{
    word: 'chore',
    row: 4,
    column: 0,
    direction: 'horizontal',
  }, {
    word: 'were',
    row: 1,
    column: 4,
    direction: 'vertical',
  }, {
    word: 'lynx',
    row: 3,
    column: 0,
    direction: 'horizontal',
  }, {
    word: 'rye',
    row: 0,
    column: 0,
    direction: 'horizontal',
  }],
}
