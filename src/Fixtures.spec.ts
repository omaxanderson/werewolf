import { Team } from './components/Characters';
import characters from './Components/Characters';

export const getCharacter = (name: string) => characters.find(c => c.name === name);

export const middleCardsFixture = [
  getCharacter('Villager'),
  getCharacter('Werewolf'),
  getCharacter('Robber'),
];

export const clientsFixture = [
  {
    name: 'Player 1',
    roomId: 'r1',
    gameId: '123',
    playerId: 'p1',
    color: '#aaa',
    character: getCharacter('Werewolf'),
    startingCharacter: getCharacter('Werewolf'),
  },
  {
    name: 'Player 2',
    roomId: 'r1',
    gameId: '123',
    playerId: 'p2',
    color: '#aaa',
    character: getCharacter('Seer'),
    startingCharacter: getCharacter('Seer'),
  },
  {
    name: 'Player 3',
    roomId: 'r1',
    gameId: '123',
    playerId: 'p3',
    color: '#aaa',
    character: getCharacter('Troublemaker'),
    startingCharacter: getCharacter('Troublemaker'),
  },
  {
    name: 'Player 4',
    roomId: 'r1',
    gameId: '123',
    playerId: 'p2',
    color: '#aaa',
    character: getCharacter('Drunk'),
    startingCharacter: getCharacter('Drunk'),
  },
  {
    name: 'Player 5',
    roomId: 'r1',
    gameId: '123',
    playerId: 'p5',
    color: '#aaa',
    character: getCharacter('Insomniac'),
    startingCharacter: getCharacter('Insomniac'),
  },
];

export const midGameClients = [
  {
    name: 'Player 1',
    roomId: 'r1',
    gameId: '123',
    color: '#aaa',
    character: getCharacter('Insomniac'),
    startingCharacter: getCharacter('Werewolf'),
  },
  {
    name: 'Player 2',
    roomId: 'r1',
    gameId: '123',
    color: '#aaa',
    character: getCharacter('Seer'),
    startingCharacter: getCharacter('Seer'),
  },
  {
    name: 'Player 3',
    roomId: 'r1',
    gameId: '123',
    color: '#aaa',
    character: getCharacter('Troublemaker'),
    startingCharacter: getCharacter('Troublemaker'),
  },
  {
    name: 'Player 4',
    roomId: 'r1',
    gameId: '123',
    color: '#aaa',
    character: getCharacter('Minion'),
    startingCharacter: getCharacter('Drunk'),
  },
  {
    name: 'Player 5',
    roomId: 'r1',
    gameId: '123',
    color: '#aaa',
    character: getCharacter('Werewolf'),
    startingCharacter: getCharacter('Insomniac'),
  },
];
