import cloneDeep from 'lodash/cloneDeep';
import { getCharacterTurnInfo, handleCharacterActions } from './CharacterLogic';
import { Character, Team } from './components/Characters';
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
    );

    expect(info.insomniac.name).toBe('Werewolf');
  })
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

    expect(card).toEqual(getCharacter('Troublemaker'));
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

    expect(card).toEqual(getCharacter('Insomniac'));
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

    expect(card).toEqual([
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
    const card = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    if (isCharacter(card)) {
      expect(card.name).toBe('Troublemaker');
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
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(result).toBe(true);
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
    const result = handleCharacterActions(
      myClients,
      player,
      params,
      middleCards,
    );

    expect(result).toBe(true);
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

    expect(result.message).toEqual('You are now the Doppelganger Insomniac.');
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

    expect(result.message).toEqual('You are now the Doppelganger Werewolf.');
    expect(player.startingCharacter.name).toBe('Doppelganger Werewolf');
  });
});
