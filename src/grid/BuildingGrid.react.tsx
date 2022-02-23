

import type {GameMap, Word} from '../types';

import LetterCellInput from './LetterCellInput.react';
import getStableRowAndColumn, { StableRowAndColumn } from '../utils/getStableRowAndColumn';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCharacterMap, getCharacterPosition } from '../utils/state';
import {ROWS, COLUMNS} from '../constants/grid';
import useWordReducer from '../utils/useWordReducer';
import validateWord from '../utils/validateWord';
import getWordsByLength from '../utils/getWordsByLength';
import WordList from './WordList.react';

interface BuildingGridProps {
  onCreateMap: (map: GameMap) => void;
}

type ValidateWordError = {
  type: 'letterOverlap',
  collisions: Set<StableRowAndColumn>,
} | {
  type: 'wordListExceeded',
  wordLength: number,
} | {
  type: 'notAWord',
} | {
  type: 'incorrectWordLength',
} | {
  type: 'duplicateWord',
} | {
  type: 'tooManyCharactersOverlap',
};

export default function BuildingGrid({
  onCreateMap,
}: BuildingGridProps): JSX.Element {
  const [map, setMap] = useState<GameMap>({words: []});
  const characterMap = useMemo(() => getCharacterMap(map.words), [map]);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [validation, setValidation] = useState<ValidateWordError | true | void>();

  const [word, updateWordImpl] = useWordReducer();
  const currentWordCharacterMap = useMemo(() => getCharacterMap([word]), [word]);

  const createRef = useRef<HTMLButtonElement>(null);

  const updateWord = useCallback((value) => {
    setValidation(undefined);
    updateWordImpl(value);
  }, [updateWordImpl]);

  // When word updates, run validators.
  const mapRef = useRef(map);
  mapRef.current = map;
  const characterMapRef = useRef(characterMap);
  characterMapRef.current = characterMap;

  useEffect(() => {
    setValidation(
      validateWordPlacement(
        mapRef.current,
        characterMapRef.current,
        word,
      )
    );

    if (validateMapForCompletion(mapRef.current)) {
      setIsEditing(false);
      createRef.current?.focus();
    }
  }, [word]);

  const onSubmit = () => {
    if (validation === true) {
      setMap(map => ({...map, words: [...map.words, word]}));
      updateWordImpl({type: 'clear'});
    }
  };

  return <>
    <table onFocus={() => {
      if (!validateMapForCompletion(mapRef.current)) {
        setIsEditing(true);
      }
    }} onBlur={() => setIsEditing(false)}>
    <tbody>
    {
      ROWS.map((_, row) =>
        <tr key={row}>
          {COLUMNS.map((_, column) => {
            const rowAndColumn = getStableRowAndColumn({row, column});

            const cursorRow = word.row + (word.direction === 'horizontal' ? word.word.length : 0);
            const cursorColumn = word.column + (word.direction === 'vertical' ? word.word.length : 0);

            const isOnActivePath =
            (word.row === row && word.direction === 'horizontal' && column >= cursorColumn) ||
            (word.column === column && word.direction === 'vertical' && row >= cursorRow);

            const isInWord = currentWordCharacterMap.get(rowAndColumn) != null;
            const value = currentWordCharacterMap.get(rowAndColumn) ?? characterMap.get(rowAndColumn) ?? '';

            return (
              <td key={rowAndColumn}>
                <LetterCellInput
                  isOnActivePath={isEditing && isOnActivePath}
                  isTabbable={row === word.row && column === word.column}
                  isInvalid={isInWord && getIsCellInvalid(rowAndColumn, validation)}
                  value={value}
                  placeholder={value}
                  onFocus={() => updateWord({type: 'set', row, column})}
                  onInput={(character: string) => updateWord({type: 'append', character})}
                  onSubmit={onSubmit}
                  onBackspace={() => updateWord({type: 'backspace'})}
                  onArrowKey={move => updateWord({type: move})}
                  onSpace={() => updateWord({type: 'flip'})}
                />
              </td>
            );
          })}
        </tr>
      )
    }
    </tbody>
    </table>
    <WordList words={map.words} onUpdateWords={(newWords) => setMap({words: newWords})} />
    {validation !== true && <ValidationHint word={word} validation={validation} />}
    <button
      ref={createRef}
      disabled={validateMapForCompletion(map) !== true}
      onClick={() => onCreateMap(map)}>
        Create Map
    </button>
  </>
}

function ValidationHint(
  {word, validation: validationFromProps}:
  {word: Word, validation: void | ValidateWordError}
): JSX.Element {
  const prevValidationRef = useRef(validationFromProps);
  useEffect(() => {
    if (validationFromProps != null) {
      prevValidationRef.current = validationFromProps;
    }
  }, [validationFromProps]);

  const validation = validationFromProps ?? prevValidationRef.current;

  // Skip showing validation hints if the user hasn't entered anything.
  if (validation == null) {
    return <></>;
  }

  switch (validation.type) {
    case 'letterOverlap': {
      return <>Letters that overlap other words must match.</>;
    }
    case 'notAWord': {
      return <>{`${word.word} is not a valid word.`}</>;
    }
    case 'wordListExceeded': {
      return <>{validation.wordLength === 4 ?
        'Only 2 4-letter words can be entered.' :
        `Only one ${validation.wordLength} word can be entered.`
      }</>;
    }
    case 'incorrectWordLength': {
      return <>Enter a 3-letter, 4-letter, or 5-letter word.</>;
    }
    case 'duplicateWord': {
      return <>{`${word.word} has already been entered.`}</>;
    }
    case 'tooManyCharactersOverlap': {
      return <>More than half the word overlaps with other words.</>;
    }
  }
}

function validateWordPlacement(
  originalMap: GameMap,
  characterMap: Map<StableRowAndColumn, string>,
  newWord: Word,
): void | true | ValidateWordError {
  // User hasn't started entering text yet.
  if (newWord.word.length === 0) {
    return undefined;
  }

  if (newWord.word.length < 3 || newWord.word.length > 5) {
    return {type: 'incorrectWordLength'};
  }

  const wordsByLength = getWordsByLength(originalMap.words);
  // Only a single 3 letter word is allowed
  if (newWord.word.length === 3 && (wordsByLength.get(3) ?? []).length > 0) {
    return {type: 'wordListExceeded', wordLength: 3};
  }
  // Only 2 4 letter words are allowed
  if (newWord.word.length === 4 && (wordsByLength.get(4) ?? []).length > 1) {
    return {type: 'wordListExceeded', wordLength: 4};
  }
  // Only a single 5 letter word is allowed
  if (newWord.word.length === 5 && (wordsByLength.get(5) ?? []).length > 0) {
    return {type: 'wordListExceeded', wordLength: 5};
  }

  // Check that this is a real word
  if (!validateWord(newWord)) {
    return {type: 'notAWord'};
  }

  if (originalMap.words.find(word => word.word === newWord.word) != null) {
    return {type: 'duplicateWord'};
  }

  // Where words intersect, the letters must match.
  const nonMatchingCollisions: Set<StableRowAndColumn> = new Set();
  const allCollisions: Set<StableRowAndColumn> = new Set();
  Array.from(newWord.word).forEach((letter, letterIndex) => {
    const position = getCharacterPosition({
      letterIndex,
      direction: newWord.direction,
      row: newWord.row,
      column: newWord.column
    });
    const stableKey = getStableRowAndColumn(position);
    const character = characterMap.get(stableKey);
    if (character != null && character.toUpperCase() !== letter.toUpperCase()) {
      nonMatchingCollisions.add(stableKey);
    } else if (character != null) {
      allCollisions.add(stableKey);
    }
  });
  if (nonMatchingCollisions.size > 0) {
    return {type: 'letterOverlap', collisions: nonMatchingCollisions};
  }
  if (allCollisions.size > newWord.word.length / 2) {
    return {type: 'tooManyCharactersOverlap'};
  }

  return true;
}

function validateMapForCompletion(map: GameMap): boolean {
  if (map.words.length !== 4) {
    return false;
  }

  return true;
}

function getIsCellInvalid(
  rowAndColumn: StableRowAndColumn,
  validation: ValidateWordError | true | void
): boolean {
  if (validation == null || validation === true) {
    return false;
  }

  switch (validation.type) {
    case 'duplicateWord':
      // Intentional fallthrough
    case 'incorrectWordLength':
      // Intentional fallthrough
    case 'notAWord':
      // Intentional fallthrough
    case 'tooManyCharactersOverlap':
      // Intentional fallthrough
    case 'wordListExceeded': {
      return true;
    }
    case 'letterOverlap': {
      return validation.collisions.has(rowAndColumn);
    }
  }
}