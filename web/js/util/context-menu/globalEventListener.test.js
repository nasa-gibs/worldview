import { MENU_SHOW, MENU_HIDE } from './actions';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('./actions', () => ({
  MENU_SHOW: 'REACT_CONTEXTMENU_SHOW',
  MENU_HIDE: 'REACT_CONTEXTMENU_HIDE',
}));

jest.mock('./helpers', () => ({
  uniqueId: jest.fn(),
  hasOwnProp: jest.fn((obj, key) =>
    Object.prototype.hasOwnProperty.call(obj, key),
  ),
  canUseDOM: true,
}));

// ---------------------------------------------------------------------------
// Helper — fresh singleton + fresh uniqueId mock per test
// ---------------------------------------------------------------------------

function getFreshListener() {
  let listener;
  let helpers;
  jest.isolateModules(() => {
    helpers = require('./helpers');
    listener = require('./globalEventListener').default;
  });
  return { listener, helpers };
}

// ---------------------------------------------------------------------------
// Construction / DOM listener registration
// ---------------------------------------------------------------------------

describe('GlobalEventListener construction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers MENU_SHOW and MENU_HIDE on window when canUseDOM is true', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    getFreshListener();
    const eventNames = addSpy.mock.calls.map(([name]) => name);
    expect(eventNames).toContain(MENU_SHOW);
    expect(eventNames).toContain(MENU_HIDE);
    addSpy.mockRestore();
  });

  it('does NOT register window listeners when canUseDOM is false', () => {
    jest.resetModules();
    jest.doMock('./helpers', () => ({
      uniqueId: jest.fn(),
      hasOwnProp: jest.fn((obj, key) =>
        Object.prototype.hasOwnProperty.call(obj, key),
      ),
      canUseDOM: false,
    }));

    const addSpy = jest.spyOn(window, 'addEventListener');
    jest.isolateModules(() => {
      require('./globalEventListener');
    });

    const eventNames = addSpy.mock.calls.map(([name]) => name);
    expect(eventNames).not.toContain(MENU_SHOW);
    expect(eventNames).not.toContain(MENU_HIDE);
    addSpy.mockRestore();

    jest.doMock('./helpers', () => ({
      uniqueId: jest.fn(),
      hasOwnProp: jest.fn((obj, key) =>
        Object.prototype.hasOwnProperty.call(obj, key),
      ),
      canUseDOM: true,
    }));
    jest.resetModules();
  });

  it('initialises with an empty callbacks object', () => {
    const { listener } = getFreshListener();
    expect(listener.callbacks).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// register()
// ---------------------------------------------------------------------------

describe('register()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the generated unique id', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    const id = listener.register(jest.fn(), jest.fn());
    expect(id).toBe('id-1');
  });

  it('stores show and hide callbacks under the returned id', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    const show = jest.fn();
    const hide = jest.fn();
    const id = listener.register(show, hide);
    expect(listener.callbacks[id].show).toBe(show);
    expect(listener.callbacks[id].hide).toBe(hide);
  });

  it('stores multiple registrations independently', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId
      .mockReturnValueOnce('id-1')
      .mockReturnValueOnce('id-2');

    const show1 = jest.fn();
    const show2 = jest.fn();
    listener.register(show1, jest.fn());
    listener.register(show2, jest.fn());

    expect(Object.keys(listener.callbacks)).toHaveLength(2);
    expect(listener.callbacks['id-1'].show).toBe(show1);
    expect(listener.callbacks['id-2'].show).toBe(show2);
  });
});

// ---------------------------------------------------------------------------
// unregister()
// ---------------------------------------------------------------------------

describe('unregister()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes the callback entry for the given id', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    const id = listener.register(jest.fn(), jest.fn());
    listener.unregister(id);
    expect(listener.callbacks[id]).toBeUndefined();
  });

  it('does nothing when id is null', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    listener.register(jest.fn(), jest.fn());
    expect(() => listener.unregister(null)).not.toThrow();
    expect(Object.keys(listener.callbacks)).toHaveLength(1);
  });

  it('does nothing when id is undefined', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    listener.register(jest.fn(), jest.fn());
    expect(() => listener.unregister(undefined)).not.toThrow();
    expect(Object.keys(listener.callbacks)).toHaveLength(1);
  });

  it('does nothing when id does not exist in callbacks', () => {
    const { listener } = getFreshListener();
    expect(() => listener.unregister('non-existent-id')).not.toThrow();
  });

  it('only removes the specified registration', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId
      .mockReturnValueOnce('id-1')
      .mockReturnValueOnce('id-2');

    listener.register(jest.fn(), jest.fn());
    listener.register(jest.fn(), jest.fn());
    listener.unregister('id-1');

    expect(listener.callbacks['id-1']).toBeUndefined();
    expect(listener.callbacks['id-2']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// handleShowEvent()
// ---------------------------------------------------------------------------

describe('handleShowEvent()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the show callback of every registered listener', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId
      .mockReturnValueOnce('id-1')
      .mockReturnValueOnce('id-2');

    const show1 = jest.fn();
    const show2 = jest.fn();
    listener.register(show1, jest.fn());
    listener.register(show2, jest.fn());

    const event = { detail: {} };
    listener.handleShowEvent(event);

    expect(show1).toHaveBeenCalledWith(event);
    expect(show2).toHaveBeenCalledWith(event);
  });

  it('does not call hide callbacks on a show event', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    const hide = jest.fn();
    listener.register(jest.fn(), hide);

    listener.handleShowEvent({ detail: {} });

    expect(hide).not.toHaveBeenCalled();
  });

  it('does not throw when there are no registered callbacks', () => {
    const { listener } = getFreshListener();
    expect(() => listener.handleShowEvent({ detail: {} })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// handleHideEvent()
// ---------------------------------------------------------------------------

describe('handleHideEvent()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the hide callback of every registered listener', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId
      .mockReturnValueOnce('id-1')
      .mockReturnValueOnce('id-2');

    const hide1 = jest.fn();
    const hide2 = jest.fn();
    listener.register(jest.fn(), hide1);
    listener.register(jest.fn(), hide2);

    const event = { detail: {} };
    listener.handleHideEvent(event);

    expect(hide1).toHaveBeenCalledWith(event);
    expect(hide2).toHaveBeenCalledWith(event);
  });

  it('does not call show callbacks on a hide event', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    const show = jest.fn();
    listener.register(show, jest.fn());

    listener.handleHideEvent({ detail: {} });

    expect(show).not.toHaveBeenCalled();
  });

  it('does not call callbacks that have been unregistered', () => {
    const { listener, helpers } = getFreshListener();
    helpers.uniqueId.mockReturnValue('id-1');
    const hide = jest.fn();
    const id = listener.register(jest.fn(), hide);
    listener.unregister(id);

    listener.handleHideEvent({ detail: {} });

    expect(hide).not.toHaveBeenCalled();
  });

  it('does not throw when there are no registered callbacks', () => {
    const { listener } = getFreshListener();
    expect(() => listener.handleHideEvent({ detail: {} })).not.toThrow();
  });
});
