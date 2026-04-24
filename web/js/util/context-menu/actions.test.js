import {
  dispatchGlobalEvent,
  showMenu,
  hideMenu,
  MENU_SHOW,
  MENU_HIDE,
} from './actions';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('./helpers', () => ({
  store: {},
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('MENU_SHOW has the correct value', () => {
    expect(MENU_SHOW).toBe('REACT_CONTEXTMENU_SHOW');
  });

  it('MENU_HIDE has the correct value', () => {
    expect(MENU_HIDE).toBe('REACT_CONTEXTMENU_HIDE');
  });
});

// ---------------------------------------------------------------------------
// dispatchGlobalEvent
// ---------------------------------------------------------------------------

describe('dispatchGlobalEvent()', () => {
  let dispatchSpy;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('dispatches an event on the default window target', () => {
    dispatchGlobalEvent('TEST_EVENT', { foo: 'bar' });
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('dispatches an event with the correct event name', () => {
    dispatchGlobalEvent('MY_EVENT', {});
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.type).toBe('MY_EVENT');
  });

  it('passes opts as event detail', () => {
    const opts = { id: 'menu-1', x: 100, y: 200 };
    dispatchGlobalEvent('TEST_EVENT', opts);
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.detail).toEqual(opts);
  });

  it('dispatches on a custom target when provided', () => {
    const customTarget = document.createElement('div');
    const customDispatchSpy = jest.spyOn(customTarget, 'dispatchEvent');

    dispatchGlobalEvent('TEST_EVENT', { foo: 'bar' }, customTarget);

    expect(customDispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch when target is null', () => {
    dispatchGlobalEvent('TEST_EVENT', { foo: 'bar' }, null);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('merges opts into the store after dispatch', async () => {
    const { store } = await import('./helpers');
    const opts = { position: { x: 50, y: 75 } };

    dispatchGlobalEvent('TEST_EVENT', opts);

    expect(store).toMatchObject(opts);
  });

  it('does not update store when target is null', async () => {
    const { store } = await import('./helpers');
    // Reset store
    Object.keys(store).forEach((k) => delete store[k]);

    dispatchGlobalEvent('TEST_EVENT', { shouldNotAppear: true }, null);

    expect(store.shouldNotAppear).toBeUndefined();
  });

  it('uses document.createEvent when CustomEvent is not a function', () => {
    const originalCustomEvent = window.CustomEvent;
    // Simulate IE where CustomEvent is not a constructor function
    window.CustomEvent = undefined;

    const createEventSpy = jest.spyOn(document, 'createEvent');

    dispatchGlobalEvent('TEST_EVENT', { foo: 'bar' });

    expect(createEventSpy).toHaveBeenCalledWith('CustomEvent');

    window.CustomEvent = originalCustomEvent;
    createEventSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// showMenu
// ---------------------------------------------------------------------------

describe('showMenu()', () => {
  let dispatchSpy;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('dispatches a MENU_SHOW event', () => {
    showMenu();
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.type).toBe(MENU_SHOW);
  });

  it('includes type MENU_SHOW in the event detail', () => {
    showMenu({ id: 'my-menu' });
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.detail.type).toBe(MENU_SHOW);
  });

  it('merges provided opts into the event detail', () => {
    showMenu({ id: 'my-menu', x: 10 });
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.detail.id).toBe('my-menu');
    expect(dispatched.detail.x).toBe(10);
  });

  it('works with no arguments', () => {
    expect(() => showMenu()).not.toThrow();
  });

  it('dispatches on a custom target when provided', () => {
    const customTarget = document.createElement('div');
    const customDispatchSpy = jest.spyOn(customTarget, 'dispatchEvent');

    showMenu({}, customTarget);

    expect(customDispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not mutate the original opts object', () => {
    const opts = { id: 'menu-1' };
    const original = { ...opts };
    showMenu(opts);
    expect(opts).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// hideMenu
// ---------------------------------------------------------------------------

describe('hideMenu()', () => {
  let dispatchSpy;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('dispatches a MENU_HIDE event', () => {
    hideMenu();
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.type).toBe(MENU_HIDE);
  });

  it('includes type MENU_HIDE in the event detail', () => {
    hideMenu({ id: 'my-menu' });
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.detail.type).toBe(MENU_HIDE);
  });

  it('merges provided opts into the event detail', () => {
    hideMenu({ id: 'my-menu', reason: 'blur' });
    const dispatched = dispatchSpy.mock.calls[0][0];
    expect(dispatched.detail.id).toBe('my-menu');
    expect(dispatched.detail.reason).toBe('blur');
  });

  it('works with no arguments', () => {
    expect(() => hideMenu()).not.toThrow();
  });

  it('dispatches on a custom target when provided', () => {
    const customTarget = document.createElement('div');
    const customDispatchSpy = jest.spyOn(customTarget, 'dispatchEvent');

    hideMenu({}, customTarget);

    expect(customDispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not mutate the original opts object', () => {
    const opts = { id: 'menu-1' };
    const original = { ...opts };
    hideMenu(opts);
    expect(opts).toEqual(original);
  });
});
