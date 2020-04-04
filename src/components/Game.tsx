import React from 'react';
import { Character } from "./Characters";
import { Room } from './Home';
import { start } from 'repl';
import Player from './Player';

export interface GameOptions {
  gameId: string;
  characters: Character[];
  originalCharacters: Character[];
  secondsPerCharacter: number;
  secondsToConference: number;
  startingCharacter: Character;
  conferenceStart?: number;
}

function isCharacter(c: Character | any): c is Character {
  return c && ((c as Character).name !== undefined);
}

type Phase = Character | 'conference';

const INTERVAL = 1000;

export default class Game extends React.Component<{
  options: GameOptions;
  room: Room;
}, {
  current: Phase;
  next: Phase;
}> {
  private interval;
  constructor(props) {
    super(props);

    this.state = {
      current: null,
      next: null,
    }
  }

  componentDidMount(): void {
    this.getPositionInGame();
    this.interval = setInterval(this.getPositionInGame, INTERVAL);
  }

  getPositionInGame = () => {
    const { options } = this.props;
    const {
      characters,
      conferenceStart,
      secondsToConference,
    } = options;
    const charactersToPlay = characters.filter(c => c.startTime);
    const now = Date.now();
    if (!conferenceStart || !charactersToPlay[0]?.startTime) {
      return;
    }

    // case 1, game hasn't started
    if (now < charactersToPlay[0].startTime) {
      return this.setState({ next: charactersToPlay[0] });
    }

    const conferenceEnd = conferenceStart + (secondsToConference * 1000);
    // case 2, it's conference time
    if (now < conferenceEnd && now > conferenceStart) {
      return this.setState({ current: 'conference' });
    }

    // case 3, conference is over
    if (now > conferenceEnd) {
      return this.setState({ current: null, next: null });
    }

    // case 4, characters are taking their turns
    const current = charactersToPlay
      .filter(c => c.startTime < now)
      .reduce((previous, cur) => {
      if (!previous || cur.startTime > previous.startTime) {
        return cur;
      }
      return previous;
    });
    const next = charactersToPlay.find(c => c.startTime > now);
    this.setState({
      current,
      next,
    });
  };

  getGameBody = () => {
    const { options } = this.props;
    const { startingCharacter } = options;
    const {
      current,
      next,
    } = this.state;
    const now = Date.now();
    const conferenceEnd = options.conferenceStart + (options.secondsToConference * 1000);
    // case 1, we have no game data
    if (!current && !next && !options.conferenceStart) {
      return <div>Game starting soon</div>;
    }

    // case 2 game hasn't started yet
    if (isCharacter(next) && !current) {
      return <div>Game starting in {(next.startTime - now) / 1000}s</div>
    }

    // case 3 in game
    if (isCharacter(current)) {
      return (
        <>
          <div>Currently going: {current.name === startingCharacter.name ? 'You!' : current.name}</div>
          {isCharacter(next) && <div>Next up: {next.name}</div>}
        </>
      );
    }

    // case 4 in conference
    if (current === 'conference') {
      return <div>talk it out boys: {(conferenceEnd - now) / 1000}s</div>
    }

    // case 5 after conference
    if (now > conferenceEnd) {
      return <div>we done</div>;
    }

    return <div>Game starting soon</div>;
  };

  render() {
    const {
      options,
      room,
    } = this.props;
    const { startingCharacter } = options;
    let jsx = this.getGameBody();
    return (
      <>
        {startingCharacter && <div>You are the <strong>{startingCharacter.name}</strong></div>}
        <div style={{ display: 'flex' }}>
          {room.players.map(player => <Player name={player.name} color={player.color} />)}
        </div>
        {jsx}
      </>
    )
  }
}
