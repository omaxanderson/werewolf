import { GameOptions, IPlayer } from './components/Interfaces';

export interface WebSocketMessage {
  action: WebSocketAction;
  messageId: string;
  message?: string;
  broadcast?: boolean;
  config?: GameOptions;
  vote?: IPlayer;
}

export enum WebSocketAction {
  MESSAGE,
  PLAYER_JOINED,
  LIST_PLAYERS,
  START_GAME,
  SET_COLOR,
  SET_NAME,
  NEXT_CHARACTER,
  CHARACTER_ACTION,
  DEBUG__NEXT_CHARACTER,
  SEND_PLAYER_ID,
  ACTION_RESULT,
  GAME_END,
  NEW_GAME,
  GO_TO_SETUP,
  UPDATE_CLIENT_STARTING_CHARACTER,
  CAST_VOTE,
  UPDATE_GAME_CONFIG,
  PAUSE_GAME,
  CANCEL_GAME,
  RESUME_GAME,
  GAME_IS_PAUSED,
  GAME_IS_CANCELLED,
  GAME_IS_RESUMED,
}
