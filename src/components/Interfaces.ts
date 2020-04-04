import { Character } from './Characters';

export interface GameOptions {
  gameId: string;
  characters: Character[];
  originalCharacters: Character[];
  secondsPerCharacter: number;
  secondsToConference: number;
  startingCharacter: Character;
  conferenceStart?: number;
}

export interface IPlayer {
  name: string;
  color?: string;
}

export interface Room {
  players: IPlayer[];
}

