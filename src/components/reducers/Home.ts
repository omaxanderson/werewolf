import { DispatchObject, Store, ReduxAction } from '../Interfaces';
import { WebSocketAction } from '../../IWebsocket';

const initialState = {
  gameState: null,
  gameOptions: null,
  roomId: null,
  players: [],
  client: null,
  name: null,
  extraInfo: null,
  playerId: null,
  actionResult: null,
  gameResults: null,
  dispatch: (obj: DispatchObject) => console.log('bad things happened'),
};

export default (state: Store = initialState, action) => {
  const {
    payload,
    type,
  } = action;
  switch (type) {
    case ReduxAction.UPDATE_GAME_STATE:
      return {
        ...state,
        gameState: payload.gameState,
        extraInfo: payload.extraInfo || state.extraInfo,
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
    case ReduxAction.SET_PLAYER_ID:
      return {
        ...state,
        playerId: payload,
      };
    case ReduxAction.LIST_PLAYERS:
      return {
        ...state,
        players: payload,
      };
    case ReduxAction.SET_WS_CLIENT:
      return {
        ...state,
        client: payload,
      };
    case ReduxAction.SET_NAME:
      return {
        ...state,
        name: payload,
      };
    case ReduxAction.GAME_IS_STARTING:
      return {
        ...state,
        gameOptions: payload.gameOptions,
        gameState: payload.gameState,
      };
    case ReduxAction.SAVE_ACTION_RESULT:
      return {
        ...state,
        actionResult: payload,
        extraInfo: payload.info || state.extraInfo,
      };
    case ReduxAction.GAME_END:
      return {
        ...state,
        gameResults: payload.results,
      };
    case ReduxAction.GO_TO_SETUP:
      return {
        ...state,
        gameResults: null,
        gameState: null,
        gameOptions: null,
        extraInfo: null,
        actionResult: null,
      };
    case ReduxAction.UPDATE_STARTING_CHARACTER:
      // need to be careful with this...
      if (state.gameOptions?.startingCharacter?.name !== 'Doppelganger') {
        console.warn('Probably shouldnt be updating starting character...');
      }
      return {
        ...state,
        gameOptions: {
          ...state.gameOptions,
          startingCharacter: payload?.gameOptions?.startingCharacter,
        }
      };
    case ReduxAction.START_GAME:
      // send the websocket message
      console.log('starting game', payload);
      state.client.send(JSON.stringify({
        config: payload,
        action: WebSocketAction.START_GAME,
      }));
      // CAREFUL putting things below here, there's no break on the previous
      // case because we want the fallthrough
    default:
      return state;
  }
}
