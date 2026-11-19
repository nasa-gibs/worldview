import mapLocationToSidebarState from './util';

const defaultState = {
  sidebar: {
    isCollapsed: false,
    activeTab: 'layers',
    previousTab: null,
    mobileCollapsed: true,
  },
};

const defaultStateFromLocation = {
  sidebar: {},
};

describe('mapLocationToSidebarState', () => {
  it('sets activeTab to "events" when parameters.e is truthy', () => {
    const result = mapLocationToSidebarState(
      { e: true },
      defaultStateFromLocation,
      defaultState,
      {},
    );
    expect(result.sidebar.activeTab).toBe('events');
  });

  it('sets activeTab to "download" when parameters.sh is truthy', () => {
    const result = mapLocationToSidebarState(
      { sh: true },
      defaultStateFromLocation,
      defaultState,
      {},
    );
    expect(result.sidebar.activeTab).toBe('download');
  });

  it('sets activeTab to "layers" when neither parameters.e nor parameters.sh are set', () => {
    const result = mapLocationToSidebarState(
      {},
      defaultStateFromLocation,
      defaultState,
      {},
    );
    expect(result.sidebar.activeTab).toBe('layers');
  });

  it('prioritizes "events" over "download" when both parameters.e and parameters.sh are truthy', () => {
    const result = mapLocationToSidebarState(
      { e: true, sh: true },
      defaultStateFromLocation,
      defaultState,
      {},
    );
    expect(result.sidebar.activeTab).toBe('events');
  });

  it('preserves existing sidebar state properties from state.sidebar', () => {
    const stateWithExtras = {
      sidebar: {
        isCollapsed: true,
        activeTab: 'layers',
        previousTab: 'events',
        mobileCollapsed: false,
      },
    };
    const result = mapLocationToSidebarState(
      {},
      defaultStateFromLocation,
      stateWithExtras,
      {},
    );
    expect(result.sidebar.isCollapsed).toBe(true);
    expect(result.sidebar.previousTab).toBe('events');
    expect(result.sidebar.mobileCollapsed).toBe(false);
  });

  it('returns an updated stateFromLocation object with the sidebar property set', () => {
    const stateFromLocation = { sidebar: {}, someOtherProp: 'value' };
    const result = mapLocationToSidebarState(
      { sh: true },
      stateFromLocation,
      defaultState,
      {},
    );
    expect(result.someOtherProp).toBe('value');
    expect(result.sidebar).toBeDefined();
  });

  it('does not mutate the original stateFromLocation object', () => {
    const stateFromLocation = Object.freeze({ sidebar: {} });
    expect(() =>
      mapLocationToSidebarState({}, stateFromLocation, defaultState, {}),
    ).not.toThrow();
  });

  it('does not mutate the original state object', () => {
    const frozenState = Object.freeze({
      sidebar: Object.freeze({ ...defaultState.sidebar }),
    });
    expect(() =>
      mapLocationToSidebarState({}, defaultStateFromLocation, frozenState, {}),
    ).not.toThrow();
  });

  it('sets activeTab to "layers" when parameters.e is falsy and parameters.sh is falsy', () => {
    const result = mapLocationToSidebarState(
      { e: null, sh: 0 },
      defaultStateFromLocation,
      defaultState,
      {},
    );
    expect(result.sidebar.activeTab).toBe('layers');
  });
});
