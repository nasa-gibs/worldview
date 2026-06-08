import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockDateSelector = jest.fn((props) => {
  const {
    date,
    idSuffix,
    onDateChange,
    minDate,
    maxDate,
    subDailyMode,
    isDisabled,
    isStartDate,
  } = props;

  return (
    <div data-testid={`date-selector-${isStartDate ? 'start' : 'end'}`}>
      <span data-testid={`date-${isStartDate ? 'start' : 'end'}`}>
        {date ? date.toISOString() : 'null'}
      </span>
      <span data-testid={`id-suffix-${isStartDate ? 'start' : 'end'}`}>
        {idSuffix || 'none'}
      </span>
      <span data-testid={`min-date-${isStartDate ? 'start' : 'end'}`}>
        {minDate ? minDate.toISOString() : 'null'}
      </span>
      <span data-testid={`max-date-${isStartDate ? 'start' : 'end'}`}>
        {maxDate ? maxDate.toISOString() : 'null'}
      </span>
      <span data-testid={`sub-daily-mode-${isStartDate ? 'start' : 'end'}`}>
        {String(subDailyMode)}
      </span>
      <span data-testid={`is-disabled-${isStartDate ? 'start' : 'end'}`}>
        {String(isDisabled)}
      </span>
      <button
        type="button"
        onClick={() => onDateChange(new Date('2020-01-03T00:00:00Z'))}
      >
        change
      </button>
    </div>
  );
});

jest.mock('./date-selector', () => ({
  __esModule: true,
  default: (props) => mockDateSelector(props),
}));

import DateRangeSelector from './date-range-selector';

describe('DateRangeSelector', () => {
  beforeEach(() => {
    mockDateSelector.mockClear();
  });

  it('renders start and end selectors with the correct props and class', () => {
    const startDate = new Date('2020-01-01T00:00:00Z');
    const endDate = new Date('2020-01-02T00:00:00Z');
    const minDate = new Date('2019-12-31T00:00:00Z');
    const maxDate = new Date('2020-01-10T00:00:00Z');

    const { container } = render(
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        minDate={minDate}
        maxDate={maxDate}
        setDateRange={jest.fn()}
        subDailyMode
        idSuffix="test-suffix"
        isDisabled={false}
      />,
    );

    expect(container.firstChild.className).toContain('wv-date-range-selector');
    expect(screen.getByText('to')).toBeInTheDocument();

    expect(screen.getByTestId('date-start')).toHaveTextContent('2020-01-01T00:00:00.000Z');
    expect(screen.getByTestId('date-end')).toHaveTextContent('2020-01-02T00:00:00.000Z');
    expect(screen.getByTestId('id-suffix-start')).toHaveTextContent('test-suffix');
    expect(screen.getByTestId('id-suffix-end')).toHaveTextContent('test-suffix');
    expect(screen.getByTestId('min-date-start')).toHaveTextContent('2019-12-31T00:00:00.000Z');
    expect(screen.getByTestId('max-date-start')).toHaveTextContent('2020-01-02T00:00:00.000Z');
    expect(screen.getByTestId('min-date-end')).toHaveTextContent('2020-01-01T00:00:00.000Z');
    expect(screen.getByTestId('max-date-end')).toHaveTextContent('2020-01-10T00:00:00.000Z');
    expect(screen.getByTestId('sub-daily-mode-start')).toHaveTextContent('true');
    expect(screen.getByTestId('sub-daily-mode-end')).toHaveTextContent('true');
    expect(screen.getByTestId('is-disabled-start')).toHaveTextContent('false');
    expect(screen.getByTestId('is-disabled-end')).toHaveTextContent('false');
  });

  it('calls setDateRange with updated start date when the start selector changes', () => {
    const startDate = new Date('2020-01-01T00:00:00Z');
    const endDate = new Date('2020-01-02T00:00:00Z');
    const setDateRange = jest.fn();

    render(
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        maxDate={endDate}
        setDateRange={setDateRange}
        subDailyMode={false}
        idSuffix="start-change"
        isDisabled={false}
      />,
    );

    fireEvent.click(screen.getByTestId('date-selector-start').querySelector('button'));

    expect(setDateRange).toHaveBeenCalledTimes(1);
    expect(setDateRange.mock.calls[0][0][1]).toEqual(endDate);
    expect(setDateRange.mock.calls[0][0][0]).toEqual(new Date('2020-01-03T00:00:00Z'));
  });

  it('calls setDateRange with updated end date when the end selector changes', () => {
    const startDate = new Date('2020-01-01T00:00:00Z');
    const endDate = new Date('2020-01-02T00:00:00Z');
    const setDateRange = jest.fn();

    render(
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        maxDate={endDate}
        setDateRange={setDateRange}
        subDailyMode={false}
        idSuffix="end-change"
        isDisabled={false}
      />,
    );

    fireEvent.click(screen.getByTestId('date-selector-end').querySelector('button'));

    expect(setDateRange).toHaveBeenCalledTimes(1);
    expect(setDateRange.mock.calls[0][0][0]).toEqual(startDate);
    expect(setDateRange.mock.calls[0][0][1]).toEqual(new Date('2020-01-03T00:00:00Z'));
  });

  it('renders disabled state and supports null date values', () => {
    const setDateRange = jest.fn();

    const { container } = render(
      <DateRangeSelector
        startDate={null}
        endDate={null}
        minDate={null}
        maxDate={null}
        setDateRange={setDateRange}
        subDailyMode={false}
        idSuffix={null}
        isDisabled
      />,
    );

    expect(container.firstChild.className).toContain('disabled');
    expect(screen.getByTestId('date-start')).toHaveTextContent('null');
    expect(screen.getByTestId('date-end')).toHaveTextContent('null');
    expect(screen.getByTestId('is-disabled-start')).toHaveTextContent('true');
    expect(screen.getByTestId('is-disabled-end')).toHaveTextContent('true');
  });
});
