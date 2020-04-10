import { DispatchObject, Store, ReduxAction } from '../Interfaces';
import { WebSocketAction } from '../../IWebsocket';

const defaultGameOptions = {
  characters: [],
  // secondsToConference: 10,
  // secondsPerCharacter: 7,
  gameId: '',
  originalCharacters: [],
  startingCharacter: null,
  conferenceStart: null,
};

const initialState = {
  gameState: {
    currentIdx: -1,
  },
  gameOptions: {
    ...defaultGameOptions,
    secondsToConference: 10,
    secondsPerCharacter: 7,
  },
  roomId: null,
  players: [],
  client: null,
  name: null,
  extraInfo: [],
  playerId: null,
  actionResult: [],
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
      const e = [...state.extraInfo];
      if (payload.extraInfo) {
        e.push(payload.extraInfo);
      }
      return {
        ...state,
        gameState: payload.gameState,
        extraInfo: e,
      };
    case ReduxAction.SET_ROOM_ID:
      return {
        ...state,
        roomId: payload,
      };
    case ReduxAction.UPDATE_GAME_OPTIONS:
      console.log('updating state');
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
      const {
        actionResult,
        extraInfo,
      } = state;
      const newActionResult = [...actionResult, payload];
      let newExtraInfo = [...extraInfo];
      if (payload.info) {
        newExtraInfo.push(payload.info);
      }
      return {
        ...state,
        actionResult: newActionResult,
        extraInfo: newExtraInfo,
      };
    case ReduxAction.GAME_END:
      return {
        ...state,
        gameResults: payload.results,
      };
    case ReduxAction.GO_TO_SETUP:
      // todo this might need to be fixed
      return {
        ...state,
        gameResults: null,
        gameState: {},
        gameOptions: {
          ...state.gameOptions,
          ...defaultGameOptions,
          characters: state.gameOptions.originalCharacters,
        },
        extraInfo: [],
        actionResult: [],
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
    case ReduxAction.GAME_STATUS_UPDATE:
      const extraInfoGameState = [...state.extraInfo];
      const gameState = {...state.gameState};
      if (payload === WebSocketAction.GAME_IS_CANCELLED) {
        extraInfoGameState.push({
          directions: 'The game has been cancelled.',
        });
      } else if (payload === WebSocketAction.GAME_IS_PAUSED) {
        extraInfoGameState.push({
          directions: 'The game has been paused.',
        });
        gameState.paused = true;
      } else if (payload === WebSocketAction.GAME_IS_RESUMED) {
        extraInfoGameState.push({
          directions: 'The game has been resumed.',
        });
        gameState.paused = false;
      }
      return {
      ...state,
        extraInfo: extraInfoGameState,
        gameState,
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
