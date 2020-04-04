import { GameOptions } from './components/Interfaces';

export interface WebSocketMessage {
  action: WebSocketAction;
  messageId: string;
  message?: string;
  broadcast?: boolean;
  config?: GameOptions;
}

export enum WebSocketAction {
  MESSAGE,
  PLAYER_JOINED,
  LIST_PLAYERS,
  START_GAME,
  SET_COLOR,
  SET_NAME,
}
