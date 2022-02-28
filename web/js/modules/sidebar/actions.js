import {
  CHANGE_TAB,
  TOGGLE_COLLAPSE,
  COLLAPSE_SIDEBAR,
  EXPAND_SIDEBAR,
  TOGGLE_MOBILE_COLLAPSE,
  MOBILE_COLLAPSE_SIDEBAR,
  MOBILE_EXPAND_SIDEBAR,
} from './constants';

export function changeTab(str) {
  return (dispatch, getState) => {
    if (getState().sidebar.activeTab !== str) {
      dispatch({
        type: CHANGE_TAB,
        activeTab: str,
      });
    }
  };
}
export function toggleSidebarCollapse() {
  return (dispatch, getState) => {
    const isMobile = getState().browser.lessThan.medium;
    if (isMobile) {
      dispatch({ type: TOGGLE_MOBILE_COLLAPSE });
    } else {
      dispatch({ type: TOGGLE_COLLAPSE });
    }
  };
}

export function collapseSidebar() {
  return (dispatch, getState) => {
    const isMobile = getState().browser.lessThan.medium;
    if (isMobile) {
      dispatch({ type: MOBILE_COLLAPSE_SIDEBAR });
    } else {
      dispatch({ type: COLLAPSE_SIDEBAR });
    }
  };
}

export function expandSidebar() {
  return (dispatch, getState) => {
    const isMobile = getState().browser.lessThan.medium;
    if (isMobile) {
      dispatch({ type: MOBILE_EXPAND_SIDEBAR });
    } else {
      dispatch({ type: EXPAND_SIDEBAR });
    }
  };
}
