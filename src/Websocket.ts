import WebSocket from "ws";
import * as http from "http";
import flatten from 'lodash/flatten';
import shuffle from 'lodash/shuffle';
import { v4 } from 'uuid';
import Redis from './Redis';
import parseUrl from "./util/parseUrl";
import { CharacterActionParams, GameOptions, GameState, ICharacterExtraData, LogItem } from './components/Interfaces';
import { Character, Team } from './components/Characters';
import shortId from './util/shortId';
import { WebSocketAction, WebSocketMessage, } from './IWebsocket';
import randomInt from './util/randomInt';
import { canTakeAction, getCharacterTurnInfo, handleCharacterActions } from './CharacterLogic';

export interface MyWebSocket extends WebSocket {
  roomId: string;
  gameId: string;
  playerId: string;
  name: string;
  color: string;
  character: Character;
  startingCharacter: Character;
  actionTaken: string[];
  vote: string, // going to be the playerId
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

const sendFinalCharacters = async (wss: WebSocket.Server, roomId: string) => {
  const results: {
    [name: string]: Character;
  } = {};
  const votes = {};
  const clients = getClientsInRoom(wss, roomId);
  let gameId;
  clients.forEach(client => {
    results[client.name] = client.character;

    // set votes
    console.log('v', client.vote);
    if (client.vote) {
	    if (votes[client.vote]) {
	      votes[client.vote] = votes[client.vote] + 1;
	    } else {
	      votes[client.vote] = 1;
	    }
    }
    // get game id
    if (!gameId && client.gameId) {
      gameId = client.gameId;
    }
  });
  console.log(1, `characters-${gameId}`);
  console.log(2, await Redis.get(`characters-${gameId}`));
  const { middleCards } = JSON.parse(await Redis.get(`characters-${gameId}`));
  // results.middleCards = middleCards;

  const log: LogItem[] = JSON.parse(await Redis.get(`log-${gameId}`));

  console.log('e1');
  clients.forEach(client => client.send(JSON.stringify({
    action: WebSocketAction.GAME_END,
    results: {
      characterResults: results,
      middleCards,
      votes,
      log,
    },
  })));
};

const nextCharacterTurn = async (wss: WebSocket.Server, roomId: string, gameId: string) => {
  const state: GameState = JSON.parse(await Redis.get(`game-${gameId}`));
  const config: GameOptions = JSON.parse(await Redis.get(`config-${gameId}`));
  const clients = getClientsInRoom(wss, roomId);
  const fromCharacter = state.currentIdx < config.characters.length
    && config.characters[state.currentIdx]?.name;
  state.currentIdx += 1;
  // should handle double characters (werewolf, mason)
  if (fromCharacter === config.characters[state.currentIdx]?.name) {
    state.currentIdx += 1;
  }
  console.log('e3');
  await Redis.set(`game-${gameId}`, JSON.stringify(state));

  const isDaylight = state.currentIdx >= config.characters.length;
  const currentCharacter: Character = !isDaylight
    ? config.characters[state.currentIdx]
    // special end state character
    : {
      name: 'Daylight',
      key: 'daylight',
      order: 9000,
      team: Team.UNKNOWN,
      doppel: false,
    };

  if (isDaylight) {
    setTimeout(
      () => sendFinalCharacters(wss, roomId),
      config.secondsToConference * 1000,
    );
  } else {
    const t = (config.secondsPerCharacter
      + (currentCharacter.name === 'Doppelganger' ? 10 : 0)) * 1000;
    setTimeout(
      () => nextCharacterTurn(wss, roomId, gameId),
      t,
    );
  }

  // need to send special configs depending on each character
  getClientsInRoom(wss, roomId).forEach(client => {
    const message: {
      action: WebSocketAction;
      gameState: GameState;
      extraInfo?: ICharacterExtraData;
    } = {
      action: WebSocketAction.NEXT_CHARACTER,
      gameState: state,
    };
    //if (currentCharacter.name === client.startingCharacter.name) {
    // get special config
    message.extraInfo = getCharacterTurnInfo(currentCharacter, clients, client);
    if (isDaylight) {
      // get conference end time
      const millisecondsToConference = config.secondsToConference * 1000;
      const endTime = Date.now() + millisecondsToConference;
      message.extraInfo = {
        conferenceEndTime: endTime,
      }
    }
    console.log('e4');
    client.send(JSON.stringify(message));
  });
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
    // todo set a timeout to push the next_character info
    // instead of relying on input
    secondsPerCharacter,
  } = config;
  // Add doppleganger characters when necessary
  const hasDoppelganger = charactersConfig.some(c => c.key === 'doppelganger');
  const characters = flatten(charactersConfig.map(c => {
    return c.name === 'Insomniac' && hasDoppelganger ? [c, {
      ...c,
      name: `Doppelganger ${c.name}`,
      order: c.order + 1,
    }] : c;
  })).filter((c: Character) => c.order > 0);

  // put the characters in order
  characters.sort((a, b) => a.order - b.order);

  config.originalCharacters = charactersConfig;
  config.characters = characters;
  // config.conferenceStart = t;

  const gameId = `${roomId}-${shortId()}`;
  config.gameId = gameId;

  // set the gameid for each client in the room
  getClientsInRoom(wss, roomId).forEach(client => client.gameId = gameId);

  // store game config and state
  try {
    console.log('e5');
    await Redis.set(`config-${gameId}`, JSON.stringify(config));
    console.log('e6');
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

  // TODO DEBUGGING ONLY
  shuffled.sort((a, b) => {
    const c = 'Doppelganger';
    if (a.name === c /* || a.name === 'Werewolf' */ ) {
      return 1;
    }
    return -1;
  });
  // shuffled.splice(0, 0, shuffled.pop());
  // TODO END DEBUGGING

  const characterMap: { [key: string]: Character } = {};
  getClientsInRoom(webSocketServer, ws.roomId).forEach(client => {
    const character = shuffled.pop();
    client.startingCharacter = character;
    client.character = character;
    characterMap[client.playerId] = character;
    console.log('e8');
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
    console.log('e9');
    await Redis.set(`characters-${m.config.gameId}`, JSON.stringify({
      characterMap,
      middleCards: shuffled,
    }));
  } catch (e) {
    console.error(`Redis Error: ${e}`);
  }

  //set timeout to start the game
  setTimeout(
    () => nextCharacterTurn(webSocketServer, ws.roomId, m.config.gameId),
    START_BUFFER,
  );
};

/**
 * Web Socket setup
 */
export default (server) => {
  const webSocketServer = new WebSocket.Server({server});
  webSocketServer.on('connection', (webSocket: WebSocket, req: http.IncomingMessage) => {
    // Have to manually re-type this
    const ws = webSocket as MyWebSocket;
    const {query: {id, name, playerId}} = parseUrl(req);
    if (!Array.isArray(id)) {
      ws.roomId = id;
    }
    if (!Array.isArray(name)) {
      ws.name = decodeURI(name);
    }
    if (!Array.isArray(playerId) && typeof playerId !== 'undefined') {
      // load info from redis and add them back into the game?
    }
    ws.on('message', async (json: string) => {
      try {
        const m: WebSocketMessage = JSON.parse(json);
        const action = m.action;
        switch (action) {
          case WebSocketAction.START_GAME:
            await onStartGame(webSocketServer, ws, m);
            break;
          case WebSocketAction.DEBUG__NEXT_CHARACTER:
            await nextCharacterTurn(webSocketServer, ws.roomId, ws.gameId);
            break;
          case WebSocketAction.SET_COLOR:
            ws.color = m.message;
            sendPlayerList(webSocketServer, ws);
            break;
          case WebSocketAction.UPDATE_GAME_CONFIG:
            // only update config if the game isn't going on right now
            if (!ws.gameId) {
              const { config } = m;
              getClientsInRoom(webSocketServer, ws.roomId)
                .forEach(c => c.send(JSON.stringify({
                  action: WebSocketAction.UPDATE_GAME_CONFIG,
                  gameOptions: config,
                })));
            }
            break;
          case WebSocketAction.CAST_VOTE:
            const { vote: { playerId } } = m;
            // find player name
            // save it in an object on the client?
            ws.vote = playerId;
            console.log('pid', playerId);
            const clientsForVote = getClientsInRoom(webSocketServer, ws.roomId);
            clientsForVote.forEach(c => {
              if (c.playerId === playerId) {
                console.log('setting vote', c.playerId);
                ws.vote = c.name;
              }
            });
            // then check all clients and if they all have a vote for this game id
            if (clientsForVote.every(c => c.vote)) {
              // send results to everyone
              await sendFinalCharacters(webSocketServer, ws.roomId);
            }
            break;
          case WebSocketAction.CHARACTER_ACTION:
            const allClients = getClientsInRoom(webSocketServer, ws.roomId);
            const gameOptions = JSON.parse(await Redis.get(`config-${ws.gameId}`));
            const gameState = JSON.parse(await Redis.get(`game-${ws.gameId}`));
            if (!canTakeAction(
              gameOptions,
              gameState,
              allClients,
              ws,
              ws.gameId,
            )) {
              console.log('no action for you');
              break;
            } else {
              // set current turn
              const current = gameOptions.characters[gameState.currentIdx]?.name;
              const actionStr = `${ws.gameId}-${current}-${ws.startingCharacter.name}`;
              ws.actionTaken.push(actionStr);
            }
            const redisData = JSON.parse(await Redis.get(`characters-${ws.gameId}`));
            const { middleCards } = redisData;
            const originalStartingCharacterName = ws.startingCharacter?.name;
            const actionResult = await handleCharacterActions(
              allClients,
              ws,
              (m as unknown as { params: CharacterActionParams }).params,
              middleCards,
              Redis,
            );

            // this should really be handled by the handleCharacterActions but
            // eh i'm lazy
            if (ws.startingCharacter.name === 'Drunk') {
              middleCards[
                (m as unknown as { params: CharacterActionParams }).params.middleCardsSelected[0]
                ] = ws.startingCharacter;
              console.log('e10');
              await Redis.set(`characters-${ws.gameId}`, JSON.stringify({
                ...redisData,
                middleCards,
              }));
            }

            if (originalStartingCharacterName === 'Doppelganger') {
              // this should only happen the first time the doppelganger takes an action
              console.log('e11');
              ws.send(JSON.stringify({
                action: WebSocketAction.UPDATE_CLIENT_STARTING_CHARACTER,
                gameOptions: {
                  startingCharacter: ws.startingCharacter,
                }
              }));
            }

            console.log('e12');
            ws.send(JSON.stringify({
              action: WebSocketAction.ACTION_RESULT,
              ...actionResult,
            }));
            break;
          case WebSocketAction.NEW_GAME:
            // clear out all game info from all room members
            const clientsToClear = getClientsInRoom(webSocketServer, ws.roomId);
            clientsToClear.forEach(client => {
              client.gameId = null;
              client.character = null;
              client.startingCharacter = null;
              client.actionTaken = [];
              client.vote = null;
            });
            clientsToClear.forEach(client => {
              console.log('e13');
              client.send(JSON.stringify({
                action: WebSocketAction.GO_TO_SETUP,
              }));
            });

            break;
          default:
            console.log('e14');
            ws.send(JSON.stringify({
              message: `hello you sent: ${m.message}`,
              messageId: m.messageId,
            }));
        }
      } catch (e) {
        console.log('error in websocket message', e);
      }
    });

    // maybe this should be on a timeout to allow re-connection
    ws.on('close', () => {
      const filteredClients = getClientsInRoom(webSocketServer, ws.roomId)
        .filter(client => client.playerId !== ws.playerId);
      const simplified = filteredClients.map((client: MyWebSocket) => ({
            name: client.name,
            color: client.color,
            playerId: client.playerId,
        }));
      console.log('e15');
      filteredClients.forEach(client => client.send(JSON.stringify({
        action: WebSocketAction.LIST_PLAYERS,
        players: simplified,
      })));
    });

    // set unique id for client
    ws.playerId = v4();

    ws.actionTaken = [];

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
    console.log('e16');
    clientsInRoom.forEach(client => client.send(JSON.stringify({
      action: WebSocketAction.PLAYER_JOINED,
      players: simplifiedClients,
    })));
    console.log('e17');
    ws.send(JSON.stringify({
      action: WebSocketAction.LIST_PLAYERS,
      players: simplifiedClients,
    }));
    console.log('e18');
    ws.send(JSON.stringify({
      action: WebSocketAction.SEND_PLAYER_ID,
      playerId: ws.playerId,
    }))
  });
};

function sendPlayerList(wss: WebSocket.Server, ws: MyWebSocket) {
  // notify room members of a new join
  const clientsInRoom = getClientsInRoom(wss, ws.roomId);
  const simplifiedClients = clientsInRoom.map((client: MyWebSocket) => ({
    name: client.name,
    color: client.color,
    playerId: client.playerId,
  }));
  clientsInRoom.forEach(client => {
    console.log('e19');
    client.send(JSON.stringify({
      action: WebSocketAction.LIST_PLAYERS,
      players: simplifiedClients,
    }));
  });
}
