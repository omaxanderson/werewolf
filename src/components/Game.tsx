import React from 'react';
import { connect } from 'react-redux';
import { Character, Team } from "./Characters";
import { IPlayer } from './Interfaces';
import Player from './Player';
import { Store } from './Interfaces';
import Ribbon from './Ribbon';
import style from './Game.scss';
import { start } from 'repl';

type Phase = Character | 'conference';

const INTERVAL = 1000;

class Game extends React.Component<Store, {
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
    /*
    this.getPositionInGame();
    this.interval = setInterval(this.getPositionInGame, INTERVAL);
     */
  }

  getPositionInGame = () => {
    const { gameOptions, } = this.props;
    const {
      characters,
      conferenceStart,
      secondsToConference,
    } = gameOptions;
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
    const {
      gameOptions,
      gameState,
      extraInfo,
      playerId,
    } = this.props;
    const { startingCharacter } = gameOptions;
    const ribbonItems: Character[] = [
      {
        name: 'Game will start soon',
        key: 'pregame',
        team: Team.UNKNOWN,
        order: -1000,
        doppel: false,
        directions: 'Game will start soon.',
        color: 'white',
      },
      ...gameOptions.characters,
      {
        name: 'Daylight!',
        key: 'postgame',
        team: Team.UNKNOWN,
        order: Number.MAX_SAFE_INTEGER,
        doppel: false,
        directions: 'Find the werewolves!',
        color: 'white',
      },
    ];

    let extraJsx;
    if (extraInfo) {
      const {
        allWerewolves,
        allMasons,
        insomniac,
      } = extraInfo;
      switch (startingCharacter.name) {
        case 'Werewolf':
          if (allWerewolves.length === 1) {
            extraJsx = <div>You are a solo wolf! Click on a middle card to view it.</div>
            // solo wolf, look at a middle card
          } else {
            const otherWolf = allWerewolves.find(client => client.playerId !== playerId);
            extraJsx = <div>Your other wolf is {otherWolf.name}</div>
          }
          break;
        case 'Minion':
          const one = allWerewolves.length === 1;
          const str = `The other werewol${one ? 'f' : 'ves'} ${one ? 'is' : 'are'} ${allWerewolves.map(w => w.name).join(' and ')}.`;
          if (allWerewolves.length > 0) {
            extraJsx = <div>{str}</div>;
          }
          break;
        case 'Mason':
          if (allMasons.length === 1) {
            extraJsx = <div>You are a solo mason!</div>
            // solo wolf, look at a middle card
          } else {
            const otherMason = allMasons.find(client => client.playerId !== playerId);
            extraJsx = <div>Your other wolf is {otherMason.name}</div>
          }
          break;
        case 'Insomniac':
          extraJsx = <div>You are {insomniac.name === 'Insomniac' ? 'still' : 'now'} the {insomniac.name}</div>;
          break;
        default:
          // do nothing
      }
    }

    // doing this wonky + 1 because we're adding an element to the array
    return (
      <>
        {extraJsx}
        Character Order
        <div className={style.RibbonContainer}>
          <Ribbon characters={ribbonItems} idx={gameState.currentIdx + 1} />
        </div>
        Middle Cards
        <div className={style.RibbonContainer}>
          <Ribbon characters={[
            { name: 'Middle Card', color: '#ACAEB0' },
            { name: 'Middle Card', color: '#ACAEB0' },
            { name: 'Middle Card', color: '#ACAEB0' },
          ]} idx={-1} />
        </div>
      </>
    );
  };

  isMyTurn = (): boolean => {
    const {
      gameOptions,
      gameState,
    } = this.props;
    const current = gameOptions?.characters[gameState.currentIdx];
    const me = gameOptions?.startingCharacter;
    return Boolean(current && (current.name === me?.name));
  };

  onPlayerClick = (player: IPlayer) => {
    console.log('clicked on', player);
  };

  render() {
    const {
      gameOptions,
      players,
    } = this.props;
    const { startingCharacter } = gameOptions;
    let jsx = this.getGameBody();
    const isMyTurn = this.isMyTurn();
    return (
      <>
        {startingCharacter &&
          <div className={style.Me}>
            <div>You are the
              {' '}
              <span className={style.Title}>
                {startingCharacter.name}
              </span>
            </div>
          </div>
        }
        <div>Players</div>
        <div className={style.PlayerContainer}>
          {players.map(player => (
            <Player
              player={player}
              onPlayerClick={isMyTurn ? this.onPlayerClick : () => {}}
            />
          ))}
        </div>
        {jsx}
      </>
    )
  }
}

export default connect(state => state)(Game);
