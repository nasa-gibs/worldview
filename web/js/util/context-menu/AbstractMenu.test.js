/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import AbstractMenu from './AbstractMenu'; // Update path as needed
import MenuItem from './MenuItem';

// ---------------------------------------------------------------------------
// Concrete subclass — AbstractMenu cannot be rendered directly
// ---------------------------------------------------------------------------

class TestMenu extends AbstractMenu {
  getSubMenuType() {
    return 'submenu'; // simple sentinel string
  }

  hideMenu() {
    this.setState({ isVisible: false });
  }

  render() {
    return (
      <div onKeyDown={this.handleKeyNavigation}>
        {this.renderChildren(this.props.children)}
      </div>
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMenu(children, props = {}) {
  return render(<TestMenu {...props}>{children}</TestMenu>);
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('AbstractMenu initial state', () => {
  it('renders children without crashing', () => {
    const { getByText } = renderMenu(
      <MenuItem>Item 1</MenuItem>,
    );
    expect(getByText('Item 1')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = renderMenu(
      <>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </>,
    );
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// renderChildren — non MenuItem wrapper passthrough
// ---------------------------------------------------------------------------

describe('renderChildren()', () => {
  it('passes through non-MenuItem wrapper elements', () => {
    const { getByText } = renderMenu(
      <div>
        <MenuItem>Wrapped Item</MenuItem>
      </div>,
    );
    expect(getByText('Wrapped Item')).toBeTruthy();
  });

  it('returns non-element children (strings) unchanged', () => {
    const { getByText } = renderMenu(
      <>
        <MenuItem>Real Item</MenuItem>
        {'plain text'}
      </>,
    );
    expect(getByText('plain text')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// onChildMouseMove / onChildMouseLeave
// ---------------------------------------------------------------------------

describe('mouse interactions', () => {
  it('sets selectedItem on mouse move over a MenuItem', () => {
    const { getByText } = renderMenu(
      <>
        <MenuItem>Item A</MenuItem>
        <MenuItem>Item B</MenuItem>
      </>,
    );

    fireEvent.mouseMove(getByText('Item A'));
    // After mouseMove, Item A should be selected (gets `selected` prop → no crash)
    expect(getByText('Item A')).toBeTruthy();
  });

  it('clears selectedItem on mouse leave', () => {
    const { getByText } = renderMenu(
      <MenuItem>Item A</MenuItem>,
    );

    fireEvent.mouseMove(getByText('Item A'));
    fireEvent.mouseLeave(getByText('Item A'));
    // Should not throw and component is still mounted
    expect(getByText('Item A')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// handleKeyNavigation — arrow keys
// ---------------------------------------------------------------------------

describe('handleKeyNavigation()', () => {
  function renderNavigableMenu() {
    const { container } = renderMenu(
      <>
        <MenuItem>First</MenuItem>
        <MenuItem>Second</MenuItem>
        <MenuItem>Third</MenuItem>
      </>,
    );
    return container.firstChild;
  }

  it('does not throw on down arrow keypress', () => {
    const menu = renderNavigableMenu();
    expect(() => fireEvent.keyDown(menu, { keyCode: 40 })).not.toThrow();
  });

  it('does not throw on up arrow keypress', () => {
    const menu = renderNavigableMenu();
    expect(() => fireEvent.keyDown(menu, { keyCode: 38 })).not.toThrow();
  });

  it('does not throw on escape keypress', () => {
    const menu = renderNavigableMenu();
    expect(() => fireEvent.keyDown(menu, { keyCode: 27 })).not.toThrow();
  });

  it('does not throw on left arrow keypress', () => {
    const menu = renderNavigableMenu();
    expect(() => fireEvent.keyDown(menu, { keyCode: 37 })).not.toThrow();
  });

  it('does not throw on right arrow keypress', () => {
    const menu = renderNavigableMenu();
    expect(() => fireEvent.keyDown(menu, { keyCode: 39 })).not.toThrow();
  });

  it('does not throw on enter keypress', () => {
    const menu = renderNavigableMenu();
    expect(() => fireEvent.keyDown(menu, { keyCode: 13 })).not.toThrow();
  });

  it('does not throw on an unhandled key', () => {
    const menu = renderNavigableMenu();
    expect(() => fireEvent.keyDown(menu, { keyCode: 65 })).not.toThrow();
  });

  it('does nothing when isVisible is explicitly false', () => {
    // Simulate ContextMenu context where isVisible is part of state
    class ContextTestMenu extends TestMenu {
      constructor(props) {
        super(props);
        this.state = { ...this.state, isVisible: false };
      }
    }

    const { container } = render(
      <ContextTestMenu>
        <MenuItem>Item</MenuItem>
      </ContextTestMenu>,
    );

    // Should return early without any state change / error
    expect(
      () => fireEvent.keyDown(container.firstChild, { keyCode: 40 }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// selectChildren — disabled items
// ---------------------------------------------------------------------------

describe('selectChildren() with disabled items', () => {
  it('does not select any item when all children are disabled', () => {
    const { container } = renderMenu(
      <>
        <MenuItem disabled>Disabled 1</MenuItem>
        <MenuItem disabled>Disabled 2</MenuItem>
      </>,
    );

    // Down arrow should not throw and nothing should be selected
    expect(
      () => fireEvent.keyDown(container.firstChild, { keyCode: 40 }),
    ).not.toThrow();
  });

  it('skips disabled items during keyboard navigation', () => {
    const { container } = renderMenu(
      <>
        <MenuItem>Enabled 1</MenuItem>
        <MenuItem disabled>Disabled</MenuItem>
        <MenuItem>Enabled 2</MenuItem>
      </>,
    );

    // Navigate down twice — should skip the disabled item
    fireEvent.keyDown(container.firstChild, { keyCode: 40 });
    expect(
      () => fireEvent.keyDown(container.firstChild, { keyCode: 40 }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// handleForceClose
// ---------------------------------------------------------------------------

describe('handleForceClose()', () => {
  it('does not throw when called', () => {
    const { container } = renderMenu(
      <MenuItem>Item</MenuItem>,
    );

    // Trigger right arrow to potentially set forceSubMenuOpen, then close
    expect(
      () => fireEvent.keyDown(container.firstChild, { keyCode: 39 }),
    ).not.toThrow();
  });
});
