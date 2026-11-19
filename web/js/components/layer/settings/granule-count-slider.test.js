/* eslint-disable react/jsx-props-no-spreading */
import {
  render, screen, fireEvent, act,
} from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../modules/layers/constants', () => ({
  DEFAULT_NUM_GRANULES: 10,
  MIN_GRANULES: 1,
  MAX_GRANULES: 30,
}));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));
jest.mock('../../util/hover-tooltip', () => function MockHoverTooltip() { return null; });

import GranuleCountSlider from './granule-count-slider';

const defaultProps = {
  count: 10,
  def: { id: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule' },
  granuleDates: ['2023-01-01', '2023-01-02'],
  isMobile: false,
  updateGranuleLayerOptions: jest.fn(),
};

const renderSlider = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<GranuleCountSlider {...props} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('GranuleCountSlider', () => {
  it('follows external count updates (e.g. from the sidebar row slider)', () => {
    const { rerender } = renderSlider({ count: 7 });
    rerender(<GranuleCountSlider {...defaultProps} count={12} />);
    expect(screen.getByRole('slider')).toHaveAttribute('value', '12');
  });

  it('debounces the call to updateGranuleLayerOptions', () => {
    const updateGranuleLayerOptions = jest.fn();
    renderSlider({ updateGranuleLayerOptions });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '18' } });
    expect(updateGranuleLayerOptions).not.toHaveBeenCalled();
    act(() => {
      jest.runAllTimers();
    });
    expect(updateGranuleLayerOptions).toHaveBeenCalledTimes(1);
    expect(updateGranuleLayerOptions).toHaveBeenCalledWith(
      defaultProps.granuleDates,
      defaultProps.def,
      18,
    );
  });
});
