
import { useEffect, useRef, useState } from 'react';
import GuessingGrid from './grid/GuessingGrid.react';
import StatusGrid from './grid/StatusGrid.react';
import BuildingGrid from './grid/BuildingGrid.react';
import { GameMap, GridState, RemoteClient, Word } from './types';
import { isComplete, updateCellStateForGuesses } from './utils/state';
import styled from 'styled-components';


interface Params {
  client: RemoteClient,
  gameId: string,
  initialGrid?: GridState,
}

const TIMEOUT = 10;

type GameStatus = 'placing' | 'waiting' | 'guessing' | 'defeat' | 'victory';

export default function BattleWordsGame({
  client,
  gameId,
  initialGrid,
}: Params): JSX.Element {
  const [gridState, setGridState] = useState<GridState>(initialGrid ?? new Map());
  const [opponentGridState, setOpponentGridState] = useState<GridState>(new Map());
  const [gameMap, setGameMap] = useState<GameMap>({words: []});
  const [gameStatus, setGameStatus] = useState<GameStatus>(initialGrid ? 'guessing' : 'placing');
  const [playerPlaced, setPlayerPlaced] = useState<boolean>(false);
  const [opponentPlaced, setOpponentPlaced] = useState<boolean>(false);
  const [guessResumeTime, setGuessResumeTime] = useState<number>(Date.now());
  const [time, setTime] = useState<number>(Date.now());

  const onWord = (word: Word) => {
    console.log('Sending word', word);
    (document.activeElement as HTMLElement)?.blur();
    setGuessResumeTime(Date.now() + TIMEOUT*1000);
    setGameStatus('waiting');
    client?.sendWord(word, gridState);
  };

  // Make stable refs to avoid retriggering
  // the subscription effect.
  const gridStateRef = useRef(gridState);
  gridStateRef.current = gridState;
  const gameMapRef = useRef(gameMap);
  gameMapRef.current = gameMap;

  if (time >= guessResumeTime && gameStatus === 'waiting') {
    setGameStatus('guessing');
  }

  const checkBothPlaced = () => {
    if (playerPlaced && opponentPlaced && gameStatus === 'placing') {
      setGameStatus('guessing');
    }
  };

  useEffect(() => {
    setInterval(() => setTime(Date.now()), 250);
  });

  useEffect(() => {
    // Verifying opponent's guess
    client?.onWord((word: Word, opponentGrid: GridState) => {
      console.log('Receiving word', word);  
      setGuessResumeTime(Date.now());
  
      const updateGridState = updateCellStateForGuesses(
        opponentGrid,
        gameMapRef.current.words,
        [word],
      );
      console.log('Sending updated grid', updateGridState);
      client?.sendGrid(updateGridState);
      setOpponentGridState(updateGridState);

      if (isComplete(updateGridState, gameMapRef.current.words)) {
        client.sendWin();
        setGameStatus('defeat');
        (document.activeElement as HTMLElement)?.blur();
      }
    });

    // Receiving result from a guess
    client?.onGrid((grid: GridState) => {
      console.log('Receiving grid', grid);
      setGridState(grid);
    });

    client?.onWin(() => {
      setGameStatus('victory');
      (document.activeElement as HTMLElement)?.blur();
    });

    client?.onPlaced(() => {
      setOpponentPlaced(true);
    });
  }, [client]);

  const onCreateMap = (map: GameMap) => {
    setPlayerPlaced(true);
    setGameMap(map);
    client.sendPlaced();
  };

  checkBothPlaced();

  const renderPlacing = () => {
    return <>
      {
        playerPlaced ? 'Waiting for opponent to finish placing ... ' :
          <BuildingGrid onCreateMap={onCreateMap}></BuildingGrid>
      }
    </>;
  };

  // Render the StatusGrid with gridState for now, but it should be
  // have the current player's words with the opponents guesses.
  const guessActive = guessResumeTime <= Date.now();
  return (
    <EnclosingDiv className={gameStatus}>
      <TopBar className={'top-bar'}>
        <StatusGrid className={'status-grid'} playerGrid={opponentGridState} playerWords={gameMapRef.current.words}></StatusGrid>
        <span className="status">{gameStatus?.toUpperCase()}</span>
        <div className="clock-wrapper">
          {gameStatus === 'waiting' ? <><div className="clock"><div className="handle"></div></div></> : '' }
        </div>
      </TopBar>
      <div className={'play-region' + (guessActive ? '' : ' disabled')}>
        {
          gameStatus === 'placing' ? renderPlacing() :
            <GuessingGrid gridState={gridState} onWord={onWord} isEditing={guessActive}/>
        }
      </div>
      <span>{gameId}</span>
    </EnclosingDiv>
  );
}

const EnclosingDiv = styled.div`
&.defeat,
&.victory {
  pointer-events: none;
}

&.defeat .top-bar,
&.victory .top-bar {
  color: white;
}

&.defeat .status {
  background: firebrick;
}

&.victory .status {
  background: #6aaa64;
}

.play-region {
  margin-left: 30px;
}

.play-region.disabled {
  pointer-events: none;
  opacity: 0.5;
}

.top-bar {
  position: relative;
}

@keyframes shrink-clock {
  0% { width: 150px; height: 150px; }
  50% { width: 75px; height: 75px; }
  100% { width: 0px; height: 0px; }
}

.clock-wrapper {
  align-items: center;
  display: flex;
  justify-content: center;
  position: absolute;
  right: 100px;
  top: 50%;
}

.clock {
  animation: shrink-clock 10s linear;
  background: white;
  border-radius: 1000px;
  display: none;
  z-index: 2;
  overflow: hidden;
  position: absolute;
  border: 5px solid gray;
}

@keyframes rotate-handle {
  0% {transform: rotate(-90deg)}
  100% {transform: rotate(270deg)}
}

.handle {
  animation: rotate-handle 10s linear;
  background: dimgray;
  border-radius: 10px;
  border: 2px solid dimgray;
  left: calc(50% - 2px);
  top: calc(50% - 2px);
  transform-origin: 2px 2px;
  position: absolute;
  width: 75px;
  height: 0;
}

&.waiting .clock {
  display: block;
}
`;

const TopBar = styled.div`
align-items: center;
display: flex;
padding: 5px;

.status-grid {
  border-collapse: collapse;
  margin-left: 30px;
  z-index: 1;
}

.status-grid td {
  border: 2px solid white;
}

.status {
  background: lightgray;
  flex: 1;
  font-size: 60px;
  padding: 10px 60px;
  position: absolute;
  width: 100%;
  z-index: 0;
  padding-left: 240px;
}
`;
