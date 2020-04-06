import React from 'react';
import style from './Game.scss';
import Player from './Player';
import { IPlayer } from './Interfaces';

export default class Players extends React.Component<{
  players: IPlayer[];
  playersSelected?: IPlayer[];
  onPlayerClick?: (IPlayer) => void;
  size?: 'sm' | 'md' | 'lg';
}, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      players,
      playersSelected,
      onPlayerClick = () => {},
      size = 'sm',
    } = this.props;
    return (
      <div className={style.PlayerContainer}>
        {players.map(player => (
          <Player
            key={`player_${player.playerId}`}
            player={player}
            onPlayerClick={onPlayerClick}
            highlighted={playersSelected?.some(p => p.playerId === player.playerId)}
            size={size}
          />
        ))}
      </div>
    );
  }
}
