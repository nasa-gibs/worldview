/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent, act } from '@testing-library/react';
import ContextMenuTrigger from './ContextMenuTrigger'; // Update path as needed
import { showMenu, hideMenu } from './actions';
import { cssClasses } from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('./actions', () => ({
  showMenu: jest.fn(),
  hideMenu: jest.fn(),
}));

jest.mock('./helpers', () => ({
  callIfExists: jest.fn((fn, ...args) => fn && fn(...args)),
  cssClasses: {
    menuWrapper: 'react-contextmenu-wrapper',
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MENU_ID = 'test-menu';

function renderTrigger(props = {}) {
  return render(
    <ContextMenuTrigger id={MENU_ID} {...props}>
      <span data-testid="child">Right click me</span>
    </ContextMenuTrigger>,
  );
}

function rightClickEvent(overrides = {}) {
  return { button: 2, clientX: 100, clientY: 200, ...overrides };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ContextMenuTrigger rendering', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders a div wrapper by default', () => {
    const { container } = renderTrigger();
    expect(container.firstChild.tagName).toBe('DIV');
  });

  it('renders a custom tag when renderTag is provided', () => {
    const { container } = renderTrigger({ renderTag: 'span' });
    expect(container.firstChild.tagName).toBe('SPAN');
  });

  it('applies the menuWrapper cssClass', () => {
    const { container } = renderTrigger();
    expect(container.firstChild.className).toContain(cssClasses.menuWrapper);
  });

  it('applies additional className from attributes prop', () => {
    const { container } = renderTrigger({ attributes: { className: 'extra-class' } });
    expect(container.firstChild.className).toContain('extra-class');
  });

  it('renders children', () => {
    const { getByTestId } = renderTrigger();
    expect(getByTestId('child')).toBeTruthy();
  });

  it('passes through additional attributes to the wrapper element', () => {
    const { container } = renderTrigger({ attributes: { 'data-custom': 'value' } });
    expect(container.firstChild.getAttribute('data-custom')).toBe('value');
  });
});

// ---------------------------------------------------------------------------
// handleContextMenu
// ---------------------------------------------------------------------------

describe('handleContextMenu()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls showMenu on right-click (button 2)', () => {
    const { container } = renderTrigger();
    fireEvent.contextMenu(container.firstChild, rightClickEvent());
    expect(showMenu).toHaveBeenCalled();
  });

  it('calls hideMenu before showMenu', () => {
    const callOrder = [];
    hideMenu.mockImplementation(() => callOrder.push('hide'));
    showMenu.mockImplementation(() => callOrder.push('show'));

    const { container } = renderTrigger();
    fireEvent.contextMenu(container.firstChild, rightClickEvent());

    expect(callOrder).toEqual(['hide', 'show']);
  });

  it('does not call showMenu when mouseButton does not match', () => {
    const { container } = renderTrigger({ mouseButton: 0 });
    fireEvent.contextMenu(container.firstChild, rightClickEvent({ button: 2 }));
    expect(showMenu).not.toHaveBeenCalled();
  });

  it('calls the onContextMenu attribute callback', () => {
    const onContextMenu = jest.fn();
    const { container } = renderTrigger({ attributes: { onContextMenu } });
    fireEvent.contextMenu(container.firstChild, rightClickEvent());
    expect(onContextMenu).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleContextClick
// ---------------------------------------------------------------------------

describe('handleContextClick()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not call showMenu when disable is true', () => {
    const { container } = renderTrigger({ disable: true });
    fireEvent.contextMenu(container.firstChild, rightClickEvent());
    expect(showMenu).not.toHaveBeenCalled();
  });

  it('does not call showMenu when disableIfShiftIsPressed and shiftKey is true', () => {
    const { container } = renderTrigger({ disableIfShiftIsPressed: true });
    fireEvent.contextMenu(container.firstChild, rightClickEvent({ shiftKey: true }));
    expect(showMenu).not.toHaveBeenCalled();
  });

  it('calls showMenu when disableIfShiftIsPressed but shiftKey is false', () => {
    const { container } = renderTrigger({ disableIfShiftIsPressed: true });
    fireEvent.contextMenu(container.firstChild, rightClickEvent({ shiftKey: false }));
    expect(showMenu).toHaveBeenCalled();
  });

  it('passes position x/y from clientX/clientY to showMenu', () => {
    const { container } = renderTrigger();
    fireEvent.contextMenu(container.firstChild, rightClickEvent({ clientX: 150, clientY: 250 }));
    const config = showMenu.mock.calls[0][0];
    expect(config.position.x).toBe(150);
    expect(config.position.y).toBe(250);
  });

  it('subtracts posX and posY offsets from position', () => {
    const { container } = renderTrigger({ posX: 10, posY: 20 });
    fireEvent.contextMenu(container.firstChild, rightClickEvent({ clientX: 150, clientY: 250 }));
    const config = showMenu.mock.calls[0][0];
    expect(config.position.x).toBe(140);
    expect(config.position.y).toBe(230);
  });

  it('passes the menu id to showMenu', () => {
    const { container } = renderTrigger();
    fireEvent.contextMenu(container.firstChild, rightClickEvent());
    const config = showMenu.mock.calls[0][0];
    expect(config.id).toBe(MENU_ID);
  });

  it('includes data from collect function in showMenu config', () => {
    const collect = jest.fn(() => ({ customKey: 'customValue' }));
    const { container } = renderTrigger({ collect });
    fireEvent.contextMenu(container.firstChild, rightClickEvent());
    const config = showMenu.mock.calls[0][0];
    expect(config.data.customKey).toBe('customValue');
  });

  it('handles a Promise returned from collect', async () => {
    const collect = jest.fn(() => Promise.resolve({ asyncKey: 'asyncValue' }));
    const { container } = renderTrigger({ collect });

    await act(async () => {
      fireEvent.contextMenu(container.firstChild, rightClickEvent());
    });

    const config = showMenu.mock.calls[0][0];
    expect(config.data.asyncKey).toBe('asyncValue');
  });
});

// ---------------------------------------------------------------------------
// handleMouseClick
// ---------------------------------------------------------------------------

describe('handleMouseClick()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls showMenu when mouseButton is 0 and left click occurs', () => {
    const { container } = renderTrigger({ mouseButton: 0 });
    fireEvent.click(container.firstChild, { button: 0, clientX: 100, clientY: 200 });
    expect(showMenu).toHaveBeenCalled();
  });

  it('does not call showMenu when button does not match mouseButton', () => {
    const { container } = renderTrigger({ mouseButton: 0 });
    fireEvent.click(container.firstChild, { button: 2 });
    expect(showMenu).not.toHaveBeenCalled();
  });

  it('calls the onClick attribute callback', () => {
    const onClick = jest.fn();
    const { container } = renderTrigger({ mouseButton: 0, attributes: { onClick } });
    fireEvent.click(container.firstChild, { button: 0, clientX: 100, clientY: 200 });
    expect(onClick).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleMouseDown / handleMouseUp / handleMouseOut
// ---------------------------------------------------------------------------

describe('handleMouseDown()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the onMouseDown attribute callback', () => {
    const onMouseDown = jest.fn();
    const { container } = renderTrigger({ attributes: { onMouseDown } });
    fireEvent.mouseDown(container.firstChild, { button: 0 });
    expect(onMouseDown).toHaveBeenCalled();
  });

  it('triggers context click after holdToDisplay timeout on left click', () => {
    jest.useFakeTimers();
    const { container } = renderTrigger({ holdToDisplay: 500 });

    fireEvent.mouseDown(container.firstChild, {
      button: 0,
      clientX: 100,
      clientY: 200,
      persist: jest.fn(),
      stopPropagation: jest.fn(),
    });

    act(() => jest.advanceTimersByTime(500));

    expect(showMenu).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not trigger hold timeout when holdToDisplay is -1', () => {
    jest.useFakeTimers();
    const { container } = renderTrigger({ holdToDisplay: -1 });

    fireEvent.mouseDown(container.firstChild, { button: 0 });

    act(() => jest.advanceTimersByTime(2000));

    expect(showMenu).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe('handleMouseUp()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cancels the hold timeout on mouse up', () => {
    jest.useFakeTimers();
    const { container } = renderTrigger({ holdToDisplay: 500 });

    fireEvent.mouseDown(container.firstChild, {
      button: 0,
      clientX: 100,
      clientY: 200,
      persist: jest.fn(),
      stopPropagation: jest.fn(),
    });

    fireEvent.mouseUp(container.firstChild, { button: 0 });
    act(() => jest.advanceTimersByTime(500));

    expect(showMenu).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('calls the onMouseUp attribute callback', () => {
    const onMouseUp = jest.fn();
    const { container } = renderTrigger({ attributes: { onMouseUp } });
    fireEvent.mouseUp(container.firstChild, { button: 0 });
    expect(onMouseUp).toHaveBeenCalled();
  });
});

describe('handleMouseOut()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cancels the hold timeout on mouse out', () => {
    jest.useFakeTimers();
    const { container } = renderTrigger({ holdToDisplay: 500 });

    fireEvent.mouseDown(container.firstChild, {
      button: 0,
      clientX: 100,
      clientY: 200,
      persist: jest.fn(),
      stopPropagation: jest.fn(),
    });

    fireEvent.mouseOut(container.firstChild, { button: 0 });
    act(() => jest.advanceTimersByTime(500));

    expect(showMenu).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('calls the onMouseOut attribute callback', () => {
    const onMouseOut = jest.fn();
    const { container } = renderTrigger({ attributes: { onMouseOut } });
    fireEvent.mouseOut(container.firstChild, { button: 0 });
    expect(onMouseOut).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleTouchstart / handleTouchEnd
// ---------------------------------------------------------------------------

describe('handleTouchstart()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('triggers context click after holdToDisplay timeout on touch', () => {
    jest.useFakeTimers();
    const { container } = renderTrigger({ holdToDisplay: 500 });

    fireEvent.touchStart(container.firstChild, {
      touches: [{ pageX: 100, pageY: 200 }],
      persist: jest.fn(),
      stopPropagation: jest.fn(),
    });

    act(() => jest.advanceTimersByTime(500));

    expect(showMenu).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not trigger when holdToDisplay is -1', () => {
    jest.useFakeTimers();
    const { container } = renderTrigger({ holdToDisplay: -1 });

    fireEvent.touchStart(container.firstChild, {
      touches: [{ pageX: 100, pageY: 200 }],
    });

    act(() => jest.advanceTimersByTime(2000));

    expect(showMenu).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('calls the onTouchStart attribute callback', () => {
    const onTouchStart = jest.fn();
    const { container } = renderTrigger({ attributes: { onTouchStart } });
    fireEvent.touchStart(container.firstChild);
    expect(onTouchStart).toHaveBeenCalled();
  });
});

describe('handleTouchEnd()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cancels the touch hold timeout on touch end', () => {
    jest.useFakeTimers();
    const { container } = renderTrigger({ holdToDisplay: 500 });

    fireEvent.touchStart(container.firstChild, {
      touches: [{ pageX: 100, pageY: 200 }],
      persist: jest.fn(),
      stopPropagation: jest.fn(),
    });

    fireEvent.touchEnd(container.firstChild);
    act(() => jest.advanceTimersByTime(500));

    expect(showMenu).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('calls the onTouchEnd attribute callback', () => {
    const onTouchEnd = jest.fn();
    const { container } = renderTrigger({ attributes: { onTouchEnd } });
    fireEvent.touchEnd(container.firstChild);
    expect(onTouchEnd).toHaveBeenCalled();
  });
});
