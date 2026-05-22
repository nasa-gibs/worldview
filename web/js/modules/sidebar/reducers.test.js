import sidebarReducer, { sidebarState } from './reducers';
import {
  CHANGE_TAB,
  TOGGLE_COLLAPSE,
  COLLAPSE_SIDEBAR,
  EXPAND_SIDEBAR,
  TOGGLE_MOBILE_COLLAPSE,
  MOBILE_COLLAPSE_SIDEBAR,
  MOBILE_EXPAND_SIDEBAR,
} from './constants';

const defaultState = {
  isCollapsed: false,
  activeTab: 'layers',
  previousTab: null,
  mobileCollapsed: true,
};

describe('sidebarReducer', () => {
  it('returns the default state when no action is matched', () => {
    const state = sidebarReducer(defaultState, { type: '@@INIT' });
    expect(state).toEqual(defaultState);
  });

  it('returns the initial sidebarState when state is undefined', () => {
    const state = sidebarReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(sidebarState);
  });

  it('handles CHANGE_TAB by updating activeTab and setting previousTab', () => {
    const state = sidebarReducer(defaultState, { type: CHANGE_TAB, activeTab: 'events' });
    expect(state.activeTab).toBe('events');
    expect(state.previousTab).toBe('layers');
  });

  it('handles TOGGLE_COLLAPSE by flipping isCollapsed from false to true', () => {
    const state = sidebarReducer(
      {...defaultState, isCollapsed: false }, { type: TOGGLE_COLLAPSE },
    );
    expect(state.isCollapsed).toBe(true);
  });

  it('handles TOGGLE_COLLAPSE by flipping isCollapsed from true to false', () => {
    const state = sidebarReducer(
      {...defaultState, isCollapsed: true }, { type: TOGGLE_COLLAPSE },
    );
    expect(state.isCollapsed).toBe(false);
  });

  it('handles COLLAPSE_SIDEBAR by setting isCollapsed to true', () => {
    const state = sidebarReducer(
      {...defaultState, isCollapsed: false }, { type: COLLAPSE_SIDEBAR },
    );
    expect(state.isCollapsed).toBe(true);
  });

  it('handles COLLAPSE_SIDEBAR when already collapsed', () => {
    const state = sidebarReducer(
      {...defaultState, isCollapsed: true }, { type: COLLAPSE_SIDEBAR },
    );
    expect(state.isCollapsed).toBe(true);
  });

  it('handles EXPAND_SIDEBAR by setting isCollapsed to false', () => {
    const state = sidebarReducer(
      {...defaultState, isCollapsed: true }, { type: EXPAND_SIDEBAR },
    );
    expect(state.isCollapsed).toBe(false);
  });

  it('handles EXPAND_SIDEBAR when already expanded', () => {
    const state = sidebarReducer(
      {...defaultState, isCollapsed: false }, { type: EXPAND_SIDEBAR },
    );
    expect(state.isCollapsed).toBe(false);
  });

  it('handles TOGGLE_MOBILE_COLLAPSE by flipping mobileCollapsed from true to false', () => {
    const state = sidebarReducer(
      {...defaultState, mobileCollapsed: true }, { type: TOGGLE_MOBILE_COLLAPSE },
    );
    expect(state.mobileCollapsed).toBe(false);
  });

  it('handles TOGGLE_MOBILE_COLLAPSE by flipping mobileCollapsed from false to true', () => {
    const state = sidebarReducer(
      {...defaultState, mobileCollapsed: false }, { type: TOGGLE_MOBILE_COLLAPSE },
    );
    expect(state.mobileCollapsed).toBe(true);
  });

  it('handles MOBILE_COLLAPSE_SIDEBAR by setting mobileCollapsed to true', () => {
    const state = sidebarReducer(
      {...defaultState, mobileCollapsed: false }, { type: MOBILE_COLLAPSE_SIDEBAR },
    );
    expect(state.mobileCollapsed).toBe(true);
  });

  it('handles MOBILE_COLLAPSE_SIDEBAR when already collapsed', () => {
    const state = sidebarReducer(
      {...defaultState, mobileCollapsed: true }, { type: MOBILE_COLLAPSE_SIDEBAR },
    );
    expect(state.mobileCollapsed).toBe(true);
  });

  it('handles MOBILE_EXPAND_SIDEBAR by setting mobileCollapsed to false', () => {
    const state = sidebarReducer(
      {...defaultState, mobileCollapsed: true }, { type: MOBILE_EXPAND_SIDEBAR },
    );
    expect(state.mobileCollapsed).toBe(false);
  });

  it('handles MOBILE_EXPAND_SIDEBAR when already expanded', () => {
    const state = sidebarReducer(
      {...defaultState, mobileCollapsed: false }, { type: MOBILE_EXPAND_SIDEBAR },
    );
    expect(state.mobileCollapsed).toBe(false);
  });

  it('does not mutate the original state', () => {
    const frozen = Object.freeze({ ...defaultState });
    expect(() => sidebarReducer(frozen, { type: COLLAPSE_SIDEBAR })).not.toThrow();
  });
});
