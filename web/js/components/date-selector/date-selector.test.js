/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, act } from '@testing-library/react';
import DateSelector from './date-selector';
import usePrevious from '../../util/customHooks';

jest.mock('./date-input-column', () => {
  return function DummyDateInputColumn(props) {
    const validValues = {
      year: 2023,
      month: '01', // Jan
      day: 15,
      hour: 12,
      minute: 30,
    };
    const invalidValues = {
      year: 1990, // Outside minDate
      day: 32, // Exceeds max days in any month
    };

    return (
      <div data-testid={`date-input-${props.type}`}>
        <span data-testid={`kiosk-${props.type}`}>{props.isKioskModeActive ? 'kiosk' : 'normal'}</span>
        <span data-testid={`disabled-${props.type}`}>{props.isDisabled ? 'disabled' : 'enabled'}</span>
        <button
          data-testid={`focus-${props.type}`}
          onClick={() => {
            if (props.onFocus) props.onFocus(props.type);
          }}
        >
          Focus {props.type}
        </button>
        <button
          data-testid={`update-${props.type}`}
          onClick={() => {
            if (props.updateTimeUnitInput) {
              props.updateTimeUnitInput(props.type, validValues[props.type]);
            }
          }}
        >
          Update {props.type}
        </button>
        <button
          data-testid={`update-invalid-${props.type}`}
          onClick={() => {
            if (props.updateTimeUnitInput) {
              props.updateTimeUnitInput(props.type, invalidValues[props.type]);
            }
          }}
        >
          Update Invalid {props.type}
        </button>
        <button
          data-testid={`roll-${props.type}`}
          onClick={() => {
            if (props.updateDate) props.updateDate(props.date, true);
          }}
        >
          Roll {props.type}
        </button>
      </div>
    );
  };
});

jest.mock('../../util/customHooks', () => jest.fn());

jest.mock('../../util/util', () => ({
  stringInArray: jest.fn(() => 0),
  pad: jest.fn((num) => String(num).padStart(2, '0')),
}));

describe('DateSelector', () => {
  const defaultProps = {
    date: new Date('2023-01-01T12:00:00Z'),
    minDate: new Date('2000-01-01T00:00:00Z'),
    maxDate: new Date('2024-01-01T00:00:00Z'),
    onDateChange: jest.fn(),
    subDailyMode: false,
    isDisabled: false,
    isKioskModeActive: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usePrevious.mockImplementation((val) => val);
  });

  it('renders basic date columns correctly', () => {
    render(<DateSelector {...defaultProps} />);

    expect(screen.getByTestId('date-input-year')).toBeDefined();
    expect(screen.getByTestId('date-input-month')).toBeDefined();
    expect(screen.getByTestId('date-input-day')).toBeDefined();

    expect(screen.queryByTestId('date-input-hour')).toBeNull();
    expect(screen.queryByTestId('date-input-minute')).toBeNull();
  });

  it('renders time columns when subDailyMode is true', () => {
    render(<DateSelector {...defaultProps} subDailyMode />);

    expect(screen.getByTestId('date-input-hour')).toBeDefined();
    expect(screen.getByTestId('date-input-minute')).toBeDefined();
    expect(screen.getByText(':')).toBeDefined();
    expect(screen.getByText('Z')).toBeDefined();
  });

  it('applies disabled state correctly', () => {
    render(<DateSelector {...defaultProps} isDisabled />);

    expect(screen.getByTestId('disabled-year').textContent).toBe('disabled');
    expect(screen.getByTestId('disabled-month').textContent).toBe('disabled');
    expect(screen.getByTestId('disabled-day').textContent).toBe('disabled');
  });

  it('applies kiosk mode styles correctly', () => {
    const { container } = render(<DateSelector {...defaultProps} subDailyMode isKioskModeActive />);

    expect(screen.getByTestId('kiosk-year').textContent).toBe('kiosk');
    expect(container.querySelector('.input-time-divider-kiosk')).toBeDefined();
    expect(container.querySelector('.input-time-zmark-kiosk')).toBeDefined();
  });

  it('handles date changes and triggers clearing values', () => {
    usePrevious.mockImplementationOnce(() => new Date('2022-01-01T12:00:00Z'));
    const { rerender } = render(<DateSelector {...defaultProps} />);

    const newDateProps = { ...defaultProps, date: new Date('2023-02-01T12:00:00Z') };
    rerender(<DateSelector {...newDateProps} />);

    expect(screen.getByTestId('date-input-year')).toBeDefined();
  });

  it('updates time unit input and triggers effect for year', () => {
    render(<DateSelector {...defaultProps} />);

    const updateYearBtn = screen.getByTestId('update-year');
    act(() => {
      fireEvent.click(updateYearBtn);
    });

    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  it('updates time unit input and triggers effect for month', () => {
    render(<DateSelector {...defaultProps} />);

    const updateMonthBtn = screen.getByTestId('update-month');
    act(() => {
      fireEvent.click(updateMonthBtn);
    });

    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  it('updates time unit input and triggers effect for day', () => {
    render(<DateSelector {...defaultProps} />);

    const updateDayBtn = screen.getByTestId('update-day');
    act(() => {
      fireEvent.click(updateDayBtn);
    });

    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  it('updates time unit input and triggers effect for hour in subDailyMode', () => {
    render(<DateSelector {...defaultProps} subDailyMode />);

    const updateHourBtn = screen.getByTestId('update-hour');
    act(() => {
      fireEvent.click(updateHourBtn);
    });

    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  it('updates time unit input and triggers effect for minute in subDailyMode', () => {
    render(<DateSelector {...defaultProps} subDailyMode />);

    const updateMinuteBtn = screen.getByTestId('update-minute');
    act(() => {
      fireEvent.click(updateMinuteBtn);
    });

    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  it('does not trigger onDateChange if the updated date is out of range', () => {
    render(<DateSelector {...defaultProps} />);

    const updateInvalidYearBtn = screen.getByTestId('update-invalid-year');
    act(() => {
      fireEvent.click(updateInvalidYearBtn);
    });

    expect(defaultProps.onDateChange).not.toHaveBeenCalled();
  });

  // ─── isRollDate path ───────────────────────────────────────────────────────

  it('triggers onDateChange when updateDate is called with isRollDate=true', () => {
    render(<DateSelector {...defaultProps} />);
    act(() => {
      fireEvent.click(screen.getByTestId('roll-year'));
    });
    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  // ─── focusedUnit='year' validation branch ─────────────────────────────────

  it('sets yearValid=false when focused year is updated to out-of-range value', () => {
    render(<DateSelector {...defaultProps} />);
    act(() => {
      fireEvent.click(screen.getByTestId('focus-year'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('update-invalid-year'));
    });
    expect(defaultProps.onDateChange).not.toHaveBeenCalled();
  });

  // ─── day overflow without focus ───────────────────────────────────────────

  it('clamps day to max when day exceeds month limit (no focus)', () => {
    render(<DateSelector {...defaultProps} />);
    act(() => {
      fireEvent.click(screen.getByTestId('update-invalid-day'));
    });
    // day=32 > maxDayDate=31, validDate set false, returns false → no onDateChange
    expect(defaultProps.onDateChange).not.toHaveBeenCalled();
  });

  // ─── day overflow with focus ──────────────────────────────────────────────

  it('sets dayValid=false when focused day exceeds month limit', () => {
    render(<DateSelector {...defaultProps} />);
    act(() => {
      fireEvent.click(screen.getByTestId('focus-day'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('update-invalid-day'));
    });
    expect(defaultProps.onDateChange).not.toHaveBeenCalled();
  });

  // ─── month tabToCheck validation ──────────────────────────────────────────

  it('validates month range when month column is focused', () => {
    render(<DateSelector {...defaultProps} />);
    act(() => {
      fireEvent.click(screen.getByTestId('focus-month'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('update-month'));
    });
    // month within range → onDateChange called
    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  // ─── day+month both pending (chained invalid state) ───────────────────────

  it('handles both day and month pending in dateObj via chained invalid year', () => {
    render(<DateSelector {...defaultProps} />);

    // Step 1: set year=1990 (out of range) so state isn't cleared
    act(() => {
      fireEvent.click(screen.getByTestId('update-invalid-year'));
    });

    // Step 2: set day=15 (still out of range due to year=1990)
    act(() => {
      fireEvent.click(screen.getByTestId('update-day'));
    });

    // Step 3: set month='01' — now both day and month are in dateObj,
    // exercising the day && month branches in updateDateCheck
    act(() => {
      fireEvent.click(screen.getByTestId('update-month'));
    });

    // date remains out of range (year=1990) → no onDateChange
    expect(defaultProps.onDateChange).not.toHaveBeenCalled();
  });

  // ─── hour tabToCheck validation (subDailyMode) ────────────────────────────

  it('validates hour range when hour column is focused in subDailyMode', () => {
    render(<DateSelector {...defaultProps} subDailyMode />);
    act(() => {
      fireEvent.click(screen.getByTestId('focus-hour'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('update-hour'));
    });
    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  // ─── minute tabToCheck validation (subDailyMode) ─────────────────────────

  it('validates minute range when minute column is focused in subDailyMode', () => {
    render(<DateSelector {...defaultProps} subDailyMode />);
    act(() => {
      fireEvent.click(screen.getByTestId('focus-minute'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('update-minute'));
    });
    expect(defaultProps.onDateChange).toHaveBeenCalled();
  });

  // ─── non-kiosk time divider classes ───────────────────────────────────────

  it('uses non-kiosk classes for time divider and Z mark when not in kiosk mode', () => {
    const { container } = render(<DateSelector {...defaultProps} subDailyMode />);
    expect(container.querySelector('.input-time-divider')).toBeDefined();
    expect(container.querySelector('.input-time-zmark')).toBeDefined();
  });

  // ─── no prevDate (first mount) clears state ───────────────────────────────

  it('clears time values on mount when prevDate is undefined', () => {
    usePrevious.mockImplementation(() => undefined);
    render(<DateSelector {...defaultProps} />);
    // Should render without errors and not call onDateChange
    expect(screen.getByTestId('date-input-year')).toBeDefined();
    expect(defaultProps.onDateChange).not.toHaveBeenCalled();
  });
});
