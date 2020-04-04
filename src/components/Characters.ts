export interface Character {
  name: string;
  key: string;
  team: Team;
  order: number;
  doppel: boolean,
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
    doppel: false,
  },
  {
    name: 'Mystic Wolf',
    key: 'mystic_wolf',
    team: Team.WEREWOLF,
    order: 10,
    doppel: true,
  },
  {
    name: 'Werewolf',
    key: 'werewolf_1',
    team: Team.WEREWOLF,
    order: 20,
    doppel: true,
  },
  {
    name: 'Werewolf',
    key: 'werewolf_2',
    team: Team.WEREWOLF,
    order: 20,
    doppel: true,
  },
  {
    name: 'Minion',
    key: 'minion',
    team: Team.WEREWOLF_ALLY,
    order: 30,
    doppel: true,
  },
  {
    name: 'Mason',
    key: 'mason_1',
    team: Team.VILLAGER,
    order: 40,
    doppel: false,
  },
  {
    name: 'Mason',
    key: 'mason_2',
    team: Team.VILLAGER,
    order: 40,
    doppel: false,
  },
  {
    name: 'Seer',
    key: 'seer',
    team: Team.VILLAGER,
    order: 50,
    doppel: true,
  },
  {
    name: 'Robber',
    key: 'robber',
    team: Team.VILLAGER,
    order: 60,
    doppel: true,
  },
  {
    name: 'Troublemaker',
    key: 'troublemaker',
    team: Team.VILLAGER,
    order: 70,
    doppel: true,
  },
  {
    name: 'Drunk',
    key: 'drunk',
    team: Team.VILLAGER,
    order: 80,
    doppel: true,
  },
  {
    name: 'Insomniac',
    key: 'insomniac',
    team: Team.VILLAGER,
    order: 90,
    doppel: true,
  },
  {
    name: 'Hunter',
    key: 'hunter',
    team: Team.VILLAGER,
    order: -1,
    doppel: false,
  },
  {
    name: 'Tanner',
    key: 'tanner',
    team: Team.SELF,
    order: -1,
    doppel: false,
  },
  {
    name: 'Villager',
    key: 'villager',
    team: Team.VILLAGER,
    order: -1,
    doppel: false,
  },
];

export default characters;
