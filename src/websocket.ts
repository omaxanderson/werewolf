import WebSocket from "ws";
import * as http from "http";
import parseUrl from "./util/parseUrl";

interface MyWebSocket extends WebSocket {
  roomId: string;
  name: string;
  color: string;
}

export enum WebSocketAction {
  MESSAGE,
  PLAYER_JOINED,
  LIST_PLAYERS,
  SET_COLOR,
  SET_NAME,
}

export interface WebSocketMessage {
  action: WebSocketAction;
  message: string;
  messageId: string;
  broadcast?: boolean;
}

const getClientsInRoom = (wss: WebSocket.Server, roomId: string) => {
  const clients: MyWebSocket[] = [];
  wss.clients.forEach((client: MyWebSocket) => {
    if (client.roomId === roomId) {
      clients.push(client);
    }
  });
  return clients;
};

/**
 * Web Socket setup
 */
export default (server) => {
  const webSocketServer = new WebSocket.Server({server});
  webSocketServer.on('connection', (webSocket: WebSocket, req: http.IncomingMessage) => {
    // Have to manually re-type this
    const ws = webSocket as MyWebSocket;
    const {query: {id, name}} = parseUrl(req);
    if (!Array.isArray(id)) {
      ws.roomId = id;
    }
    if (!Array.isArray(name)) {
      ws.name = name;
    }
    ws.on('message', (json: string) => {
      console.log(json);
      const m: WebSocketMessage = JSON.parse(json);
      if (m.broadcast) {
        webSocketServer.clients
          .forEach((client: MyWebSocket) => {
            if (client != ws && client.roomId === ws.roomId) {
              client.send(JSON.stringify({
                message: m.messageId,
                broadcast: true,
              }));
            }
          });
      } else {
        ws.send(JSON.stringify({
          message: `hello you sent: ${m.message}`,
          messageId: m.messageId,
        }));
      }
    });

    // notify room members of a new join
    const clientsInRoom = getClientsInRoom(webSocketServer, ws.roomId);
    const simplifiedClients = clientsInRoom.map((client: MyWebSocket) => ({
      name: client.name,
      color: client.color,
    }));
    clientsInRoom.forEach(client => client.send(JSON.stringify({
      action: WebSocketAction.PLAYER_JOINED,
      players: simplifiedClients,
    })));
    ws.send(JSON.stringify({
      action: WebSocketAction.LIST_PLAYERS,
      players: simplifiedClients,
    }));
  });
};
