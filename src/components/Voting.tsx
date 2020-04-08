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
  hasCastVote: boolean;
}> {
  private interval;
  constructor(props) {
    super(props);

    this.state = {
      playerSelected: null,
      hasCastVote: false,
    };
  }

  componentDidMount(): void {
    this.interval = setInterval(() => this.forceUpdate(), 1000);
  }

  componentWillUnmount(): void {
    clearInterval(this.interval);
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
    const isDaylight = gameState.currentIdx === gameOptions.characters.length;
    if (isDaylight) {
      const conferenceEnd = extraInfo?.conferenceEndTime;
      if (conferenceEnd) {
        // if after end, send vote
        if (Date.now() > conferenceEnd
          && !this.state.hasCastVote
          && this.state.playerSelected
        ) {
          this.setState({ hasCastVote: true }, () => {
            client.send(JSON.stringify({
              action: WebSocketAction.CAST_VOTE,
              vote: this.state.playerSelected,
            }));
          });
        }
        const diff = Math.floor((conferenceEnd - Date.now()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = (diff % 60).toString().padStart(2, '0');

        const playerSelected = this.state.playerSelected
          ? [this.state.playerSelected]
          : [];
        return (
          <Modal
            size="lg"
            header="Cast Your Votes"
            footerActions={[
              {
                type: 'secondary',
                onClick: () => console.log('no'),
                label: 'Leave',
              },
            ]}
          >
            <h3>{minutes}:{seconds} remaining</h3>
            <Players
              players={players}
              playersSelected={playerSelected}
              onPlayerClick={this.onPlayerClick}
            />
          </Modal>
        )
      }
    }
    return null;
  }
}

export default connect(state => state)(Voting);
