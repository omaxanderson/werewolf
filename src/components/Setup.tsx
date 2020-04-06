import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { connect } from 'react-redux';
import C, { Character, Team } from './Characters';
import { ReduxAction, Store } from './Interfaces';
import {
  TextInput,
  Row,
  Column,
  Button,
  Checkbox,
  Header,
} from '@omaxwellanderson/react-components';

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

  changeTimePerCharacter = (e, value) => {
    if (value !== '' && isNaN(parseInt(value))) {
      return;
    }
    this.setState({ timePerCharacter: value });
  };

  changeTimeToConference = (e, value) => {
    if (value !== '' && this.parseTime(value) === 0) {
      return;
    }
    this.setState({ timeToConference: value });
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

  onCharacterChange = (checked, e) => {
    const {
      value,
    } = e.target;
    console.log('value', value);
    console.log(e);
    const characters = cloneDeep(this.state.characters);
    if (checked) {
      characters.push(C.find(c => c.key === value));
    } else {
      characters.splice(characters.findIndex(c => c.key === value), 1);
    }
    this.setState({ characters });
  };

  startGame = () => {
    const message = this.validate();
    if (typeof message === 'string') {
      alert(`Error: ${message}`);
      return;
    }
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
    const [ werewolfTeam, selfTeam, villagerTeam ] = [
      C.filter(c => [Team.WEREWOLF, Team.WEREWOLF_ALLY].includes(c.team)),
      C.filter(c => [Team.SELF, Team.UNKNOWN].includes(c.team)),
      C.filter(c => [Team.VILLAGER].includes(c.team)),
    ];
    return (
      <>
        <Row>
          <Column sm={12}>
            Room Members:
          </Column>
          <Column sm={12}>
            {players.map(p => <div key={p.playerId}>{p.name}</div>)}
          </Column>
        </Row>
        <br />
        <Row>
          <Column md={6} sm={12}>
            <TextInput
              label="Seconds per Character"
              onChange={this.changeTimePerCharacter}
              value={timePerCharacter}
            />
          </Column>
          <Column md={6} sm={12}>
            <TextInput
              label="Time to Conference"
              onChange={this.changeTimeToConference}
              value={timeToConference}
            />
          </Column>
        </Row>
        <Row>
          <Column sm={12}>
            Play <strong>{this.getNumPlayers()}</strong>
          </Column>
        </Row>
        <Row>
          <Column sm={12} md={4}>
            <Header h={3}>Werewolves</Header>
            {werewolfTeam.map(c => (
              <div
                style={{ marginBottom: '8px' }}
                key={`checkbox_${c.key}`}
              >
                <Checkbox
                  key={`cbox_${c.key}`}
                  label={c.name}
                  value={c.key}
                  onChange={this.onCharacterChange}
                />
              </div>
            ))}
          </Column>
          <Column sm={12} md={4}>
            <Header h={3}>Villagers</Header>
            {villagerTeam.map(c => (
              <div
                style={{ marginBottom: '8px' }}
                key={`checkbox_${c.key}`}
              >
                <Checkbox
                  label={c.name}
                  value={c.key}
                  onChange={this.onCharacterChange}
                />
              </div>
            ))}
          </Column>
          <Column sm={12} md={4}>
            <Header h={3}>Other</Header>
            {selfTeam.map(c => (
              <div
                style={{ marginBottom: '8px' }}
                key={`checkbox_${c.key}`}
              >
                <Checkbox
                  key={`cbox_${c.key}`}
                  label={c.name}
                  value={c.key}
                  onChange={this.onCharacterChange}
                />
              </div>
            ))}
          </Column>
        </Row>
        <div>
          <Button onClick={this.startGame} disabled={!this.hasRightNumberPlayers()}>Start Game</Button>
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
