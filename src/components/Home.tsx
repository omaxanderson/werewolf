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
import { ReduxAction, Store, } from './Interfaces';
import reducer from './reducers/Home';
import {
  Modal,
  TextInput,
  Button,
} from '@omaxwellanderson/react-components';

// idk how to configure webpack to not require this but this ensures
// the css from the react components are included in the bundle
require('@omaxwellanderson/react-components/dist/main.css');

const WebSocketClient = WebSocket.w3cwebsocket;

declare global {
  interface Window {
    roomId: string;
  }
}

export class Home extends React.Component<Store, {
  joined: boolean;
}> {
  constructor(props) {
    super(props);

    this.state = {
      joined: false,
    }
  }

  componentDidMount(): void {
    const roomId = window.location.pathname.slice(1);
    if (roomId) {
      this.props.dispatch({
        type: ReduxAction.SET_ROOM_ID,
        payload: roomId,
      });
    }

    if (typeof Storage !== 'undefined') {
      const name = localStorage.getItem('name');
      if (name) {
        this.props.dispatch({
          type: ReduxAction.SET_NAME,
          payload: name,
        });
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { roomId, name } = this.props;
    if (
      roomId
      && name
      && typeof Storage !== 'undefined'
      && localStorage.getItem('joined') === roomId
      && !this.state.joined
    ) {
      this.joinGame();
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
          case WebSocketAction.ACTION_RESULT:
            this.props.dispatch({
              type: ReduxAction.SAVE_ACTION_RESULT,
              payload: m,
            });
            break;
          case WebSocketAction.GAME_END:
            this.props.dispatch({
              type: ReduxAction.GAME_END,
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
    this.props.dispatch({
      type: ReduxAction.SET_NAME,
      payload: e.target.value,
    });
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('name', e.target.value);
    }
  };

  createNewGame = () => {
    const roomId = shortId();
    window.history.pushState({}, '', roomId);
    this.props.dispatch({
      type: ReduxAction.SET_ROOM_ID,
      payload: roomId,
    })
  };

  joinGame = () => {
    const { joined } = this.state;
    if (joined) {
      return;
    }
    const { roomId } = this.props;
    this.connectToWebsocket();
    this.setState({ joined: true });
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('joined', roomId);
    }
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

  leaveGame = () => window.location.href = '/';

  render() {
    const { client, name } = this.props;
    const {
      joined,
    } = this.state;
    return (
      <div>
        <div style={{ display: 'flex' }}>
          {joined && <Button onClick={this.leaveGame}>Leave Game</Button>}
        </div>
        {!client &&
          <div>
            <TextInput label="Name" onChange={this.onNameChange} />
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
