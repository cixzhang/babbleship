
import { Word } from "../types";

export default function getWordsByLength(words: Word[]): Map<number, Word[]> {
  const wordMap = new Map();
  words.forEach(word => {
    if (!wordMap.has(word.word.length)) {
      wordMap.set(word.word.length, [word]);
    } else {
      wordMap.get(word.word.length).push(word);
    }
  });
  return wordMap;
}
