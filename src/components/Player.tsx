import React from 'react';
import style from './Player.scss';

export default class Player extends React.PureComponent<{
  name: string;
  color: string;
}, {}> {
  render() {
    const {
      color,
      name,
    } = this.props;
    console.log('style', style);
    /* <div style={{ height: '100px', width: '100px', backgroundColor: color }}> */
    return (
      <div className={style.Player} style={{ backgroundColor: color }}>
        <div className={style.Overlay}>
          {name}
        </div>
      </div>
    );
  }
}
