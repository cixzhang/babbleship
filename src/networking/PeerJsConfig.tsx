
import Peer from 'peerjs';
import {RefObject, useEffect, useImperativeHandle, useRef} from 'react';

import { useCallback } from 'react';
import { opponentMap } from '../demo';

import {GridState, RemoteClient, Word} from '../types';
import { updateCellStateForGuesses } from '../utils/state';
import { getId, getRecordedGrid, record, validateRecord } from './localStorage';
import { deserializeGridState, SerializedGridState, serializeGridState } from './serialize';

const peer = new Peer();

export type PeerHandle = {
  connectToServer: (serverId: string) => void,
  connectToMockServer: () => void,
};

interface Params {
  onOpen: (peerId: string) => void,
  onStartConnect: () => void,
  onConnect: (obj: {client: RemoteClient, gameId: string, initialGrid?: GridState}) => void,
  onConnectError: (err: Error) => void,
  onConnectLost: () => void,
  onConnectRestored: () => void,
  handle: RefObject<PeerHandle>,
}

type Data = {
  type: 'word',
  word: Word,
  grid: SerializedGridState,
} | {
  type: 'grid',
  grid: SerializedGridState,
} | {
  type: 'win'
} | {
  type: 'placed'
} | {
  type: 'join',
  id: string,
  name: string,
  lastGrid?: SerializedGridState,
} | {
  type: 'rejected',
  reason: string,
} | {
  type: 'accepted',
  id: string,
} | {
  type: 'ping',
  id: string,
};

type SubscriptionStore = {
  onWord: ((word: Word, grid: GridState) => void)[],
  onGrid: ((grid: GridState) => void)[],
  onWin: (() => void)[],
  onPlaced: (() => void)[],
  onJoin: ((id: string, lastGrid?: GridState) => void)[],
  onRejected: ((reason: string) => void)[],
  onAccepted: ((id: string) => void)[],
  onPing: ((id: string) => void)[],
};

function makeClient(connection: Peer.DataConnection): RemoteClient {
  const subscriptions: SubscriptionStore = {
    onWord: [],
    onGrid: [],
    onWin: [],
    onPlaced: [],
    onJoin: [],
    onRejected: [],
    onAccepted: [],
    onPing: [],
  };

  connection.on('data', (data: Data) => {
    console.log('Receiving data', data);
    const type = data.type;
    switch (type) {
      case 'join':
        subscriptions.onJoin.forEach(
          cb => cb(data.id, data.lastGrid ? deserializeGridState(data.lastGrid) : undefined)
        );
        return;
      case 'rejected':
        subscriptions.onRejected.forEach(cb => cb(data.reason));
        return;
      case 'accepted':
        subscriptions.onAccepted.forEach(cb => cb(data.id));
        return;
      case 'ping':
        subscriptions.onPing.forEach(cb => cb(data.id));
        return;
      case 'word':
        subscriptions.onWord.forEach(cb => cb(data.word, deserializeGridState(data.grid)));
        return;
      case 'grid':
        subscriptions.onGrid.forEach(cb => cb(deserializeGridState(data.grid)));
        return;
      case 'win':
        subscriptions.onWin.forEach(cb => cb());
        return;
      case 'placed':
        subscriptions.onPlaced.forEach(cb => cb());
        return;
    };
  });

  return {
    // Send a word guess
    sendWord(word: Word, grid: GridState) {
      connection.send({type: 'word', word, grid: serializeGridState(grid)});
    },
    // Receive an opponent's word guess
    onWord(cb: (word: Word, grid: GridState) => void) {
      subscriptions.onWord.push(cb);
    },

    // Send an updated grid state after checking the latest guess.
    sendGrid(grid: GridState) {
      connection.send({type: 'grid', grid: serializeGridState(grid)});
    },
    // Receiving an updated grid state from opponent after they check your guess.
    onGrid(cb: (grid: GridState) => void) {
      subscriptions.onGrid.push(cb);
    },

    sendWin() {
      connection.send({type: 'win'});
    },
    onWin(cb: () => void) {
      subscriptions.onWin.push(cb);
    },

    sendPlaced() {
      connection.send({type: 'placed'});
    },
    onPlaced(cb: () => void) {
      subscriptions.onPlaced.push(cb);
    },

    sendJoin(id: string, lastGrid?: GridState) {
      connection.send({type: 'join', id});
    },
    onJoin(cb: (id: string, lastGrid?: GridState) => void) {
      subscriptions.onJoin.push(cb);
    },

    sendRejectJoin(reason: string) {
      connection.send({type: 'rejected', reason});
    },
    onRejected(cb: (reason: string) => void) {
      subscriptions.onRejected.push(cb);
    },

    sendAcceptJoin(id: string) {
      connection.send({type: 'accepted', id});
    },
    onAccepted(cb: (id: string) => void) {
      subscriptions.onAccepted.push(cb);
    },

    sendPing(id: string) {
      connection.send({type: 'ping', id});
    },
    onPing(cb: (id: string) => void) {
      subscriptions.onPing.push(cb);
    },
  };
}

/**
 * Mock client to mimic oponent behavior for testing.
 */
function makeMockClient(): RemoteClient {
  const subscriptions: SubscriptionStore = {
    onWord: [],
    onGrid: [],
    onWin: [],
    onPlaced: [],
    onJoin: [],
    onRejected: [],
    onAccepted: [],
    onPing: [],
  };

  const mockOpponentId = 'MockId';
  let opponentGridState: GridState = new Map();

  return {
    sendWord(word: Word, grid: GridState) {
      const updatedGrid = updateCellStateForGuesses(
        grid,
        opponentMap.words,
        [word],
      );

      setTimeout(() => {
        // Send a grid update.
        subscriptions.onGrid.forEach(cb => {
          cb(updatedGrid);
        });
      }, 800);

      setTimeout(() => {
        // Parrot back the same guess for now.
        subscriptions.onWord.forEach(cb => {
          cb(word, opponentGridState);
        });
      }, 1500);
    },
    onWord(cb: (word: Word, grid: GridState) => void) {
      subscriptions.onWord.push(cb);
    },

    sendGrid(grid: GridState) {
      opponentGridState = grid;
    },
    onGrid(cb: (grid: GridState) => void) {
      subscriptions.onGrid.push(cb);
    },

    sendWin() {
      // Don't have to do anything because defeat is handled on the player's side
      // and we don't see the mock client's screen.
    },
    onWin(cb: () => void) {
      subscriptions.onWin.push(cb);
    },

    sendPlaced() {
      // Mock opponent will be ready soon after the player is ready.
      setTimeout(() => {
        // Send a grid update.
        subscriptions.onPlaced.forEach(cb => {
          cb();
        });
      }, 800);
    },
    onPlaced(cb: () => void) {
      subscriptions.onPlaced.push(cb);
    },

    // Mock client doesn't need to worry about joining.
    sendJoin(id: string) {
      subscriptions.onAccepted.forEach(cb => cb(mockOpponentId));
    },
    onJoin(cb: (id: string, lastGrid?: GridState) => void) {},

    sendRejectJoin(message: string) {},
    onRejected(cb: (message: string) => void) {},

    sendAcceptJoin(message: string) {},
    onAccepted(cb: (id: string) => void) {
      subscriptions.onAccepted.push(cb);
    },

    sendPing(id: string) {
      subscriptions.onPing.forEach(cb => cb(mockOpponentId));
    },
    onPing(cb: (id: string) => void) {
      subscriptions.onPing.push(cb);
    },
  };
}

const DEFAULT_CONNECT_ERROR = 'Couldn\'t connect to server.';
const PING_INTERVAL = 2000;

export default function PeerJsConfig({
  onConnect,
  onConnectError,
  onStartConnect,
  onConnectLost,
  onConnectRestored,
  onOpen,
  handle,
}: Params): null {
  // Force this reference to be stable.
  const onConnectRef = useStableFuncRef(onConnect);
  const onConnectErrorRef = useStableFuncRef(onConnectError);
  const onStartConnectRef = useStableFuncRef(onStartConnect);
  const onConnectLostRef = useStableFuncRef(onConnectLost);
  const onConnectRestoredRef = useStableFuncRef(onConnectRestored);
  const onOpenRef = useStableFuncRef(onOpen);
  const waitingForConnectionRef = useRef<boolean>(false);

  const getValidatedClient = useCallback((gameId, connection) => {
    const client = makeClient(connection);
    let isInitialConnection = true;
    let opponentId: void | string;
    let lastPing = Date.now();

    client.onJoin((id, lastGrid) => {
      if (gameId == null) {
        onConnectErrorRef.current?.(new Error('Connection join occurred before peer opened.'));
        return;
      }

      if (id === getId()) {
        client.sendRejectJoin('You\'ve already joined this game.');
        return; 
      }

      const validation = validateRecord(gameId, id, lastGrid);
      if (validation !== true) {
        client.sendRejectJoin(validation);
      } else {
        client.sendAcceptJoin(getId());
        opponentId = id;
        record(gameId, id, lastGrid);
        if (isInitialConnection) {
          isInitialConnection = false;
          onConnectRef.current?.({client, gameId});
        }
      }
    });

    client.onAccepted((id) => {
      if (id !== getId()) {
        opponentId = id;
        // Initialize the connection with the last received grid.
        onConnectRef.current?.({client, gameId, initialGrid: getRecordedGrid(gameId)});
      }
    });

    client.onRejected((message) => {
      onConnectErrorRef.current?.(new Error(message ?? DEFAULT_CONNECT_ERROR));
      connection.close();
    });

    client.onGrid(grid => {
      if (gameId == null || opponentId == null) return;
      record(gameId, opponentId, grid);
    });


    let peerLost = false;
    client.onPing(id => {
      if (id === opponentId) {
        lastPing = Date.now();
        if (peerLost) onConnectRestoredRef.current?.();
        peerLost = false;
      }
    });
    setInterval(() => {
      const newPeerLost = lastPing < (Date.now() - PING_INTERVAL * 4);
      client.sendPing(getId());
      if (newPeerLost && !peerLost) onConnectLostRef.current?.();
      peerLost = newPeerLost;
    }, PING_INTERVAL);

    return client;
  }, [onConnectErrorRef, onConnectRef, onConnectLostRef, onConnectRestoredRef]);

  useEffect(() => {
    let gameId: void | string;
    peer.on('open', (peerId) => {
      gameId = peerId;
      onOpenRef.current?.(peerId);
    });

    peer.on('connection', function(connection) {
      getValidatedClient(gameId, connection);
    });
  }, [onOpenRef, getValidatedClient]);

  const connectToServer = useCallback((
    serverId: string,
  ) => {
    let gameId: void | string;
    const connection = peer.connect(serverId);
    onStartConnectRef.current?.();
    waitingForConnectionRef.current = true;

    // Wait up to 10 seconds for a connection.
    const waitingTimeoutId = setTimeout(() => {
      waitingForConnectionRef.current = false;
      onConnectErrorRef.current?.(new Error(DEFAULT_CONNECT_ERROR));
      connection.close();
    }, 10000);

    connection.on('open', () => {
      waitingForConnectionRef.current = false;
      clearTimeout(waitingTimeoutId);
      gameId = serverId;

      const client = getValidatedClient(gameId, connection);
      client.sendJoin(getId(), getRecordedGrid(gameId));
    });
  }, [onStartConnectRef, onConnectErrorRef, getValidatedClient]);

  const connectToMockServer = useCallback(() => {
    onConnectRef.current?.({client: makeMockClient(), gameId: '--Mock Game--'});
  }, [onConnectRef]);

  useImperativeHandle(handle, () => ({
    connectToServer,
    connectToMockServer,
  }));

  return null;
}

function useStableFuncRef<T>(func: T): RefObject<T> {
  // Ensures that a function's reference is stable
  const funcRef = useRef(func);
  funcRef.current = func;
  return funcRef;
}
