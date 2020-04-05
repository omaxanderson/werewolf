import React from 'react';
import ReactDOM from 'react-dom';
import shortId from '../util/shortId';
import * as WebSocket from 'websocket';
import { connect, Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { WebSocketAction } from '../IWebsocket';
import Setup from './Setup';
import Game from './Game';
import { DispatchObject, GameOptions, ReduxAction, Store, } from './Interfaces';
import reducer from './reducers/Home';

'./Interfaces';

const WebSocketClient = WebSocket.w3cwebsocket;

declare global {
  interface Window {
    roomId: string;
  }
}

export class Home extends React.Component<Store & {
  dispatch: (obj: DispatchObject) => void;
}, {
  joined: boolean;
}> {
  constructor(props) {
    super(props);

    const roomId = window.location.pathname.slice(1);
    this.state = {
      joined: false,
    }
  }

  // debugging purposes, delete before use
  componentDidMount(): void {
    const roomId = window.location.pathname.slice(1);
    if (roomId) {
      this.props.dispatch({
        type: ReduxAction.SET_ROOM_ID,
        payload: roomId,
      });
    }
  }

  connectToWebsocket = (): void => {
    const {
      name,
      roomId,
    } = this.props;
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
            this.props.dispatch({
              type: ReduxAction.LIST_PLAYERS,
              payload: m.players,
            });
            break;
          case WebSocketAction.SEND_PLAYER_ID:
            this.props.dispatch({
              type: ReduxAction.SET_PLAYER_ID,
              payload: m.playerId,
            });
            break;
          case WebSocketAction.START_GAME:
            this.props.dispatch({
              type: ReduxAction.GAME_IS_STARTING,
              payload: m,
            });
            break;
          case WebSocketAction.NEXT_CHARACTER:
            this.props.dispatch({
              type: ReduxAction.UPDATE_GAME_STATE,
              payload: m,
            });
            break;
          default:
            console.log('unhandled message received: ', m);
        }
      }
    };
    this.props.dispatch({
      type: ReduxAction.SET_WS_CLIENT,
      payload: client,
    });
  };

  onNameChange = (e) => {
    // this.setState({ name: e.target.value });
    this.props.dispatch({
      type: ReduxAction.SET_NAME,
      payload: e.target.value,
    })
  };

  createNewGame = () => {
    const roomId = shortId();
    // this.setState({ roomId }, () => window.history.pushState({}, '', roomId));
    window.history.pushState({}, '', roomId);
    this.props.dispatch({
      type: ReduxAction.SET_ROOM_ID,
      payload: roomId,
    })
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
    const { client } = this.props;
    const messageId = shortId();
    client.send(JSON.stringify({
      ...message,
      messageId,
    }))
  };

  getBody = () => {
    const {
      gameOptions,
      roomId,
      name,
      client,
    } = this.props;

    if (gameOptions) {
      return <Game />;
    } else if (client) {
      return (<Setup />
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
    const { client } = this.props;
    return (
      <div>
        {!client &&
          <div>
              <label htmlFor="name">Name</label>
              <input type="text" name="name" onChange={this.onNameChange}/>
          </div>
        }
        {this.getBody()}
      </div>
    )
  }
}

const store = createStore(reducer, composeWithDevTools(applyMiddleware()));
const HomeWithStore = connect(state => state)(Home);
const ReduxWrapper = (
  <Provider store={store}>
    <HomeWithStore />
  </Provider>
);

ReactDOM.render(
  ReduxWrapper,
  document.getElementById('root'),
);
