import React from 'react';
import style from './Player.scss';
import { IPlayer } from './Interfaces';

export default class Player extends React.PureComponent<{
  player: IPlayer;
  onPlayerClick?: () => void;
}, {}> {
  render() {
    const {
      player: { color, name },
      onPlayerClick,
    } = this.props;
    console.log('style', style);
    /* <div style={{ height: '100px', width: '100px', backgroundColor: color }}> */
    return (
      <div
        onClick={() => onPlayerClick()}
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
