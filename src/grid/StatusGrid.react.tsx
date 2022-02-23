
import {GridState, Word} from '../types';
import {ROWS, COLUMNS} from '../constants/grid';
import getWordCharacter from '../utils/getWordCharacter';
import getStableRowAndColumn from '../utils/getStableRowAndColumn';
import { letterClass } from './LetterCell.react';
import styled from 'styled-components';

interface Params {
  className?: string;
  playerGrid: GridState;
  playerWords: Word[];
};

// This grid shows the status of the player's board with the opponents guesses.
export default function StatusGrid(params: Params): JSX.Element {

  function getCell(row: number, column: number) {
    return params.playerGrid.get(getStableRowAndColumn({row, column}));
  }

  function cellClass(row: number, column: number) {
    const cell = getCell(row, column);
    if (!cell) return '';
    return letterClass(cell, cell.hit || cell?.near?.entries().next().value);
  }

  function getAnyCharacterAt(row: number, column: number) {
    return params.playerWords.map(
      word => getWordCharacter(word, row, column)).filter(x => x)[0]?.toUpperCase();
  }

  return <StyledTable className={params.className}>
    <tbody>
    {
      ROWS.map((_, r) => {
        return <tr key={r}>{COLUMNS.map((_, c) => <td key={c} className={
          cellClass(r, c)}>{getAnyCharacterAt(r, c)}</td>)}</tr>;
      })
    }
    </tbody>
  </StyledTable>;
}

const StyledTable = styled.table`
td {
  background: lightgray;
  color: black;
  font-size: 15px;
  height: 30px;
  text-align: center;
  width: 30px;
}

td.hit {
  background: firebrick;
  color: white;
}

td.near {
  background: #c9b458;
  color: white;
}

`;