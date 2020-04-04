import React from 'react';
import { Character } from "./Characters";
import { Room } from './Home';

export interface GameOptions {
  characters: Character[];
  secondsPerCharacter: number;
  secondsToConference: number;
}

export default class Game extends React.Component<{
  options: GameOptions;
  room: Room;
}, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    return <div>let's start the game</div>;
  }
}
