import React from 'react';
import { Character } from './Characters';
import style from './Ribbon.scss';

type RibbonItem = Pick<
  Character,
  'color' |
  'name'
  >;

type OnClickFunc = (val: number) => void;

class Ribbon extends React.Component<{
  characters: RibbonItem[];
  idx: number;
  onClick?: OnClickFunc;
}, {}> {
  render() {
    const {
      characters,
      idx,
      onClick,
    } = this.props;
    return (
      <div className={style.RibbonContainer}>
        {characters.map((c, i) => {
          const className = i === idx
            ? style['RibbonItem--active']
            : style.RibbonItem;
          return (
            <div
              onClick={() => onClick(i)}
              className={className}
              style={{ backgroundColor: c.color }}
            >
              {c.name}
            </div>
          )
        })}
      </div>
    );
  }
}

export default Ribbon;
