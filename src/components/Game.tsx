import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Character, Team } from "./Characters";
import { IPlayer } from './Interfaces';
import { Store } from './Interfaces';
import Ribbon from './Ribbon';
import style from './Game.scss';
import { WebSocketAction } from '../IWebsocket';
import {
  Button,
  Row,
  Column,
  Header,
} from '@omaxwellanderson/react-components';
import Players from './Players';

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

  startNewGame = () => {
    const { client } = this.props;
    client.send(JSON.stringify({
      action: WebSocketAction.NEW_GAME,
    }));
  };

  getGameResults = () => {
    const { gameResults, players } = this.props;
    const { middleCards, ...rest } = gameResults;
    const mappedToNames = Object.keys(rest).map(playerId => {
      const { name: playerName } = players.find(p => p.playerId === playerId);
      return [playerName, rest[playerId]];
    });
    return (
      <>
        <Row>
          <Column sm={12} md={6}>
            <Header h={3}>Players</Header>
            {mappedToNames.map(([name, character]) => (
              <div key={`result_${name}`}>
                {name}: <strong>{character.name}</strong>
              </div>
            ))}
          </Column>
          <Column sm={12} md={6}>
            <Header h={3}>Middle Cards</Header>
            {middleCards.map(card => <div key={`middle${card.name}`}>{card.name}</div>)}
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
    if (isMyTurn) {
      const {
        allWerewolves,
        allMasons,
        insomniac,
      } = extraInfo || {};
      switch (startingCharacter.name) {
        case 'Werewolf':
          if (allWerewolves.length === 1) {
            extraJsx = <div>You are a solo wolf! Click on a middle card to view it.</div>;
            onMiddleCardClick = (idx: number) => client.send(JSON.stringify({
              action: WebSocketAction.CHARACTER_ACTION,
              params: {
                middleCardsSelected: [idx],
              },
            }));
            // solo wolf, look at a middle card
          } else {
            const otherWolf = allWerewolves.find(client => client.playerId !== playerId);
            extraJsx = <div>Your other wolf is {otherWolf.name}</div>
          }
          break;
        case 'Mystic Wolf':
          onPlayerClick = (player) => {
            if (player.playerId !== playerId) {
              client.send(JSON.stringify({
                action: WebSocketAction.CHARACTER_ACTION,
                params: {
                  playersSelected: [player],
                },
              }));
            } else {
              alert('Don\'t choose yourself you walnut.');
            }
          };
          extraJsx = <div>Click on another player to view that card.</div>;
          break;
        case 'Minion':
          const one = allWerewolves.length === 1;
          const str = `The ${one ? 'only' : ''} werewol${one ? 'f' : 'ves'} ${one ? 'is' : 'are'} ${allWerewolves.map(w => w.name).join(' and ')}.`;
          if (allWerewolves.length > 0) {
            extraJsx = <div>{str}</div>;
          } else {
            extraJsx = <div>All the werewolves are in the middle.</div>
          }
          break;
        case 'Mason':
          if (allMasons.length === 1) {
            extraJsx = <div>You are a solo mason!</div>
            // solo wolf, look at a middle card
          } else {
            const otherMason = allMasons.find(client => client.playerId !== playerId);
            extraJsx = <div>Your other mason is {otherMason.name}</div>
          }
          break;
        case 'Robber':
          onPlayerClick = (player) => {
            if (player.playerId !== playerId) {
              client.send(JSON.stringify({
                action: WebSocketAction.CHARACTER_ACTION,
                params: {
                  playersSelected: [player],
                },
              }));
            } else {
              alert('Don\'t choose yourself you walnut.');
            }
          };
          extraJsx = <div>Click on a player to rob their card.</div>;
          break;
        case 'Seer':
          onPlayerClick = (player) => {
            if (player.playerId !== playerId) {
              client.send(JSON.stringify({
                action: WebSocketAction.CHARACTER_ACTION,
                params: {
                  playersSelected: [player],
                },
              }));
            } else {
              alert('Don\'t choose yourself you walnut.');
            }
          };
          onMiddleCardClick = (idx: number) => {
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
          extraJsx = <div>Click on a player to see, or select two cards from the middle.</div>;
        break;
        case 'Troublemaker':
          onPlayerClick = (player) => {
            const { playersSelected: currentlySelected } = this.state;
            const playersSelected = [...currentlySelected, player];
            if (player.playerId === playerId) {
              alert('Don\'t choose yourself you walnut.');
            } else {
              this.setState({ playersSelected }, () => {
                if (playersSelected.length === 2) {
                  client.send(JSON.stringify({
                    action: WebSocketAction.CHARACTER_ACTION,
                    params: { playersSelected },
                  }));
                  // setTimeout(() => this.setState({ playersSelected: [] }), 5000);
                }
              });
            }
          };
          extraJsx = <div>Click on two players to swap them.</div>;
          break;
        case 'Drunk':
          onMiddleCardClick = (idx: number) => client.send(JSON.stringify({
            action: WebSocketAction.CHARACTER_ACTION,
            params: {
              middleCardsSelected: [idx],
            },
          }));
          extraJsx = <div>Click on a card in the middle to take that card</div>;
          break;
        case 'Insomniac':
          extraJsx = <div>You are {insomniac.name === 'Insomniac' ? 'still' : 'now'} the {insomniac.name}</div>;
          break;
        default:
          // do nothing
      }
    }

    let actionResultMessage = actionResult?.message || '';

    const isDaylight = gameState.currentIdx === gameOptions.characters.length;
    if (isDaylight && !this.interval) {
      this.interval = setInterval(() => {
        this.forceUpdate();
      }, 1000);
    }

    const timer = this.getTimerJsx();

    const characterHeader = gameState.currentIdx >= 0 && gameState.currentIdx < gameOptions.characters.length
      ? <span>Current Turn: {gameOptions.characters[gameState.currentIdx]?.name}</span>
      : <span>Character Order</span>;

    return (
      <>
        {timer}
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
    const {
      gameState,
      gameOptions,
      extraInfo,
    } = this.props;
    const isDaylight = gameState.currentIdx === gameOptions.characters.length;
    if (isDaylight) {
      const conferenceEnd = extraInfo?.conferenceEndTime;
      if (conferenceEnd) {
        const diff = Math.floor((conferenceEnd - Date.now()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = (diff % 60).toString().padStart(2, '0');
        return (
          <Row>
            <Column sm={12}>
              <Header h={3}>Conference Time: {minutes}:{seconds}</Header>
            </Column>
          </Row>
        );
      }
    }
    return null;
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
