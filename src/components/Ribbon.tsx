import React from 'react';
import classnames from 'classnames';
import { Character } from './Characters';
import style from './Ribbon.scss';

type RibbonItem = Pick<
  Character,
  'color' |
  'name' |
  'key'
> & { highlighted?: boolean };

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
          const className = classnames(i === idx
            ? style['RibbonItem--active']
            : style.RibbonItem, {
            [style.RibbonItem__highlighted]: c.highlighted,
          });
          return (
            <div
              key={c.key}
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
