/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { act } from 'react-dom/test-utils';
import { render, fireEvent, screen } from '@testing-library/react';
import DateInputColumn from './date-input-column';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';

describe('DateInputColumn', () => {
  const getDefaultProps = () => ({
    date: new Date(2020, 0, 1),
    value: '1',
    fontSize: 14,
    idSuffix: 'test',
    isValid: true,
    isStartDate: false,
    isEndDate: false,
    isDisabled: false,
    isKioskModeActive: false,
    maxDate: new Date(2100, 0, 1),
    minDate: new Date(1970, 0, 1),
    onFocus: jest.fn(),
    updateDate: jest.fn(),
    updateTimeUnitInput: jest.fn(),
    subDailyMode: false,
    type: 'month',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('prevents default on enter, tab, and shift-tab in onKeyPress', () => {
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    DateInputColumn.onKeyPress({ keyCode: 13, preventDefault, stopPropagation, shiftKey: false });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();

    preventDefault.mockClear();
    stopPropagation.mockClear();

    DateInputColumn.onKeyPress({ keyCode: 9, preventDefault, stopPropagation, shiftKey: false });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();

    preventDefault.mockClear();
    stopPropagation.mockClear();

    DateInputColumn.onKeyPress({ keyCode: 9, preventDefault, stopPropagation, shiftKey: true });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('renders with initial props and updates value when props change', () => {
    const { rerender } = render(<DateInputColumn {...getDefaultProps()} />);
    const input = screen.getByRole('textbox');

    expect(input.value).toBe('1');
    expect(input.id).toBe('month-test');
    expect(input.getAttribute('size')).toBe('3');

    rerender(<DateInputColumn {...getDefaultProps()} value="12" />);
    expect(screen.getByRole('textbox').value).toBe('12');
  });

  it('adjusts size when type equals "year"', () => {
    render(<DateInputColumn {...getDefaultProps()} type="year" />);
    expect(screen.getByRole('textbox').getAttribute('size')).toBe('4');
  });

  it('adjusts size when type equals "month"', () => {
    render(<DateInputColumn {...getDefaultProps()} type="month" />);
    expect(screen.getByRole('textbox').getAttribute('size')).toBe('3');
  });

  it('moves focus to the next input for start date day and wraps to year end', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="day" isStartDate />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const next = document.createElement('input');
    next.id = 'year-test-end';
    next.focus = jest.fn();
    document.body.appendChild(next);

    act(() => {
      ref.current.nextInput();
      jest.runAllTimers();
    });

    expect(input.blur).toHaveBeenCalled();
    expect(next.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('moves focus to the previous input for start date year and wraps to day end', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="year" isStartDate />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const previous = document.createElement('input');
    previous.id = 'day-test-end';
    previous.focus = jest.fn();
    document.body.appendChild(previous);

    act(() => {
      ref.current.prevInput();
      jest.runAllTimers();
    });

    expect(input.blur).toHaveBeenCalled();
    expect(previous.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('increments and decrements date on arrow key presses', () => {
    const updateDate = jest.fn();
    render(<DateInputColumn {...getDefaultProps()} updateDate={updateDate} type="month" />);
    const input = screen.getByRole('textbox');

    fireEvent.keyUp(input, { keyCode: 38 });
    expect(updateDate).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(input, { keyCode: 40 });
    expect(updateDate).toHaveBeenCalledTimes(2);
  });

  it('uses prevInput when shift-tab is pressed', () => {
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="month" />);
    ref.current.prevInput = jest.fn();

    const input = screen.getByRole('textbox');
    fireEvent.keyUp(input, { keyCode: 9, shiftKey: true });

    expect(ref.current.prevInput).toHaveBeenCalled();
  });

  it('sanitizes month input and converts numeric month to string', () => {
    const updateTimeUnitInput = jest.fn();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} updateTimeUnitInput={updateTimeUnitInput} type="month" />);

    const result = ref.current.sanitizeInput('3');

    expect(result).not.toBeNull();
    expect(updateTimeUnitInput).toHaveBeenCalledWith('month', MONTH_STRING_ARRAY[2]);
  });

  it('pads single-digit hour input with a leading zero', () => {
    const updateTimeUnitInput = jest.fn();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} updateTimeUnitInput={updateTimeUnitInput} type="hour" />);

    const result = ref.current.sanitizeInput('3');

    expect(result).not.toBeNull();
    expect(updateTimeUnitInput).toHaveBeenCalledWith('hour', '03');
  });

  it('keeps old value on invalid blur and converts valid month blur', () => {
    const updateTimeUnitInput = jest.fn();
    const { rerender } = render(<DateInputColumn {...getDefaultProps()} updateTimeUnitInput={updateTimeUnitInput} type="month" value="01" />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.blur(input);
    expect(input.value).toBe(MONTH_STRING_ARRAY[2]);
    expect(updateTimeUnitInput).toHaveBeenCalledWith('month', MONTH_STRING_ARRAY[2]);

    rerender(<DateInputColumn {...getDefaultProps()} value="2020" type="year" />);
    const invalidInput = screen.getByRole('textbox');
    fireEvent.change(invalidInput, { target: { value: 'abcd' } });
    fireEvent.blur(invalidInput);
    expect(invalidInput.value).toBe('2020');
  });

  it('updates state in onChange to uppercase', () => {
    render(<DateInputColumn {...getDefaultProps()} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'ab' } });
    expect(input.value).toBe('AB');
  });

  it('handles focus by selecting and reporting focus type', () => {
    const onFocus = jest.fn();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} onFocus={onFocus} type="year" />);
    const input = screen.getByRole('textbox');
    input.select = jest.fn();

    fireEvent.focus(input);

    expect(input.select).toHaveBeenCalled();
    expect(ref.current.state.selected).toBe(true);
    expect(onFocus).toHaveBeenCalledWith('year');
  });

  it('handles blur on invalid input for day type', () => {
    render(<DateInputColumn {...getDefaultProps()} type="day" value="15" />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '32' } });
    fireEvent.blur(input);
    expect(input.value).toBe('15');
  });

  it('pads single-digit day input with leading zero on blur', () => {
    render(<DateInputColumn {...getDefaultProps()} type="day" value="01" />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    expect(input.value).toBe('05');
  });

  it('validates year input on blur', () => {
    const updateTimeUnitInput = jest.fn();
    render(<DateInputColumn {...getDefaultProps()} updateTimeUnitInput={updateTimeUnitInput} type="year" value="2020" />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '2050' } });
    fireEvent.blur(input);
    expect(input.value).toBe('2050');
    expect(updateTimeUnitInput).toHaveBeenCalled();
  });

  it('validates minute input and pads with leading zero', () => {
    const updateTimeUnitInput = jest.fn();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} updateTimeUnitInput={updateTimeUnitInput} type="minute" />);

    const result = ref.current.sanitizeInput('5');

    expect(result).not.toBeNull();
    expect(updateTimeUnitInput).toHaveBeenCalledWith('minute', '05');
  });

  it('validates day input', () => {
    const updateTimeUnitInput = jest.fn();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} updateTimeUnitInput={updateTimeUnitInput} type="day" />);

    const result = ref.current.sanitizeInput('15');

    expect(result).not.toBeNull();
    expect(updateTimeUnitInput).toHaveBeenCalledWith('day', '15');
  });

  it('handles onTouchCancel event like blur', () => {
    render(<DateInputColumn {...getDefaultProps()} type="month" value="01" />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.touchCancel(input);
    expect(input.value).toBe(MONTH_STRING_ARRAY[2]);
  });

  it('handles onTouchStart event like focus', () => {
    const onFocus = jest.fn();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} onFocus={onFocus} type="year" />);
    const input = screen.getByRole('textbox');
    input.select = jest.fn();

    fireEvent.touchStart(input);

    expect(input.select).toHaveBeenCalled();
    expect(ref.current.state.selected).toBe(true);
    expect(onFocus).toHaveBeenCalledWith('year');
  });

  it('does not call changeDate when disabled and arrow key is pressed', () => {
    const updateDate = jest.fn();
    render(<DateInputColumn {...getDefaultProps()} updateDate={updateDate} isDisabled type="month" />);
    const input = screen.getByRole('textbox');

    fireEvent.keyUp(input, { keyCode: 38 });
    expect(updateDate).not.toHaveBeenCalled();

    fireEvent.keyUp(input, { keyCode: 40 });
    expect(updateDate).not.toHaveBeenCalled();
  });

  it('handles arrow up and down with disabled state', () => {
    const updateDate = jest.fn();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} updateDate={updateDate} type="month" isDisabled />);

    ref.current.changeDate(1);
    expect(updateDate).not.toHaveBeenCalled();

    ref.current.changeDate(-1);
    expect(updateDate).not.toHaveBeenCalled();
  });

  it('wraps to start date year when at end of start date inputs', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="day" isStartDate subDailyMode={false} />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const next = document.createElement('input');
    next.id = 'year-test-end';
    next.focus = jest.fn();
    document.body.appendChild(next);

    act(() => {
      ref.current.nextInput();
      jest.runAllTimers();
    });

    expect(next.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('wraps to end date minute when navigating with subdaily mode', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="minute" isStartDate subDailyMode />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const next = document.createElement('input');
    next.id = 'year-test-end';
    next.focus = jest.fn();
    document.body.appendChild(next);

    act(() => {
      ref.current.nextInput();
      jest.runAllTimers();
    });

    expect(next.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('wraps to end date day when at start of start date year without subdaily', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="year" isStartDate subDailyMode={false} />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const prev = document.createElement('input');
    prev.id = 'day-test-end';
    prev.focus = jest.fn();
    document.body.appendChild(prev);

    act(() => {
      ref.current.prevInput();
      jest.runAllTimers();
    });

    expect(prev.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('wraps to end date minute when at start of start date year with subdaily', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="year" isStartDate subDailyMode />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const prev = document.createElement('input');
    prev.id = 'minute-test-end';
    prev.focus = jest.fn();
    document.body.appendChild(prev);

    act(() => {
      ref.current.prevInput();
      jest.runAllTimers();
    });

    expect(prev.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('moves to next input when end date and at last position', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="day" isEndDate subDailyMode={false} />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const next = document.createElement('input');
    next.id = 'year-test-start';
    next.focus = jest.fn();
    document.body.appendChild(next);

    act(() => {
      ref.current.nextInput();
      jest.runAllTimers();
    });

    expect(next.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('moves to previous input when end date and at first position', () => {
    jest.useFakeTimers();
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="year" isEndDate subDailyMode={false} />);

    const input = screen.getByRole('textbox');
    input.blur = jest.fn();

    const prev = document.createElement('input');
    prev.id = 'day-test-start';
    prev.focus = jest.fn();
    document.body.appendChild(prev);

    act(() => {
      ref.current.prevInput();
      jest.runAllTimers();
    });

    expect(prev.focus).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('renders with correct aria-label', () => {
    render(<DateInputColumn {...getDefaultProps()} type="year" idSuffix="test" />);
    const input = screen.getByRole('textbox');

    expect(input.getAttribute('aria-label')).toBe('year-test input');
  });

  it('renders with correct aria-label for start date', () => {
    render(<DateInputColumn {...getDefaultProps()} type="month" idSuffix="test" isStartDate />);
    const input = screen.getByRole('textbox');

    expect(input.getAttribute('aria-label')).toBe('month-test-start input');
  });

  it('renders with correct aria-label for end date', () => {
    render(<DateInputColumn {...getDefaultProps()} type="day" idSuffix="test" isEndDate />);
    const input = screen.getByRole('textbox');

    expect(input.getAttribute('aria-label')).toBe('day-test-end input');
  });

  it('applies invalid-input class when isValid is false', () => {
    render(<DateInputColumn {...getDefaultProps()} isValid={false} />);
    const input = screen.getByRole('textbox');

    expect(input.className).toContain('invalid-input');
  });

  it('applies selected class to container when focused', () => {
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="month" />);
    const input = screen.getByRole('textbox');
    input.select = jest.fn();

    fireEvent.focus(input);

    const container = input.closest('.input-wrapper');
    expect(container.className).toContain('selected');
  });

  it('removes selected class on blur', () => {
    const ref = React.createRef();
    render(<DateInputColumn ref={ref} {...getDefaultProps()} type="month" value="01" />);
    const input = screen.getByRole('textbox');
    input.select = jest.fn();

    fireEvent.focus(input);
    expect(ref.current.state.selected).toBe(true);

    fireEvent.blur(input);
    expect(ref.current.state.selected).toBe(false);
  });

  it('applies fontSize style when provided', () => {
    render(<DateInputColumn {...getDefaultProps()} fontSize={20} />);
    const input = screen.getByRole('textbox');

    expect(input.style.fontSize).toBe('20px');
  });

  it('applies red border when invalid', () => {
    render(<DateInputColumn {...getDefaultProps()} isValid={false} />);
    const container = screen.getByRole('textbox').closest('.input-wrapper');

    expect(container.style.borderColor).toBe('rgb(255, 0, 0)');
  });
});
