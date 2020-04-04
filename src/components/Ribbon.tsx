import React from 'react';
import { Character } from './Characters';
import style from './Ribbon.scss';

class Ribbon extends React.Component<{
  characters: Character[];
  idx: number;
}, {}> {
  render() {
    const { characters, idx } = this.props;
    return (
      <div className={style.RibbonContainer}>
        {characters.map((c, i) => {
          const className = i === idx
            ? style['RibbonItem--active']
            : style.RibbonItem;
          return (
            <div className={className} style={{ backgroundColor: c.color }}>
              {c.name}
            </div>
          )
        })}
      </div>
    );
  }
}

export default Ribbon;
