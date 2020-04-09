import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Character, Team } from "./Characters";
import { IPlayer, LogItem } from './Interfaces';
import { Store } from './Interfaces';
import Ribbon from './Ribbon';
import style from './Game.scss';
import { WebSocketAction } from '../IWebsocket';
import {
  Button,
  Row,
  Column,
  Header,
  Modal,
} from '@omaxwellanderson/react-components';
import Players from './Players';
import Voting from './Voting';
import { v4 } from 'uuid';

class Game extends React.Component<Store, {
  middleCardsSelected: number[];
  playersSelected: IPlayer[];
  infoDidChange: boolean;
  resultsDidChange: boolean;
}> {
  private interval;
  constructor(props) {
    super(props);

    this.state = {
      middleCardsSelected: [],
      playersSelected: [],
      infoDidChange: false,
      resultsDidChange: false,
    }
  }

  componentDidUpdate(prevProps, prevState): void {
    if (prevProps.extraInfo !== this.props.extraInfo) {
      this.setState({ infoDidChange: true }, () => {
        setTimeout(() => this.setState({ infoDidChange: false }), 5000);
      });
    }
    if (prevProps.actionResult !== this.props.actionResult) {
      this.setState({ resultsDidChange: true }, () => {
        setTimeout(() => this.setState({ resultsDidChange: false }), 5000);
      });
    }
  }

  componentDidMount(): void {
    /*
    this.getPositionInGame();
    this.interval = setInterval(this.getPositionInGame, INTERVAL);
     */
  }

  componentWillUnmount(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  startNewGame = () => {
    const { client } = this.props;
    client.send(JSON.stringify({
      action: WebSocketAction.NEW_GAME,
    }));
  };

  getGameResults = () => {
    const { gameResults, players } = this.props;
    const { middleCards, votes, log, ...rest } = gameResults;
    const mappedToNames = Object.keys(rest).map(playerId => {
      const { name: playerName } = players.find(p => p.playerId === playerId);
      return [playerName, rest[playerId]];
    });

    const mappedVotesToNames = Object.keys(votes).map(playerId => {
      const { name: playerName } = players.find(p => p.playerId === playerId);
      return [playerName, votes[playerId]];
    });
    mappedVotesToNames.sort(([_, a], [__, b]) => b - a);
    const readableLog = log?.map((logItem: LogItem) => {
      let str = `${logItem.player} as the ${logItem.as}: `;
      if (logItem.middleCardsSelected?.length > 0) {
        str += `selected the ${
          logItem.middleCardsSelected.join(' and ')
        } from the middle.`;
      } else if (logItem.playersSelected?.length > 0) {
        str += `selected ${logItem.playersSelected.join(' and ')}.`;
      }
      return str;
    }) || [];
    return (
      <>
        <Row>
          <Column sm={12} md={4}>
            <Header h={3}>Players</Header>
            {mappedToNames.map(([name, character]) => (
              <div key={`result_${name}`}>
                {name}: <strong>{character.name}</strong>
              </div>
            ))}
          </Column>
          <Column sm={12} md={4}>
            <Header h={3}>Middle Cards</Header>
            {middleCards.map(card => <div key={`middle${card.name}`}>{card.name}</div>)}
          </Column>
          <Column sm={12} md={4}>
            <Header h={3}>Votes</Header>
            {mappedVotesToNames.map(([name, votes], idx) => {
              const jsx = <div key={`vote_${name}`}>{name}: {votes}</div>;
              return idx === 0 ? <strong>{jsx}</strong> : jsx;
            })}
          </Column>
        </Row>
        <Row>
          <Column sm={12}>
            <Header h={3}>Log</Header>
            {readableLog.map(l => <div key={v4()}>{l}</div>)}
          </Column>
        </Row>
        <Row>
          <Column sm={12}>
            <Button onClick={this.startNewGame}>New Game</Button>
          </Column>
        </Row>
      </>

    )
  };

  getGameBody = () => {
    const {
      gameOptions,
      gameState,
      extraInfo,
      playerId,
      client,
      players,
      actionResult,
      gameResults,
    } = this.props;
    if (gameResults) {
      return this.getGameResults();
    }
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
    let onMiddleCardClick = (idx: number) => {};
    let onPlayerClick = (player: any) => {};
    const isMyTurn = this.isMyTurn();
    const singlePlayerClick = (player) => {
      if (player.playerId !== playerId) {
        client.send(JSON.stringify({
          action: WebSocketAction.CHARACTER_ACTION,
          params: {
            playersSelected: [player],
          },
        }));
      }
    };
    const multiPlayerClick = (player) => {
      if (!isMyTurn) {
        return;
      }
      const { playersSelected: currentlySelected } = this.state;
      const playersSelected = [...currentlySelected, player];
      if (player.playerId !== playerId) {
        this.setState({ playersSelected }, () => {
          if (playersSelected.length === 2) {
            client.send(JSON.stringify({
              action: WebSocketAction.CHARACTER_ACTION,
              params: { playersSelected },
            }));
          }
        });
      }
    };
    const singleMiddleClick = (idx: number) => {
      client.send(JSON.stringify({
        action: WebSocketAction.CHARACTER_ACTION,
        params: {
          middleCardsSelected: [idx],
        },
      }));
    };
    const multiMiddleClick = (idx: number) => {
      if (!isMyTurn) {
        return;
      }
      const { middleCardsSelected: currentlySelected } = this.state;
      const middleCardsSelected = [...currentlySelected, idx];
      this.setState({ middleCardsSelected }, () => {
        if (middleCardsSelected.length === 2) {
          client.send(JSON.stringify({
            action: WebSocketAction.CHARACTER_ACTION,
            params: { middleCardsSelected },
          }));
        }
      });
    };

    const {
      allWerewolves,
      allMasons,
        insomniac,
      } = extraInfo || {};
      switch (startingCharacter.name) {
        case 'Doppelganger':
          onPlayerClick = singlePlayerClick;
          if (isMyTurn) {
            extraJsx = <div>Select another player to become that role.</div>;
          }
          break;
        case 'Doppelganger Mystic Wolf':
        case 'Mystic Wolf':
          onPlayerClick = singlePlayerClick;
          if (isMyTurn) {
            extraJsx = <div>Click on another player to view that card.</div>;
            break;
          }
          // intentional fallthrough here
        case 'Werewolf':
        case 'Doppelganger Werewolf':
          onMiddleCardClick = singleMiddleClick;
          if (!allWerewolves) {
            break;
          }
          if (allWerewolves.length === 1) {
            extraJsx = <div>You are a solo wolf! Click on a middle card to view it.</div>;
            // solo wolf, look at a middle card
          } else {
            const otherWolves = allWerewolves.filter(client => client.playerId !== playerId);
            const plural = otherWolves.length > 1;
            const wolfStr = `Your other wol${
              plural
                ? 'ves are'
                : 'f is'
              } ${otherWolves.map(client => client.name).join(' and ')}.`;
            extraJsx = <div>{wolfStr}</div>
          }
          break;
        case 'Doppelganger Minion':
        case 'Minion':
          if (!allWerewolves) {
            break;
          }
          const one = allWerewolves.length === 1;
          const str = `The ${one ? 'only' : ''} werewol${one ? 'f' : 'ves'} ${one ? 'is' : 'are'} ${allWerewolves.map(w => w.name).join(' and ')}.`;
          if (allWerewolves.length > 0) {
            extraJsx = <div>{str}</div>;
          } else {
            extraJsx = <div>All the werewolves are in the middle.</div>
          }
          break;
        case 'Mason':
        case 'Doppelganger Mason':
          if (!allMasons) {
            break;
          }
          if (allMasons.length === 1) {
            extraJsx = <div>You are a solo mason!</div>
            // solo wolf, look at a middle card
          } else {
            const otherMason = allMasons.filter(client => client.playerId !== playerId);
            const pluralMason = otherMason.length > 1;
            const masonStr = `Your other mason${pluralMason ? 's' : ''} ${pluralMason
              ? 'are'
              : 'is'
            } ${otherMason.map(({name}) => name).join(' and ')}.`;
            extraJsx = <div>{masonStr}</div>
          }
          break;
        case 'Robber':
        case 'Doppelganger Robber':
          onPlayerClick = singlePlayerClick;
          if (isMyTurn) {
            extraJsx = <div>Click on a player to rob their card.</div>;
          }
          break;
        case 'Seer':
        case 'Doppelganger Seer':
          onPlayerClick = singlePlayerClick;
          onMiddleCardClick = multiMiddleClick;
          if (isMyTurn) {
            extraJsx = <div>Click on a player to see, or select two cards from the middle.</div>;
          }
        break;
        case 'Apprentice Seer':
        case 'Doppelganger Apprentice Seer':
          onMiddleCardClick = singleMiddleClick;
          if (isMyTurn) {
            extraJsx = <div>Click on a card in the middle to view that card.</div>;
          }
          break;
        case 'Troublemaker':
        case 'Doppelganger Troublemaker':
          onPlayerClick = multiPlayerClick;
          if (isMyTurn) {
            extraJsx = <div>Click on two players to swap them.</div>;
          }
          break;
        case 'Drunk':
        case 'Doppelganger Drunk':
          onMiddleCardClick = singleMiddleClick;
          if (isMyTurn) {
            extraJsx = <div>Click on a card in the middle to take that card</div>;
          }
          break;
        case 'Insomniac':
        case 'Doppelganger Insomniac':
          if (!insomniac) {
            break;
          }
          extraJsx = <div>You are {insomniac.name === 'Insomniac' ? 'still' : 'now'} the {insomniac.name}</div>;
          break;
        default:
          // do nothing
      }
    // }

    let actionResultMessage = actionResult?.message || '';

    const isDaylight = gameState.currentIdx === gameOptions.characters.length;
    if (isDaylight && !this.interval) {
      this.interval = setInterval(() => {
        this.forceUpdate();
      }, 1000);
    }

    const characterHeader = gameState.currentIdx >= 0 && gameState.currentIdx < gameOptions.characters.length
      ? <span>Current Turn: {gameOptions.characters[gameState.currentIdx]?.name}</span>
      : <span>Character Order</span>;

    return (
      <>
        <Voting />
        <Row>
          <Column sm={6}>
            <div className={classNames(style.Box, {
              [style.Box__Important]: this.state.infoDidChange,
            })}>
              <h3 className={style.Box__Header}>
                Info
              </h3>
              {extraJsx || <div>It's not your turn.</div>}
            </div>
          </Column>
          <Column sm={6}>
            <div className={classNames(style.Box, {
              [style.Box__Important]: this.state.resultsDidChange,
            })}>
              <h3 className={style.Box__Header}>
                Results
              </h3>
              <div>
                {actionResultMessage ? actionResultMessage : 'No results to see yet.'}
              </div>
            </div>
          </Column>
        </Row>
        <Header h={2} spacing="sm">{characterHeader}</Header>
        <div className={style.RibbonContainer}>
          <Ribbon characters={ribbonItems} idx={gameState.currentIdx + 1} />
        </div>
        <Header h={2}>Players</Header>
        <Players
          players={players}
          playersSelected={this.state.playersSelected}
          onPlayerClick={onPlayerClick}
        />
        <Header h={2}>Middle Cards</Header>
        <div className={style.RibbonContainer}>
          <Ribbon characters={[
            { name: 'Middle Card', color: '#ACAEB0', key: 'm1', highlighted: this.state.middleCardsSelected.includes(0) },
            { name: 'Middle Card', color: '#ACAEB0', key: 'm2', highlighted: this.state.middleCardsSelected.includes(1)  },
            { name: 'Middle Card', color: '#ACAEB0', key: 'm3', highlighted: this.state.middleCardsSelected.includes(2)  },
          ]} idx={-1} onClick={onMiddleCardClick}/>
        </div>
      </>
    );
  };

  getTimerJsx = () => {
    return <Voting />;
  };

  isMyTurn = (): boolean => {
    const {
      gameOptions,
      gameState,
    } = this.props;
    const current = gameOptions?.characters[gameState.currentIdx];
    const me = gameOptions?.startingCharacter;
    if (current && (current.name === me?.name)) {
      return true;
    }
    return Boolean(current && (me?.name?.startsWith(current.name)));
  };

  debugStepForward = () => {
    this.props.client.send(JSON.stringify({
      action: 8,
    }));
  };

  render() {
    const {
      gameOptions,
      gameResults,
    } = this.props;
    const { startingCharacter } = gameOptions;
    let jsx = this.getGameBody();
    return (
      <>
        { /* <Button onClick={this.debugStepForward}>Next</Button> */ }
        {gameResults && <div>The results are in!</div>}
        {startingCharacter && !gameResults &&
          <div className={style.Me}>
            <div className={style.x}>You are the</div>
            <h2 className={style.Title}>
              {startingCharacter.name}
            </h2>
          </div>
        }
        {jsx}
      </>
    )
  }
}

export default connect(state => state)(Game);
