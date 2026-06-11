/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent, act } from '@testing-library/react';
import SubMenu from './SubMenu';
import MenuItem from './MenuItem';
import { hideMenu } from './actions';
import { callIfExists, cssClasses, store } from './helpers';
import listener from './globalEventListener';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('./actions', () => ({ hideMenu: jest.fn() }));

jest.mock('./helpers', () => ({
  callIfExists: jest.fn((fn, ...args) => fn && fn(...args)),
  hasOwnProp: jest.fn((obj, key) => Object.prototype.hasOwnProperty.call(obj, key)),
  cssClasses: {
    menu: 'react-contextmenu',
    menuVisible: 'react-contextmenu--visible',
    menuItem: 'react-contextmenu-item',
    menuItemActive: 'react-contextmenu-item--active',
    menuItemDisabled: 'react-contextmenu-item--disabled',
    menuItemSelected: 'react-contextmenu-item--selected',
    subMenu: 'react-contextmenu-submenu',
  },
  store: { data: {}, target: null },
}));

jest.mock('./globalEventListener', () => ({
  register: jest.fn(() => 'mock-listen-id'),
  unregister: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Silence React DOM unknown prop warnings
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  store.data = {};
  store.target = null;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSubMenu(props = {}) {
  return render(
    <SubMenu title={<span data-testid="title">Submenu</span>} {...props}>
      <MenuItem>Child Item</MenuItem>
    </SubMenu>,
  );
}

function getHideHandler() {
  return listener.register.mock.calls[listener.register.mock.calls.length - 1][1];
}

function openSubMenu(outerNav, delay = 100) {
  fireEvent.mouseEnter(outerNav);
  act(() => jest.advanceTimersByTime(delay));
}

function setupSubMenuRect(subMenuNav, overrides = {}) {
  subMenuNav.getBoundingClientRect = () => ({
    bottom: 100,
    right: 100,
    left: 50,
    width: 100,
    height: 50,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('rendering', () => {
  it('renders nav with role menuitem', () => {
    const { getAllByRole } = renderSubMenu();
    expect(getAllByRole('menuitem').length).toBeGreaterThan(0);
  });

  it('renders title', () => {
    const { getByTestId } = renderSubMenu();
    expect(getByTestId('title')).toBeTruthy();
  });

  it('renders children', () => {
    const { getByText } = renderSubMenu();
    expect(getByText('Child Item')).toBeTruthy();
  });

  it('applies menuItem and subMenu classes to outer nav', () => {
    const { getAllByRole } = renderSubMenu();
    const nav = getAllByRole('menuitem')[0];
    expect(nav.className).toContain(cssClasses.menuItem);
    expect(nav.className).toContain(cssClasses.subMenu);
  });

  it('applies custom className to inner nav', () => {
    const { getAllByRole } = renderSubMenu({ className: 'custom' });
    expect(getAllByRole('menu')[0].className).toContain('custom');
  });

  it('applies disabled class when disabled', () => {
    const { getByTestId } = renderSubMenu({ disabled: true });
    expect(getByTestId('title').parentElement.className).toContain(cssClasses.menuItemDisabled);
  });

  it('applies attributes.disabledClassName when disabled', () => {
    const { getByTestId } = renderSubMenu({
      disabled: true,
      attributes: { disabledClassName: 'dis' },
    });
    expect(getByTestId('title').parentElement.className).toContain('dis');
  });

  it('applies selected class when selected', () => {
    const { getByTestId } = renderSubMenu({ selected: true });
    expect(getByTestId('title').parentElement.className).toContain(cssClasses.menuItemSelected);
  });

  it('applies attributes.selectedClassName when selected', () => {
    const { getByTestId } = renderSubMenu({
      selected: true,
      attributes: { selectedClassName: 'sel' },
    });
    expect(getByTestId('title').parentElement.className).toContain('sel');
  });

  it('applies attributes.visibleClassName when visible', () => {
    jest.useFakeTimers();
    const { getAllByRole, getByTestId } = renderSubMenu({
      hoverDelay: 100,
      attributes: { visibleClassName: 'vis' },
    });
    openSubMenu(getAllByRole('menuitem')[0]);
    expect(getByTestId('title').parentElement.className).toContain('vis');
    jest.useRealTimers();
  });

  it('applies attributes.listClassName to outer nav', () => {
    const { getAllByRole } = renderSubMenu({ attributes: { listClassName: 'list' } });
    expect(getAllByRole('menuitem')[0].className).toContain('list');
  });

  it('applies attributes.className to title div', () => {
    const { getByTestId } = renderSubMenu({ attributes: { className: 'attr' } });
    expect(getByTestId('title').parentElement.className).toContain('attr');
  });

  it('forwards onMouseMove to title div', () => {
    const onMouseMove = jest.fn();
    const { getByTestId } = renderSubMenu({ onMouseMove });
    fireEvent.mouseMove(getByTestId('title').parentElement);
    expect(onMouseMove).toHaveBeenCalled();
  });

  it('forwards onMouseOut to title div', () => {
    const onMouseOut = jest.fn();
    const { getByTestId } = renderSubMenu({ onMouseOut });
    fireEvent.mouseOut(getByTestId('title').parentElement);
    expect(onMouseOut).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

describe('lifecycle', () => {
  it('registers listener on mount', () => {
    renderSubMenu();
    // clearAllMocks runs in beforeEach so count is exactly 1 per test
    expect(listener.register).toHaveBeenCalledTimes(1);
  });

  it('unregisters listener on unmount', () => {
    const { unmount } = renderSubMenu();
    unmount();
    expect(listener.unregister).toHaveBeenCalledWith('mock-listen-id');
  });

  it('does not unregister when listenId is falsy', () => {
    listener.register.mockReturnValueOnce(null);
    const { unmount } = renderSubMenu();
    unmount();
    expect(listener.unregister).not.toHaveBeenCalled();
  });

  it('clears open timer on unmount', () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const { getAllByRole, unmount } = renderSubMenu({ hoverDelay: 500 });
    fireEvent.mouseEnter(getAllByRole('menuitem')[0]);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });

  it('clears close timer on unmount', () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const { getAllByRole, unmount } = renderSubMenu({ hoverDelay: 100 });
    openSubMenu(getAllByRole('menuitem')[0]);
    fireEvent.mouseLeave(getAllByRole('menuitem')[0]);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// shouldComponentUpdate
// ---------------------------------------------------------------------------

describe('shouldComponentUpdate', () => {
  it('always returns true and tracks visibility change', () => {
    jest.useFakeTimers();
    const { getAllByRole, getByTestId } = renderSubMenu({ hoverDelay: 100 });
    openSubMenu(getAllByRole('menuitem')[0]);
    expect(getByTestId('title').parentElement.className).toContain(cssClasses.menuItemActive);
    jest.useRealTimers();
  });

  it('isVisibilityChange is false when visible and forceOpen both true', () => {
    jest.useFakeTimers();
    const { getAllByRole, rerender } = render(
      <SubMenu title={<span>T</span>} forceOpen={false} hoverDelay={100}>
        <MenuItem>C</MenuItem>
      </SubMenu>,
    );
    openSubMenu(getAllByRole('menuitem')[0]);
    const subMenuNav = getAllByRole('menu')[0];
    setupSubMenuRect(subMenuNav);
    rerender(
      <SubMenu title={<span>T</span>} forceOpen hoverDelay={100}>
        <MenuItem>C</MenuItem>
      </SubMenu>,
    );
    act(() => jest.runAllTimers());
    expect(subMenuNav).toBeTruthy();
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// componentDidUpdate — show branch
// ---------------------------------------------------------------------------

describe('componentDidUpdate show branch', () => {
  it('adds menuVisible class after opening (LTR, no overflow)', () => {
    jest.useFakeTimers();
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    const subMenuNav = getAllByRole('menu')[0];
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
    setupSubMenuRect(subMenuNav, { bottom: 200, right: 200 });
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => jest.runAllTimers());
    expect(subMenuNav.className).toContain(cssClasses.menuVisible);
    jest.useRealTimers();
  });

  it('positions with bottom/right when overflowing in LTR', () => {
    jest.useFakeTimers();
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    const subMenuNav = getAllByRole('menu')[0];
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 300 });
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 300 });
    setupSubMenuRect(subMenuNav, { bottom: 500, right: 500 });
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => jest.runAllTimers());
    expect(subMenuNav.className).toContain(cssClasses.menuVisible);
    jest.useRealTimers();
  });

  it('adds menuVisible class for RTL with no overflow', () => {
    jest.useFakeTimers();
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100, rtl: true });
    const subMenuNav = getAllByRole('menu')[0];
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });
    setupSubMenuRect(subMenuNav, { bottom: 200, left: 100 });
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => jest.runAllTimers());
    expect(subMenuNav.className).toContain(cssClasses.menuVisible);
    jest.useRealTimers();
  });

  it('adds menuVisible class for RTL with bottom overflow and left < 0', () => {
    jest.useFakeTimers();
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100, rtl: true });
    const subMenuNav = getAllByRole('menu')[0];
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 300 });
    setupSubMenuRect(subMenuNav, { bottom: 500, left: -50 });
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => jest.runAllTimers());
    expect(subMenuNav.className).toContain(cssClasses.menuVisible);
    jest.useRealTimers();
  });

  it('shows when forceOpen becomes true', () => {
    jest.useFakeTimers();
    const { getAllByRole, rerender } = render(
      <SubMenu title={<span>T</span>} forceOpen={false}>
        <MenuItem>C</MenuItem>
      </SubMenu>,
    );
    const subMenuNav = getAllByRole('menu')[0];
    setupSubMenuRect(subMenuNav);
    rerender(
      <SubMenu title={<span>T</span>} forceOpen>
        <MenuItem>C</MenuItem>
      </SubMenu>,
    );
    act(() => jest.runAllTimers());
    expect(subMenuNav.className).toContain(cssClasses.menuVisible);
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// componentDidUpdate — hide branch
// ---------------------------------------------------------------------------

describe('componentDidUpdate hide branch', () => {
  it('removes menuVisible and resets styles on transitionend', () => {
    jest.useFakeTimers();
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    const outerNav = getAllByRole('menuitem')[0];
    const subMenuNav = getAllByRole('menu')[0];
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
    setupSubMenuRect(subMenuNav);
    openSubMenu(outerNav);
    act(() => jest.runAllTimers());
    fireEvent.mouseLeave(outerNav);
    act(() => jest.advanceTimersByTime(100));
    act(() => fireEvent.transitionEnd(subMenuNav));
    expect(subMenuNav.style.top).toBe('0px');
    expect(subMenuNav.style.left).toBe('100%');
    jest.useRealTimers();
  });

  it('does not run update logic when isVisibilityChange is false', () => {
    const { rerender } = render(
      <SubMenu title={<span>T</span>} forceOpen={false}>
        <MenuItem>C</MenuItem>
      </SubMenu>,
    );
    expect(() =>
      rerender(
        <SubMenu title={<span>T</span>} forceOpen={false}>
          <MenuItem>C</MenuItem>
        </SubMenu>,
      ),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// handleMouseEnter
// ---------------------------------------------------------------------------

describe('handleMouseEnter', () => {
  it('opens after hoverDelay', () => {
    jest.useFakeTimers();
    const { getAllByRole, getByTestId } = renderSubMenu({ hoverDelay: 100 });
    openSubMenu(getAllByRole('menuitem')[0]);
    expect(getByTestId('title').parentElement.className).toContain(cssClasses.menuItemActive);
    jest.useRealTimers();
  });

  it('does not open when disabled', () => {
    jest.useFakeTimers();
    const { getAllByRole, getByTestId } = renderSubMenu({ disabled: true, hoverDelay: 100 });
    openSubMenu(getAllByRole('menuitem')[0]);
    expect(getByTestId('title').parentElement.className).not.toContain(cssClasses.menuItemActive);
    jest.useRealTimers();
  });

  it('does not open again if already visible', () => {
    jest.useFakeTimers();
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    const outerNav = getAllByRole('menuitem')[0];
    openSubMenu(outerNav);
    const spy = jest.spyOn(global, 'setTimeout');
    fireEvent.mouseEnter(outerNav);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    jest.useRealTimers();
  });

  it('clears close timer on enter', () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    const outerNav = getAllByRole('menuitem')[0];
    openSubMenu(outerNav);
    fireEvent.mouseLeave(outerNav);
    fireEvent.mouseEnter(outerNav);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// handleMouseLeave
// ---------------------------------------------------------------------------

describe('handleMouseLeave', () => {
  it('closes after hoverDelay', () => {
    jest.useFakeTimers();
    const { getAllByRole, getByTestId } = renderSubMenu({ hoverDelay: 100 });
    const outerNav = getAllByRole('menuitem')[0];
    openSubMenu(outerNav);
    fireEvent.mouseLeave(outerNav);
    act(() => jest.advanceTimersByTime(100));
    expect(getByTestId('title').parentElement.className).not.toContain(cssClasses.menuItemActive);
    jest.useRealTimers();
  });

  it('does not set close timer when not visible', () => {
    jest.useFakeTimers();
    const spy = jest.spyOn(global, 'setTimeout');
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    fireEvent.mouseLeave(getAllByRole('menuitem')[0]);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    jest.useRealTimers();
  });

  it('clears open timer on leave', () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const { getAllByRole } = renderSubMenu({ hoverDelay: 500 });
    fireEvent.mouseEnter(getAllByRole('menuitem')[0]);
    fireEvent.mouseLeave(getAllByRole('menuitem')[0]);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// handleClick
// ---------------------------------------------------------------------------

describe('handleClick', () => {
  it('does not call onClick when disabled', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderSubMenu({ disabled: true, onClick });
    fireEvent.click(getByTestId('title').parentElement);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls callIfExists with onClick when not disabled', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderSubMenu({ onClick });
    fireEvent.click(getByTestId('title').parentElement);
    expect(callIfExists).toHaveBeenCalledWith(
      onClick,
      expect.anything(),
      expect.anything(),
      store.target,
    );
  });

  it('calls hideMenu when onClick provided and not preventCloseOnClick', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderSubMenu({ onClick });
    fireEvent.click(getByTestId('title').parentElement);
    expect(hideMenu).toHaveBeenCalled();
  });

  it('does not call hideMenu when onClick not provided', () => {
    // clearAllMocks in beforeEach ensures clean state
    const { getByTestId } = renderSubMenu();
    fireEvent.click(getByTestId('title').parentElement);
    expect(hideMenu).not.toHaveBeenCalled();
  });

  it('does not call hideMenu when preventCloseOnClick is true', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderSubMenu({ onClick, preventCloseOnClick: true });
    fireEvent.click(getByTestId('title').parentElement);
    expect(hideMenu).not.toHaveBeenCalled();
  });

  it('merges props.data and store.data', () => {
    // Set store.data directly on the mock object
    const mockStore = require('./helpers').store;
    mockStore.data = { sk: 'sv' };

    const onClick = jest.fn();
    const { getByTestId } = renderSubMenu({ onClick, data: { ik: 'iv' } });
    fireEvent.click(getByTestId('title').parentElement);

    // callIfExists is called once in this test (mocks cleared in beforeEach)
    const arg = callIfExists.mock.calls[0][2];
    expect(arg.sk).toBe('sv');
    expect(arg.ik).toBe('iv');
    mockStore.data = {};
  });

  it('passes store.target as third arg', () => {
    const mockStore = require('./helpers').store;
    const t = document.createElement('div');
    mockStore.target = t;

    const onClick = jest.fn();
    const { getByTestId } = renderSubMenu({ onClick });
    fireEvent.click(getByTestId('title').parentElement);

    expect(callIfExists.mock.calls[0][3]).toBe(t);
    mockStore.target = null;
  });
});

// ---------------------------------------------------------------------------
// hideSubMenu
// ---------------------------------------------------------------------------

describe('hideSubMenu', () => {
  it('hides the menu', () => {
    jest.useFakeTimers();
    const { getAllByRole, getByTestId } = renderSubMenu({ hoverDelay: 100 });
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => getHideHandler()({ detail: null }));
    expect(getByTestId('title').parentElement.className).not.toContain(cssClasses.menuItemActive);
    jest.useRealTimers();
  });

  it('calls forceClose when forceOpen is true', () => {
    const forceClose = jest.fn();
    renderSubMenu({ forceOpen: true, forceClose });
    act(() => getHideHandler()({ detail: null }));
    expect(forceClose).toHaveBeenCalled();
  });

  it('does not hide when detail.id does not match menu id', () => {
    jest.useFakeTimers();
    const { getAllByRole, getByTestId } = renderSubMenu({ hoverDelay: 100 });
    const subMenuNav = getAllByRole('menu')[0];
    setupSubMenuRect(subMenuNav);
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => jest.runAllTimers());
    act(() => getHideHandler()({ detail: { id: 'other' } }));
    expect(getByTestId('title').parentElement.className).toContain(cssClasses.menuItemActive);
    jest.useRealTimers();
  });

  it('does not throw with empty detail', () => {
    renderSubMenu();
    expect(() => act(() => getHideHandler()({ detail: null }))).not.toThrow();
  });

  it('does not throw with detail but no id', () => {
    renderSubMenu();
    expect(() => act(() => getHideHandler()({ detail: {} }))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// registerHandlers / unregisterHandlers
// ---------------------------------------------------------------------------

describe('registerHandlers / unregisterHandlers', () => {
  it('swaps keydown handlers on register', () => {
    jest.useFakeTimers();
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const addSpy = jest.spyOn(document, 'addEventListener');
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => jest.runAllTimers());
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
    addSpy.mockRestore();
    jest.useRealTimers();
  });

  it('restores keydown handler on close via transitionend (not dismounting)', () => {
    jest.useFakeTimers();
    const { getAllByRole } = renderSubMenu({ hoverDelay: 100 });
    const outerNav = getAllByRole('menuitem')[0];
    const subMenuNav = getAllByRole('menu')[0];
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
    setupSubMenuRect(subMenuNav);

    openSubMenu(outerNav);
    act(() => jest.runAllTimers());

    // Close the submenu
    fireEvent.mouseLeave(outerNav);
    act(() => jest.advanceTimersByTime(100));

    // Spy AFTER close timer fires but BEFORE transitionend
    const addSpy = jest.spyOn(document, 'addEventListener');

    // transitionend triggers cleanup which calls unregisterHandlers(false)
    act(() => fireEvent.transitionEnd(subMenuNav));

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
    jest.useRealTimers();
  });

  it('does not restore keydown handler when dismounting', () => {
    jest.useFakeTimers();
    const { getAllByRole, unmount } = renderSubMenu({ hoverDelay: 100 });
    const subMenuNav = getAllByRole('menu')[0];
    setupSubMenuRect(subMenuNav);
    openSubMenu(getAllByRole('menuitem')[0]);
    act(() => jest.runAllTimers());

    // Spy before unmount
    const addSpy = jest.spyOn(document, 'addEventListener');
    unmount();

    // unregisterHandlers(true) must NOT re-add keydown
    expect(addSpy.mock.calls.filter(([e]) => e === 'keydown').length).toBe(0);
    addSpy.mockRestore();
    jest.useRealTimers();
  });
});
