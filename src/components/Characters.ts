export interface Character {
  name: string;
  key: string;
  team: Team;
  order: number;
  directions?: string;
  startTime?: number; // timestamp to determine when the character should begin
  color?: string;
}

export enum Team {
  WEREWOLF = 1,
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
    directions: `Doppelganger, click another player to select that card. You are now that role.`,
    color: '#9FC5E4',
  },
  {
    name: 'Werewolf',
    key: 'werewolf_1',
    team: Team.WEREWOLF,
    order: 10,
    directions: `If there is only one Werewolf, you may look at a card from the center.`,
    color: '#ACAEB0',
  },
  {
    name: 'Werewolf',
    key: 'werewolf_2',
    team: Team.WEREWOLF,
    order: 10,
    directions: `If there is only one Werewolf, you may look at a card from the center.`,
    color: '#ACAEB0',
  },
  {
    name: 'Mystic Wolf',
    key: 'mystic_wolf',
    team: Team.WEREWOLF,
    order: 20,
    directions: `You may view another player's card.`,
    color: '#CF9FE4',
  },
  {
    name: 'Minion',
    key: 'minion',
    team: Team.WEREWOLF_ALLY,
    order: 30,
    directions: `You may now see the other werewolves`,
    color: '#E3E0C0',
  },
  {
    name: 'Mason',
    key: 'mason_1',
    team: Team.VILLAGER,
    order: 40,
    directions: `Wake up and view the other mason.`,
    color: '#92B356',
  },
  {
    name: 'Mason',
    key: 'mason_2',
    team: Team.VILLAGER,
    order: 40,
    directions: `Wake up and view the other mason.`,
    color: '#92B356',
  },
  {
    name: 'Seer',
    key: 'seer',
    team: Team.VILLAGER,
    order: 50,
    directions: `You may view another player's card, or two from the center.`,
    color: '#BBFBAD',
  },
  {
    name: 'Apprentice Seer',
    key: 'apprentice_seer',
    team: Team.VILLAGER,
    order: 55,
    directions: `You may view one card from the center.`,
    color: '#BBFBAD',
  },
  {
    name: 'Robber',
    key: 'robber',
    team: Team.VILLAGER,
    order: 60,
    directions: `Click on another player to exchange your card with that players card.`,
    color: '#949494',
  },
  {
    name: 'Troublemaker',
    key: 'troublemaker',
    team: Team.VILLAGER,
    order: 70,
    directions: `You may switch two other players cards.`,
    color: '#F68F8F',
  },
  {
    name: 'Drunk',
    key: 'drunk',
    team: Team.VILLAGER,
    order: 80,
    directions: `Exchange your card with a card from the center.`,
    color: '#EDDEDE',
  },
  {
    name: 'Insomniac',
    key: 'insomniac',
    team: Team.VILLAGER,
    order: 90,
    directions: `View your card.`,
    color: '#D5C49B',
  },
  {
    name: 'Hunter',
    key: 'hunter',
    team: Team.VILLAGER,
    order: -1,
    color: '#F4A151',
  },
  {
    name: 'Tanner',
    key: 'tanner',
    team: Team.SELF,
    order: -1,
    color: '#CF9FE4',
  },
  {
    name: 'Villager',
    key: 'villager',
    team: Team.VILLAGER,
    order: -1,
    color: '#EC9A42',
  },
];

export default characters;
