import cloneDeep from 'lodash/cloneDeep';
import { Character, Team } from './components/Characters';
import { MyWebSocket } from './Websocket';
import {
  ActionResponse,
  CharacterActionParams, GameOptions, GameState,
  ICharacter,
  ICharacterExtraData,
  IPlayer, LogItem
} from './components/Interfaces';
import { Redis } from 'ioredis';

export const getCharacterTurnInfo = (
  currentCharacter: ICharacter,
  clients: MyWebSocket[],
  client: MyWebSocket,
): ICharacterExtraData => {
  const { startingCharacter } = client;
  const doppelgangerInfoTurns = {
    Werewolf: ['Werewolf', 'Mystic Wolf', 'Doppelganger Werewolf', 'Doppelganger Mystic Wolf'],
    Mason: ['Mason', 'Doppelganger Mason'],
    Minion: ['Minion', 'Doppelganger Minion'],
  };

  // todo write tests for this
  if (Object.keys(doppelgangerInfoTurns).includes(currentCharacter.name)) {
    // we know we're sending info to other people
    if (!doppelgangerInfoTurns[currentCharacter.name]?.includes(startingCharacter.name)) {
      return {};
    }
  } else {
    // anyone who isn't the current turn's role gets nothing
    if (startingCharacter.name !== currentCharacter.name) {
      return {};
    }
  }
  switch (currentCharacter.name) {
    // Werewolves need to know other werewolves
    case 'Doppelganger Minion': // special case that we send from handle action
    case 'Werewolf':
    case 'Minion':
      // right now, if the current character is any of these it'll send everyone that info
      const allWerewolves: MyWebSocket[] = [];
      clients.forEach(c => {
        if (c.startingCharacter.team === Team.WEREWOLF) {
          allWerewolves.push(c);
        }
      });
      return { allWerewolves };
      break;
    case 'Doppelganger Mason':
    case 'Mason':
      const allMasons: MyWebSocket[] = [];
      clients.forEach(c => {
        if (['Mason', 'Doppelganger Mason'].includes(c.startingCharacter.name)) {
          allMasons.push(c);
        }
      });
      return { allMasons };
    case 'Doppelganger Insomniac':
      if (startingCharacter.name !== 'Doppelganger Insomniac') {
        break;
      }
      let doppelgangerInsomniac: Character;
      clients.forEach(c => {
        if (c.startingCharacter.name === 'Doppelganger Insomniac') {
          doppelgangerInsomniac = c.character;
        }
      });
      return { insomniac: doppelgangerInsomniac };
    case 'Insomniac':
      if (startingCharacter.name !== 'Insomniac') {
        break;
      }
      let insomniac: Character;
      clients.forEach(c => {
        if (c.startingCharacter.name === 'Insomniac') {
          insomniac = c.character;
        }
      });
      return { insomniac };
    default:
      // do nothing
  }
  return {};
};

const findSelectedPlayerCharacter = (clients: MyWebSocket[], player: IPlayer): Character => {
  let character: Character;
  clients.forEach(c => {
    if (c.playerId === player.playerId) {
      character = c.character;
    }
  });
  return character;
};

const actionMap = {
  'Mystic Wolf': "You may click on another player's card to view that card.",
  Seer: `Select one other player's card, or select two from the middle`,
  'Apprentice Seer': 'Choose one card from the middle to view that card.',
  Robber: `Select another player's card to switch cards with theirs.`,
  Troublemaker: `Select two other player cards to swap those cards.`,
  Drunk: 'Select one card from the middle to switch with.',
};

// ACTION EFFECT always on player.character
// origin of effect always from player.startingCharacter
export const handleCharacterActions = async (
  clients: MyWebSocket[],
  player: MyWebSocket,
  params: CharacterActionParams,
  middleCards: Character[],
  storage: Redis,
): Promise<ActionResponse> => {
  const { startingCharacter: character } = player;
  const {
    playersSelected,
    middleCardsSelected,
  } = params;
  const [first, second] = playersSelected || [];
  const [firstMiddle, secondMiddle] = middleCardsSelected || [];
  const response: ActionResponse = {
    message: '',
    result: [],
  };
  try {
    const log: LogItem[] = JSON.parse(await storage.get(`log-${player.gameId}`)) || [];
    const logItem: LogItem = {
      player: player.name,
      as: player.startingCharacter.name,
      playersSelected: [],
      middleCardsSelected: [],
    };
    // conditionaly add the log items, kinda gross but whatever
    if (first) logItem.playersSelected.push(`${first.name} (${findSelectedPlayerCharacter(clients, first).name})`);
    if (second) logItem.playersSelected.push(`${second.name} (${findSelectedPlayerCharacter(clients, second).name})`);
    if (firstMiddle) logItem.middleCardsSelected.push(middleCards[firstMiddle].name);
    if (secondMiddle) logItem.middleCardsSelected.push(middleCards[secondMiddle].name);

    log.push(logItem);
    await storage.set(`log-${player.gameId}`, JSON.stringify(log));
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
  switch (character.name) {
    case 'Doppelganger':
      // need to somehow turn the doppelganger into the new role
      if (playersSelected.length) {
        const newDoppelganger = cloneDeep(findSelectedPlayerCharacter(clients, first));
        const originalName = newDoppelganger.name;
        newDoppelganger.name = `Doppelganger ${newDoppelganger.name}`;
        // now set that as the doppelgangers current character
        player.startingCharacter = newDoppelganger;
        response.result = [newDoppelganger];
        response.message = `You are now the ${newDoppelganger.name}. ${actionMap[originalName] || ''}`;
        // todo when they become minion need to send relevant data back
        if (originalName === 'Minion') {
          const extraMinionInfo = getCharacterTurnInfo({
            name: originalName,
          }, clients, player);
          response.info = extraMinionInfo;
        }
        return response;
      }
      break;
    case 'Doppelganger Mystic Wolf':
    case 'Mystic Wolf':
      if (playersSelected.length) {
        response.result = [findSelectedPlayerCharacter(clients, first)];
        response.message = `You have viewed the ${response.result[0].name}.`;
        return response;
      }
      break;
    case 'Doppelganger Werewolf':
    case 'Werewolf':
      response.result = [middleCards[firstMiddle]];
      response.message = `You saw the ${response.result[0].name} in the middle.`;
      return response;
    case 'Doppelganger Seer':
    case 'Seer':
      if (playersSelected?.length) {
        response.result = [findSelectedPlayerCharacter(clients, first)];
        response.message = `You saw the ${response.result[0].name}.`;
        return response;
      }
      response.result = [middleCards[firstMiddle], middleCards[secondMiddle]];
      response.message = `You saw the ${response.result[0].name} and the ${response.result[1].name} in the middle.`;
      return response;
    case 'Doppelganger Apprentice Seer':
    case 'Apprentice Seer':
      response.result = [middleCards[firstMiddle]];
      response.message = `You saw the ${response.result[0].name} in the middle.`;
      return response;
    case 'Doppelganger Robber':
    case 'Robber':
      // swap the characters
      let newCharacter: Character;
      clients.forEach(client => {
        if (client.playerId === first.playerId) {
          // client is the chosen player's card
          newCharacter = client.character;
          client.character = player.character; // set new player as robber
          player.character = newCharacter; // set robber as new character
        }
      });
      response.result = [newCharacter];
      console.log('starting', player.character.name);
      console.log('new', newCharacter.name);
      response.message = `You are now the ${newCharacter.name}.`;
      return response;
    case 'Doppelganger Troublemaker':
    case 'Troublemaker':
      // similar to robber just with two players
      // swap the characters
      let clientA: MyWebSocket;
      let clientB: MyWebSocket;
      clients.forEach(client => {
        if (client.playerId === first.playerId) {
          clientA = client;
        } else if (client.playerId === second.playerId) {
          clientB = client;
        }
      });
      // hopefully this works since they're object references...
      const tempCharacter = clientA.character;
      clientA.character = clientB.character;
      clientB.character = tempCharacter;
      response.message = 'Success!';
      return response;
    case 'Doppelganger Drunk':
    case 'Drunk':
      // splice middle cards with current
      const [drunkNewCharacter] = middleCards.splice(firstMiddle, 1, player.character);
      player.character = drunkNewCharacter;
      response.message = 'Success!';
      return response;
    default:
      console.log('character action not supported');
  }

  return response;
};

// ws.actionTaken = 'gameID-Mystic Wolf';
// <gameId>-<turn>-<startingCharacter>
// mystic wolf would be able to do '123-Mystic Wolf' and possibly '123-Werewolf'

export function canTakeAction(
  gameOptions: Pick<GameOptions, 'characters'>,
  gameState: GameState,
  clients: Pick<MyWebSocket, 'startingCharacter'>[],
  player: Pick<MyWebSocket, 'actionTaken' | 'startingCharacter'>,
  gameId: string,
): boolean {
  const { characters } = gameOptions;
  const { currentIdx } = gameState;
  const currentTurn = characters[currentIdx];

  // cant take a turn when the game hasn't started
  // or when the game is over
  if (currentIdx < 0 || currentIdx >= characters.length) {
    return false;
  }

  // check if they've taken an action for this turn
  if (
    player
      .actionTaken
      .includes(`${gameId}-${currentTurn.name}-${player.startingCharacter.name}`)
  ) {
    return false;
  }

  // you can usually take an action when it's your turn
  if (player.startingCharacter.name === currentTurn.name) {
    // Werewolf can only take an action if he is a solo wolf
    if (player.startingCharacter.name === 'Werewolf'
      && clients.filter(c => c.startingCharacter.team === Team.WEREWOLF).length > 1
    ) {
      return false;
    }

    return true;
  }

  // Mystic wolf can act as a Werewolf if she is the solo wolf
  if (
    player.startingCharacter.name === 'Mystic Wolf' // you are the MW
    && currentTurn.name === 'Werewolf' // Werewolf's turn
    && clients.filter(c => c.startingCharacter.team === Team.WEREWOLF).length === 1 // you are the only wolf
  ) {
    return true;
  }

  // Doppelganger can take an action after she transforms
  if (
    currentTurn.name === 'Doppelganger'
    && player.startingCharacter.name.startsWith('Doppelganger')
  ) {
    return true;
  }

  // Doppelganger can act on werewolf turn
  // actually that isn't possible, the fact that she is a werewolf means
  // there is at least one other WW and therefore she won't be a solo wolf

  return false;
}
