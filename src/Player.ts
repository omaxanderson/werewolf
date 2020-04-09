import { Redis } from 'ioredis';
import storage, { ok } from './Redis';
import WebSocket from 'ws';
import { Character } from './components/Characters';
import { MyWebSocket } from './Websocket';

export interface PlayerClient {
  roomId: string;
  playerId: string;

  gameId?: string;
  name?: string;
  color?: string;
  character?: Character;
  startingCharacter?: Character;
  actionTaken?: string[];
  vote?: string; // going to be the playerId
}

export default class Player implements PlayerClient {
  private _ws: WebSocket;
  private _actionTaken: string[];
  private _character: Character;
  private _color: string;
  private _gameId: string;
  private _name: string;
  private _playerId: string;
  private _roomId: string;
  private _startingCharacter: Character;
  private _vote: string;

  constructor(ws: MyWebSocket, opts: { playerId: string; roomId: string; gameId?: string }) {
    this._ws = ws;
  }

  takeAction(actionString: string) {
    this._actionTaken.push(actionString);
  }

  getPlayerObject = (): PlayerClient => {
    return {
      actionTaken: this._actionTaken,
      character: this._character,
      color: this._color,
      gameId: this._gameId,
      name: this._name,
      playerId: this._playerId,
      roomId: this._roomId,
      startingCharacter: this._startingCharacter,
      vote: this._vote,
    }
  };

  get ws(): WebSocket { return this._ws; }
  set ws(value: WebSocket) { this._ws = value; savePlayerState(this); }

  get actionTaken(): string[] { return this._actionTaken; }
  set actionTaken(value: string[]) { this._actionTaken = value; savePlayerState(this)}

  get character(): Character { return this._character; }
  set character(value: Character) { this._character = value; savePlayerState(this)}

  get color(): string { return this._color; }
  set color(value: string) { this._color = value; savePlayerState(this)}

  get gameId(): string { return this._gameId; }
  set gameId(value: string) { this._gameId = value; savePlayerState(this)}

  get name(): string { return this._name; }
  set name(value: string) { this._name = value; savePlayerState(this)}

  get playerId(): string { return this._playerId; }
  set playerId(value: string) { this._playerId = value; savePlayerState(this)}

  get roomId(): string { return this._roomId; }
  set roomId(value: string) { this._roomId = value; savePlayerState(this)}

  get startingCharacter(): Character { return this._startingCharacter; }
  set startingCharacter(value: Character) { this._startingCharacter = value; savePlayerState(this)}

  get vote(): string { return this._vote; }
  set vote(value: string) { this._vote = value; savePlayerState(this)}
}

async function savePlayerState(player: Player) {
  if (await ok()) {
    try {
      await storage.set(
        `player-${player.playerId}`,
        JSON.stringify(player.getPlayerObject()),
      );
    } catch (e) {
      console.log('error saving player', e.message);
    }
  }
}

