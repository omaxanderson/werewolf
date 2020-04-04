import React from 'react';
import style from './Player.scss';
import { IPlayer } from './Interfaces';

export default class Player extends React.PureComponent<{
  player: IPlayer;
  onPlayerClick?: (IPlayer) => void;
}, {}> {
  render() {
    const {
      player,
      onPlayerClick,
    } = this.props;
    const {
      color,
      name,
    } = player;
    /* <div style={{ height: '100px', width: '100px', backgroundColor: color }}> */
    return (
      <div
        onClick={() => onPlayerClick(player)}
        className={style.Player}
        style={{ backgroundColor: color }}
      >
        <div className={style.Overlay}>
          {name}
        </div>
      </div>
    );
  }
}
