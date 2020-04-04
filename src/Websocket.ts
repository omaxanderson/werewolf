import WebSocket from "ws";
import * as http from "http";
import flatten from 'lodash/flatten';
import shuffle from 'lodash/shuffle';
import { v4 } from 'uuid';
import Redis from './Redis';
import parseUrl from "./util/parseUrl";
import { GameOptions, GameState } from './components/Interfaces';
import { Character } from './components/Characters';
import shortId from './util/shortId';
import { WebSocketAction, WebSocketMessage, } from './IWebsocket';
import randomInt from './util/randomInt';

interface MyWebSocket extends WebSocket {
  roomId: string;
  gameId: string;
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

const nextCharacterTurn = async (wss: WebSocket.Server, roomId: string, gameId: string) => {
  const config: GameState = JSON.parse(await Redis.get(`game-${gameId}`));
  config.currentIdx += 1;
  await Redis.set(`game-${gameId}`, JSON.stringify(config));
  getClientsInRoom(wss, roomId).forEach(client => client.send(JSON.stringify({
    action: WebSocketAction.NEXT_CHARACTER,
    gameState: config,
  })))
};

/**
 * adds doppelganger characters if necessary, sorts and sets start times for each character
 * @param {GameOptions} config
 * @param roomId
 * @param wss
 */
const setupGame = async (config: GameOptions, roomId: string, wss: WebSocket.Server) => {
  const {
    characters: charactersConfig,
    secondsPerCharacter,
  } = config;
  // Add doppleganger characters when necessary
  const hasDoppelganger = charactersConfig.some(c => c.key === 'doppelganger');
  const characters = flatten(charactersConfig.map(c => {
    return c.doppel && hasDoppelganger ? [c, {
      ...c,
      name: `Doppelganger ${c.name}`,
      order: c.order + 1,
    }] : c;
  }));

  const now = Date.now();
  let t = now + START_BUFFER;
  // put the characters in order and assign them a start time
  characters.sort((a, b) => a.order - b.order);
  for (let i = 0; i < characters.length; i++) {
    if (characters[i].order > 0) {
      characters[i].startTime = t;
      // setTimeout to send the next message
      /*
      setTimeout(() => {
        nextCharacterTurn(wss, roomId, characters[i]);
      }, t - now);
       */
      t += secondsPerCharacter * 1000;
    }
  }
  config.originalCharacters = charactersConfig;
  config.characters = characters;
  config.conferenceStart = t;
  const gameId = `${roomId}-${shortId()}`;
  config.gameId = gameId;
  getClientsInRoom(wss, roomId).forEach(client => client.gameId = gameId);
  try {
    await Redis.set(`config-${gameId}`, JSON.stringify(config));
    await Redis.set(`game-${gameId}`, JSON.stringify({
      currentIdx: -1,
    } as GameState));
  } catch (e) {
    console.error(e);
  }
};

const onStartGame = async (webSocketServer: WebSocket.Server, ws: MyWebSocket, m: WebSocketMessage) => {
  await setupGame(m.config, ws.roomId, webSocketServer);
  const shuffled = shuffle(m.config.originalCharacters);
  const characterMap: { [key: string]: Character } = {};
  getClientsInRoom(webSocketServer, ws.roomId).forEach(client => {
    const character = shuffled.pop();
    client.startingCharacter = character;
    client.character = character;
    characterMap[client.playerId] = character;
    client.send(JSON.stringify({
      action: WebSocketAction.START_GAME,
      gameOptions: {
        ...m.config,
        startingCharacter: character,
        currentCharacter: character,
      },
      gameState: {
        currentIdx: -1,
      },
    }));
  });
  try {
    await Redis.set(`characters-${m.config.gameId}`, JSON.stringify(characterMap));
  } catch (e) {
    console.error(`Redis Error: ${e}`);
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
          await onStartGame(webSocketServer, ws, m);
          break;
        case WebSocketAction.DEBUG__NEXT_CHARACTER:
          await nextCharacterTurn(webSocketServer, ws.roomId, ws.gameId);
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

    // set color
    ws.color = `#${[
      randomInt(255).toString(16).padStart(2, '0'),
      randomInt(255).toString(16).padStart(2, '0'),
      randomInt(255).toString(16).padStart(2, '0'),
    ].join('')}`;

    // notify room members of a new join
    const clientsInRoom = getClientsInRoom(webSocketServer, ws.roomId);
    const simplifiedClients = clientsInRoom.map((client: MyWebSocket) => ({
      name: client.name,
      color: client.color,
      playerId: client.playerId,
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
