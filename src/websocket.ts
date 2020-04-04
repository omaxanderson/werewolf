import WebSocket from "ws";
import * as http from "http";
import flatten from 'lodash/flatten';
import parseUrl from "./util/parseUrl";
import { GameOptions } from './components/Game';

interface MyWebSocket extends WebSocket {
  roomId: string;
  name: string;
  color: string;
}

export enum WebSocketAction {
  MESSAGE,
  PLAYER_JOINED,
  LIST_PLAYERS,
  START_GAME,
  SET_COLOR,
  SET_NAME,
}

export interface WebSocketMessage {
  action: WebSocketAction;
  messageId: string;
  message?: string;
  broadcast?: boolean;
  config?: GameOptions;
}

const getClientsInRoom = (wss: WebSocket.Server, roomId: string) => {
  const clients: MyWebSocket[] = [];
  wss.clients.forEach((client: MyWebSocket) => {
    if (client.roomId === roomId) {
      clients.push(client);
    }
  });
  return clients;
};

const START_BUFFER = 5 * 1000;

const setupGame = (config: GameOptions) => {
  const {
    characters: charactersConfig,
    secondsPerCharacter,
  } = config;
  const hasDoppelganger = charactersConfig.some(c => c.key === 'doppelganger');
  const characters = flatten(charactersConfig.map(c => {
    return c.doppel && hasDoppelganger ? [c, {
      ...c,
      name: `Doppelganger ${c.name}`,
      order: c.order + 1,
    }] : c;
  }));
  const now = Date.now();
  const startTime = now + START_BUFFER;
  let t = startTime;
  // put the characters in order and assign them a start time
  characters.sort((a, b) => a.order - b.order);
  for (let i = 0; i < characters.length; i++) {
    if (characters[i].order > 0) {
      characters[i].startTime = t;
      t += secondsPerCharacter * 1000;
    }
  }
  config.characters = characters;
  config.conferenceStart = t;
};

/**
 * Web Socket setup
 */
export default (server) => {
  const webSocketServer = new WebSocket.Server({server});
  webSocketServer.on('connection', (webSocket: WebSocket, req: http.IncomingMessage) => {
    // Have to manually re-type this
    const ws = webSocket as MyWebSocket;
    const {query: {id, name}} = parseUrl(req);
    if (!Array.isArray(id)) {
      ws.roomId = id;
    }
    if (!Array.isArray(name)) {
      ws.name = name;
    }
    ws.on('message', (json: string) => {
      const m: WebSocketMessage = JSON.parse(json);
      const action = m.action;
      switch (action) {
        case WebSocketAction.START_GAME:
          setupGame(m.config);
          getClientsInRoom(webSocketServer, ws.roomId).forEach(client => client.send(JSON.stringify({
            action: WebSocketAction.START_GAME,
            config: m.config,
          })));
          break;

        default:
          ws.send(JSON.stringify({
            message: `hello you sent: ${m.message}`,
            messageId: m.messageId,
          }));

      }
    });

    // notify room members of a new join
    const clientsInRoom = getClientsInRoom(webSocketServer, ws.roomId);
    const simplifiedClients = clientsInRoom.map((client: MyWebSocket) => ({
      name: client.name,
      color: client.color,
    }));
    clientsInRoom.forEach(client => client.send(JSON.stringify({
      action: WebSocketAction.PLAYER_JOINED,
      players: simplifiedClients,
    })));
    ws.send(JSON.stringify({
      action: WebSocketAction.LIST_PLAYERS,
      players: simplifiedClients,
    }));
  });
};
