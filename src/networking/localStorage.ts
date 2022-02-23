
import { GridState } from "../types";
import { deserializeGridState, SerializedGridState, serializeGridState } from "./serialize";

const instanceId = `${Math.random() * 100000000000}`;
export function getId(): string {
  let id; // = localStorage.getItem('id');
  if (id == null) {
    id = instanceId;
    localStorage.setItem('id', id);
  }
  return id;
}

export function record(
  gameId: string,
  opponentId: string,
  lastGrid?: GridState,
): void {
  localStorage.setItem(gameId, JSON.stringify({
    a: opponentId,
    b: lastGrid ? serializeGridState(lastGrid) : undefined,
  }));
}

function getRecord(
  gameId: string,
): void | {
  opponentId: string,
  lastGrid?: SerializedGridState
} {
  const json = localStorage.getItem(gameId) ?? '';
  let record = undefined;
  try {
    const jsonParsed = JSON.parse(json);
    if (typeof jsonParsed === 'object') {
      record = {
        opponentId: jsonParsed.a,
        lastGrid: jsonParsed.b,
      }
    }
  } catch (_e) {
    // Invalid JSON or grid state; treat this like there's no record.
  }
  return record;
}

export function getRecordedGrid(
  gameId: string,
): undefined | GridState {
  const record = getRecord(gameId);
  if (record == null || record.lastGrid == null) {
    return;
  }

  try {
    return deserializeGridState(record.lastGrid);
  } catch (_e) {
    // gridState was invalid, so treat it like there wasn't any
  }
  return;
}

export function validateRecord(
  gameId: string,
  opponentId: string,
  lastGrid?: GridState,
): true | string {
  const gameRecord = getRecord(gameId);
  if (gameRecord == null && lastGrid != null) {
    // Client thinks game hasn't started, but opponent already has a grid.
    return 'Couldn\'t join this game. Please create a new game';
  }

  if (gameRecord == null) {
    // Game hasn't started
    return true;
  }

  if (opponentId !== gameRecord.opponentId) {
    return 'Another player has already joined.'
  }

  if (lastGrid == null && gameRecord.lastGrid != null) {
    return 'Game states did not match. Please create a new game.'
  }

  if (
    lastGrid != null &&
    JSON.stringify(serializeGridState(lastGrid)) !==
    JSON.stringify(gameRecord.lastGrid)
  ) {
    return 'Game states did not match. Please create a new game.'
  }

  return true;
}
