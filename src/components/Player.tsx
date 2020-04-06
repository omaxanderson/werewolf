import React from 'react';
import classNames from 'classnames';
import style from './Player.scss';
import { IPlayer } from './Interfaces';

export default class Player extends React.PureComponent<{
  player: IPlayer;
  onPlayerClick?: (IPlayer) => void;
  highlighted: boolean;
  size: 'sm' | 'md' | 'lg';
}, {}> {
  render() {
    const {
      player,
      onPlayerClick,
      highlighted,
      size = 'sm',
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
          [style.Player__Small]: size === 'sm',
          [style.Player__Medium]: size === 'md',
          [style.Player__Large]: size === 'lg',
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
