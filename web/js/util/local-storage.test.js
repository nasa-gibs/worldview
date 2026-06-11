/* eslint-disable no-restricted-globals */
// ---------------------------------------------------------------------------
// Helpers — reset module between tests that need different localStorage states
// ---------------------------------------------------------------------------

function getFreshModule() {
  jest.resetModules();
  return require('./local-storage').default;
}

// ---------------------------------------------------------------------------
// enabled — localStorage available and functional
// ---------------------------------------------------------------------------

describe('enabled', () => {
  it('is true when localStorage is available and functional', () => {
    const storage = getFreshModule();
    expect(storage.enabled).toBe(true);
  });

  it('is false when localStorage.setItem throws', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    const storage = getFreshModule();
    expect(storage.enabled).toBe(false);
    jest.restoreAllMocks();
  });

  it('logs a warning when localStorage throws', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    getFreshModule();
    expect(warnSpy).toHaveBeenCalledWith('Local storage disabled.');
    jest.restoreAllMocks();
  });

  it('is undefined when window.localStorage is falsy', () => {
    const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      value: null,
      configurable: true,
      writable: true,
    });
    const storage = getFreshModule();
    expect(storage.enabled).toBeUndefined();
    Object.defineProperty(window, 'localStorage', originalLocalStorage);
  });
});

// ---------------------------------------------------------------------------
// keys
// ---------------------------------------------------------------------------

describe('keys', () => {
  let storage;
  beforeEach(() => { storage = getFreshModule(); });

  it('exports RECENT_LAYERS key', () => {
    expect(storage.keys.RECENT_LAYERS).toBe('recentLayers');
  });

  it('exports LOCATION_SEARCH_COLLAPSED key', () => {
    expect(storage.keys.LOCATION_SEARCH_COLLAPSED).toBe('locationSearchState');
  });

  it('exports DISMISSED_EVENT_VIS_ALERT key', () => {
    expect(storage.keys.DISMISSED_EVENT_VIS_ALERT).toBe('dismissedEventVisibilityAlert');
  });

  it('exports DISMISSED_COMPARE_ALERT key', () => {
    expect(storage.keys.DISMISSED_COMPARE_ALERT).toBe('dismissedCompareAlert');
  });

  it('exports DISMISSED_DISTRACTION_FREE_ALERT key', () => {
    expect(storage.keys.DISMISSED_DISTRACTION_FREE_ALERT).toBe('dismissedDistractionFreeAlert');
  });

  it('exports DISSMISSED_DDV_ZOOM_ALERT key', () => {
    expect(storage.keys.DISSMISSED_DDV_ZOOM_ALERT).toBe('dismissedDDVZoomAlert');
  });

  it('exports DISSMISSED_DDV_LOCATION_ALERT key', () => {
    expect(storage.keys.DISSMISSED_DDV_LOCATION_ALERT).toBe('dismissedDDVLocationAlert');
  });

  it('exports GLOBAL_TEMPERATURE_UNIT key', () => {
    expect(storage.keys.GLOBAL_TEMPERATURE_UNIT).toBe('globalTemperatureUnit');
  });

  it('exports HIDE_TOUR key', () => {
    expect(storage.keys.HIDE_TOUR).toBe('hideTour');
  });

  it('exports HIDE_EDS_WARNING key', () => {
    expect(storage.keys.HIDE_EDS_WARNING).toBe('hideEDS');
  });

  it('exports SIDEBAR_COLLAPSED key', () => {
    expect(storage.keys.SIDEBAR_COLLAPSED).toBe('sidebarState');
  });

  it('exports COORDINATE_FORMAT key', () => {
    expect(storage.keys.COORDINATE_FORMAT).toBe('coordinateFormat');
  });

  it('exports NOTIFICATION_OUTAGE key', () => {
    expect(storage.keys.NOTIFICATION_OUTAGE).toBe('outage');
  });

  it('exports NOTIFICATION_ALERT key', () => {
    expect(storage.keys.NOTIFICATION_ALERT).toBe('alert');
  });

  it('exports NOTIFICATION_MSG key', () => {
    expect(storage.keys.NOTIFICATION_MSG).toBe('message');
  });

  it('exports GROUP_OVERLAYS key', () => {
    expect(storage.keys.GROUP_OVERLAYS).toBe('groupOverlays');
  });

  it('exports ALWAYS_SHOW_DATELINES key', () => {
    expect(storage.keys.ALWAYS_SHOW_DATELINES).toBe('alwaysShowDatelines');
  });

  it('exports ALLOW_GRANULE_REORDER key', () => {
    expect(storage.keys.ALLOW_GRANULE_REORDER).toBe('allowGranuleReorder');
  });
});

// ---------------------------------------------------------------------------
// getItem
// ---------------------------------------------------------------------------

describe('getItem()', () => {
  beforeEach(() => localStorage.clear());

  it('returns the stored value when localStorage is enabled', () => {
    const storage = getFreshModule();
    localStorage.setItem('testKey', 'testValue');
    expect(storage.getItem('testKey')).toBe('testValue');
  });

  it('returns null when key does not exist', () => {
    const storage = getFreshModule();
    expect(storage.getItem('nonexistent')).toBeNull();
  });

  it('returns false when localStorage is disabled', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('disabled');
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = getFreshModule();
    jest.restoreAllMocks();
    // enabled is false so getItem returns false (false && ...)
    expect(storage.getItem('anyKey')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setItem
// ---------------------------------------------------------------------------

describe('setItem()', () => {
  beforeEach(() => localStorage.clear());

  it('stores a value in localStorage when enabled', () => {
    const storage = getFreshModule();
    storage.setItem('myKey', 'myValue');
    expect(localStorage.getItem('myKey')).toBe('myValue');
  });

  it('does not throw when localStorage is disabled', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('disabled');
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = getFreshModule();
    jest.restoreAllMocks();
    expect(() => storage.setItem('key', 'value')).not.toThrow();
  });

  it('does not write to localStorage when disabled', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('disabled');
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = getFreshModule();
    jest.restoreAllMocks();
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    storage.setItem('key', 'value');
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

describe('removeItem()', () => {
  beforeEach(() => localStorage.clear());

  it('removes a key from localStorage when enabled', () => {
    const storage = getFreshModule();
    localStorage.setItem('removeMe', 'yes');
    storage.removeItem('removeMe');
    expect(localStorage.getItem('removeMe')).toBeNull();
  });

  it('does not throw when localStorage is disabled', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('disabled');
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = getFreshModule();
    jest.restoreAllMocks();
    expect(() => storage.removeItem('key')).not.toThrow();
  });

  it('does not call localStorage.removeItem when disabled', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('disabled');
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = getFreshModule();
    jest.restoreAllMocks();
    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
    storage.removeItem('key');
    expect(removeItemSpy).not.toHaveBeenCalled();
    removeItemSpy.mockRestore();
  });
});
