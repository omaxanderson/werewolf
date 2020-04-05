import { Character } from './components/Characters';
import { MyWebSocket } from './Websocket';

type ICharacter = Pick<Character, 'name'>;
export type IWebSocket = Pick<
  MyWebSocket,
  'startingCharacter' |
  'character' |
  'name'
>;

interface ICharacterExtraData {
  allWerewolves?: MyWebSocket[];
  allMasons?: MyWebSocket[];
  insomniac?: Character;
}

export const getCharacterTurnInfo = (currentCharacter: ICharacter, clients: MyWebSocket[]): ICharacterExtraData => {
  switch (currentCharacter.name) {
    // Werewolves need to know other werewolves
    case 'Werewolf':
    case 'Minion':
      const allWerewolves: MyWebSocket[] = [];
      clients.forEach(c => {
        if (c.startingCharacter.name === 'Werewolf') {
          allWerewolves.push(c);
        }
      });
      return { allWerewolves };
    case 'Mason':
      const allMasons: MyWebSocket[] = [];
      clients.forEach(c => {
        if (c.startingCharacter.name === 'Mason') {
          allMasons.push(c);
        }
      });
      return { allMasons };
    case 'Insomniac':
      let insomniac: Character;
      clients.forEach(c => {
        if (c.startingCharacter.name === 'Insomniac') {
          insomniac = c.character;
        }
      });
      return { insomniac };
    default:
      return {};
  }
};

interface CharacterActionParams {
  playersSelected?: MyWebSocket[];
  middleCardsSelected?: number[];
}

const findSelectedPlayerCharacter = (clients: MyWebSocket[], player: MyWebSocket): Character => {
  let character: Character;
  clients.forEach(c => {
    if (c.playerId === player.playerId) {
      character = c.character;
    }
  });
  return character;
};

// ACTION EFFECT always on player.character
// origin of effect always from player.startingCharacter
export const handleCharacterActions = (
  clients: MyWebSocket[],
  player: MyWebSocket,
  params: CharacterActionParams,
  middleCards: Character[],
) => {
  const { startingCharacter: character } = player;
  const {
    playersSelected,
    middleCardsSelected,
  } = params;
  const [first, second] = playersSelected || [];
  const [firstMiddle, secondMiddle] = middleCardsSelected || [];
  switch (character.name) {
    case 'Mystic Wolf':
      if (playersSelected.length) {
        return findSelectedPlayerCharacter(clients, first);
      }
      break;
    case 'Seer':
      if (playersSelected?.length) {
        return findSelectedPlayerCharacter(clients, first);
      }
      return [middleCards[firstMiddle], middleCards[secondMiddle]];
    case 'Apprentice Seer':
      return middleCards[firstMiddle];
    case 'Robber':
      // swap the characters
      let newCharacter: Character;
      clients.forEach(client => {
        if (client.playerId === first.playerId) {
          // client is the chosen player's card
          newCharacter = client.character;
          client.character = character; // set new player as robber
          player.character = newCharacter; // set robber as new character
        }
      });
      return newCharacter;
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
      return true;
    case 'Drunk':
      // splice middle cards with current
      const [drunkNewCharacter] = middleCards.splice(firstMiddle, 1, character);
      player.character = drunkNewCharacter;
      return true;
    default:
      console.log('character action not supported');
  }
};

