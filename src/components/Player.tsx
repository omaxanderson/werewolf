import React from 'react';
import classNames from 'classnames';
import style from './Player.scss';
import { IPlayer } from './Interfaces';

export default class Player extends React.PureComponent<{
  player: IPlayer;
  onPlayerClick?: (IPlayer) => void;
  highlighted: boolean;
}, {}> {
  render() {
    const {
      player,
      onPlayerClick,
      highlighted,
    } = this.props;
    const {
      color,
      name,
    } = player;
    return (
      <div
        onClick={() => onPlayerClick(player)}
        className={classNames(style.Player, {
          [style.Player__Highlighted]: highlighted,
        })}
        style={{ backgroundColor: color }}
      >
        <div className={style.Overlay}>
          {name}
        </div>
      </div>
    );
  }
}
