// import { assign as lodashAssign } from 'lodash';
// import { TOGGLE_EMBED_MODE } from './constants';

export const embedState = {
  isEmbedModeActive: false,
};

export default function embedReducers(state = embedState, action) {
  switch (action.type) {
    // case TOGGLE_EMBED_MODE:
    //   return lodashAssign({}, state, {
    //     isEmbedModeActive: !state.isEmbedModeActive,
    //   });
    default:
      return state;
  }
}
