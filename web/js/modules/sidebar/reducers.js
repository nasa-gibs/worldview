import { assign as lodashAssign } from 'lodash';
import {
  CHANGE_TAB,
  TOGGLE_COLLAPSE,
  COLLAPSE_SIDEBAR,
  EXPAND_SIDEBAR,
  TOGGLE_MOBILE_COLLAPSE,
  MOBILE_COLLAPSE_SIDEBAR,
  MOBILE_EXPAND_SIDEBAR,
} from './constants';
import safeLocalStorage from '../../util/local-storage';

const { SIDEBAR_COLLAPSED } = safeLocalStorage.keys;
const wasCollapseRequested = safeLocalStorage.getItem(SIDEBAR_COLLAPSED) === 'collapsed';
export const sidebarState = {
  isCollapsed: wasCollapseRequested || false,
  activeTab: 'layers',
  previousTab: null,
  mobileCollapsed: true,
};

export default function sidebarReducer(state = sidebarState, action) {
  switch (action.type) {
    case CHANGE_TAB:
      return lodashAssign({}, state, {
        previousTab: state.activeTab,
        activeTab: action.activeTab,
      });
    case TOGGLE_COLLAPSE:
      return lodashAssign({}, state, {
        isCollapsed: !state.isCollapsed,
      });
    case COLLAPSE_SIDEBAR:
      return lodashAssign({}, state, {
        isCollapsed: true,
      });
    case TOGGLE_MOBILE_COLLAPSE:
      return lodashAssign({}, state, {
        mobileCollapsed: !state.mobileCollapsed,
      });
    case MOBILE_COLLAPSE_SIDEBAR:
      return lodashAssign({}, state, {
        mobileCollapsed: true,
      });
    case MOBILE_EXPAND_SIDEBAR:
      return lodashAssign({}, state, {
        mobileCollapsed: false,
      });
    case EXPAND_SIDEBAR:
      return lodashAssign({}, state, {
        isCollapsed: false,
      });
    default:
      return state;
  }
}
