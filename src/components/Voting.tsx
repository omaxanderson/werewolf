import React from 'react';
import { connect } from 'react-redux';
import {
  Modal,
} from '@omaxwellanderson/react-components';
import { IPlayer, Store } from './Interfaces';
import style from './Game.scss';
import Ribbon from './Ribbon';
import Players from './Players';
import { WebSocketAction } from '../IWebsocket';

class Voting extends React.Component<Store, {
  playerSelected: IPlayer;
  hasCastVote: IPlayer;
}> {
  private interval;
  constructor(props) {
    super(props);

    this.state = {
      playerSelected: null,
      hasCastVote: null,
    };
  }

  componentDidMount(): void {
    this.setTimerInterval();
  }

  componentWillUnmount(): void {
    this.clearTimerInterval();
  }

  setTimerInterval = () => {
    this.interval = setInterval(() => this.forceUpdate(), 1000);
  };

  clearTimerInterval = () => {
    clearInterval(this.interval);
    this.interval = null;
  };

  componentDidUpdate(prevProps: Readonly<Store>) {
    if (prevProps.gameState?.paused && this.interval) {
      this.clearTimerInterval();
    } else if (prevProps.gameState?.paused && !this.props.gameState?.paused) {
      this.setTimerInterval();
    }
  }

  onPlayerClick = (player) => {
    this.setState({ playerSelected: player });
  };

  render() {
    const {
      gameState,
      gameOptions,
      extraInfo,
      players,
      client,
    } = this.props;
    const {
      playerSelected,
      hasCastVote,
    } = this.state;
    const isDaylight = gameState.currentIdx === gameOptions.characters.length;
    if (isDaylight) {
      const conferenceEnd = extraInfo.find(e => e.conferenceEndTime)?.conferenceEndTime;
      if (conferenceEnd) {
        // if after end, send vote
        if (playerSelected
          && (!hasCastVote || (hasCastVote.name !== playerSelected.name))
        ) {
          this.setState({ hasCastVote: this.state.playerSelected }, () => {
            client.send(JSON.stringify({
              action: WebSocketAction.CAST_VOTE,
              vote: this.state.playerSelected,
            }));
          });
        }
        const diff = Math.floor((conferenceEnd - Date.now()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = (diff % 60).toString().padStart(2, '0');

        return (
          <>
            <h3>{minutes}:{seconds} remaining</h3>
            <Players
              players={players}
              playersSelected={playerSelected
                ? [playerSelected]
                : []}
              onPlayerClick={this.onPlayerClick}
            />
          </>
        )
      }
    }
    return null;
  }
}

export default connect(state => state)(Voting);
