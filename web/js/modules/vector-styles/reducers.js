import { assign as lodashAssign, get as lodashGet } from 'lodash';
import {
  REQUEST_VECTORSTYLE_SUCCESS,
  SET_CUSTOM,
  REQUEST_VECTORSTYLE_START,
  SET_RANGE_AND_SQUASH,
  LOADED_CUSTOM_VECTORSTYLES
} from './constants';
import update from 'immutability-helper';
import util from '../../util/util';
const browser = util.browser;
export const defaultVectorStyleState = {
  rendered: {},
  default: {},
  active: {},
  activeB: {},
  isLoading: {},
  supported: !(browser.ie || !browser.webWorkers || !browser.cors)
};
export function getInitialVectorStyleState(config) {
  const rendered = lodashGet(config, 'vectorStyles.rendered') || {};
  const custom = lodashGet(config, 'vectorStyles.custom') || {};
  return lodashAssign({}, defaultVectorStyleState, {
    rendered,
    custom
  });
}

export function vectorStyleReducer(state = defaultVectorStyleState, action) {
  const groupName = action.groupName || 'active';
  switch (action.type) {
    case REQUEST_VECTORSTYLE_START:
      return lodashAssign({}, state, {
        isLoading: update(state.isLoading, {
          [action.id]: { $set: true }
        })
      });
    case REQUEST_VECTORSTYLE_SUCCESS:
      let isLoading = update(state.isLoading, { $unset: [action.id] });
      return lodashAssign({}, state, {
        rendered: lodashAssign({}, state.rendered, {
          [action.id]: action.response
        }),
        isLoading
      });
    case SET_RANGE_AND_SQUASH:
      return lodashAssign({}, state, {
        [groupName]: action.vectorStyles
      });
    case SET_CUSTOM:
      return lodashAssign({}, state, {
        [groupName]: action.vectorStyles
      });
    case LOADED_CUSTOM_VECTORSTYLES:
      return lodashAssign({}, state, {
        custom: action.custom
      });
    default:
      return state;
  }
}
