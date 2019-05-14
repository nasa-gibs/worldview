import { assign as lodashAssign, get as lodashGet } from 'lodash';
import {
  REQUEST_PALETTE_SUCCESS,
  SET_CUSTOM,
  REQUEST_PALETTE_START,
  SET_RANGE_AND_SQUASH,
  LOADED_CUSTOM_PALETTES
} from './constants';
import update from 'immutability-helper';
import util from '../../util/util';
const browser = util.browser;
export const defaultPaletteState = {
  rendered: {},
  custom: {},
  active: {},
  activeB: {},
  isLoading: {},
  supported: !(browser.ie || !browser.webWorkers || !browser.cors)
};
export function getInitialPaletteState(config) {
  const rendered = lodashGet(config, 'palettes.rendered') || {};
  const custom = lodashGet(config, 'palettes.custom') || {};
  return lodashAssign({}, defaultPaletteState, {
    rendered,
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
    case SET_RANGE_AND_SQUASH:
      return lodashAssign({}, state, {
        [groupName]: action.palettes
      });
    case SET_CUSTOM:
      return lodashAssign({}, state, {
        [groupName]: action.palettes
      });
    case LOADED_CUSTOM_PALETTES:
      return lodashAssign({}, state, {
        custom: action.custom
      });
    default:
      return state;
  }
}
