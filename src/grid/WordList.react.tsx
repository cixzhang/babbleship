
import { useMemo } from 'react';
import styled from 'styled-components';
import { Word } from "../types";
import getWordsByLength from '../utils/getWordsByLength';

interface Props {
  words: Word[],
  onUpdateWords: (wordlist: Word[]) => void,
};

export default function WordList({words, onUpdateWords}: Props): JSX.Element {
  const wordsByLength = useMemo(() => getWordsByLength(words), [words]);

  const onRemove = (wordRaw: string) => {
    onUpdateWords(words.filter(word => word.word !== wordRaw));
  };

  return <div>
    <strong id="word-list-header">Word List</strong>
    <ul aria-labelledby="word-list-header">
      <WordListItem
        key="3"
        wordRaw={wordsByLength.get(3)?.[0]?.word}
        wordLength={3}
        onRemove={onRemove} />
      <WordListItem
        key="4-1"
        wordRaw={wordsByLength.get(4)?.[0]?.word}
        wordLength={4}
        onRemove={onRemove} />
      <WordListItem
        key="4-2"
        wordRaw={wordsByLength.get(4)?.[1]?.word}
        wordLength={4}
        onRemove={onRemove} />
      <WordListItem
        key="5"
        wordRaw={wordsByLength.get(5)?.[0]?.word}
        wordLength={5}
        onRemove={onRemove} />
    </ul>
  </div>;
}

function WordListItem({wordRaw, wordLength, onRemove}: {
  wordRaw?: string,
  wordLength: number,
  onRemove: (wordRaw: string) => void,
}): JSX.Element {
  return <li>
    <LetterBoxContainer>
      {Array.from({length: wordLength}).map((_, index) => (
        <LetterBox>{wordRaw?.[index] ?? ''}</LetterBox>
      ))}
      {
        wordRaw != null &&
          <button onClick={() => onRemove(wordRaw)}>
            {`Remove ${wordRaw}`}
          </button>
      }
    </LetterBoxContainer>
  </li>
}

const LetterBoxContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const LetterBox = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 1px solid black;
  text-align: center;
`;
