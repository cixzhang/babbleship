
import { Word } from "../types";

export default function getWordCharacter(word: Word, row: number, column: number) {
  if (word.direction === 'horizontal' && word.row === row && column >= word.column) {
    return word.word.at(column - word.column) || '';
  } else if (word.direction === 'vertical' && word.column === column && row >= word.row) {
    return word.word.at(row - word.row) || '';
  }
  return '';
}