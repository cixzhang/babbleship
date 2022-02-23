
import threeletterwordlist from '../constants/3letterwordlist';
import fourletterwordlist from '../constants/4letterwordlist';
import fiveletterwordlist from '../constants/5letterwordlist';
import type { Word } from '../types';

export default function validateWord(word: Word): boolean {
  const wordRaw = word.word.toLowerCase();
  switch (wordRaw.length) {
    case 3: 
      return threeletterwordlist.has(wordRaw);
    case 4:
      return fourletterwordlist.has(wordRaw);
    case 5:
      return fiveletterwordlist.has(wordRaw);
  }
  return false;
}
