import React from 'react';
import { connect } from 'react-redux';
import C, { Character, Team } from './Characters';
import { ReduxAction, Store } from './Interfaces';
import { Button, Checkbox, Column, Header, Row, TextInput, } from '@omaxwellanderson/react-components';
import Players from './Players';
import { WebSocketAction } from '../IWebsocket';

class Setup extends React.Component<Store & { onGameStart }, {
  timePerCharacter: string;
  timeToConference: string;
  characters: Character[];
}> {
  constructor(props) {
    super(props);
  }

  changeTimePerCharacter = (e, value) => {
    if (value !== '' && isNaN(parseInt(value))) {
      return;
    }
    const { gameOptions } = this.props;
    const newGameOptions = {
      ...gameOptions,
      secondsPerCharacter: this.parseTime(value),
    };
    this.props.dispatch({
      type: ReduxAction.UPDATE_GAME_OPTIONS,
      payload: newGameOptions,
    });
    this.props.client.send(JSON.stringify({
      action: WebSocketAction.UPDATE_GAME_CONFIG,
      config: newGameOptions,
    }))
  };

  changeTimeToConference = (e, value) => {
    if (value !== '' && this.parseTime(value) === 0) {
      return;
    }
    const { gameOptions } = this.props;
    const newGameOptions = {
      ...gameOptions,
      secondsToConference: this.parseTime(value),
    };
    this.props.dispatch({
      type: ReduxAction.UPDATE_GAME_OPTIONS,
      payload: newGameOptions,
    });
    this.props.client.send(JSON.stringify({
      action: WebSocketAction.UPDATE_GAME_CONFIG,
      config: newGameOptions,
    }));
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

  secondsToTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const leftoverSeconds = seconds % 60;
    return `${minutes}:${leftoverSeconds.toString().padStart(2, '0')}`;
  };

  validate = (): string | boolean => {
    const {
      characters,
    } = this.props.gameOptions;
    if (!this.hasRightNumberPlayers()) {
      return 'Incorrect number of characters';
    }
    if (!characters.some(c => c.team === Team.WEREWOLF)) {
      return 'No Werewolves';
    }
    if (!characters.some(c => c.team === Team.VILLAGER)) {
      return 'No Villagers';
    }
    /*
    if (!this.parseTime(this.props.gameOptions.secondsToConference)) {
      return 'Invalid time to conference';
    }

    if (!this.parseTime(this.state.timePerCharacter)) {
      return 'Invalid time per character';
    }
     */
    return false;
  };

  hasRightNumberPlayers = () => this.getNumPlayers() === this.props.players.length;

  getNumPlayers = () => this.props.gameOptions?.characters?.length <= 3
    ? 0
    : this.props.gameOptions?.characters?.length - 3;

  onCharacterChange = (checked, e) => {
    const {
      value,
    } = e.target;
    const { gameOptions } = this.props;
    const { characters = [] } = gameOptions;
    if (checked) {
      characters.push(C.find(c => c.key === value));
    } else {
      characters.splice(characters.findIndex(c => c.key === value), 1);
    }
    const newGameOptions = {
      ...gameOptions,
      characters,
    };
    this.props.dispatch({
      type: ReduxAction.UPDATE_GAME_OPTIONS,
      payload: newGameOptions,
    });
    this.props.client.send(JSON.stringify({
      action: WebSocketAction.UPDATE_GAME_CONFIG,
      config: newGameOptions,
    }));
  };

  startGame = () => {
    const message = this.validate();
    if (typeof message === 'string') {
      alert(`Error: ${message}`);
      return;
    }
    const {
      characters,
      secondsToConference,
      secondsPerCharacter,
    } = this.props.gameOptions;
    this.props.dispatch({
      type: ReduxAction.START_GAME,
      payload: {
        characters,
        secondsToConference,
        secondsPerCharacter,
      },
    });
  };

  render() {
    // cards, time per character, time to confer
    const {
      players,
      gameOptions: {
        characters,
        secondsPerCharacter,
        secondsToConference,
      },
    } = this.props;
    const [ werewolfTeam, selfTeam, villagerTeam ] = [
      C.filter(c => [Team.WEREWOLF, Team.WEREWOLF_ALLY].includes(c.team)),
      C.filter(c => [Team.SELF, Team.UNKNOWN].includes(c.team)),
      C.filter(c => [Team.VILLAGER].includes(c.team)),
    ];
    const testFunc = (character) => Boolean(characters.find(c => c.key === character.key));
    return (
      <>
        <Row>
          <Column sm={12}>
            <h3 style={{ marginBottom: '0px', marginTop: '0px' }}>
              In the Game
            </h3>
          </Column>
          <Column sm={12}>
            <Players
              size="sm"
              players={players}
            />
          </Column>
        </Row>
        <Row>
          <Column md={6} sm={12}>
            <TextInput
              label="Seconds per Character"
              onChange={this.changeTimePerCharacter}
              value={secondsPerCharacter}
            />
          </Column>
          <Column md={6} sm={12}>
            <TextInput
              label="Time to Conference"
              onChange={this.changeTimeToConference}
              value={this.secondsToTime(secondsToConference)}
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
                  checked={testFunc(c)}
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
                  checked={testFunc(c)}
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
                  checked={testFunc(c)}
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
          <Button
            onClick={this.startGame}
            disabled={!this.hasRightNumberPlayers()}
            type="primary"
          >
            Start Game
          </Button>
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
