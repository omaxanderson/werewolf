export interface Character {
  name: string;
  key: string;
  team: Team;
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
    name: 'Mystic Wolf',
    key: 'mystic_wolf',
    team: Team.WEREWOLF,
  },
  {
    name: 'Werewolf',
    key: 'werewolf_1',
    team: Team.WEREWOLF,
  },
  {
    name: 'Werewolf',
    key: 'werewolf_2',
    team: Team.WEREWOLF,
  },
  {
    name: 'Tanner',
    key: 'tanner',
    team: Team.SELF,
  },
  {
    name: 'Villager',
    key: 'villager',
    team: Team.VILLAGER,
  },
  {
    name: 'Troublemaker',
    key: 'troublemaker',
    team: Team.VILLAGER,
  },
  {
    name: 'Doppelganger',
    key: 'doppelganger',
    team: Team.UNKNOWN,
  },
  {
    name: 'Minion',
    key: 'minion',
    team: Team.WEREWOLF_ALLY,
  },
  {
    name: 'Mason',
    key: 'mason_1',
    team: Team.VILLAGER,
  },
  {
    name: 'Mason',
    key: 'mason_2',
    team: Team.VILLAGER,
  },
  {
    name: 'Seer',
    key: 'seer',
    team: Team.VILLAGER,
  },
  {
    name: 'Robber',
    key: 'robber',
    team: Team.VILLAGER,
  },
  {
    name: 'Drunk',
    key: 'drunk',
    team: Team.VILLAGER,
  },
  {
    name: 'Insomniac',
    key: 'insomniac',
    team: Team.VILLAGER,
  },
  {
    name: 'Hunter',
    key: 'hunter',
    team: Team.VILLAGER,
  },
];

export default characters;
