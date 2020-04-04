import WebSocket from "ws";
import * as http from "http";
import flatten from 'lodash/flatten';
import shuffle from 'lodash/shuffle';
import { v4 } from 'uuid';
import Redis, { ok } from './Redis';
import parseUrl from "./util/parseUrl";
import { GameOptions } from './components/Game';
import { Character } from './components/Characters';
import shortId from './util/shortId';
import {
  WebSocketMessage,
  WebSocketAction,
} from './IWebsocket';

interface MyWebSocket extends WebSocket {
  roomId: string;
  playerId: string;
  name: string;
  color: string;
  character: Character;
  startingCharacter: Character;
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

/**
 * adds doppelganger characters if necessary, sorts and sets start times for each character
 * @param {GameOptions} config
 */
const setupGame = async (config: GameOptions, roomId: string) => {
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
  config.originalCharacters = charactersConfig;
  config.characters = characters;
  config.conferenceStart = t;
  const gameId = `${roomId}-${shortId()}`;
  config.gameId = gameId;
  try {
    await Redis.set(`game-${gameId}`, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
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
    ws.on('message', async (json: string) => {
      const m: WebSocketMessage = JSON.parse(json);
      const action = m.action;
      switch (action) {
        case WebSocketAction.START_GAME:
          await setupGame(m.config, ws.roomId);
          const shuffled = shuffle(m.config.originalCharacters);
          const characterMap: { [key: string]: Character } = {};
          getClientsInRoom(webSocketServer, ws.roomId).forEach(client => {
            const character = shuffled.pop();
            client.startingCharacter = character;
            client.character = character;
            characterMap[client.playerId] = character;
            client.send(JSON.stringify({
              action: WebSocketAction.START_GAME,
              config: {
                ...m.config,
                startingCharacter: character,
                currentCharacter: character,
              },
            }));
          });
          try {
            await Redis.set(`characters-${m.config.gameId}`, JSON.stringify(characterMap));
          } catch (e) {
            console.error(`Redis Error: ${e}`);
          }
          break;

        default:
          ws.send(JSON.stringify({
            message: `hello you sent: ${m.message}`,
            messageId: m.messageId,
          }));

      }
    });

    // set unique id for client
    ws.playerId = v4();

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
