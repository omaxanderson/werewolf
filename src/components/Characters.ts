export interface Character {
  name: string;
  key: string;
  team: Team;
  order: number;
  startTime?: number; // timestamp to determine when the character should begin
}

export enum Team {
  WEREWOLF,
  WEREWOLF_ALLY,
  VILLAGER,
  SELF,
  UNKNOWN,
}

const characters: Character[] = [
  {
    name: 'Doppelganger',
    key: 'doppelganger',
    team: Team.UNKNOWN,
    order: 1,
  },
  {
    name: 'Mystic Wolf',
    key: 'mystic_wolf',
    team: Team.WEREWOLF,
    order: 10,
  },
  {
    name: 'Werewolf',
    key: 'werewolf_1',
    team: Team.WEREWOLF,
    order: 20,
  },
  {
    name: 'Werewolf',
    key: 'werewolf_2',
    team: Team.WEREWOLF,
    order: 20,
  },
  {
    name: 'Minion',
    key: 'minion',
    team: Team.WEREWOLF_ALLY,
    order: 30,
  },
  {
    name: 'Mason',
    key: 'mason_1',
    team: Team.VILLAGER,
    order: 40,
  },
  {
    name: 'Mason',
    key: 'mason_2',
    team: Team.VILLAGER,
    order: 40,
  },
  {
    name: 'Seer',
    key: 'seer',
    team: Team.VILLAGER,
    order: 50,
  },
  {
    name: 'Robber',
    key: 'robber',
    team: Team.VILLAGER,
    order: 60,
  },
  {
    name: 'Troublemaker',
    key: 'troublemaker',
    team: Team.VILLAGER,
    order: 70,
  },
  {
    name: 'Drunk',
    key: 'drunk',
    team: Team.VILLAGER,
    order: 80,
  },
  {
    name: 'Insomniac',
    key: 'insomniac',
    team: Team.VILLAGER,
    order: 90,
  },
  {
    name: 'Hunter',
    key: 'hunter',
    team: Team.VILLAGER,
    order: -1,
  },
  {
    name: 'Tanner',
    key: 'tanner',
    team: Team.SELF,
    order: -1,
  },
  {
    name: 'Villager',
    key: 'villager',
    team: Team.VILLAGER,
    order: -1,
  },
];

export default characters;
