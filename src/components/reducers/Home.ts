import { DispatchObject, Store, ReduxAction } from '../Interfaces';
import { WebSocketAction } from '../../IWebsocket';

const initialState = {
  gameState: null,
  gameOptions: null,
  roomId: null,
  players: [],
  client: null,
  name: null,
  dispatch: (obj: DispatchObject) => console.log('bad things happened'),
};

export default (state: Store = initialState, action) => {
  const {
    payload,
    type,
  } = action;
  switch (type) {
    case ReduxAction.UPDATE_GAME_STATE:
      console.log('setting game state');
      return {
        ...state,
        gameState: payload.gameState,
      };
    case ReduxAction.SET_ROOM_ID:
      return {
        ...state,
        roomId: payload,
      };
    case ReduxAction.UPDATE_GAME_OPTIONS:
      return {
        ...state,
        gameOptions: payload,
      };
    case ReduxAction.LIST_PLAYERS:
      return {
        ...state,
        players: payload,
      };
    case ReduxAction.SET_WS_CLIENT:
      console.log('client payload', payload);
      return {
        ...state,
        client: payload,
      };
    case ReduxAction.SET_NAME:
      return {
        ...state,
        name: payload,
      };
    case ReduxAction.START_GAME:
      // send the websocket message
      console.log('starting game', payload);
      state.client.send(JSON.stringify({
        config: payload,
        action: WebSocketAction.START_GAME,
      }));
      break;
    case ReduxAction.GAME_IS_STARTING:
      return {
        ...state,
        gameOptions: payload.gameOptions,
        gameState: payload.gameState,
      };
    default:
      return state;
  }
}
