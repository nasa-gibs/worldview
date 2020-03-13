import {
  assign as lodashAssign,
  get as lodashGet,
  isEmpty,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import update from 'immutability-helper';
import {
  REQUEST_PALETTE_SUCCESS,
  SET_CUSTOM,
  REQUEST_PALETTE_START,
  SET_THRESHOLD_RANGE_AND_SQUASH,
  LOADED_CUSTOM_PALETTES,
  BULK_PALETTE_RENDERING_SUCCESS,
  CLEAR_CUSTOM,
  SET_DISABLED_CLASSIFICATION,
} from './constants';
import { INIT_SECOND_LAYER_GROUP } from '../layers/constants';
import util from '../../util/util';

const { browser } = util;
export const defaultPaletteState = {
  rendered: {},
  custom: {},
  active: {},
  activeB: {},
  isLoading: {},
  supported: !(browser.ie || !browser.webWorkers || !browser.cors),
};
export function getInitialPaletteState(config) {
  const rendered = lodashGet(config, 'palettes.rendered') || {};
  const custom = lodashGet(config, 'palettes.custom') || {};
  return lodashAssign({}, defaultPaletteState, {
    rendered,
    custom,
  });
}

export function paletteReducer(state = defaultPaletteState, action) {
  const groupName = action.groupName || 'active';
  switch (action.type) {
    case REQUEST_PALETTE_START:
      return lodashAssign({}, state, {
        isLoading: update(state.isLoading, {
          [action.id]: { $set: true },
        }),
      });
    case BULK_PALETTE_RENDERING_SUCCESS:
      return update(state, {
        rendered: { $merge: action.rendered || {} },
      });
    case REQUEST_PALETTE_SUCCESS: {
      const isLoading = update(state.isLoading, { $unset: [action.id] });
      return lodashAssign({}, state, {
        rendered: lodashAssign({}, state.rendered, {
          [action.id]: action.response,
        }),
        isLoading,
      });
    }
    case INIT_SECOND_LAYER_GROUP:
      if (!isEmpty(state.activeB)) return state;
      return lodashAssign({}, state, {
        activeB: lodashCloneDeep(state.active),
      });
    case SET_THRESHOLD_RANGE_AND_SQUASH:
    case SET_CUSTOM:
    case SET_DISABLED_CLASSIFICATION:
    case CLEAR_CUSTOM:
      return lodashAssign({}, state, {
        [groupName]: action.palettes || {},
      });
    case LOADED_CUSTOM_PALETTES:
      return lodashAssign({}, state, {
        custom: action.custom || {},
      });
    default:
      return state;
  }
}
