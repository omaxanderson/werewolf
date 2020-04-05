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
}

export interface GameState extends GameOptions {
  current: Character;
  next: Character;
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
  extraInfo: ICharacterExtraData;
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
  allWerewolves?: MyWebSocket[];
  allMasons?: MyWebSocket[];
  insomniac?: Character;
}
