import { assign as lodashAssign, get as lodashGet } from 'lodash';
import {
  REQUEST_PALETTE_SUCCESS,
  PALETTE_CHANGE,
  REQUEST_PALETTE_START
} from './constants';
import update from 'immutability-helper';

export const defaultPaletteState = {
  rendered: {},
  custom: {},
  active: {},
  activeB: {},
  isLoading: {}
};
export function getInitialPaletteState(config) {
  const rendered = lodashGet(config, 'palettes.rendered') || {};
  console.log(config.palettes);
  const custom = lodashGet(config, 'palettes.custom');
  return lodashAssign({}, defaultPaletteState, {
    rendered: rendered,
    custom
  });
}

export function paletteReducer(state = defaultPaletteState, action) {
  const groupName = action.groupName || 'active';

  switch (action.type) {
    case REQUEST_PALETTE_START:
      return lodashAssign({}, state, {
        isLoading: update(state.isLoading, {
          [action.id]: { $set: true }
        })
      });
    case REQUEST_PALETTE_SUCCESS:
      let isLoading = update(state.isLoading, { $unset: [action.id] });
      return lodashAssign({}, state, {
        rendered: lodashAssign({}, state.rendered, {
          [action.id]: action.response
        }),
        isLoading
      });
    case PALETTE_CHANGE:
      return lodashAssign({}, state, {
        [groupName]: action.palettes
      });
    default:
      return state;
  }
}
