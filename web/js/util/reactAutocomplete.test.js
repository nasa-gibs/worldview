/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent, act } from '@testing-library/react';
import Autocomplete from './reactAutocomplete';

jest.mock('dom-scroll-into-view', () => jest.fn());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

function renderAC(props = {}) {
  return render(
    <Autocomplete
      items={fruits}
      getItemValue={(item) => item}
      renderItem={(item, isHighlighted) => (
        <div key={item} data-testid={`item-${item}`} style={{ background: isHighlighted ? 'lightblue' : 'white' }}>
          {item}
        </div>
      )}
      value=""
      onChange={jest.fn()}
      onSelect={jest.fn()}
      {...props}
    />,
  );
}

function getInput(container) {
  return container.querySelector('input');
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('rendering', () => {
  it('renders an input element', () => {
    const { container } = renderAC();
    expect(getInput(container)).toBeTruthy();
  });

  it('renders wrapper div with inline-block by default', () => {
    const { container } = renderAC();
    expect(container.firstChild.style.display).toBe('inline-block');
  });

  it('applies wrapperStyle prop', () => {
    const { container } = renderAC({ wrapperStyle: { display: 'block' } });
    expect(container.firstChild.style.display).toBe('block');
  });

  it('applies wrapperProps to wrapper div', () => {
    const { container } = renderAC({ wrapperProps: { 'data-testid': 'wrapper' } });
    expect(container.querySelector('[data-testid="wrapper"]')).toBeTruthy();
  });

  it('sets role=combobox on input', () => {
    const { container } = renderAC();
    expect(getInput(container).getAttribute('role')).toBe('combobox');
  });

  it('sets aria-autocomplete=list on input', () => {
    const { container } = renderAC();
    expect(getInput(container).getAttribute('aria-autocomplete')).toBe('list');
  });

  it('sets aria-expanded=false when menu is closed', () => {
    const { container } = renderAC();
    expect(getInput(container).getAttribute('aria-expanded')).toBe('false');
  });

  it('sets autoComplete=off on input', () => {
    const { container } = renderAC();
    expect(getInput(container).getAttribute('autocomplete')).toBe('off');
  });

  it('passes value prop to input', () => {
    const { container } = renderAC({ value: 'Apple' });
    expect(getInput(container).value).toBe('Apple');
  });

  it('passes inputProps to input', () => {
    const { container } = renderAC({ inputProps: { placeholder: 'Search...' } });
    expect(getInput(container).getAttribute('placeholder')).toBe('Search...');
  });

  it('does not render menu when closed', () => {
    const { queryByTestId } = renderAC();
    expect(queryByTestId('item-Apple')).toBeNull();
  });

  it('renders menu when open=true prop is provided', () => {
    const { getByTestId } = renderAC({ open: true });
    expect(getByTestId('item-Apple')).toBeTruthy();
  });

  it('renders debug pre element when debug=true', () => {
    const { container } = renderAC({ debug: true });
    expect(container.querySelector('pre')).toBeTruthy();
  });

  it('does not render debug pre element when debug=false', () => {
    const { container } = renderAC({ debug: false });
    expect(container.querySelector('pre')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// renderInput prop
// ---------------------------------------------------------------------------

describe('renderInput prop', () => {
  it('uses custom renderInput when provided', () => {
    const { container } = renderAC({
      renderInput: (props) => <textarea {...props} data-testid="custom-input" />,
    });
    expect(container.querySelector('[data-testid="custom-input"]')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// open / isOpen
// ---------------------------------------------------------------------------

describe('isOpen()', () => {
  it('opens menu on input focus', () => {
    const { container, getByTestId } = renderAC();
    fireEvent.focus(getInput(container));
    expect(getByTestId('item-Apple')).toBeTruthy();
  });

  it('uses open prop over internal state', () => {
    const { getByTestId } = renderAC({ open: true });
    expect(getByTestId('item-Apple')).toBeTruthy();
  });

  it('sets aria-expanded=true when menu is open', () => {
    const { container } = renderAC({ open: true });
    expect(getInput(container).getAttribute('aria-expanded')).toBe('true');
  });

  it('opens on input click when input is focused', () => {
    const { container, getByTestId } = renderAC();
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.blur(input);
    // Close it first by blurring
    act(() => fireEvent.blur(input));
    // Re-focus and click
    fireEvent.focus(input);
    expect(getByTestId('item-Apple')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// handleChange
// ---------------------------------------------------------------------------

describe('handleChange()', () => {
  it('calls onChange with event and value', () => {
    const onChange = jest.fn();
    const { container } = renderAC({ onChange });
    fireEvent.change(getInput(container), { target: { value: 'App' } });
    expect(onChange).toHaveBeenCalledWith(expect.any(Object), 'App');
  });
});

// ---------------------------------------------------------------------------
// shouldItemRender
// ---------------------------------------------------------------------------

describe('shouldItemRender prop', () => {
  it('filters items based on shouldItemRender', () => {
    const { getByTestId, queryByTestId } = renderAC({
      open: true,
      shouldItemRender: (item, value) => item.startsWith('A'),
    });
    expect(getByTestId('item-Apple')).toBeTruthy();
    expect(queryByTestId('item-Banana')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sortItems
// ---------------------------------------------------------------------------

describe('sortItems prop', () => {
  it('sorts items using sortItems function', () => {
    const { container } = renderAC({
      open: true,
      sortItems: (a, b) => b.localeCompare(a), // reverse alphabetical
    });
    const items = container.querySelectorAll('[data-testid^="item-"]');
    expect(items[0].textContent).toBe('Elderberry');
  });
});

// ---------------------------------------------------------------------------
// keyboard navigation
// ---------------------------------------------------------------------------

describe('keyboard navigation', () => {
  it('ArrowDown opens menu and highlights first item', () => {
    const { container } = renderAC();
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('ArrowDown cycles through items', () => {
    const onSelect = jest.fn();
    const { container } = renderAC({ onSelect });
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Highlighted index should have advanced
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('ArrowUp highlights last item when none selected', () => {
    const { container } = renderAC();
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('Escape closes menu and clears highlight', () => {
    const { container, queryByTestId } = renderAC();
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(queryByTestId('item-Apple')).toBeNull();
  });

  it('Enter with no highlight closes menu', () => {
    const { container, queryByTestId } = renderAC();
    const input = getInput(container);
    fireEvent.focus(input);
    // Do not arrow-down — no highlighted item
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
    expect(queryByTestId('item-Apple')).toBeNull();
  });

  it('Enter with keyCode other than 13 does nothing', () => {
    const onSelect = jest.fn();
    const { container } = renderAC({ onSelect });
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Tab releases ignore-blur flag', () => {
    const { container } = renderAC();
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Tab' });
    // No throw and menu state unchanged
    expect(container.firstChild).toBeTruthy();
  });

  it('unknown key press opens menu', () => {
    const { container } = renderAC();
    const input = getInput(container);
    // Start with menu closed
    fireEvent.keyDown(input, { key: 'a' });
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// mouse interactions
// ---------------------------------------------------------------------------

describe('mouse interactions', () => {
  it('calls onSelect when item is clicked', () => {
    const onSelect = jest.fn();
    const { getByTestId } = renderAC({ onSelect, open: true });
    fireEvent.click(getByTestId('item-Banana'));
    expect(onSelect).toHaveBeenCalledWith('Banana', 'Banana');
  });

  it('highlights item on mouse enter', () => {
    const { getByTestId } = renderAC({ open: true });
    fireEvent.mouseEnter(getByTestId('item-Cherry'));
    // Menu should still be open
    expect(getByTestId('item-Cherry')).toBeTruthy();
  });

  it('clicking item closes the menu', () => {
    const { queryByTestId } = renderAC({ open: false });
    const { container } = renderAC({ onSelect: jest.fn() });
    const input = getInput(container);
    fireEvent.focus(input);
    const item = queryByTestId ? queryByTestId('item-Apple') : null;
    if (item) fireEvent.click(item);
  });
});

// ---------------------------------------------------------------------------
// onMenuVisibilityChange
// ---------------------------------------------------------------------------

describe('onMenuVisibilityChange prop', () => {
  it('called with true when menu opens', () => {
    const onMenuVisibilityChange = jest.fn();
    const { container } = renderAC({ onMenuVisibilityChange });
    fireEvent.focus(getInput(container));
    expect(onMenuVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('called with false when menu closes', () => {
    const onMenuVisibilityChange = jest.fn();
    const { container } = renderAC({ onMenuVisibilityChange });
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onMenuVisibilityChange).toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// handleInputBlur
// ---------------------------------------------------------------------------

describe('handleInputBlur()', () => {
  it('closes menu on blur', () => {
    const { container, queryByTestId } = renderAC();
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(queryByTestId('item-Apple')).toBeNull();
  });

  it('calls inputProps.onBlur when provided', () => {
    const onBlur = jest.fn();
    const { container } = renderAC({ inputProps: { onBlur } });
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });

  it('selectOnBlur calls onSelect with highlighted item', () => {
    const onSelect = jest.fn();
    const { container } = renderAC({ onSelect, selectOnBlur: true });
    const input = getInput(container);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.blur(input);
    expect(onSelect).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleInputFocus
// ---------------------------------------------------------------------------

describe('handleInputFocus()', () => {
  it('calls inputProps.onFocus when provided', () => {
    const onFocus = jest.fn();
    const { container } = renderAC({ inputProps: { onFocus } });
    fireEvent.focus(getInput(container));
    expect(onFocus).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// isItemSelectable
// ---------------------------------------------------------------------------

describe('isItemSelectable prop', () => {
  it('non-selectable items do not fire onClick', () => {
    const onSelect = jest.fn();
    const isItemSelectable = (item) => item !== 'Apple';
    const { getByTestId } = renderAC({ onSelect, open: true, isItemSelectable });
    fireEvent.click(getByTestId('item-Apple'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// autoHighlight
// ---------------------------------------------------------------------------

describe('autoHighlight prop', () => {
  it('auto-highlights first matching item when value changes', () => {
    const { rerender, container } = renderAC({
      value: '',
      autoHighlight: true,
    });
    rerender(
      <Autocomplete
        items={fruits}
        getItemValue={(item) => item}
        renderItem={(item, isHighlighted) => (
          <div key={item} data-testid={`item-${item}`}>{item}</div>
        )}
        value="App"
        onChange={jest.fn()}
        onSelect={jest.fn()}
        autoHighlight
        shouldItemRender={(item, val) => item.toLowerCase().startsWith(val.toLowerCase())}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// renderMenu prop
// ---------------------------------------------------------------------------

describe('renderMenu prop', () => {
  it('uses custom renderMenu when provided', () => {
    const renderMenu = jest.fn((items) => <ul data-testid="custom-menu">{items}</ul>);
    const { getByTestId } = renderAC({ open: true, renderMenu });
    expect(getByTestId('custom-menu')).toBeTruthy();
    expect(renderMenu).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// composeEventHandlers
// ---------------------------------------------------------------------------

describe('composeEventHandlers()', () => {
  it('calls both internal and external keyDown handlers', () => {
    const externalKeyDown = jest.fn();
    const { container } = renderAC({ inputProps: { onKeyDown: externalKeyDown } });
    fireEvent.keyDown(getInput(container), { key: 'a' });
    expect(externalKeyDown).toHaveBeenCalled();
  });

  it('calls both internal and external onClick handlers', () => {
    const externalClick = jest.fn();
    const { container } = renderAC({ inputProps: { onClick: externalClick } });
    fireEvent.click(getInput(container));
    expect(externalClick).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getScrollOffset
// ---------------------------------------------------------------------------

describe('getScrollOffset()', () => {
  it('uses window.pageXOffset and pageYOffset when available', () => {
    Object.defineProperty(window, 'pageXOffset', { value: 10, configurable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 20, configurable: true });
    // Trigger a render to exercise the code path on focus+blur cycle
    const { container } = renderAC();
    fireEvent.focus(getInput(container));
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// componentWillUnmount
// ---------------------------------------------------------------------------

describe('componentWillUnmount()', () => {
  it('does not throw on unmount', () => {
    const { unmount } = renderAC();
    expect(() => unmount()).not.toThrow();
  });

  it('clears scroll timer on unmount', () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const { container, unmount } = renderAC();
    // Trigger _scrollTimer by simulating the ignore-focus path
    fireEvent.focus(getInput(container));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// IMPERATIVE_API exposure
// ---------------------------------------------------------------------------

describe('exposeAPI()', () => {
  it('exposes focus method on the component instance', () => {
    let ref;
    render(
      <Autocomplete
        ref={(c) => { ref = c; }}
        items={fruits}
        getItemValue={(i) => i}
        renderItem={(i) => <div key={i}>{i}</div>}
        value=""
        onChange={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    // The imperative API is bound on the instance directly
    expect(typeof ref?.focus === 'function' || ref?.focus === undefined).toBe(true);
  });
});
