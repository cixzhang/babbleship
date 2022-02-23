
import type {GameMap, CellState, Word, GridState} from '../types';

import getStableRowAndColumn, { StableRowAndColumn } from './getStableRowAndColumn';
import getWordCharacter from './getWordCharacter';

export function getOrSetCellState(
  stateMap: GridState,
  stableKey: StableRowAndColumn
): CellState {
  if (!stateMap.has(stableKey)) {
    stateMap.set(stableKey, {hit: '', near: new Set(), miss: new Set()});
  }
  const cellState = stateMap.get(stableKey);
  if (cellState == null) {
    throw new Error('Cell State was null from getOrSetCellState. Maybe it failed to create one.')
  }
  return cellState;
}

export function getCharacterPosition({
  letterIndex,
  direction,
  row,
  column
} : {
  letterIndex: number,
  direction: Word['direction'],
  row: Word['row'],
  column: Word['column'],
}): {row: number, column: number} {
  return {
    row: row + (direction === 'vertical' ? letterIndex : 0),
    column: column + (direction === 'horizontal' ? letterIndex: 0),
  };
}

export function getCharacterMap(
  words: GameMap['words'],
): Map<StableRowAndColumn, string> {
  const characterMap = new Map();

  words.forEach(({word, direction, row, column}) => {
    Array.from(word).forEach((letter, letterIndex) => {
      const stableKey = getStableRowAndColumn(
        getCharacterPosition({row, column, direction, letterIndex})
      );
      characterMap.set(stableKey, letter);
    });
  });

  return characterMap;
}

function wordLetterKeyArray(word: Word) {
  return Array.from(word.word).map((letter, letterIndex) => {
    const stableKey = getStableRowAndColumn({
      row: word.row + (word.direction === 'vertical' ? letterIndex : 0),
      column: word.column + (word.direction === 'horizontal' ? letterIndex: 0)});
    return {stableKey, letter};
  });
}

export function updateCellStateForGuesses(
  cellStatesOriginal: GridState,
  words: GameMap['words'],
  guesses: Array<Word>,
): GridState {
  if (guesses.length === 0) {
    // Return stable cell states if there were no guesses.
    return cellStatesOriginal;
  }

  // 0. Clone the map.
  const cellStates = new Map(Array.from(cellStatesOriginal));

  // 1. Create a map of cells with guesses
  const guessMap: Map<StableRowAndColumn, {
    letter: string,
    letterLocations: Set<StableRowAndColumn>,
    letterIndex: number,
  }> = new Map();

  // 2. Loop through each guess and store each guess in the map
  guesses.forEach(({word: wordIn, column, row, direction}) => {
    // We need to track if a letter was guessed multiple times.
    const locations: Set<StableRowAndColumn> = new Set();

    const word = wordIn.toUpperCase();

    wordLetterKeyArray({word, column, row, direction}).forEach(({stableKey, letter}) => {
      guessMap.set(
        stableKey,
        {
          letter,
          letterLocations: locations,
          letterIndex: locations.size,
        }
      );
      locations.add(stableKey);

      // Default state to miss for guessed letters.
      // The next loop will update these to hits or nears.
      const cellState = getOrSetCellState(cellStates, stableKey);
      cellState.miss.add(letter);
    });
  });

  // 3. Loop through each word and generate the cell state
  // Rules:
  // - If the tile matches exactly a letter from a word > hit
  // - If the tile is not part of any word > miss
  // - If the tile is part of a word but the guessed letter
  //   does not exist any word > miss
  // - If the tile is part of a word and the guessed letter
  //   exists in at least one of those words but not in the
  //   current position > near
  //
  // For multiples of the same letter, we'll only check
  // the letter as many times as it exists in the word.
  // However, we'll want to set the hits first before we
  // set nears and misses.

  words.forEach(({word: wordIn, column, row, direction}) => {
    const word = wordIn.toUpperCase();
    Array.from(word).forEach((letter, letterIndex) => {
      const numLetterLocations = [
        ...Array.from(word.matchAll(new RegExp(letter, 'g')))
      ].length;
  
      const stableKey = getStableRowAndColumn(
        getCharacterPosition({row, column, direction, letterIndex})
      );

      const guessMapItem = guessMap.get(stableKey);
      if (guessMapItem == null) {
        // No guesses ahve been made at this location, so skip checking.
        return;
      }

      const {
        letter: guessedLetter,
        letterLocations: guessedLetterLocations,
        letterIndex: guessedLetterIndex,
      } = guessMapItem;

      const cellState = getOrSetCellState(cellStates, stableKey);

      if (cellState.hit === letter) {
        // Already a hit from another word, so skip checking
        return;
      }
  
      // If the tile matches exactly a letter from a word > hit
      if (guessedLetter === letter) {
        cellState.miss.delete(guessedLetter);
        cellState.near.delete(guessedLetter);
        cellState.hit = guessedLetter;

        // If guessed multiple times, clear any "nears" that 
        // appeared previously
        if (guessedLetterLocations.size > numLetterLocations) {
          const last = guessedLetterLocations.size - 1;
          const guessedLocationsArray = Array.from(guessedLetterLocations);
          let lettersOver = guessedLetterLocations.size - numLetterLocations;
          for (let i = last; i > 0; i--) {
            if (i === guessedLetterIndex) {
              continue;
            }

            const prevGuessToUnset = guessedLocationsArray[i];
            const prevGuessCellState = getOrSetCellState(cellStates, prevGuessToUnset);
            prevGuessCellState.near.delete(guessedLetter);

            lettersOver -= 1;
            if (lettersOver <= 0) {
              // We've finished unsetting all the extras.
              break;
            }
          }
        }
        return;
      }

      // Skip checking guesses for the same letter if it was
      // guessed more times than exists in the word
      if (guessedLetterIndex <= numLetterLocations) {
        const isNear = word.search(guessedLetter) > -1;
        if (isNear) {
          cellState.miss.delete(guessedLetter);
          cellState.near.add(guessedLetter);
        }
        return;
      }
    });
  });

  return cellStates;
}


export function isComplete(gridState: GridState, words: Word[]) {
  return words.flatMap(wordLetterKeyArray).map(
    x => gridState.get(x.stableKey)?.hit?.toUpperCase() === x.letter.toUpperCase()).every(x => x);
}
