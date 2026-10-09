/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../modules/layers/constants', () => ({
  MIN_DAY_COUNT: 1,
}));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));
jest.mock('../../util/hover-tooltip', () => function MockHoverTooltip() { return null; });

import DayRangeSlider from './day-range-slider';

const defaultProps = {
  layer: { id: 'OPERA_L2_Radiometric_Terrain_Corrected_SAR_Sentinel-1' },
  dayCount: 1,
  maxDayRange: 12,
  isMobile: false,
  updateDayCount: jest.fn(),
};

const renderSlider = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<DayRangeSlider {...props} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('DayRangeSlider', () => {
  describe('layout', () => {
    it('renders the Days to Aggregate heading', () => {
      renderSlider();
      expect(screen.getByText('Days to Aggregate')).toBeInTheDocument();
    });

    it('renders the info icon', () => {
      renderSlider();
      expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
    });

    it('renders the range input', () => {
      renderSlider();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('displays "1 day" (singular) when dayCount is 1', () => {
      renderSlider({ dayCount: 1 });
      expect(screen.getByText('1 day')).toBeInTheDocument();
    });

    it('displays "N days" (plural) when dayCount is greater than 1', () => {
      renderSlider({ dayCount: 5 });
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });
  });

  describe('range input attributes', () => {
    it('sets min to MIN_DAY_COUNT (1)', () => {
      renderSlider();
      expect(screen.getByRole('slider')).toHaveAttribute('min', '1');
    });

    it('sets max to the maxDayRange prop', () => {
      renderSlider({ maxDayRange: 12 });
      expect(screen.getByRole('slider')).toHaveAttribute('max', '12');
    });

    it('sets value to the dayCount prop', () => {
      renderSlider({ dayCount: 7 });
      expect(screen.getByRole('slider')).toHaveAttribute('value', '7');
    });
  });

  describe('onChange', () => {
    it('updates the displayed label immediately on slide', () => {
      renderSlider({ dayCount: 1 });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
      expect(screen.getByText('8 days')).toBeInTheDocument();
    });

    it('debounces the call to updateDayCount', () => {
      const updateDayCount = jest.fn();
      renderSlider({ updateDayCount });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '9' } });
      expect(updateDayCount).not.toHaveBeenCalled();
      act(() => {
        jest.runAllTimers();
      });
      expect(updateDayCount).toHaveBeenCalledTimes(1);
      expect(updateDayCount).toHaveBeenCalledWith(defaultProps.layer.id, 9);
    });
  });
});
