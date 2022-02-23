
import {RefObject, useState} from 'react';
import { PeerHandle } from './networking/PeerJsConfig';

interface Params {
  peerId: string,
  peer: RefObject<PeerHandle>,
}

export default function BattleWordsHome({peerId, peer}: Params): JSX.Element {
  const [serverId, setServerId] = useState<string>();

  return (
    <>
      <label>
        Join a game
        <input
          type="text"
          placeholder="Enter server id"
          value={serverId}
          onChange={e => setServerId(e.target.value)}
        />
        <button
          disabled={serverId == null}
          onClick={() =>
            serverId != null &&
            peer.current?.connectToServer(serverId)
          }>
          Join
        </button>
      </label>
      <hr />
      <label>
        Share a game code
        <input
          type="text"
          value={peerId}
          onChange={() => {}}
        />
        <button disabled={true}>Waiting for players...</button>
      </label>
      <hr />
      <button onClick={() => peer.current?.connectToMockServer()}>
        Join a mock game (DEV)
      </button>
    </>
  )
}