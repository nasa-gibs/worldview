import {
  changeTab,
  toggleSidebarCollapse,
  collapseSidebar,
  expandSidebar,
} from './actions';
import {
  CHANGE_TAB,
  TOGGLE_COLLAPSE,
  COLLAPSE_SIDEBAR,
  EXPAND_SIDEBAR,
  TOGGLE_MOBILE_COLLAPSE,
  MOBILE_COLLAPSE_SIDEBAR,
  MOBILE_EXPAND_SIDEBAR,
} from './constants';

describe('changeTab', () => {
  it('dispatches CHANGE_TAB when activeTab differs from str', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ sidebar: { activeTab: 'home' } });

    changeTab('settings')(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: CHANGE_TAB, activeTab: 'settings' });
  });

  it('does not dispatch when activeTab equals str', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ sidebar: { activeTab: 'settings' } });

    changeTab('settings')(dispatch, getState);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('toggleSidebarCollapse', () => {
  it('dispatches TOGGLE_MOBILE_COLLAPSE on mobile', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ screenSize: { isMobileDevice: true } });

    toggleSidebarCollapse()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: TOGGLE_MOBILE_COLLAPSE });
  });

  it('dispatches TOGGLE_COLLAPSE on desktop', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ screenSize: { isMobileDevice: false } });

    toggleSidebarCollapse()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: TOGGLE_COLLAPSE });
  });
});

describe('collapseSidebar', () => {
  it('dispatches MOBILE_COLLAPSE_SIDEBAR on mobile', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ screenSize: { isMobileDevice: true } });

    collapseSidebar()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_COLLAPSE_SIDEBAR });
  });

  it('dispatches COLLAPSE_SIDEBAR on desktop', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ screenSize: { isMobileDevice: false } });

    collapseSidebar()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: COLLAPSE_SIDEBAR });
  });
});

describe('expandSidebar', () => {
  it('dispatches MOBILE_EXPAND_SIDEBAR on mobile', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ screenSize: { isMobileDevice: true } });

    expandSidebar()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: MOBILE_EXPAND_SIDEBAR });
  });

  it('dispatches EXPAND_SIDEBAR on desktop', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ screenSize: { isMobileDevice: false } });

    expandSidebar()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({ type: EXPAND_SIDEBAR });
  });
});
