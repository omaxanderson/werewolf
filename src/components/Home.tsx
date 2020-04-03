import React from 'react';
import ReactDOM from 'react-dom';
import shortId from '../util/shortId';
import * as WebSocket from 'websocket';
import cloneDeep from 'lodash/cloneDeep';
import {WebSocketAction} from "../websocket";

const WebSocketClient = WebSocket.w3cwebsocket;

declare global {
  interface Window {
    roomId: string;
  }
}

interface Player {
  name: string;
  color?: string;
}

interface Room {
  players: Player[];
}

export class Home extends React.Component<{}, {
  roomId: string;
  name: string;
  joined: boolean;
  client: WebSocket.w3cwebsocket;
  room: Room;
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
    }
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
        }
        console.log('message received:', m.data);
      }
    };
    this.setState({ client });
  };

  onNameChange = (e) => {
    this.setState({name: e.target.value});
  };

  createNewGame = () => {
    const roomId = shortId();
    this.setState({ roomId }, () => window.history.pushState({}, '', roomId));
  };

  joinGame = () => {
    this.connectToWebsocket();
    this.setState({ joined: true });
  };

  render() {
    const {
      name,
      roomId,
      joined,
      room,
    } = this.state;
    return (
      <div>
        <div>
          <label htmlFor="name">Name</label>
          <input type="text" name="name" onChange={this.onNameChange} />
        </div>
        {!joined ? (
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
        ) : (
          <>
            <div>
              Room Members
            </div>
            <div>
              {room.players.map(player => <div>{player.name}</div>)}
            </div>
          </>
        )}
      </div>
    )
  }
}

ReactDOM.render(
    <Home />,
    document.getElementById('root'),
);
