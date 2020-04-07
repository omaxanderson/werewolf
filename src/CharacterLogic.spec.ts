import cloneDeep from 'lodash/cloneDeep';
import { getCharacterTurnInfo, handleCharacterActions } from './CharacterLogic';
import characters, { Character, Team } from './components/Characters';
import { MyWebSocket } from './Websocket';
import { clientsFixture, getCharacter, middleCardsFixture, midGameClients } from './Fixtures.spec';
import { isCharacter, IWebSocket } from './components/Interfaces';
import { v4 } from 'uuid';

type TestWebSocket = IWebSocket & { name: string };

const characterTemplate: Character = {
  name: '',
  key: '',
  order: 10,
  team: -1,
  doppel: true,
};

function createClient(name: string, startingCharacterName: string, characterName: string = '') {
  return {
    name,
    startingCharacter: characters.find(c => c.name === startingCharacterName),
    character: characters.find(c => c.name === (characterName || startingCharacterName)),
    playerId: v4(),
  } as MyWebSocket;
}

describe('Character Extra Info Logic', () => {
  let myClients: MyWebSocket[];
  beforeEach(() => {
    const c = [];
    for (let i = 0; i < 5; i++) {
      c.push({
        startingCharacter: {
          ...characterTemplate
        },
        character: {
          ...characterTemplate
        },
        name: `Player ${i}`,
        playerId: v4(),
      });
    }
    myClients = c;
  });

  it('Should return all werewolves when it\'s the werewolves\'s turn', () => {
    myClients.forEach((c, i) => {
      if ([0, 1].includes(i)) {
        c.startingCharacter.name = 'Werewolf';
        c.startingCharacter.team = Team.WEREWOLF;
      }
    });
    const info = getCharacterTurnInfo(
      { name: 'Werewolf' },
      myClients,
      createClient('max', 'Werewolf'),
    );

    expect(info.allWerewolves.length).toBe(2);
    expect(info.allWerewolves.map(c => c.name)).toEqual([
      'Player 0',
      'Player 1',
    ]);
  });

  it('Should return all werewolves when it is the minions turn', () => {
    myClients.forEach((c, i) => {
      if ([0, 1].includes(i)) {
        c.startingCharacter.name = 'Werewolf';
        c.startingCharacter.team = Team.WEREWOLF;
      }
    });
    const info = getCharacterTurnInfo(
      { name: 'Minion' },
      myClients,
      createClient('max', 'Minion'),
    );

    expect(info.allWerewolves.length).toBe(2);
    expect(info.allWerewolves.map(c => c.name)).toEqual([
      'Player 0',
      'Player 1',
    ]);
  });

  it('Should return all masons when it is the mason\'s turn', () => {
    myClients.forEach((c, i) => {
      if ([0, 3].includes(i)) {
        c.startingCharacter.name = 'Mason';
      }
    });
    const info = getCharacterTurnInfo(
      { name: 'Mason' },
      myClients,
      createClient('max', 'Mason'),
    );

    expect(info.allMasons.length).toBe(2);
    expect(info.allMasons.map(c => c.name)).toEqual([
      'Player 0',
      'Player 3',
    ]);
  });

  it('Should return insomniac current character', () => {
    myClients.forEach((c, i) => {
      if ([0].includes(i)) {
        c.startingCharacter.name = 'Insomniac';
        c.character.name = 'Werewolf';
      }
    });
    const info = getCharacterTurnInfo(
      { name: 'Insomniac' },
      myClients,
      createClient('max', 'Insomniac'),
    );

    expect(info.insomniac.name).toBe('Werewolf');
  });

  it('Should not return any extra info to the seer on Werewolf turn', () => {
    myClients = cloneDeep(clientsFixture);
    const player = myClients.find(c => c.startingCharacter.name === 'Seer');

    const info = getCharacterTurnInfo(
      createClient('abc', 'Werewolf').character,
      myClients,
      player,
    );

    expect(info).toEqual({});
  });


  it('Should not return any extra info to Mason on Werewolf turn', () => {
    myClients = cloneDeep(clientsFixture);
    myClients.push(createClient('hello123', 'Mason'));
    const player = myClients.find(c => c.startingCharacter.name === 'Mason');

    const info = getCharacterTurnInfo(
      createClient('abc', 'Werewolf').character,
      myClients,
      player,
    );

    expect(info).toEqual({});
  });
});

describe('Character Actions', () => {
  let myClients: MyWebSocket[];
  let middleCards;
  beforeEach(() => {
      // @ts-ignore;
      myClients = cloneDeep(clientsFixture);
      middleCards = cloneDeep(middleCardsFixture);
  });

  it('Mystic wolf should return the selected players card', () => {
    myClients[0].startingCharacter.name = 'Mystic Wolf';
    const player = myClients.find(c => c.startingCharacter.name === 'Mystic Wolf');
    const params = {
      playersSelected: [myClients.find(c => c.character.name === 'Troublemaker')],
    };
    const card = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(card).toEqual({
      result: [getCharacter('Troublemaker')],
      message: 'You have viewed the Troublemaker.',
    });
  });

  it('Seer should return the selected players card', () => {
    if (!myClients.some(c => c.startingCharacter.name === 'Seer')) {
      myClients[0].startingCharacter.name = 'Seer';
    }
    const player = myClients.find(c => c.startingCharacter.name === 'Seer');
    const params = {
      playersSelected: [myClients.find(c => c.character.name === 'Insomniac')],
    };
    const card = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(card).toEqual({
      result: [getCharacter('Insomniac')],
      message: 'You saw the Insomniac.',
    });
  });

  it('Seer should return two middle cards', () => {
    if (!myClients.some(c => c.startingCharacter.name === 'Seer')) {
      myClients[0].startingCharacter.name = 'Seer';
    }
    const player = myClients.find(c => c.startingCharacter.name === 'Seer');
    const params = {
      middleCardsSelected: [1, 2],
    };
    const card = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(card.result).toEqual([
      middleCards[1],
      middleCards[2],
    ]);
  });

  it('Robber should change the characters of two players', () => {
    if (!myClients.some(c => c.startingCharacter.name === 'Robber')) {
      myClients[0].startingCharacter.name = 'Robber';
    }
    const player = myClients.find(c => c.startingCharacter.name === 'Robber');
    const params = {
      playersSelected: [myClients.find(c => c.startingCharacter.name === 'Troublemaker')],
    };
    const { message, result } = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    if (isCharacter(result[0])) {
      expect(result[0].name).toBe('Troublemaker');
    } else {
      expect(true).toBe(false);
    }
    expect(player.character.name).toBe('Troublemaker');
    expect(
      myClients
        .find(c => c.startingCharacter.name === 'Troublemaker')
        .character.name
    ).toBe('Robber');
  });

  it('Trouble should swap two other players cards', () => {
    if (!myClients.some(c => c.startingCharacter.name === 'Troublemaker')) {
      myClients[0].startingCharacter.name = 'Troublemaker';
    }
    const player = myClients.find(c => c.startingCharacter.name === 'Troublemaker');
    const params = {
      playersSelected: [
        myClients.find(c => c.startingCharacter.name === 'Insomniac'),
        myClients.find(c => c.startingCharacter.name === 'Werewolf'),
      ],
    };
    const { result, message } = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(result).toEqual([]);
    expect(message).toBe('Success!');
    const originalInsomniac = myClients.find(c => c.startingCharacter.name === 'Insomniac');
    const originalWerewolf = myClients.find(c => c.startingCharacter.name === 'Werewolf');
    expect(originalInsomniac.character.name).toBe('Werewolf');
    expect(originalWerewolf.character.name).toBe('Insomniac');
  });

  it('Drunk should swap with one middle card', () => {
    if (!myClients.some(c => c.startingCharacter.name === 'Drunk')) {
      myClients[0].startingCharacter.name = 'Drunk';
    }
    const originalMiddleCardName = middleCards[1].name;
    const player = myClients.find(c => c.startingCharacter.name === 'Drunk');
    const params = {
      middleCardsSelected: [1],
    };
    const { result, message } = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(result).toEqual([]);
    expect(message).toBe('Success!');
    expect(middleCards[1].name).toBe('Drunk');
    expect(player.character.name).toBe(originalMiddleCardName);
  });

  it('Doppelganger should become a new character', () => {
    if (!myClients.some(c => c.startingCharacter.name === 'Doppelganger')) {
      myClients[0].startingCharacter.name = 'Doppelganger';
    }
    const player = myClients.find(c => c.startingCharacter.name === 'Doppelganger');
    const params = {
      playersSelected: [myClients.find(c => c.startingCharacter.name === 'Insomniac')],
    };
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(result.message.trim()).toEqual('You are now the Doppelganger Insomniac.');
    expect(player.startingCharacter.name).toBe('Doppelganger Insomniac');
  });

  it('Doppelganger should become a werewolf', () => {
    // @ts-ignore
    myClients.push({
      startingCharacter: {
        ...characterTemplate,
        name: 'Doppelganger',
        team: Team.UNKNOWN,
      },
      character: {
        ...characterTemplate,
        name: 'Doppelganger',
        team: Team.UNKNOWN,
      },
      name: 'Player Zero',
      playerId: 'abc123',
    });
    const player = myClients.find(c => c.startingCharacter.name === 'Doppelganger');
    const params = {
      playersSelected: [myClients.find(c => c.startingCharacter.name === 'Werewolf')],
    };
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(result.message.trim()).toEqual('You are now the Doppelganger Werewolf.');
    expect(player.startingCharacter.name).toBe('Doppelganger Werewolf');
    expect(player.character.name).toBe('Doppelganger');
  });

  it('Doppelganger who views Minion should receive werewolf list', () => {
    myClients.push(createClient('Player Zero', 'Doppelganger'));
    myClients.push(createClient('Extra WW', 'Werewolf'));
    myClients.push(createClient('Minion Man', 'Minion'));
    const player = myClients.find(c => c.startingCharacter.name === 'Doppelganger');
    const params = {
      playersSelected: [myClients.find(c => c.startingCharacter.name === 'Minion')],
    };
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(result.message.trim()).toEqual('You are now the Doppelganger Minion.');
    expect(player.startingCharacter.name).toBe('Doppelganger Minion');
    expect(player.character.name).toBe('Doppelganger');

    expect(result.result.length).toBe(1);
    expect(result.info?.allWerewolves?.length).toBe(2);
    expect(result.info?.allWerewolves?.map(w => w.name)).toEqual(['Player 1', 'Extra WW']);
  });

  it('Doppelganger Drunk should swap cards', () => {
    myClients.push(createClient('Player Zero', 'Doppelganger'));
    const player = myClients.find(c => c.startingCharacter.name === 'Doppelganger');
    const params = {
      playersSelected: [myClients.find(c => c.character.name === 'Drunk')],
    };
    const originalMiddleCards = cloneDeep(middleCards);
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(player.character.name).toBe('Doppelganger');
    expect(player.startingCharacter.name).toBe('Doppelganger Drunk');

    const swapResult = handleCharacterActions(
      myClients,
      player,
      { middleCardsSelected: [1] },
      middleCards,
    );

    expect(swapResult.result).toEqual([]);
    expect(swapResult.message).toEqual('Success!');

    expect(middleCards[1]).toEqual(getCharacter('Doppelganger'));
    expect(player.character).toEqual(originalMiddleCards[1]);
  });

  it('Doppelganger Mystic Wolf should get all werewolves on Werewolf turn', () => {
    myClients.push(createClient('Player Zero', 'Doppelganger'));
    myClients.push(createClient('Mystic Wolf Player', 'Mystic Wolf'));
    const player = myClients.find(c => c.startingCharacter.name === 'Doppelganger');
    const params = {
      playersSelected: [myClients.find(c => c.character.name === 'Mystic Wolf')],
    };
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );
    // doppelganger is now doppel mystic

    expect(player.character.name).toBe('Doppelganger');
    expect(player.startingCharacter.name).toBe('Doppelganger Mystic Wolf');
    expect(result.message).toBe(`You are now the Doppelganger Mystic Wolf. You may click on another player's card to view that card.`);

    const viewedClient = myClients.find(c => c.character.name === 'Seer');

    const viewResult = handleCharacterActions(
      myClients,
      player,
      { playersSelected: [viewedClient] },
      middleCards,
    );

    expect(viewResult.result).toEqual([viewedClient.character]);
    expect(viewResult.message).toEqual(`You have viewed the Seer.`);

    const werewolfTurnInfo = getCharacterTurnInfo(
      createClient('hi', 'Werewolf').character,
      myClients,
      player,
    );
    expect(werewolfTurnInfo.allWerewolves.length).toBe(3);
    expect(werewolfTurnInfo.allWerewolves.map(c => c.startingCharacter.name)).toEqual([
      'Werewolf',
      'Doppelganger Mystic Wolf',
      'Mystic Wolf',
    ]);

    const masonTurnInfo = getCharacterTurnInfo(
      createClient('hi', 'Mason').character,
      myClients,
      player,
    );
    expect(masonTurnInfo.allMasons).toBeUndefined();
  });

  it('Doppelganger Mason should get all Masons on Mason turn', () => {
    myClients.push(createClient('Player Zero', 'Doppelganger'));
    myClients.push(createClient('Mason Player', 'Mason'));
    const player = myClients.find(c => c.startingCharacter.name === 'Doppelganger');
    const params = {
      playersSelected: [myClients.find(c => c.character.name === 'Mason')],
    };
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );
    // doppelganger is now doppel mystic

    expect(player.character.name).toBe('Doppelganger');
    expect(player.startingCharacter.name).toBe('Doppelganger Mason');
    expect(result.message).toBe(`You are now the Doppelganger Mason. `);

    const werewolfTurnInfo = getCharacterTurnInfo(
      createClient('hi', 'Werewolf').character,
      myClients,
      player,
    );
    expect(werewolfTurnInfo.allWerewolves).toBeUndefined();

    const masonTurnInfo = getCharacterTurnInfo(
      createClient('hi', 'Mason').character,
      myClients,
      player,
    );
    expect(masonTurnInfo.allMasons.length).toBe(2);
    expect(masonTurnInfo.allMasons.map(c => c.startingCharacter.name)).toEqual([
      'Doppelganger Mason',
      'Mason',
    ]);
  });
});
