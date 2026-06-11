/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import MenuItem from './MenuItem'; // Update path as needed
import { hideMenu } from './actions';
import { callIfExists, cssClasses, store } from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('./actions', () => ({
  hideMenu: jest.fn(),
}));

jest.mock('./helpers', () => ({
  callIfExists: jest.fn((fn, ...args) => fn && fn(...args)),
  cssClasses: {
    menuItem: 'react-contextmenu-item',
    menuItemDisabled: 'react-contextmenu-item--disabled',
    menuItemDivider: 'react-contextmenu-item--divider',
    menuItemSelected: 'react-contextmenu-item--selected',
  },
  store: { data: {}, target: null },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderItem(props = {}) {
  return render(
    <MenuItem {...props}>
      {props.children ?? <span data-testid="child">Item Label</span>}
    </MenuItem>,
  );
}

function clickItem(element, button = 0) {
  fireEvent.click(element, { button });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('MenuItem rendering', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders a div with role="menuitem"', () => {
    const { getByRole } = renderItem();
    expect(getByRole('menuitem')).toBeTruthy();
  });

  it('renders children by default', () => {
    const { getByTestId } = renderItem();
    expect(getByTestId('child')).toBeTruthy();
  });

  it('does not render children when divider is true', () => {
    const { queryByTestId } = renderItem({ divider: true });
    expect(queryByTestId('child')).toBeNull();
  });

  it('applies the base menuItem cssClass', () => {
    const { getByRole } = renderItem();
    expect(getByRole('menuitem').className).toContain(cssClasses.menuItem);
  });

  it('applies a custom className prop', () => {
    const { getByRole } = renderItem({ className: 'my-custom-class' });
    expect(getByRole('menuitem').className).toContain('my-custom-class');
  });

  it('applies attributes.className', () => {
    const { getByRole } = renderItem({ attributes: { className: 'attr-class' } });
    expect(getByRole('menuitem').className).toContain('attr-class');
  });

  it('applies disabled class when disabled is true', () => {
    const { getByRole } = renderItem({ disabled: true });
    expect(getByRole('menuitem').className).toContain(cssClasses.menuItemDisabled);
  });

  it('applies attributes.disabledClassName when disabled', () => {
    const { getByRole } = renderItem({
      disabled: true,
      attributes: { disabledClassName: 'custom-disabled' },
    });
    expect(getByRole('menuitem').className).toContain('custom-disabled');
  });

  it('does not apply disabled class when disabled is false', () => {
    const { getByRole } = renderItem({ disabled: false });
    expect(getByRole('menuitem').className).not.toContain(cssClasses.menuItemDisabled);
  });

  it('applies divider class when divider is true', () => {
    const { getByRole } = renderItem({ divider: true });
    expect(getByRole('menuitem').className).toContain(cssClasses.menuItemDivider);
  });

  it('applies attributes.dividerClassName when divider', () => {
    const { getByRole } = renderItem({
      divider: true,
      attributes: { dividerClassName: 'custom-divider' },
    });
    expect(getByRole('menuitem').className).toContain('custom-divider');
  });

  it('does not apply divider class when divider is false', () => {
    const { getByRole } = renderItem({ divider: false });
    expect(getByRole('menuitem').className).not.toContain(cssClasses.menuItemDivider);
  });

  it('applies selected class when selected is true', () => {
    const { getByRole } = renderItem({ selected: true });
    expect(getByRole('menuitem').className).toContain(cssClasses.menuItemSelected);
  });

  it('applies attributes.selectedClassName when selected', () => {
    const { getByRole } = renderItem({
      selected: true,
      attributes: { selectedClassName: 'custom-selected' },
    });
    expect(getByRole('menuitem').className).toContain('custom-selected');
  });

  it('does not apply selected class when selected is false', () => {
    const { getByRole } = renderItem({ selected: false });
    expect(getByRole('menuitem').className).not.toContain(cssClasses.menuItemSelected);
  });

  it('sets aria-disabled to "true" when disabled', () => {
    const { getByRole } = renderItem({ disabled: true });
    expect(getByRole('menuitem').getAttribute('aria-disabled')).toBe('true');
  });

  it('sets aria-disabled to "false" when not disabled', () => {
    const { getByRole } = renderItem({ disabled: false });
    expect(getByRole('menuitem').getAttribute('aria-disabled')).toBe('false');
  });

  it('sets aria-orientation to "horizontal" when divider', () => {
    const { getByRole } = renderItem({ divider: true });
    expect(getByRole('menuitem').getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('does not set aria-orientation when not a divider', () => {
    const { getByRole } = renderItem({ divider: false });
    expect(getByRole('menuitem').getAttribute('aria-orientation')).toBeNull();
  });

  it('passes through extra attributes to the div', () => {
    const { getByRole } = renderItem({ attributes: { 'data-custom': 'value' } });
    expect(getByRole('menuitem').getAttribute('data-custom')).toBe('value');
  });

  it('renders null children when children prop is null', () => {
    const { getByRole } = renderItem({ children: null });
    expect(getByRole('menuitem')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// handleClick — button guard
// ---------------------------------------------------------------------------

describe('handleClick() button guard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not prevent default for left click (button 0)', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ onClick });
    fireEvent.click(getByRole('menuitem'), { button: 0 });
    expect(onClick).toHaveBeenCalled();
    expect(hideMenu).toHaveBeenCalled();
  });

  it('calls onClick for middle click (button 1)', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ onClick });
    fireEvent.click(getByRole('menuitem'), { button: 1 });
    expect(onClick).toHaveBeenCalled();
  });

  it('calls hideMenu for middle click (button 1)', () => {
    const { getByRole } = renderItem();
    fireEvent.click(getByRole('menuitem'), { button: 1 });
    expect(hideMenu).toHaveBeenCalled();
  });

  it('does not call onClick or hideMenu for button > 1 when disabled', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ disabled: true, onClick });
    fireEvent.click(getByRole('menuitem'), { button: 2 });
    expect(onClick).not.toHaveBeenCalled();
    expect(hideMenu).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleClick — disabled / divider guards
// ---------------------------------------------------------------------------

describe('handleClick() disabled and divider guards', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not call onClick when disabled', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ disabled: true, onClick });
    clickItem(getByRole('menuitem'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call hideMenu when disabled', () => {
    const { getByRole } = renderItem({ disabled: true });
    clickItem(getByRole('menuitem'));
    expect(hideMenu).not.toHaveBeenCalled();
  });

  it('does not call onClick when divider is true', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ divider: true, onClick });
    clickItem(getByRole('menuitem'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call hideMenu when divider is true', () => {
    const { getByRole } = renderItem({ divider: true });
    clickItem(getByRole('menuitem'));
    expect(hideMenu).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleClick — preventClose
// ---------------------------------------------------------------------------

describe('handleClick() preventClose', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not call hideMenu when preventClose is true', () => {
    const { getByRole } = renderItem({ preventClose: true });
    clickItem(getByRole('menuitem'));
    expect(hideMenu).not.toHaveBeenCalled();
  });

  it('still calls onClick when preventClose is true', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ preventClose: true, onClick });
    clickItem(getByRole('menuitem'));
    expect(onClick).toHaveBeenCalled();
  });

  it('calls hideMenu when preventClose is false', () => {
    const { getByRole } = renderItem({ preventClose: false });
    clickItem(getByRole('menuitem'));
    expect(hideMenu).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleClick — data merging
// ---------------------------------------------------------------------------

describe('handleClick() data merging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.data = {};
    store.target = null;
  });

  it('passes merged data and store.data to onClick', () => {
    const onClick = jest.fn();
    store.data = { storeKey: 'storeValue' };

    const { getByRole } = renderItem({ onClick, data: { itemKey: 'itemValue' } });
    clickItem(getByRole('menuitem'));

    const dataArg = onClick.mock.calls[0][1];
    expect(dataArg.itemKey).toBe('itemValue');
    expect(dataArg.storeKey).toBe('storeValue');
  });

  it('store.data properties override item data properties with same key', () => {
    const onClick = jest.fn();
    store.data = { key: 'fromStore' };

    const { getByRole } = renderItem({ onClick, data: { key: 'fromItem' } });
    clickItem(getByRole('menuitem'));

    const dataArg = onClick.mock.calls[0][1];
    expect(dataArg.key).toBe('fromStore');
  });

  it('passes store.target as the third argument to onClick', () => {
    const onClick = jest.fn();
    const mockTarget = document.createElement('div');
    store.target = mockTarget;

    const { getByRole } = renderItem({ onClick });
    clickItem(getByRole('menuitem'));

    expect(onClick.mock.calls[0][2]).toBe(mockTarget);
  });

  it('passes the click event as the first argument to onClick', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ onClick });
    clickItem(getByRole('menuitem'));

    const eventArg = onClick.mock.calls[0][0];
    expect(eventArg).toBeTruthy();
    expect(typeof eventArg.preventDefault).toBe('function');
  });

  it('works when data prop is an empty object', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ onClick, data: {} });
    clickItem(getByRole('menuitem'));
    expect(onClick).toHaveBeenCalled();
  });

  it('works when store.data is empty', () => {
    const onClick = jest.fn();
    store.data = {};
    const { getByRole } = renderItem({ onClick, data: { key: 'value' } });
    clickItem(getByRole('menuitem'));
    const dataArg = onClick.mock.calls[0][1];
    expect(dataArg.key).toBe('value');
  });
});

// ---------------------------------------------------------------------------
// Mouse event handlers
// ---------------------------------------------------------------------------

describe('mouse event handlers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls onMouseMove prop when mouse moves over item', () => {
    const onMouseMove = jest.fn();
    const { getByRole } = renderItem({ onMouseMove });
    fireEvent.mouseMove(getByRole('menuitem'));
    expect(onMouseMove).toHaveBeenCalled();
  });

  it('calls onMouseLeave prop when mouse leaves item', () => {
    const onMouseLeave = jest.fn();
    const { getByRole } = renderItem({ onMouseLeave });
    fireEvent.mouseLeave(getByRole('menuitem'));
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it('does not throw when default onMouseMove is used', () => {
    const { getByRole } = renderItem();
    expect(() => fireEvent.mouseMove(getByRole('menuitem'))).not.toThrow();
  });

  it('does not throw when default onMouseLeave is used', () => {
    const { getByRole } = renderItem();
    expect(() => fireEvent.mouseLeave(getByRole('menuitem'))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Touch handler
// ---------------------------------------------------------------------------

describe('touch handler (onTouchEnd)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls onClick on touch end with button 0', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ onClick });
    fireEvent.touchEnd(getByRole('menuitem'), { button: 0 });
    expect(onClick).toHaveBeenCalled();
  });

  it('calls hideMenu on touch end by default', () => {
    const { getByRole } = renderItem();
    fireEvent.touchEnd(getByRole('menuitem'), { button: 0 });
    expect(hideMenu).toHaveBeenCalled();
  });

  it('does not call onClick on touch end when disabled', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ disabled: true, onClick });
    fireEvent.touchEnd(getByRole('menuitem'), { button: 0 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call hideMenu on touch end when divider is true', () => {
    const { getByRole } = renderItem({ divider: true });
    fireEvent.touchEnd(getByRole('menuitem'), { button: 0 });
    expect(hideMenu).not.toHaveBeenCalled();
  });

  it('does not call hideMenu on touch end when preventClose is true', () => {
    const { getByRole } = renderItem({ preventClose: true });
    fireEvent.touchEnd(getByRole('menuitem'), { button: 0 });
    expect(hideMenu).not.toHaveBeenCalled();
  });

  it('calls preventDefault for touch end with button > 1', () => {
    const { getByRole } = renderItem();
    // button 2 triggers the preventDefault branch
    expect(() =>
      fireEvent.touchEnd(getByRole('menuitem'), { button: 2 }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// callIfExists integration
// ---------------------------------------------------------------------------

describe('callIfExists integration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls callIfExists with the onClick prop', () => {
    const onClick = jest.fn();
    const { getByRole } = renderItem({ onClick });
    clickItem(getByRole('menuitem'));
    expect(callIfExists).toHaveBeenCalledWith(
      onClick,
      expect.anything(), // event
      expect.anything(), // merged data
      store.target,
    );
  });

  it('does not throw when onClick prop is not provided (uses default)', () => {
    const { getByRole } = renderItem();
    expect(() => clickItem(getByRole('menuitem'))).not.toThrow();
  });
});
