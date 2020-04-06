import React from 'react';
import style from './Modal.scss';

export default class Modal extends React.Component<{
  header: string;
  onSubmit: Function;
  onClose: Function;
  submitLabel?: string;
  closeLabel?: string;
}, {}> {
  render() {
    const {
      header,
      onSubmit,
      onClose,
      submitLabel,
      closeLabel,
    } = this.props;
    console.log(style);
    return (
      <div className={style.Modal__Container}>
        <div className={style.Modal}>
          <div className={style.Modal__Header}>
            <h2 className={style.Modal__HeaderText}>{header}</h2>
            <button className={style.Modal__HeaderClose}>X</button>
          </div>

          <div className={style.Modal__Body}>

          </div>

          <div className={style.Modal__Footer}>
            <button className={style.Modal__Button}>Click Me!</button>
          </div>
        </div>
      </div>
    );
  }
}

