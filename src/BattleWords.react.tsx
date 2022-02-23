

import { useRef, useState } from 'react';

import { GridState, RemoteClient } from './types';
import BattleWordsGame from './BattleWordsGame.react';
import BattleWordsHome from './BattleWordsHome.react';
import PeerJsConfig, { PeerHandle } from './networking/PeerJsConfig';

type ConnectionStatus = 'none' | 'waiting' | 'error' | 'connected';

export default function BattleWords() {
  const [client, setClient] = useState<RemoteClient>();
  const [peerId, setPeerId] = useState<string>('');
  const [gameId, setGameId] = useState<string>('');
  const [initialGrid, setInitialGrid] = useState<undefined | GridState>();

  // TODO: make connection status visible to the user
  const [connectionError, setConnectionError] = useState<void | Error>();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');

  const peerHandle = useRef<PeerHandle>({
    connectToServer: () => {},
    connectToMockServer: () => {},
  });

  return <div>
    <PeerJsConfig
      handle={peerHandle}
      onConnect={({client, gameId, initialGrid}) => {
        setClient(client);
        setGameId(gameId);
        setInitialGrid(initialGrid);
        setConnectionStatus('connected');
        console.log('Connected to game', gameId, initialGrid);
      }}
      onConnectError={(err) => {
        console.error(err);
        setConnectionError(err);
        setConnectionStatus('error');
      }}
      onStartConnect={() => {
        console.log('Attempting connection...');
        setConnectionStatus('waiting');
      }}
      onConnectLost={() => {
        console.log('Connection to peer was lost.');
        setConnectionStatus('none');
      }}
      onConnectRestored={() => {
        console.log('Connection to peer was restored.');
        setConnectionStatus('connected');
      }}
      onOpen={setPeerId}
    />
    {
      client != null ?
        <BattleWordsGame client={client} gameId={gameId} initialGrid={initialGrid} /> :
        <BattleWordsHome peer={peerHandle} peerId={peerId} />
    }
  </div>;
}
