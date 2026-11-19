/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('lodash', () => ({
  debounce: jest.fn((fn) => fn),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, onClick, className }) => (
    <svg data-testid={`fa-icon-${icon}`} className={className} onClick={onClick} />
  ),
}));

jest.mock('../../components/timeline/date-util', () => ({
  getISODateFormatted: jest.fn((date) => (date ? date.toISOString().split('T')[0] : '')),
}));

jest.mock('../../components/animation-widget/loop-button', () => {
  const capture = {};
  const MockLoopButton = (props) => {
    Object.assign(capture, props);
    return <div data-testid="loop-button" />;
  };
  MockLoopButton.capture = capture;
  return { __esModule: true, default: MockLoopButton };
});

jest.mock('../../components/timeline/custom-interval-selector/mobile-custom-interval-selector', () => {
  const capture = {};
  const MockMobileCustomIntervalSelector = (props) => {
    Object.assign(capture, props);
    return <div data-testid="mobile-custom-interval-selector" />;
  };
  MockMobileCustomIntervalSelector.capture = capture;
  return { __esModule: true, default: MockMobileCustomIntervalSelector };
});

jest.mock('../../components/timeline/mobile-date-picker', () => {
  const captures = [];
  const MockMobileDatePicker = (props) => {
    captures.push({ ...props });
    return <div data-testid="mobile-date-picker" />;
  };
  MockMobileDatePicker.captures = captures;
  return { __esModule: true, default: MockMobileDatePicker };
});

import MobileAnimationWidget from './mobile-animation-widget';

let loopButtonCapture;
let mobileCustomIntervalCapture;
let mobileDatePickerCaptures;

beforeAll(() => {
  loopButtonCapture = jest.requireMock('../../components/animation-widget/loop-button').default.capture;
  mobileCustomIntervalCapture = jest.requireMock('../../components/timeline/custom-interval-selector/mobile-custom-interval-selector').default.capture;
  mobileDatePickerCaptures = jest.requireMock('../../components/timeline/mobile-date-picker').default.captures;
});

let defaultProps;

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(loopButtonCapture).forEach((k) => delete loopButtonCapture[k]);
  Object.keys(mobileCustomIntervalCapture).forEach((k) => delete mobileCustomIntervalCapture[k]);
  mobileDatePickerCaptures.length = 0;

  defaultProps = {
    breakpoints: { small: 768 },
    endDate: new Date('2023-01-10T00:00:00.000Z'),
    hasSubdailyLayers: false,
    isEmbedModeActive: false,
    isLandscape: false,
    isMobile: true,
    isMobilePhone: false,
    isMobileTablet: false,
    isPlaying: false,
    isPortrait: false,
    looping: false,
    maxDate: new Date('2023-12-31T00:00:00.000Z'),
    minDate: new Date('2020-01-01T00:00:00.000Z'),
    onLoop: jest.fn(),
    onSlide: jest.fn(),
    onUpdateEndDate: jest.fn(),
    onUpdateStartDate: jest.fn(),
    playDisabled: false,
    selectDate: jest.fn(),
    screenHeight: 900,
    screenWidth: 1024,
    setSpeed: jest.fn(),
    sliderLabel: 'FPS',
    speed: 5,
    startDate: new Date('2023-01-01T00:00:00.000Z'),
    subDailyMode: false,
    toggleCollapse: jest.fn(),
  };
});

const renderWidget = (overrides = {}) => render(
  <MobileAnimationWidget {...defaultProps} {...overrides} />,
);

describe('MobileAnimationWidget rendering', () => {
  test('renders all major child components', () => {
    renderWidget();
    expect(screen.getByTestId('loop-button')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-custom-interval-selector')).toBeInTheDocument();
    expect(screen.getAllByTestId('mobile-date-picker')).toHaveLength(2);
    expect(screen.getByTestId('fa-icon-times')).toBeInTheDocument();
  });

  test('renders Loop label text', () => {
    renderWidget();
    expect(screen.getByText('Loop')).toBeInTheDocument();
  });

  test('renders Start Date and End Date labels', () => {
    renderWidget();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  test('renders speed and sliderLabel in slider label span', () => {
    const { container } = renderWidget({ speed: 3, sliderLabel: 'FPS' });
    const label = container.querySelector('.wv-slider-label');
    expect(label.textContent).toContain('3');
    expect(label.textContent).toContain('FPS');
  });

  test('renders warning message text', () => {
    renderWidget();
    expect(screen.getByText(/Too many animation frames/)).toBeInTheDocument();
  });
});

describe('MobileAnimationWidget getMobileIDs', () => {
  test('returns mobile-phone-landscape for isMobilePhone + isLandscape', () => {
    const { container } = renderWidget({ isMobilePhone: true, isLandscape: true });
    expect(container.querySelector('#mobile-animation-widget-mobile-phone-landscape')).toBeInTheDocument();
  });

  test('returns mobile-phone-landscape for small screenHeight non-phone non-tablet', () => {
    const { container } = renderWidget({
      isMobilePhone: false,
      isMobileTablet: false,
      screenHeight: 700,
    });
    expect(container.querySelector('#mobile-animation-widget-mobile-phone-landscape')).toBeInTheDocument();
  });

  test('returns mobile-phone-portrait for isMobilePhone + isPortrait', () => {
    const { container } = renderWidget({ isMobilePhone: true, isPortrait: true });
    expect(container.querySelector('#mobile-animation-widget-mobile-phone-portrait')).toBeInTheDocument();
  });

  test('returns mobile-phone-portrait for narrow screenWidth non-phone non-tablet', () => {
    const { container } = renderWidget({
      isMobilePhone: false,
      isMobileTablet: false,
      screenWidth: 500,
      screenHeight: 900,
    });
    expect(container.querySelector('#mobile-animation-widget-mobile-phone-portrait')).toBeInTheDocument();
  });

  test('returns tablet for isMobileTablet', () => {
    const { container } = renderWidget({ isMobileTablet: true });
    expect(container.querySelector('#mobile-animation-widget-tablet')).toBeInTheDocument();
  });

  test('returns tablet when screenWidth <= breakpoints.small', () => {
    const { container } = renderWidget({
      isMobilePhone: false,
      isMobileTablet: false,
      screenWidth: 768,
      breakpoints: { small: 768 },
      screenHeight: 900,
    });
    expect(container.querySelector('#mobile-animation-widget-tablet')).toBeInTheDocument();
  });

  test('returns undefined for desktop-sized non-mobile', () => {
    const { container } = renderWidget({
      isMobilePhone: false,
      isMobileTablet: false,
      screenWidth: 1024,
      screenHeight: 900,
    });
    expect(container.querySelector('#mobile-animation-widget-undefined')).toBeInTheDocument();
  });
});

describe('MobileAnimationWidget CSS classes', () => {
  test('inner widget has subdaily class when subDailyMode is true', () => {
    const { container } = renderWidget({ subDailyMode: true });
    expect(container.querySelector('#wv-animation-widget')).toHaveClass('subdaily');
  });

  test('inner widget does not have subdaily class when subDailyMode is false', () => {
    const { container } = renderWidget({ subDailyMode: false });
    expect(container.querySelector('#wv-animation-widget')).not.toHaveClass('subdaily');
  });
});

describe('MobileAnimationWidget header justifyContent', () => {
  test('header uses flex-end when isEmbedModeActive is false', () => {
    const { container } = renderWidget({ isEmbedModeActive: false });
    const header = container.querySelector('.mobile-animation-header');
    expect(header.style.justifyContent).toBe('flex-end');
  });

  test('header uses flex-start when isEmbedModeActive is true', () => {
    const { container } = renderWidget({ isEmbedModeActive: true });
    const header = container.querySelector('.mobile-animation-header');
    expect(header.style.justifyContent).toBe('flex-start');
  });
});

describe('MobileAnimationWidget warning message', () => {
  test('warning span has id when playDisabled is true', () => {
    const { container } = renderWidget({ playDisabled: true });
    expect(container.querySelector('#mobile-animation-warning-message')).toBeInTheDocument();
  });

  test('warning span has no id when playDisabled is false', () => {
    const { container } = renderWidget({ playDisabled: false });
    expect(container.querySelector('#mobile-animation-warning-message')).not.toBeInTheDocument();
  });
});

describe('MobileAnimationWidget close button', () => {
  test('clicking close button calls toggleCollapse', () => {
    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(defaultProps.toggleCollapse).toHaveBeenCalledTimes(1);
  });
});

describe('MobileAnimationWidget FPS slider', () => {
  test('slider has correct attributes', () => {
    renderWidget({ speed: 3 });
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '0.5');
    expect(slider).toHaveAttribute('min', '0.5');
    expect(slider).toHaveAttribute('max', '10');
    expect(slider).toHaveValue('3');
  });

  test('slider is disabled when isPlaying', () => {
    renderWidget({ isPlaying: true });
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  test('slider is enabled when not playing', () => {
    renderWidget({ isPlaying: false });
    expect(screen.getByRole('slider')).not.toBeDisabled();
  });

  test('slider onChange calls setSpeed with parsed float', () => {
    renderWidget({ speed: 5 });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7.5' } });
    expect(defaultProps.setSpeed).toHaveBeenCalledWith(7.5);
  });

  test('slider onChange calls onSlide with the current speed prop', () => {
    renderWidget({ speed: 5 });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7.5' } });
    expect(defaultProps.onSlide).toHaveBeenCalledWith(5);
  });
});

describe('MobileAnimationWidget LoopButton props', () => {
  test('passes looping prop', () => {
    renderWidget({ looping: true });
    expect(loopButtonCapture.looping).toBe(true);
  });

  test('passes onLoop prop', () => {
    renderWidget();
    expect(loopButtonCapture.onLoop).toBe(defaultProps.onLoop);
  });

  test('passes isMobile prop', () => {
    renderWidget({ isMobile: true });
    expect(loopButtonCapture.isMobile).toBe(true);
  });
});

describe('MobileAnimationWidget MobileCustomIntervalSelector props', () => {
  test('passes hasSubdailyLayers', () => {
    renderWidget({ hasSubdailyLayers: true });
    expect(mobileCustomIntervalCapture.hasSubdailyLayers).toBe(true);
  });
});

describe('MobileAnimationWidget MobileDatePicker props', () => {
  test('start picker receives startDate as date', () => {
    renderWidget();
    expect(mobileDatePickerCaptures[0].date).toBe(defaultProps.startDate);
  });

  test('start picker startDateLimit is formatted minDate', () => {
    renderWidget();
    expect(mobileDatePickerCaptures[0].startDateLimit).toBe('2020-01-01');
  });

  test('start picker endDateLimit is formatted endDate', () => {
    renderWidget();
    expect(mobileDatePickerCaptures[0].endDateLimit).toBe('2023-01-10');
  });

  test('start picker passes hasSubdailyLayers and isMobile', () => {
    renderWidget({ hasSubdailyLayers: true, isMobile: true });
    expect(mobileDatePickerCaptures[0].hasSubdailyLayers).toBe(true);
    expect(mobileDatePickerCaptures[0].isMobile).toBe(true);
  });

  test('end picker receives endDate as date', () => {
    renderWidget();
    expect(mobileDatePickerCaptures[1].date).toBe(defaultProps.endDate);
  });

  test('end picker startDateLimit is formatted startDate', () => {
    renderWidget();
    expect(mobileDatePickerCaptures[1].startDateLimit).toBe('2023-01-01');
  });

  test('end picker endDateLimit is formatted maxDate', () => {
    renderWidget();
    expect(mobileDatePickerCaptures[1].endDateLimit).toBe('2023-12-31');
  });
});

describe('MobileAnimationWidget date change callbacks', () => {
  test('start picker onDateChange calls selectDate and onUpdateStartDate with Date object', () => {
    renderWidget();
    const dateStr = '2023-03-15';
    mobileDatePickerCaptures[0].onDateChange(dateStr);
    expect(defaultProps.selectDate).toHaveBeenCalledWith(new Date(dateStr));
    expect(defaultProps.onUpdateStartDate).toHaveBeenCalledWith(new Date(dateStr));
  });

  test('end picker onDateChange calls selectDate and onUpdateEndDate with Date object', () => {
    renderWidget();
    const dateStr = '2023-06-20';
    mobileDatePickerCaptures[1].onDateChange(dateStr);
    expect(defaultProps.selectDate).toHaveBeenCalledWith(new Date(dateStr));
    expect(defaultProps.onUpdateEndDate).toHaveBeenCalledWith(new Date(dateStr));
  });

  test('start picker callback does not call onUpdateEndDate', () => {
    renderWidget();
    mobileDatePickerCaptures[0].onDateChange('2023-03-15');
    expect(defaultProps.onUpdateEndDate).not.toHaveBeenCalled();
  });

  test('end picker callback does not call onUpdateStartDate', () => {
    renderWidget();
    mobileDatePickerCaptures[1].onDateChange('2023-06-20');
    expect(defaultProps.onUpdateStartDate).not.toHaveBeenCalled();
  });
});
