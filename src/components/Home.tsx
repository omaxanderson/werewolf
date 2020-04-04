import React from 'react';
import ReactDOM from 'react-dom';
import shortId from '../util/shortId';
import * as WebSocket from 'websocket';
import cloneDeep from 'lodash/cloneDeep';
import { WebSocketAction } from '../IWebsocket';
import Setup from './Setup';
import Game from './Game';
import { GameOptions } from './Interfaces';
import { Room } from './Interfaces';

const WebSocketClient = WebSocket.w3cwebsocket;

declare global {
  interface Window {
    roomId: string;
  }
}

export class Home extends React.Component <{}, {
  roomId: string;
  name: string;
  joined: boolean;
  client: WebSocket.w3cwebsocket;
  room: Room;
  gameOptions: GameOptions,
}> {
  constructor(props) {
    super(props);

    const roomId = window.location.pathname.slice(1);
    this.state = {
      roomId: roomId || '',
      name: '',
      joined: false,
      client: null,
      room: {
        players: [],
      },
      gameOptions: null,
    }
  }

  // debugging purposes, delete before use
  componentDidMount()
    :
    void {
    this.setState({ name: 'max' }, () => {
      this.connectToWebsocket();
      this.setState({ joined: true });
    });
  }

  connectToWebsocket = (): void => {
    const {
      name,
      roomId,
    } = this.state;
    const client = new WebSocketClient(`ws://localhost:3000?id=${roomId}&name=${name}`, 'echo-protocol');
    client.onerror = (e) => console.error(e);
    client.onopen = () => console.log('connected to websocket');
    client.onclose = () => console.log('closed');
    client.onmessage = (json: WebSocket.IMessageEvent) => {
      if (typeof json.data === 'string') {
        const m = JSON.parse(json.data);
        switch (m.action) {
          case WebSocketAction.PLAYER_JOINED:
          case WebSocketAction.LIST_PLAYERS:
            const room = cloneDeep(this.state.room);
            room.players = m.players;
            this.setState({ room });
            break;
          case WebSocketAction.START_GAME:
            this.setState({ gameOptions: m.config });
            break;
          default:
            console.log('unhandled message received: ', m);
        }
      }
    };
    this.setState({ client });
  };

  onNameChange = (e) => {
    this.setState({ name: e.target.value });
  };

  createNewGame = () => {
    const roomId = shortId();
    this.setState({ roomId }, () => window.history.pushState({}, '', roomId));
  };

  joinGame = () => {
    this.connectToWebsocket();
    this.setState({ joined: true });
  };

  sendWebSocketMessage = (message: {
    action: WebSocketAction;
    message?: any;
    config?: GameOptions;
  }) => {
    const { client } = this.state;
    const messageId = shortId();
    client.send(JSON.stringify({
      ...message,
      messageId,
    }))
  };

  onGameStart = (gameOptions: GameOptions) => {
    console.log('ga', gameOptions);
    this.setState({ gameOptions }, () => this.sendWebSocketMessage({
      action: WebSocketAction.START_GAME,
      config: gameOptions,
    }));
  };

  getBody = () => {
    const {
      joined,
      gameOptions,
      client,
      room,
      roomId,
    } = this.state;
    if (gameOptions) {
      return <Game options={gameOptions} room={room} />;
    } else if (joined) {
      return (<Setup
          room={room}
          client={client}
          onGameStart={this.onGameStart}
        />
      );
    }
    return (
      <>
        <div>
          <button
            onClick={roomId ? this.joinGame : this.createNewGame}
            disabled={!name}
          >
            {roomId ? 'Join' : 'Create'} Game
          </button>
        </div>
      </>
    )
  };

  render() {
    return (
      <div>
        <div>
          <label htmlFor="name">Name</label>
          <input type="text" name="name" onChange={this.onNameChange}/>
        </div>
        {this.getBody()}
      </div>
    )
  }
}

ReactDOM.render(
  <Home/>,
  document.getElementById('root'),
);
