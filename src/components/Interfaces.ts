import { Character } from './Characters';
import * as WebSocket from 'websocket';
import { MyWebSocket } from '../Websocket';

export function isCharacter(c: Character | any): c is Character {
  return c && ((c as Character).name !== undefined);
}

export interface DispatchObject {
  type: ReduxAction;
  payload: any;
}

export enum ReduxAction {
  UPDATE_GAME_STATE = 'UPDATE_GAME_STATE',
  UPDATE_GAME_OPTIONS = 'UPDATE_GAME_OPTIONS',
  LIST_PLAYERS = 'LIST_PLAYERS',
  SET_WS_CLIENT = 'SET_WS_CLIENT',
  SET_ROOM_ID = 'SET_ROOM_ID',
  SET_NAME = 'SET_NAME',
  START_GAME = 'START_GAME',
  GAME_IS_STARTING = 'GAME_IS_STARTING',
  SET_PLAYER_ID = 'SET_PLAYER_ID',
  SAVE_ACTION_RESULT = 'SAVE_ACTION_RESULT',
  GAME_END = 'GAME_END',
  GO_TO_SETUP = 'GO_TO_SETUP',
  UPDATE_STARTING_CHARACTER = 'UPDATE_STARTING_CHARACTER',
}

export interface ActionResponse {
  result: Character[]; // the character they become
  message: string;     // message
  info?: ICharacterExtraData;  // extra info i.e. doppel becomes minion, gets allwerewolves
}

export interface GameState {
  currentIdx: number;
}
export interface Store {
  gameOptions: GameOptions;
  gameState: GameState;
  roomId: string;
  players: IPlayer[];
  client: WebSocket.w3cwebsocket;
  name: string;
  playerId: string;
  extraInfo: ICharacterExtraData[];
  actionResult: ActionResponse[];
  gameResults: any;
  dispatch: (obj: DispatchObject) => any;
}

export interface GameOptions {
  gameId: string;
  characters: Character[];
  originalCharacters: Character[];
  secondsPerCharacter: number;
  secondsToConference: number;
  startingCharacter: Character;
  // currentIdx: number;
  conferenceStart?: number;
}

export interface IPlayer {
  name: string;
  playerId: string;
  color?: string;
}

export interface Room {
  players: IPlayer[];
}

export type ICharacter = Pick<Character, 'name'>;
export type IWebSocket = Pick<
  MyWebSocket,
  'startingCharacter' |
  'character' |
  'name'
  >;

export interface ICharacterExtraData {
  allWerewolves?: Pick<MyWebSocket, 'name' | 'playerId'>[];
  allMasons?: Pick<MyWebSocket, 'name' | 'playerId'>[];
  insomniac?: Character;
  directions?: string;
  conferenceEndTime?: number;
}

export interface CharacterActionParams {
  playersSelected?: IPlayer[];
  middleCardsSelected?: number[];
}

export interface LogItem {
  player: string;
  as: string;
  playersSelected?: string[];
  middleCardsSelected?: string[];
}
