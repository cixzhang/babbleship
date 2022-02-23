

import type {GridState, Word} from '../types';

import LetterCell from './LetterCell.react';
import getStableRowAndColumn from '../utils/getStableRowAndColumn';
import { useCallback, useEffect, useState } from 'react';
import { getOrSetCellState } from '../utils/state';
import validateWord from '../utils/validateWord';
import {ROWS, COLUMNS} from '../constants/grid';
import useWordReducer from '../utils/useWordReducer';
import getWordCharacter from '../utils/getWordCharacter';

interface GuessingGridProps {
  gridState: GridState,
  onWord: (word: Word) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isEditing?: boolean;
}

export default function GuessingGrid({
  gridState,
  isEditing,
  onWord,
  onFocus,
  onBlur,
}: GuessingGridProps): JSX.Element {
  const [isInvalid, setIsInvalid] = useState<boolean>(false);

  const [word, updateWordImpl] = useWordReducer();

  const updateWord = useCallback((value) => {
    setIsInvalid(false);
    updateWordImpl(value);
  }, [updateWordImpl]);

  const onSubmit = () => {
    const isValid = validateWord(word);
    if (isValid) {
      updateWordImpl({type: 'clear'});
      onWord(word);
    } else {
      setIsInvalid(true);
    }
  };

  useEffect(() => {
    if (isEditing) {
      const selector = `tr:nth-child(${word.row + 1}) td:nth-child(${word.column + 1}) input`;
      (document.querySelector(selector) as HTMLElement)?.focus();
    }
  }, [word, isEditing]);

  return <table onFocus={onFocus} onBlur={onBlur}>
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

            const onFocusWrapped = () => {
              updateWord({type: 'set', row, column});
              if (onFocus) onFocus();
            };

            const isWordBase = word.row === row && word.column === column;

            const value = getWordCharacter(word, row, column);
            return (
              <td key={rowAndColumn}>
                <LetterCell
                  state={getOrSetCellState(gridState, rowAndColumn)}
                  isWordBase={isWordBase}
                  isOnActivePath={Boolean(isEditing) && isOnActivePath}
                  isTabbable={row === word.row && column === word.column}
                  isInvalid={isInvalid && value.length > 0}
                  value={value}
                  onFocus={onFocusWrapped}
                  onInput={(character: string) => updateWord({type: 'append', character})}
                  onSubmit={onSubmit}
                  onBackspace={() => updateWord({type: 'backspace'})}
                  onArrowKey={move => updateWord({type: move})}
                  onFlip={() => updateWord({type: 'flip'})}
                />
              </td>
            );
          })}
        </tr>
      )
    }
    </tbody>
  </table>
}
