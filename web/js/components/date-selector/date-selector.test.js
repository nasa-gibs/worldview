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
    };

    return (
      <div data-testid={`date-input-${props.type}`}>
        <span data-testid={`kiosk-${props.type}`}>{props.isKioskModeActive ? 'kiosk' : 'normal'}</span>
        <span data-testid={`disabled-${props.type}`}>{props.isDisabled ? 'disabled' : 'enabled'}</span>
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
});
