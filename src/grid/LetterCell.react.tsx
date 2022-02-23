

import styled from 'styled-components';
import type {CellState} from '../types';

import LetterCellInput from './LetterCellInput.react';

export function letterClass(state: CellState, x: string) {
  if (state.hit === x) return 'hit';
  if (state.miss.has(x)) return 'miss';
  if (state.near.has(x)) return 'near';
  return '';
};

interface LetterCellProps {
  state: CellState,
  isInvalid: boolean,
  isWordBase?: boolean,
  isOnActivePath: boolean,
  isTabbable: boolean,
  value: string;
  onBackspace: () => void,
  onFocus: () => void,
  onSubmit: () => void,
  onInput: (character: string) => void,
  onFlip: () => void,
  onArrowKey: (move: 'up' | 'down' | 'left' | 'right') => void,
}
export default function LetterCell({
  state,
  isInvalid,
  isWordBase,
  isOnActivePath,
  isTabbable,
  value,
  onBackspace,
  onFocus,
  onSubmit,
  onInput,
  onFlip,
  onArrowKey,
}: LetterCellProps): JSX.Element {
  const renderLetter = (x: string) => <td key={x} className={letterClass(state, x.toUpperCase())}>{x}</td>;

  const onClick = (e: React.MouseEvent) => {
    if (isOnActivePath && isWordBase) {
      onFlip(); 
    } else {
      onFocus();
    }
  };

  return (
    <StyledCell>
      <table onClick={onClick}>
      <tbody>
      <tr>
        <td id="main" className={state.hit ? 'hit' : ''} colSpan={3} rowSpan={3}>
          <LetterCellInput
            placeholder={state.hit.toUpperCase()}
            isTabbable={isTabbable}
            value={value}
            onBackspace={onBackspace}
            onFocus={onFocus}
            onSubmit={onSubmit}
            onInput={onInput}
            onSpace={onFlip}
            onArrowKey={onArrowKey}
            // CSS
            isWordBase={isWordBase}
            isOnActivePath={isOnActivePath}
            isInvalid={isInvalid}
          />
        </td>
        {Array.from('ABC').map(renderLetter)}
      </tr>
      <tr>{Array.from('DEF').map(renderLetter)}</tr>
      <tr>{Array.from('GHI').map(renderLetter)}</tr>
      <tr>{Array.from('JKLMNO').map(renderLetter)}</tr>
      <tr>{Array.from('PQRSTU').map(renderLetter)}</tr>
      <tr>{Array.from('VWXYZ ').map(renderLetter)}</tr>
      </tbody>
    </table>
    </StyledCell>
  );
}

const StyledCell = styled.div`
  margin: 4px;

  table {
    border-collapse: collapse;
  }

  #main {
    background: white;
  }

  td.hit input {
    background: #6aaa64;
    color: white;
  }

  td {
    background: whitesmoke;
    font-size: 12px;
    height: 20px;
    text-align: center;
    width: 20px;
  }

  td.miss {
    background: dimgray;
    color: white;
  }

  td.near {
    background: #c9b458;
    color: white;
  }
`;
