import React from 'react';
import * as WebSocket from 'websocket';
import cloneDeep from 'lodash/cloneDeep';
import { Room } from "./Home";
import C, { Character, Team } from './Characters';

export default class Setup extends React.Component<{
  room: Room;
  client: WebSocket.w3cwebsocket;
}, {
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
    this.setState({ timePerCharacter: e.target.value });
  };

  changeTimeToConference = (e) => {
    this.setState({ timeToConference: e.target.value });
  };

  overCharacterLimit = () => {
    const numPlayers = this.props.room?.players?.length;
    return (this.state.characters.length + 3) > numPlayers;
  };

  validateCharacters = (): string | boolean => {
    const {
      characters,
    } = this.state;
    console.log(this.getNumPlayers());
    console.log(this.props.room.players.length);
    if (!this.hasRightNumberPlayers()) {
      return 'Incorrect number of characters';
    }
    if (!characters.some(c => c.team === Team.WEREWOLF)) {
      return 'No Werewolves';
    }
    if (!characters.some(c => c.team === Team.VILLAGER)) {
      return 'No Villagers';
    }
    return false;
  };

  hasRightNumberPlayers = () => this.getNumPlayers() === this.props.room.players.length;

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
    const message = this.validateCharacters();
    if (typeof message === 'string') {
      alert(`Error: ${message}`);
    }
    console.log('starting game');
  };

  render() {
    // cards, time per character, time to confer
    const {
      room,
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
          {room.players.map(p => <div>{p.name}</div>)}
        </div>
        <br />
        <div>
          <label htmlFor="characterTime">Time per Character: </label>
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
