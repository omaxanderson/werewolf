import React from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { Character, Team } from "./Characters";
import { IGameResults, IPlayer, LogItem } from './Interfaces';
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
    if (!isEqual(prevProps.extraInfo, this.props.extraInfo)) {
      this.setState({ infoDidChange: true }, () => {
        setTimeout(() => this.setState({ infoDidChange: false }), 5000);
      });
    }
    if (!isEqual(prevProps.actionResult, this.props.actionResult)) {
      this.setState({ resultsDidChange: true }, () => {
        setTimeout(() => this.setState({ resultsDidChange: false }), 5000);
      });
    }
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

  displayGameResults = () => {
    const { gameResults } = this.props;
    const {
      middleCards,
      votes,
      log,
      players,
      winningTeams,
      killed,
    }: IGameResults = gameResults;

    const werewolves = players.filter(({ character }) => (
      [Team.WEREWOLF, Team.WEREWOLF_ALLY].includes(character.team)
    ));
    const villagers = players.filter(({ character }) => (
      ![Team.WEREWOLF, Team.WEREWOLF_ALLY].includes(character.team)
    ));

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

    const displayPlayersMapFunction = ({name, character }) => {
      const className = killed.map(dead => dead.name).includes(name)
        ? style.Killed
        : '';
      const killedByHunter = killed.find(dead => dead.name === name)?.killedByHunter;
      return (
        <div key={`result_${name}`} className={className}>
          {name}: <strong>{(character as Character).name}</strong>
          {killedByHunter && ` (Killed by Hunter)`}
        </div>
      );
    };

    const sortedVotes = Object.entries(votes);
    sortedVotes.sort(([_, { numVotes: a }], [__, { numVotes: b}]) => b - a);

    return (
      <>
        <div>
          <h2>
            {winningTeams.includes(Team.VILLAGER) && 'Villagers Win!'}
          </h2>
          <h2>
            {winningTeams.includes(Team.SELF) && 'Tanner Wins!'}
          </h2>
          <h2>
            {winningTeams.includes(Team.WEREWOLF) && 'Werewolves Win!'}
          </h2>
          <h2>
            {winningTeams.includes(Team.WEREWOLF_ALLY) && 'Minion Wins!'}
          </h2>
          <h2>
            {winningTeams.length === 0 && 'Nobody Wins!'}
          </h2>
        </div>
        <Row>
          <Column sm={12} md={4}>
            <div>
              <Header h={3}>Werewolves</Header>
              {werewolves.map(displayPlayersMapFunction)}
            </div>
            <div style={{ marginTop: '20px' }}>
              <Header h={3}>Villagers</Header>
              {villagers.map(displayPlayersMapFunction)}
            </div>
          </Column>
          <Column sm={12} md={4}>
            <Header h={3}>Middle Cards</Header>
            {middleCards.map(card => <div key={`middle${card.name}`}>{card.name}</div>)}
          </Column>
          <Column sm={12} md={4}>
            <Header h={3}>Votes</Header>
            {sortedVotes.map(([name, { numVotes }], idx) => {
              const jsx = <div key={`vote_${name}`}>{name}: {numVotes}</div>;
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
      if (this.interval) {
        clearInterval(this.interval);
      }
      return this.displayGameResults();
    }
    const { startingCharacter } = gameOptions;
    const ribbonItems: Character[] = [
      {
        name: 'Game will start soon',
        key: 'pregame',
        team: Team.UNKNOWN,
        order: -1000,
        directions: 'Game will start soon.',
        color: 'white',
      },
      ...gameOptions.characters,
      {
        name: 'Daylight!',
        key: 'postgame',
        team: Team.UNKNOWN,
        order: Number.MAX_SAFE_INTEGER,
        directions: 'Find the werewolves!',
        color: 'white',
      },
    ];

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

    const extraInfoList = [];

    extraInfo.forEach(i => {
      if (i.directions) {
        extraInfoList.push(<div>{i.directions}</div>);
      }
      switch (startingCharacter.name) {
        case 'Doppelganger':
          onPlayerClick = singlePlayerClick;
          break;
        case 'Doppelganger Mystic Wolf':
        case 'Mystic Wolf':
          onPlayerClick = singlePlayerClick;
        // intentional fallthrough here
        case 'Werewolf':
        case 'Doppelganger Werewolf':
          onMiddleCardClick = singleMiddleClick;
          const { allWerewolves: wwInfo } = i;
          if (!wwInfo) {
            break;
          }
          if (wwInfo.length === 1) {
            extraInfoList.push(<div>You are a solo wolf! Click on a middle card to view it.</div>);
            // solo wolf, look at a middle card
          } else {
            const otherWolves = wwInfo.filter(client => client.playerId !== playerId);
            const plural = otherWolves.length > 1;
            const wolfStr = `Your other wol${
              plural
                ? 'ves are'
                : 'f is'
            } ${otherWolves.map(client => client.name).join(' and ')}.`;
            extraInfoList.push(<div>{wolfStr}</div>);
          }
          break;
        case 'Doppelganger Minion':
        case 'Minion':
          const { allWerewolves: minionInfo } = i;
          if (!minionInfo) {
            break;
          }
          const one = minionInfo.length === 1;
          const str = `The ${one ? 'only' : ''} werewol${one ? 'f' : 'ves'} ${one ? 'is' : 'are'} ${minionInfo.map(w => w.name).join(' and ')}.`;
          if (minionInfo.length > 0) {
            extraInfoList.push(<div>{str}</div>);
          } else {
            extraInfoList.push(<div>All the werewolves are in the middle.</div>);
          }
          break;
        case 'Mason':
        case 'Doppelganger Mason':
          const { allMasons: masonInfo } = i;
          if (!masonInfo) {
            break;
          }
          if (masonInfo.length === 1) {
            extraInfoList.push(<div>You are a solo mason!</div>);
          } else {
            const otherMason = masonInfo.filter(client => client.playerId !== playerId);
            const pluralMason = otherMason.length > 1;
            const masonStr = `Your other mason${pluralMason ? 's' : ''} ${pluralMason
              ? 'are'
              : 'is'
            } ${otherMason.map(({ name }) => name).join(' and ')}.`;
            extraInfoList.push(<div>{masonStr}</div>);
          }
          break;
        case 'Robber':
        case 'Doppelganger Robber':
          onPlayerClick = singlePlayerClick;
          break;
        case 'Seer':
        case 'Doppelganger Seer':
          onPlayerClick = singlePlayerClick;
          onMiddleCardClick = multiMiddleClick;
          break;
        case 'Apprentice Seer':
        case 'Doppelganger Apprentice Seer':
          onMiddleCardClick = singleMiddleClick;
          break;
        case 'Troublemaker':
        case 'Doppelganger Troublemaker':
          onPlayerClick = multiPlayerClick;
          break;
        case 'Drunk':
        case 'Doppelganger Drunk':
          onMiddleCardClick = singleMiddleClick;
          break;
        case 'Insomniac':
        case 'Doppelganger Insomniac':
          const { insomniac } = i;
          if (!insomniac) {
            break;
          }
          extraInfoList.push(<div>You are {insomniac.name === 'Insomniac' ? 'still' : 'now'} the {insomniac.name}</div>);
          break;
        default:
        // do nothing
      }
    });

    const actionResultMessage = actionResult.map(r => <div>{r?.message || ''}</div>);

    const isDaylight = gameState.currentIdx === gameOptions.characters.length;
    if (isDaylight && !this.interval) {
      this.interval = setInterval(() => {
        this.forceUpdate();
      }, 1000);
    }

    return (
      <>
        {gameResults && <div>The results are in!</div>}
        {startingCharacter && !gameResults &&
          <div className={style.HeaderInfo}>
            <Row>
              <Column sm={6} md={2}>
                <div className={style.Me}>
                  You are the
                  <h2 className={style.StartingCharacterHeader}>
                    {startingCharacter.name}
                  </h2>
                </div>
              </Column>
              <Column sm={6} md={10}>
                <Ribbon characters={ribbonItems} idx={gameState.currentIdx + 1} />
              </Column>
            </Row>
          </div>
        }
        <Row>
          <Column sm={6}>
            <div className={classNames(style.Box, {
              [style.Box__Important]: this.state.infoDidChange,
            })}>
              <h3 className={style.Box__Header}>
                Info
              </h3>
              {extraInfoList.length > 0 ? extraInfoList : <div>It's not your turn.</div>}
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
        {isDaylight
          ? (
            <Voting />
          ) : (
            <Row>
              <Column sm={12} md={6}>
                <Header h={2}>Players</Header>
                <Players
                  players={players}
                  playersSelected={this.state.playersSelected}
                  onPlayerClick={onPlayerClick}
                />
              </Column>
              <Column sm={12} md={6}>
                <Header h={2}>Middle Cards</Header>
                <Ribbon
                  characters={[
                    { name: 'Middle Card', color: '#ACAEB0', key: 'm1', highlighted: this.state.middleCardsSelected.includes(0) },
                    { name: 'Middle Card', color: '#ACAEB0', key: 'm2', highlighted: this.state.middleCardsSelected.includes(1)  },
                    { name: 'Middle Card', color: '#ACAEB0', key: 'm3', highlighted: this.state.middleCardsSelected.includes(2)  },
                  ]}
                  idx={-1}
                  onClick={onMiddleCardClick}
                />
              </Column>
            </Row>
        )}
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

  pauseGame = () => {
    this.props.client.send(JSON.stringify({
      action: WebSocketAction.PAUSE_GAME,
    }));
  };

  resumeGame = () => {
    this.props.client.send(JSON.stringify({
      action: WebSocketAction.RESUME_GAME,
    }));
  };

  cancelGame = () => {
    this.props.client.send(JSON.stringify({
      action: WebSocketAction.CANCEL_GAME,
    }));
  };

  render() {
    const {
      gameResults,
      gameState: {
        paused,
      },
    } = this.props;
    let jsx = this.getGameBody();
    return (
      <>
        {jsx}
        {!gameResults &&
          <div className={style.GameButtons}>
            <Button onClick={paused ? this.resumeGame : this.pauseGame}>{paused ? 'Resume' : 'Pause'} Game</Button>
            <Button onClick={this.cancelGame}>Cancel Game</Button>
          </div>
        }
      </>
    )
  }
}

export default connect(state => state)(Game);
