export interface Character {
  name: string;
  key: string;
  team: Team;
  order: number;
  doppel: boolean;
  directions?: string;
  startTime?: number; // timestamp to determine when the character should begin
  color?: string;
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
    directions: `Doppelganger, wake up and select another players card. You are now that role. If you viewed the 
    Robber or Troublemaker, do that action now.`,
    color: '#9FC5E4',
  },
  {
    name: 'Mystic Wolf',
    key: 'mystic_wolf',
    team: Team.WEREWOLF,
    order: 10,
    doppel: true,
    directions: `You may view another player's card.`,
    color: '#CF9FE4',
  },
  {
    name: 'Werewolf',
    key: 'werewolf_1',
    team: Team.WEREWOLF,
    order: 20,
    doppel: true,
    directions: `If there is only one Werewolf, you may look at a card from the center.`,
    color: '#ACAEB0',
  },
  {
    name: 'Werewolf',
    key: 'werewolf_2',
    team: Team.WEREWOLF,
    order: 20,
    doppel: true,
    directions: `If there is only one Werewolf, you may look at a card from the center.`,
    color: '#ACAEB0',
  },
  {
    name: 'Minion',
    key: 'minion',
    team: Team.WEREWOLF_ALLY,
    order: 30,
    doppel: true,
    directions: `You may now see the other werewolves`,
    color: '#E3E0C0',
  },
  {
    name: 'Mason',
    key: 'mason_1',
    team: Team.VILLAGER,
    order: 40,
    doppel: false,
    directions: `Wake up and view the other mason.`,
    color: '#92B356',
  },
  {
    name: 'Mason',
    key: 'mason_2',
    team: Team.VILLAGER,
    order: 40,
    doppel: false,
    directions: `Wake up and view the other mason.`,
    color: '#92B356',
  },
  {
    name: 'Seer',
    key: 'seer',
    team: Team.VILLAGER,
    order: 50,
    doppel: true,
    directions: `You may view another player's card, or two from the center.`,
    color: '#BBFBAD',
  },
  {
    name: 'Robber',
    key: 'robber',
    team: Team.VILLAGER,
    order: 60,
    doppel: true,
    directions: `You may exchange your card with another players card. Then, view that card.`,
    color: '#949494',
  },
  {
    name: 'Troublemaker',
    key: 'troublemaker',
    team: Team.VILLAGER,
    order: 70,
    doppel: true,
    directions: `You may switch two other players cards.`,
    color: '#F68F8F',
  },
  {
    name: 'Drunk',
    key: 'drunk',
    team: Team.VILLAGER,
    order: 80,
    doppel: true,
    directions: `Exchange your card with a card from the center.`,
    color: '#EDDEDE',
  },
  {
    name: 'Insomniac',
    key: 'insomniac',
    team: Team.VILLAGER,
    order: 90,
    doppel: true,
    directions: `View your card.`,
    color: '#D5C49B',
  },
  {
    name: 'Hunter',
    key: 'hunter',
    team: Team.VILLAGER,
    order: -1,
    doppel: false,
    color: '#F4A151',
  },
  {
    name: 'Tanner',
    key: 'tanner',
    team: Team.SELF,
    order: -1,
    doppel: false,
    color: '#CF9FE4',
  },
  {
    name: 'Villager',
    key: 'villager',
    team: Team.VILLAGER,
    order: -1,
    doppel: false,
    color: '#EC9A42',
  },
];

export default characters;
