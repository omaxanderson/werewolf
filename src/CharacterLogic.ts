import { Character, Team } from './components/Characters';
import { MyWebSocket } from './Websocket';
import { ActionResponse, CharacterActionParams, ICharacter, ICharacterExtraData } from './components/Interfaces';

export const getCharacterTurnInfo = (
  currentCharacter: ICharacter,
  clients: MyWebSocket[],
): ICharacterExtraData => {
  switch (currentCharacter.name) {
    // Werewolves need to know other werewolves
    case 'Doppelganger Werewolf':
    case 'Doppelganger Mystic Wolf':
    case 'Doppelganger Minion':
    case 'Werewolf':
    case 'Mystic Wolf':
    case 'Minion':
      const allWerewolves: MyWebSocket[] = [];
      clients.forEach(c => {
        if (c.startingCharacter.team === Team.WEREWOLF) {
          allWerewolves.push(c);
        }
      });
      return { allWerewolves };
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
      let doppelgangerInsomniac: Character;
      clients.forEach(c => {
        if (c.startingCharacter.name === 'Insomniac') {
          doppelgangerInsomniac = c.character;
        }
      });
      return { insomniac: doppelgangerInsomniac };
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

const findSelectedPlayerCharacter = (clients: MyWebSocket[], player: MyWebSocket): Character => {
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
export const handleCharacterActions = (
  clients: MyWebSocket[],
  player: MyWebSocket,
  params: CharacterActionParams,
  middleCards: Character[],
): ActionResponse => {
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
  switch (character.name) {
    case 'Doppelganger':
      // need to somehow turn the doppelganger into the new role
      if (playersSelected.length) {
        const newDoppelganger = findSelectedPlayerCharacter(clients, first);
        const originalName = newDoppelganger.name;
        newDoppelganger.name = `Doppelganger ${newDoppelganger.name}`;
        response.result = [newDoppelganger];
        response.message = `You are now the ${newDoppelganger.name}. ${actionMap[originalName] || ''}`;
        // now set that as the doppelgangers current character
        player.startingCharacter = newDoppelganger;
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
          client.character = character; // set new player as robber
          player.character = newCharacter; // set robber as new character
        }
      });
      response.result = [newCharacter];
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
      const [drunkNewCharacter] = middleCards.splice(firstMiddle, 1, character);
      player.character = drunkNewCharacter;
      response.message = 'Success!';
      return response;
    default:
      console.log('character action not supported');
  }
};

