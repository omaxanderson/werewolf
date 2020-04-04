import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { connect } from 'react-redux';
import C, { Character, Team } from './Characters';
import { ReduxAction, Store } from './Interfaces';

class Setup extends React.Component<Store & { onGameStart }, {
  timePerCharacter: string;
  timeToConference: string;
  characters: Character[];
}> {
  constructor(props) {
    super(props);

    this.state = {
      timePerCharacter: '',
      timeToConference: '',
      characters: [],
    };
  }

  changeTimePerCharacter = (e) => {
    const { value } = e.target;
    if (value !== '' && isNaN(parseInt(value))) {
      return;
    }
    this.setState({ timePerCharacter: value });
  };

  changeTimeToConference = (e) => {
    const { value } = e.target;
    if (value !== '' && this.parseTime(value) === 0) {
      return;
    }
    this.setState({ timeToConference: e.target.value });
  };

  parseTime = (time: string): number => {
    const regex = /^[\d]{1,2}:[\d]{0,2}$/;
    if (!regex.test(time) && isNaN(parseInt(time))) {
      return 0;
    }
    if (/^[\d]{1,2}:[\d]{2}$/.test(time)) {
      const [minutes, seconds] = time.split(':');
      return parseInt(seconds) + (60 * parseInt(minutes));
    }
    return parseInt(time);
  };

  validate = (): string | boolean => {
    const {
      characters,
    } = this.state;
    if (!this.hasRightNumberPlayers()) {
      return 'Incorrect number of characters';
    }
    if (!characters.some(c => c.team === Team.WEREWOLF)) {
      return 'No Werewolves';
    }
    if (!characters.some(c => c.team === Team.VILLAGER)) {
      return 'No Villagers';
    }
    if (!this.parseTime(this.state.timeToConference)) {
      return 'Invalid time to conference';
    }
    if (!this.parseTime(this.state.timePerCharacter)) {
      return 'Invalid time per character';
    }
    return false;
  };

  hasRightNumberPlayers = () => this.getNumPlayers() === this.props.players.length;

  getNumPlayers = () => this.state.characters.length <= 3 ? 0 : this.state.characters.length - 3;

  onCharacterChange = (e) => {
    const {
      value,
      checked,
    } = e.target;
    const characters = cloneDeep(this.state.characters);
    if (checked) {
      characters.push(C.find(c => c.name === value));
    } else {
      characters.splice(characters.findIndex(c => c.name === value), 1);
    }
    this.setState({ characters });
  };

  startGame = () => {
    const message = this.validate();
    if (typeof message === 'string') {
      alert(`Error: ${message}`);
      return;
    }
    // const { onGameStart } = this.props;
    // const { client } = this.props;
    const {
      characters,
      timeToConference,
      timePerCharacter,
    } = this.state;
    this.props.dispatch({
      type: ReduxAction.START_GAME,
      payload: {
        characters,
        secondsToConference: this.parseTime(timeToConference),
        secondsPerCharacter: this.parseTime(timePerCharacter),
      },
    });
    /*
    client.send(JSON.stringify({
      characters,
      secondsToConference: this.parseTime(timeToConference),
      secondsPerCharacter: this.parseTime(timePerCharacter),
    }));
     */
    /*
    onGameStart({
      characters,
      secondsToConference: this.parseTime(timeToConference),
      secondsPerCharacter: this.parseTime(timePerCharacter),
    });
     */
  };

  render() {
    // cards, time per character, time to confer
    const {
      players
    } = this.props;
    const {
      timePerCharacter,
      timeToConference,
    } = this.state;
    return (
      <>
        <div>
          Room Members:
        </div>
        <div>
          {players.map(p => <div>{p.name}</div>)}
        </div>
        <br />
        <div>
          <label htmlFor="characterTime">Seconds per Character: </label>
          <input type="text" name="characterTime" onChange={this.changeTimePerCharacter} value={timePerCharacter} />
        </div>
        <div>
          <label htmlFor="characterTime">Time to Conference: </label>
          <input type="text" name="characterTime" onChange={this.changeTimeToConference} value={timeToConference} />
        </div>
        <div>
          {C.map(c => (
            <>
              <input type="checkbox" id={c.key} onChange={this.onCharacterChange} value={c.name} />
              <label htmlFor={c.key}>{c.name}</label>
              <br />
            </>
          ))}
        </div>
        <div>
          Play <strong>{this.getNumPlayers()}</strong>
        </div>
        <div>
          <button onClick={this.startGame} disabled={!this.hasRightNumberPlayers()}>Start Game</button>
        </div>
      </>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    ...state,
    ...ownProps,
  };
}

export default connect(mapStateToProps)(Setup);
