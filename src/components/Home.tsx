import React from 'react';
import ReactDOM from 'react-dom';
import shortId from '../util/shortId';
// import { client as WebSocketClient } from 'websocket';
import * as WebSocket from 'websocket';
const WebSocketClient = WebSocket.w3cwebsocket;
console.log(WebSocketClient);

declare global {
  interface Window {
    roomId: string;
  }
}

export interface HelloProps {
    compiler: string; framework: string;
}

export class Home extends React.Component<{}, {
  roomId: string;
}> {
  constructor(props) {
    super(props);
    this.state = {
      roomId: window.roomId || '',
    }
  }

  connectToWebsocket = (): void => {
    const client = new WebSocketClient(`ws://localhost:3000?id=${this.state.roomId}`, 'echo-protocol');
    client.onerror = (e) => console.error(e);
    client.onopen = () => {
      console.log('ws started');
      client.send('hello from client!');
    };
    client.onclose = () => console.log('closed');
    client.onmessage = (message) => {
      if (typeof message.data === 'string') {
        console.log('message received:', message.data);
      }
    }
  };

  componentDidMount(): void {
    if (this.state.roomId) {
      this.connectToWebsocket();
    }
  }

  render() {
    return (
      <div>
          <button onClick={() => window.location.href = shortId()}>Create Game</button>
      </div>
    )
  }
}

ReactDOM.render(
    <Home />,
    document.getElementById('root'),
);
