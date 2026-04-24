/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent, act } from '@testing-library/react';
import ContextMenu from './ContextMenu'; // Update path as needed
import listener from './globalEventListener';
import { hideMenu } from './actions';
import { cssClasses } from './helpers';
import MenuItem from './MenuItem';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('./globalEventListener', () => ({
  register: jest.fn(() => 'mock-listen-id'),
  unregister: jest.fn(),
}));

jest.mock('./actions', () => ({
  hideMenu: jest.fn(),
  showMenu: jest.fn(),
}));

jest.mock('./helpers', () => ({
  cssClasses: {
    menu: 'react-contextmenu',
    menuVisible: 'react-contextmenu--visible',
  },
  callIfExists: jest.fn((fn, ...args) => fn && fn(...args)),
  store: { data: {}, target: null },
}));

jest.mock('./SubMenu', () => 'SubMenu');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MENU_ID = 'test-menu';

function renderMenu(props = {}) {
  return render(
    <ContextMenu id={MENU_ID} {...props}>
      <MenuItem>Item 1</MenuItem>
      <MenuItem>Item 2</MenuItem>
    </ContextMenu>,
  );
}

// Retrieve the handleShow/handleHide callbacks registered with the listener
function getRegisteredHandlers() {
  const [handleShow, handleHide] = listener.register.mock.calls[
    listener.register.mock.calls.length - 1
  ];
  return { handleShow, handleHide };
}

function makeShowEvent(id = MENU_ID, x = 100, y = 200) {
  return { detail: { id, position: { x, y } } };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ContextMenu rendering', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders a nav element with role="menu"', () => {
    const { getByRole } = renderMenu();
    expect(getByRole('menu')).toBeTruthy();
  });

  it('applies the base cssClass to the nav', () => {
    const { getByRole } = renderMenu();
    expect(getByRole('menu').className).toContain(cssClasses.menu);
  });

  it('applies a custom className prop', () => {
    const { getByRole } = renderMenu({ className: 'my-custom-class' });
    expect(getByRole('menu').className).toContain('my-custom-class');
  });

  it('is not visible by default (no visible class)', () => {
    const { getByRole } = renderMenu();
    expect(getByRole('menu').className).not.toContain(cssClasses.menuVisible);
  });

  it('renders children', () => {
    const { getByText } = renderMenu();
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });

  it('applies inline style with position fixed and opacity 0 when hidden', () => {
    const { getByRole } = renderMenu();
    const nav = getByRole('menu');
    expect(nav.style.position).toBe('fixed');
    expect(nav.style.opacity).toBe('0');
    expect(nav.style.pointerEvents).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Lifecycle — listener registration
// ---------------------------------------------------------------------------

describe('lifecycle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers with globalEventListener on mount', () => {
    renderMenu();
    expect(listener.register).toHaveBeenCalledTimes(1);
  });

  it('passes two functions to listener.register', () => {
    renderMenu();
    const [a, b] = listener.register.mock.calls[0];
    expect(typeof a).toBe('function');
    expect(typeof b).toBe('function');
  });

  it('unregisters listener on unmount', () => {
    const { unmount } = renderMenu();
    unmount();
    expect(listener.unregister).toHaveBeenCalledWith('mock-listen-id');
  });

  it('does not call unregister if listenId is falsy', () => {
    listener.register.mockReturnValueOnce(null);
    const { unmount } = renderMenu();
    unmount();
    expect(listener.unregister).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleShow
// ---------------------------------------------------------------------------

describe('handleShow()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds the visible class when id matches', () => {
    const { getByRole } = renderMenu();
    const { handleShow } = getRegisteredHandlers();

    act(() => handleShow(makeShowEvent()));

    expect(getByRole('menu').className).toContain(cssClasses.menuVisible);
  });

  it('does not show when id does not match', () => {
    const { getByRole } = renderMenu();
    const { handleShow } = getRegisteredHandlers();

    act(() => handleShow(makeShowEvent('other-menu')));

    expect(getByRole('menu').className).not.toContain(cssClasses.menuVisible);
  });

  it('does not show when menu is already visible', () => {
    const { getByRole } = renderMenu();
    const { handleShow } = getRegisteredHandlers();

    act(() => handleShow(makeShowEvent()));
    act(() => handleShow(makeShowEvent())); // second call — already visible

    expect(getByRole('menu').className).toContain(cssClasses.menuVisible);
  });

  it('calls onShow prop when shown', () => {
    const onShow = jest.fn();
    renderMenu({ onShow });
    const { handleShow } = getRegisteredHandlers();

    const event = makeShowEvent();
    act(() => handleShow(event));

    expect(onShow).toHaveBeenCalled();
  });

  it('registers document handlers when shown', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    renderMenu();
    const { handleShow } = getRegisteredHandlers();

    act(() => handleShow(makeShowEvent()));

    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
  });

  it('does not register scroll handler when preventHideOnScroll is true', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    renderMenu({ preventHideOnScroll: true });
    const { handleShow } = getRegisteredHandlers();

    act(() => handleShow(makeShowEvent()));

    const scrollCalls = addSpy.mock.calls.filter(([ev]) => ev === 'scroll');
    expect(scrollCalls.length).toBe(0);
    addSpy.mockRestore();
  });

  it('does not register contextmenu handler when preventHideOnContextMenu is true', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    renderMenu({ preventHideOnContextMenu: true });
    const { handleShow } = getRegisteredHandlers();

    act(() => handleShow(makeShowEvent()));

    const ctxCalls = addSpy.mock.calls.filter(([ev]) => ev === 'contextmenu');
    expect(ctxCalls.length).toBe(0);
    addSpy.mockRestore();
  });

  it('does not register resize handler when preventHideOnResize is true', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    renderMenu({ preventHideOnResize: true });
    const { handleShow } = getRegisteredHandlers();

    act(() => handleShow(makeShowEvent()));

    const resizeCalls = addSpy.mock.calls.filter(([ev]) => ev === 'resize');
    expect(resizeCalls.length).toBe(0);
    addSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// handleHide
// ---------------------------------------------------------------------------

describe('handleHide()', () => {
  beforeEach(() => jest.clearAllMocks());

  function showAndGetHandlers(extraProps = {}) {
    const utils = renderMenu(extraProps);
    const handlers = getRegisteredHandlers();
    act(() => handlers.handleShow(makeShowEvent()));
    return { utils, ...handlers };
  }

  it('hides the menu when called without detail', () => {
    const { utils, handleHide } = showAndGetHandlers();
    act(() => handleHide({}));
    expect(utils.getByRole('menu').className).not.toContain(cssClasses.menuVisible);
  });

  it('hides the menu when detail.id matches', () => {
    const { utils, handleHide } = showAndGetHandlers();
    act(() => handleHide({ detail: { id: MENU_ID } }));
    expect(utils.getByRole('menu').className).not.toContain(cssClasses.menuVisible);
  });

  it('does not hide when detail.id is a different menu', () => {
    const { utils, handleHide } = showAndGetHandlers();
    act(() => handleHide({ detail: { id: 'other-menu' } }));
    expect(utils.getByRole('menu').className).toContain(cssClasses.menuVisible);
  });

  it('calls onHide prop when hidden', () => {
    const onHide = jest.fn();
    const { handleHide } = showAndGetHandlers({ onHide });
    act(() => handleHide({}));
    expect(onHide).toHaveBeenCalled();
  });

  it('unregisters document handlers when hidden', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { handleHide } = showAndGetHandlers();
    act(() => handleHide({}));
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('does nothing when menu is already hidden', () => {
    renderMenu();
    const { handleHide } = getRegisteredHandlers();
    const onHide = jest.fn();

    // menu was never shown — handleHide should be a no-op
    act(() => handleHide({}));
    expect(onHide).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleOutsideClick
// ---------------------------------------------------------------------------

describe('handleOutsideClick()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls hideMenu when click is outside the menu', () => {
    renderMenu();
    const { handleShow } = getRegisteredHandlers();
    act(() => handleShow(makeShowEvent()));

    // Click on an element outside the menu
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    act(() => fireEvent.mouseDown(outside));

    expect(hideMenu).toHaveBeenCalled();
    document.body.removeChild(outside);
  });

  it('does not call hideMenu when click is inside the menu', () => {
    const { getByText } = renderMenu();
    const { handleShow } = getRegisteredHandlers();
    act(() => handleShow(makeShowEvent()));

    act(() => fireEvent.mouseDown(getByText('Item 1')));

    expect(hideMenu).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleMouseLeave
// ---------------------------------------------------------------------------

describe('handleMouseLeave()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls onMouseLeave prop', () => {
    const onMouseLeave = jest.fn();
    const { getByRole } = renderMenu({ onMouseLeave });
    act(() => fireEvent.mouseLeave(getByRole('menu')));
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it('calls hideMenu when hideOnLeave is true', () => {
    const { getByRole } = renderMenu({ hideOnLeave: true });
    act(() => fireEvent.mouseLeave(getByRole('menu')));
    expect(hideMenu).toHaveBeenCalled();
  });

  it('does not call hideMenu when hideOnLeave is false', () => {
    const { getByRole } = renderMenu({ hideOnLeave: false });
    act(() => fireEvent.mouseLeave(getByRole('menu')));
    expect(hideMenu).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleContextMenu
// ---------------------------------------------------------------------------

describe('handleContextMenu()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not throw when right-clicking inside the menu', () => {
    const { getByRole } = renderMenu();
    expect(() => act(() => fireEvent.contextMenu(getByRole('menu')))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// hideMenu (keyboard)
// ---------------------------------------------------------------------------

describe('hideMenu() keyboard handler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls hideMenu on Escape key (27)', () => {
    renderMenu();
    const { handleShow } = getRegisteredHandlers();
    act(() => handleShow(makeShowEvent()));

    act(() => fireEvent.keyDown(document, { keyCode: 27 }));

    expect(hideMenu).toHaveBeenCalled();
  });

  it('calls hideMenu on Enter key (13)', () => {
    renderMenu();
    const { handleShow } = getRegisteredHandlers();
    act(() => handleShow(makeShowEvent()));

    act(() => fireEvent.keyDown(document, { keyCode: 13 }));

    expect(hideMenu).toHaveBeenCalled();
  });

  it('does not call hideMenu on other keys', () => {
    renderMenu();
    const { handleShow } = getRegisteredHandlers();
    act(() => handleShow(makeShowEvent()));

    act(() => fireEvent.keyDown(document, { keyCode: 65 })); // 'a'

    expect(hideMenu).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getMenuPosition
// ---------------------------------------------------------------------------

describe('getMenuPosition()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns default top/left when no menu ref exists', () => {
    const menu = new ContextMenu({ id: MENU_ID, children: [] });
    menu.menu = null;
    const pos = menu.getMenuPosition(50, 80);
    expect(pos).toEqual({ top: 80, left: 50 });
  });

  it('adjusts left when menu would overflow right edge', () => {
    const menu = new ContextMenu({ id: MENU_ID, children: [] });
    menu.menu = {
      getBoundingClientRect: () => ({ width: 200, height: 100 }),
    };
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 300 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 600 });

    const pos = menu.getMenuPosition(250, 100); // 250 + 200 > 300
    expect(pos.left).toBeLessThan(250);
  });

  it('adjusts top when menu would overflow bottom edge', () => {
    const menu = new ContextMenu({ id: MENU_ID, children: [] });
    menu.menu = {
      getBoundingClientRect: () => ({ width: 100, height: 200 }),
    };
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 300 });

    const pos = menu.getMenuPosition(50, 250); // 250 + 200 > 300
    expect(pos.top).toBeLessThan(250);
  });
});

// ---------------------------------------------------------------------------
// getRTLMenuPosition
// ---------------------------------------------------------------------------

describe('getRTLMenuPosition()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns default top/left when no menu ref exists', () => {
    const menu = new ContextMenu({ id: MENU_ID, children: [] });
    menu.menu = null;
    const pos = menu.getRTLMenuPosition(50, 80);
    expect(pos).toEqual({ top: 80, left: 50 });
  });

  it('positions menu to the left of the cursor in RTL mode', () => {
    const menu = new ContextMenu({ id: MENU_ID, children: [] });
    menu.menu = {
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
    };
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 600 });

    const pos = menu.getRTLMenuPosition(300, 100);
    expect(pos.left).toBe(200); // 300 - 100
  });
});
