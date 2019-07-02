import {
  CHANGE_TAB,
  TOGGLE_COLLAPSE,
  COLLAPSE_SIDEBAR,
  EXPAND_SIDEBAR
} from './constants';
import { assign as lodashAssign } from 'lodash';
import util from '../../util/util';

const wasCallapseRequested = util.browser.localStorage
  ? localStorage.getItem('sidebarState') === 'collapsed'
  : false;
export const sidebarState = {
  isCollapsed: util.browser.small ? true : wasCallapseRequested || false,
  wasCallapseRequested: wasCallapseRequested,
  activeTab: 'layers'
};

export default function sidebarReducer(state = sidebarState, action) {
  switch (action.type) {
    case CHANGE_TAB:
      return lodashAssign({}, state, {
        activeTab: action.activeTab
      });
    case TOGGLE_COLLAPSE:
      return lodashAssign({}, state, {
        isCollapsed: !state.isCollapsed
      });
    case COLLAPSE_SIDEBAR:
      return lodashAssign({}, state, {
        isCollapsed: true
      });
    case EXPAND_SIDEBAR:
      return lodashAssign({}, state, {
        isCollapsed: false
      });
    default:
      return state;
  }
}
