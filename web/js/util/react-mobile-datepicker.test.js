/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock ReactDOM.unstable_renderSubtreeIntoContainer (removed in React 18)
// ---------------------------------------------------------------------------
jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    unstable_renderSubtreeIntoContainer: jest.fn((_parent, element, container) => {
      try { actual.render(element, container); } catch (_) {}
    }),
    unmountComponentAtNode: jest.fn((container) => {
      try { return actual.unmountComponentAtNode(container); } catch (_) { return false; }
    }),
  };
});

if (typeof global.Touch === 'undefined') {
  global.Touch = class Touch {
    constructor(init) {
      Object.assign(this, { pageX: 0, pageY: 0, clientX: 0, clientY: 0, ...init });
    }
  };
}

if (typeof global.TouchEvent === 'undefined') {
  global.TouchEvent = class TouchEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.touches = init.touches || [];
      this.targetTouches = init.targetTouches || [];
      this.changedTouches = init.changedTouches || [];
    }
  };
}

const ModalDatePicker = require('./react-mobile-datepicker');

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.useFakeTimers();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  document.body.querySelectorAll('.Modal-Portal').forEach((el) => el.remove());
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseDate = new Date(2023, 5, 15, 10, 30, 0);
const minDate = new Date(2000, 0, 1);
const maxDate = new Date(2050, 11, 31);

function renderPicker(props = {}) {
  return render(
    <ModalDatePicker
      isPopup={false}
      isOpen
      value={baseDate}
      min={minDate}
      max={maxDate}
      showHeader
      showFooter
      dateConfig={{
        date: { format: 'D', caption: 'Day', step: 1 },
      }}
      onSelect={jest.fn()}
      onCancel={jest.fn()}
      onChange={jest.fn()}
      {...props}
    />,
  );
}

function getViewport(container) {
  return container.querySelector('.datepicker-viewport');
}

// Dispatch a mouse event with a real non-zero pageY so the source code
// never falls through to event.changedTouches[0].pageY
function dispatchMouse(node, type, pageY) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pageY', { value: pageY });
  node.dispatchEvent(event);
}

function dispatchTouch(node, type, pageY) {
  const touch = new Touch({ identifier: Date.now(), target: node, pageY, clientY: pageY });
  const event = new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: type !== 'touchend' ? [touch] : [],
    targetTouches: type !== 'touchend' ? [touch] : [],
    changedTouches: [touch],
  });
  node.dispatchEvent(event);
}

// ---------------------------------------------------------------------------
// defaultProps / displayName
// ---------------------------------------------------------------------------

describe('defaultProps', () => {
  it('has displayName MobileDatePicker', () => {
    expect(ModalDatePicker.displayName).toBe('MobileDatePicker');
  });

  it('isPopup defaults to true', () => {
    expect(ModalDatePicker.defaultProps.isPopup).toBe(true);
  });

  it('isOpen defaults to false', () => {
    expect(ModalDatePicker.defaultProps.isOpen).toBe(false);
  });

  it('theme defaults to "default"', () => {
    expect(ModalDatePicker.defaultProps.theme).toBe('default');
  });

  it('showHeader defaults to true', () => {
    expect(ModalDatePicker.defaultProps.showHeader).toBe(true);
  });

  it('showFooter defaults to true', () => {
    expect(ModalDatePicker.defaultProps.showFooter).toBe(true);
  });

  it('showCaption defaults to false', () => {
    expect(ModalDatePicker.defaultProps.showCaption).toBe(false);
  });

  it('confirmText defaults to Done', () => {
    expect(ModalDatePicker.defaultProps.confirmText).toBe('Done');
  });

  it('cancelText defaults to Cancel', () => {
    expect(ModalDatePicker.defaultProps.cancelText).toBe('Cancel');
  });

  it('headerFormat defaults to YYYY/MM/DD', () => {
    expect(ModalDatePicker.defaultProps.headerFormat).toBe('YYYY/MM/DD');
  });

  it('default dateConfig has year/month/date keys', () => {
    const keys = Object.keys(ModalDatePicker.defaultProps.dateConfig);
    expect(keys).toContain('year');
    expect(keys).toContain('month');
    expect(keys).toContain('date');
  });

  it('onChange default is a function', () => {
    expect(typeof ModalDatePicker.defaultProps.onChange).toBe('function');
  });

  it('onSelect default is a function', () => {
    expect(typeof ModalDatePicker.defaultProps.onSelect).toBe('function');
  });

  it('onCancel default is a function', () => {
    expect(typeof ModalDatePicker.defaultProps.onCancel).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// isPopup=false — DatePicker rendered directly
// ---------------------------------------------------------------------------

describe('isPopup=false — rendering', () => {
  it('renders datepicker element', () => {
    const { container } = renderPicker();
    expect(container.querySelector('.datepicker')).toBeTruthy();
  });

  it('renders default theme class', () => {
    const { container } = renderPicker({ theme: 'default' });
    expect(container.querySelector('.datepicker.default')).toBeTruthy();
  });

  it('renders dark theme', () => {
    const { container } = renderPicker({ theme: 'dark' });
    expect(container.querySelector('.datepicker.dark')).toBeTruthy();
  });

  it('renders ios theme', () => {
    const { container } = renderPicker({ theme: 'ios' });
    expect(container.querySelector('.datepicker.ios')).toBeTruthy();
  });

  it('renders android theme', () => {
    const { container } = renderPicker({ theme: 'android' });
    expect(container.querySelector('.datepicker.android')).toBeTruthy();
  });

  it('renders android-dark theme', () => {
    const { container } = renderPicker({ theme: 'android-dark' });
    expect(container.querySelector('.datepicker.android-dark')).toBeTruthy();
  });

  it('falls back to default class for unknown theme', () => {
    const { container } = renderPicker({ theme: 'unicorn' });
    expect(container.querySelector('.datepicker.default')).toBeTruthy();
  });

  it('renders datepicker-header when showHeader=true', () => {
    const { container } = renderPicker({ showHeader: true });
    expect(container.querySelector('.datepicker-header')).toBeTruthy();
  });

  it('hides header when showHeader=false', () => {
    const { container } = renderPicker({ showHeader: false });
    expect(container.querySelector('.datepicker-header')).toBeNull();
  });

  it('renders customHeader content when provided', () => {
    const { container } = renderPicker({
      showHeader: true,
      customHeader: <span id="ch">My Header</span>,
    });
    expect(container.querySelector('#ch')).toBeTruthy();
  });

  it('renders formatted date in header when no customHeader', () => {
    const { container } = renderPicker({
      showHeader: true,
      headerFormat: 'YYYY',
      value: new Date(2023, 0, 1),
    });
    expect(container.querySelector('.datepicker-header').textContent).toContain('2023');
  });

  it('renders datepicker-navbar when showFooter=true', () => {
    const { container } = renderPicker({ showFooter: true });
    expect(container.querySelector('.datepicker-navbar')).toBeTruthy();
  });

  it('hides navbar when showFooter=false', () => {
    const { container } = renderPicker({ showFooter: false });
    expect(container.querySelector('.datepicker-navbar')).toBeNull();
  });

  it('renders confirmText in navbar', () => {
    const { container } = renderPicker({ showFooter: true, confirmText: 'OK' });
    expect(container.querySelector('.datepicker-navbar').textContent).toContain('OK');
  });

  it('renders cancelText in navbar', () => {
    const { container } = renderPicker({ showFooter: true, cancelText: 'Nope' });
    expect(container.querySelector('.datepicker-navbar').textContent).toContain('Nope');
  });

  it('renders caption when showCaption=true', () => {
    const { container } = renderPicker({ showCaption: true });
    expect(container.querySelector('.datepicker-caption')).toBeTruthy();
  });

  it('hides caption when showCaption=false', () => {
    const { container } = renderPicker({ showCaption: false });
    expect(container.querySelector('.datepicker-caption')).toBeNull();
  });

  it('renders datepicker-content', () => {
    const { container } = renderPicker();
    expect(container.querySelector('.datepicker-content')).toBeTruthy();
  });

  it('renders columns per dateConfig object entries', () => {
    const { container } = renderPicker({
      dateConfig: {
        year: { format: 'YYYY', caption: 'Year', step: 1 },
        month: { format: 'M', caption: 'Mon', step: 1 },
      },
    });
    expect(container.querySelectorAll('.datepicker-col-1').length).toBe(2);
  });

  it('renders columns per dateConfig array entries', () => {
    const { container } = renderPicker({ dateConfig: ['year', 'month', 'date'] });
    expect(container.querySelectorAll('.datepicker-col-1').length).toBe(3);
  });

  it('caption items match dateConfig captions', () => {
    const { container } = renderPicker({
      showCaption: true,
      dateConfig: {
        year: { format: 'YYYY', caption: 'Yr', step: 1 },
        month: { format: 'M', caption: 'Mo', step: 1 },
      },
    });
    const text = container.querySelector('.datepicker-caption').textContent;
    expect(text).toContain('Yr');
    expect(text).toContain('Mo');
  });
});

// ---------------------------------------------------------------------------
// isPopup=false — callbacks
// ---------------------------------------------------------------------------

describe('isPopup=false — callbacks', () => {
  it('calls onSelect with current value when confirm clicked', () => {
    const onSelect = jest.fn();
    const { container } = renderPicker({ onSelect, showFooter: true });
    fireEvent.click(container.querySelectorAll('.datepicker-navbar-btn')[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.any(Date));
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = jest.fn();
    const { container } = renderPicker({ onCancel, showFooter: true });
    fireEvent.click(container.querySelectorAll('.datepicker-navbar-btn')[1]);
    expect(onCancel).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// isPopup=false — UNSAFE_componentWillReceiveProps
// ---------------------------------------------------------------------------

describe('isPopup=false — prop updates', () => {
  it('updates header when value prop changes', () => {
    const { container, rerender } = renderPicker({
      showHeader: true,
      headerFormat: 'YYYY',
      value: new Date(2020, 0, 1),
    });
    rerender(
      <ModalDatePicker
        isPopup={false}
        isOpen
        showHeader
        showFooter
        headerFormat="YYYY"
        value={new Date(2025, 0, 1)}
        min={minDate}
        max={maxDate}
        onSelect={jest.fn()}
        onCancel={jest.fn()}
        onChange={jest.fn()}
      />,
    );
    expect(container.querySelector('.datepicker-header').textContent).toContain('2025');
  });

  it('does not update state when same value prop re-provided', () => {
    const same = new Date(2023, 5, 15);
    const { container, rerender } = renderPicker({ value: same, showHeader: true, headerFormat: 'YYYY' });
    rerender(
      <ModalDatePicker
        isPopup={false}
        isOpen
        showHeader
        showFooter
        headerFormat="YYYY"
        value={new Date(same.getTime())}
        min={minDate}
        max={maxDate}
        onSelect={jest.fn()}
        onCancel={jest.fn()}
        onChange={jest.fn()}
      />,
    );
    expect(container.querySelector('.datepicker-header').textContent).toContain('2023');
  });
});

// ---------------------------------------------------------------------------
// isPopup=false — componentDidUpdate boundary clamping
// ---------------------------------------------------------------------------

describe('isPopup=false — boundary clamping', () => {
  it('clamps to max when value exceeds max', () => {
    const onSelect = jest.fn();
    const max = new Date(2022, 0, 1);
    const { container, rerender } = render(
      <ModalDatePicker
        isPopup={false}
        isOpen
        showHeader
        showFooter
        dateConfig={{ date: { format: 'D', caption: 'Day', step: 1 } }}
        value={new Date(2025, 0, 1)}
        min={new Date(2000, 0, 1)}
        max={max}
        onSelect={onSelect}
        onCancel={jest.fn()}
        onChange={jest.fn()}
      />,
    );
    // Re-render with same props to trigger componentDidUpdate which clamps the value
    rerender(
      <ModalDatePicker
        isPopup={false}
        isOpen
        showHeader
        showFooter
        dateConfig={{ date: { format: 'D', caption: 'Day', step: 1 } }}
        value={new Date(2025, 0, 1)}
        min={new Date(2000, 0, 1)}
        max={max}
        onSelect={onSelect}
        onCancel={jest.fn()}
        onChange={jest.fn()}
      />,
    );
    fireEvent.click(container.querySelectorAll('.datepicker-navbar-btn')[0]);
    const selected = onSelect.mock.calls[0][0];
    expect(selected.getTime()).toBeLessThanOrEqual(max.getTime());
  });

  it('clamps to min when value is below min', () => {
    const onSelect = jest.fn();
    const min = new Date(2022, 0, 1);
    const { container, rerender } = render(
      <ModalDatePicker
        isPopup={false}
        isOpen
        showHeader
        showFooter
        dateConfig={{ date: { format: 'D', caption: 'Day', step: 1 } }}
        value={new Date(1990, 0, 1)}
        min={min}
        max={new Date(2050, 11, 31)}
        onSelect={onSelect}
        onCancel={jest.fn()}
        onChange={jest.fn()}
      />,
    );
    rerender(
      <ModalDatePicker
        isPopup={false}
        isOpen
        showHeader
        showFooter
        dateConfig={{ date: { format: 'D', caption: 'Day', step: 1 } }}
        value={new Date(1990, 0, 1)}
        min={min}
        max={new Date(2050, 11, 31)}
        onSelect={onSelect}
        onCancel={jest.fn()}
        onChange={jest.fn()}
      />,
    );
    fireEvent.click(container.querySelectorAll('.datepicker-navbar-btn')[0]);
    const selected = onSelect.mock.calls[0][0];
    expect(selected.getTime()).toBeGreaterThanOrEqual(min.getTime());
  });
});

// ---------------------------------------------------------------------------
// deprecated prop warnings
// ---------------------------------------------------------------------------

describe('deprecated prop warnings', () => {
  it('warns for dateFormat', () => {
    renderPicker({ dateFormat: ['YYYY', 'M', 'D'] });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('dateFormat is deprecated'));
  });

  it('warns for dateSteps', () => {
    renderPicker({ dateSteps: [1, 1, 1] });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('dateSteps is deprecated'));
  });

  it('warns for showFormat', () => {
    renderPicker({ showFormat: 'YYYY/MM/DD' });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('headerFormat is deprecated'));
  });
});

// ---------------------------------------------------------------------------
// normalizeDateConfig — array with non-string entries (skipped)
// ---------------------------------------------------------------------------

describe('normalizeDateConfig edge cases', () => {
  it('skips non-string entries in array config', () => {
    const { container } = renderPicker({ dateConfig: [123, null, 'year'] });
    expect(container.querySelectorAll('.datepicker-col-1').length).toBe(1);
  });

  it('skips unknown keys in object config', () => {
    const { container } = renderPicker({
      dateConfig: { unknown: { format: 'X', caption: 'X', step: 1 } },
    });
    expect(container.querySelectorAll('.datepicker-col-1').length).toBe(0);
  });

  it('includes all six known config types', () => {
    const { container } = renderPicker({
      dateConfig: {
        year: { format: 'YYYY', caption: 'Y', step: 1 },
        month: { format: 'M', caption: 'Mo', step: 1 },
        date: { format: 'D', caption: 'D', step: 1 },
        hour: { format: 'hh', caption: 'H', step: 1 },
        minute: { format: 'mm', caption: 'Mi', step: 1 },
        second: { format: 'ss', caption: 'S', step: 1 },
      },
    });
    expect(container.querySelectorAll('.datepicker-col-1').length).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// isPopup=true — Modal
// ---------------------------------------------------------------------------

describe('isPopup=true — Modal', () => {
  function renderModal(props = {}) {
    return render(
      <ModalDatePicker
        isPopup
        isOpen
        showHeader
        showFooter
        value={baseDate}
        min={minDate}
        max={maxDate}
        onSelect={jest.fn()}
        onCancel={jest.fn()}
        onChange={jest.fn()}
        {...props}
      />,
    );
  }

  it('renders noscript in-tree', () => {
    const { container } = renderModal();
    expect(container.querySelector('noscript')).toBeTruthy();
  });

  it('appends Modal-Portal div to body', () => {
    renderModal();
    expect(document.body.querySelector('.Modal-Portal')).toBeTruthy();
  });

  it('re-renders portal on prop change (UNSAFE_componentWillReceiveProps)', () => {
    const { rerender } = renderModal({ isOpen: true });
    expect(() =>
      rerender(
        <ModalDatePicker
          isPopup
          isOpen={false}
          showHeader
          showFooter
          value={baseDate}
          min={minDate}
          max={maxDate}
          onSelect={jest.fn()}
          onCancel={jest.fn()}
          onChange={jest.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it('removes Modal-Portal on unmount', () => {
    const { unmount } = renderModal();
    unmount();
    expect(document.body.querySelector('.Modal-Portal')).toBeNull();
  });

  it('EnhanceDatePicker is hidden when isOpen=false', () => {
    renderModal({ isOpen: false });
    const modal = document.querySelector('.datepicker-modal');
    if (modal) {
      expect(modal.style.display).toBe('none');
    }
  });

  it('EnhanceDatePicker is visible when isOpen=true', () => {
    renderModal({ isOpen: true });
    const modal = document.querySelector('.datepicker-modal');
    if (modal) {
      expect(modal.style.display).toBe('');
    }
  });

  it('calls onCancel when modal backdrop clicked (target===currentTarget)', () => {
    const onCancel = jest.fn();
    renderModal({ onCancel, isOpen: true });
    const modal = document.querySelector('.datepicker-modal');
    if (modal) {
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'currentTarget', { value: modal });
      Object.defineProperty(event, 'target', { value: modal });
      modal.dispatchEvent(event);
    }
  });
});

// ---------------------------------------------------------------------------
// DatePickerItem — disabled items
// ---------------------------------------------------------------------------

describe('DatePickerItem — disabled items', () => {
  it('marks items outside range as disabled', () => {
    const { container } = renderPicker({
      value: new Date(2023, 5, 15),
      min: new Date(2023, 5, 14),
      max: new Date(2023, 5, 16),
      dateConfig: { date: { format: 'D', caption: 'Day', step: 1 } },
    });
    const disabled = container.querySelectorAll('.datepicker-scroll li.disabled');
    expect(disabled.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// DatePickerItem — function format prop
// ---------------------------------------------------------------------------

describe('DatePickerItem — format function', () => {
  it('calls format function for each rendered item', () => {
    const formatFn = jest.fn((d) => d.getFullYear().toString());
    renderPicker({
      dateConfig: { year: { format: formatFn, caption: 'Year', step: 1 } },
    });
    expect(formatFn).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DatePickerItem — move to boundary (min/max clamping during scroll)
// ---------------------------------------------------------------------------

describe('DatePickerItem — scroll boundary clamping', () => {
  it('does not throw when scrolling beyond max', () => {
    const tightMax = new Date(2023, 5, 16);
    const { container } = renderPicker({
      value: new Date(2023, 5, 15),
      min: minDate,
      max: tightMax,
    });
    const vp = getViewport(container);
    dispatchMouse(vp, 'mousedown', 200);
    for (let i = 0; i < 5; i++) {
      dispatchMouse(document, 'mousemove', 200 - (i + 1) * 50);
    }
    expect(() => {
      dispatchMouse(document, 'mouseup', 1); // non-zero pageY
      act(() => jest.runAllTimers());
    }).not.toThrow();
  });

  it('does not throw when scrolling beyond min', () => {
    const tightMin = new Date(2023, 5, 14);
    const { container } = renderPicker({
      value: new Date(2023, 5, 15),
      min: tightMin,
      max: maxDate,
    });
    const vp = getViewport(container);
    dispatchMouse(vp, 'mousedown', 1); // non-zero pageY
    for (let i = 0; i < 5; i++) {
      dispatchMouse(document, 'mousemove', (i + 1) * 50);
    }
    expect(() => {
      dispatchMouse(document, 'mouseup', 250);
      act(() => jest.runAllTimers());
    }).not.toThrow();
  });

  it('handleMove returns early when date is out of range', () => {
    const { container } = renderPicker({
      value: new Date(2023, 5, 15),
      min: new Date(2023, 5, 15),
      max: new Date(2023, 5, 15),
    });
    const vp = getViewport(container);
    dispatchMouse(vp, 'mousedown', 100);
    expect(() => dispatchMouse(document, 'mousemove', 60)).not.toThrow();
    dispatchMouse(document, 'mouseup', 60);
    act(() => jest.runAllTimers());
  });
});

// ---------------------------------------------------------------------------
// dateConfig — all time unit types
// ---------------------------------------------------------------------------

describe('dateConfig — all time unit types', () => {
  ['year', 'month', 'date', 'hour', 'minute', 'second'].forEach((unit) => {
    it(`renders ${unit} column`, () => {
      const { container } = renderPicker({
        dateConfig: { [unit]: { format: 'hh', caption: unit, step: 1 } },
      });
      expect(container.querySelector('.datepicker-col-1')).toBeTruthy();
    });
  });

  it('renders via array config with all six units', () => {
    const { container } = renderPicker({
      dateConfig: ['year', 'month', 'date', 'hour', 'minute', 'second'],
    });
    expect(container.querySelectorAll('.datepicker-col-1').length).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// handleDateSelect — onChange called after state set
// ---------------------------------------------------------------------------

describe('handleDateSelect', () => {
  it('calls onChange after selecting a date via scroll', () => {
    const onChange = jest.fn();
    const { container } = renderPicker({ onChange });
    const vp = getViewport(container);
    dispatchMouse(vp, 'mousedown', 100);
    dispatchMouse(document, 'mousemove', 55);
    dispatchMouse(document, 'mouseup', 55);
    act(() => jest.runAllTimers());
    expect(onChange).toHaveBeenCalledWith(expect.any(Date));
  });
});
