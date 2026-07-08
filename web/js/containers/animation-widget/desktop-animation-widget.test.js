/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-draggable', () => {
  const capture = {};
  const MockDraggable = ({ children, ...props }) => {
    Object.assign(capture, props);
    return children;
  };
  MockDraggable.draggableCapture = capture;
  return { __esModule: true, default: MockDraggable };
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, onClick, className }) => (
    <svg data-testid={`fa-icon-${icon}`} className={className} onClick={onClick} />
  ),
}));

jest.mock('../../components/animation-widget/play-button', () => {
  const capture = {};
  const MockPlayButton = (props) => {
    Object.assign(capture, props);
    return <div data-testid="play-button" />;
  };
  MockPlayButton.capture = capture;
  return { __esModule: true, default: MockPlayButton };
});

jest.mock('../../components/animation-widget/loop-button', () => {
  const capture = {};
  const MockLoopButton = (props) => {
    Object.assign(capture, props);
    return <div data-testid="loop-button" />;
  };
  MockLoopButton.capture = capture;
  return { __esModule: true, default: MockLoopButton };
});

jest.mock('../../components/animation-widget/gif-button', () => {
  const capture = {};
  const MockGifButton = (props) => {
    Object.assign(capture, props);
    return <div data-testid="gif-button" />;
  };
  MockGifButton.capture = capture;
  return { __esModule: true, default: MockGifButton };
});

jest.mock('../../components/date-selector/date-range-selector', () => {
  const capture = {};
  const MockDateRangeSelector = (props) => {
    Object.assign(capture, props);
    return <div data-testid="date-range-selector" />;
  };
  MockDateRangeSelector.capture = capture;
  return { __esModule: true, default: MockDateRangeSelector };
});

jest.mock('../../components/timeline/timeline-controls/timescale-interval-change', () => {
  const capture = {};
  const MockTimeScaleIntervalChange = (props) => {
    Object.assign(capture, props);
    return <div data-testid="timescale-interval-change" />;
  };
  MockTimeScaleIntervalChange.capture = capture;
  return { __esModule: true, default: MockTimeScaleIntervalChange };
});

jest.mock('../../components/timeline/custom-interval-selector/custom-interval-selector', () => {
  const capture = {};
  const MockCustomIntervalSelector = (props) => {
    Object.assign(capture, props);
    return <div data-testid="custom-interval-selector" />;
  };
  MockCustomIntervalSelector.capture = capture;
  return { __esModule: true, default: MockCustomIntervalSelector };
});

import DesktopAnimationWidget from './desktop-animation-widget';

let draggableCapture;
let playButtonCapture;
let loopButtonCapture;
let gifButtonCapture;
let dateRangeSelectorCapture;
let timeScaleCapture;
let customIntervalCapture;

beforeAll(() => {
  draggableCapture = jest.requireMock('react-draggable').default.draggableCapture;
  playButtonCapture = jest.requireMock('../../components/animation-widget/play-button').default.capture;
  loopButtonCapture = jest.requireMock('../../components/animation-widget/loop-button').default.capture;
  gifButtonCapture = jest.requireMock('../../components/animation-widget/gif-button').default.capture;
  dateRangeSelectorCapture = jest.requireMock('../../components/date-selector/date-range-selector').default.capture;
  timeScaleCapture = jest.requireMock('../../components/timeline/timeline-controls/timescale-interval-change').default.capture;
  customIntervalCapture = jest.requireMock('../../components/timeline/custom-interval-selector/custom-interval-selector').default.capture;
});

const clearCaptures = () => {
  [draggableCapture, playButtonCapture, loopButtonCapture, gifButtonCapture,
    dateRangeSelectorCapture, timeScaleCapture, customIntervalCapture].forEach((cap) => {
    Object.keys(cap).forEach((k) => delete cap[k]);
  });
};

let defaultProps;

beforeEach(() => {
  jest.clearAllMocks();
  clearCaptures();
  defaultProps = {
    animationCustomModalOpen: false,
    customModalType: { ANIMATION: 'ANIMATION' },
    endDate: new Date('2023-01-10'),
    handleDragStart: jest.fn(),
    hasSubdailyLayers: false,
    interval: 'day',
    isDistractionFreeModeActive: false,
    isPlaying: false,
    looping: false,
    maxDate: new Date('2023-12-31'),
    minDate: new Date('2020-01-01'),
    numberOfFrames: 10,
    onClose: jest.fn(),
    onDateChange: jest.fn(),
    onExpandedDrag: jest.fn(),
    onLoop: jest.fn(),
    onPushPause: jest.fn(),
    onPushPlay: jest.fn(),
    onSlide: jest.fn(),
    playDisabled: false,
    toggleCollapse: jest.fn(),
    setSpeed: jest.fn(),
    sliderLabel: 'FPS',
    speed: 5,
    startDate: new Date('2023-01-01'),
    subDailyMode: false,
    widgetPosition: { x: 0, y: 0 },
    zeroDates: jest.fn(),
  };
});

const renderWidget = (overrides = {}) => render(
  <DesktopAnimationWidget {...defaultProps} {...overrides} />,
);

describe('DesktopAnimationWidget rendering', () => {
  test('renders all child components', () => {
    renderWidget();
    expect(screen.getByTestId('timescale-interval-change')).toBeInTheDocument();
    expect(screen.getByTestId('custom-interval-selector')).toBeInTheDocument();
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    expect(screen.getByTestId('loop-button')).toBeInTheDocument();
    expect(screen.getByTestId('gif-button')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-selector')).toBeInTheDocument();
    expect(screen.getByTestId('fa-icon-chevron-down')).toBeInTheDocument();
    expect(screen.getByTestId('fa-icon-times')).toBeInTheDocument();
  });

  test('renders header text', () => {
    const { container } = renderWidget();
    const header = container.querySelector('.wv-animation-widget-header');
    expect(header.textContent).toContain('Animate Map in');
    expect(header.textContent).toContain('Increments');
  });

  test('renders speed value and slider label', () => {
    const { container } = renderWidget({ speed: 3, sliderLabel: 'FPS' });
    const label = container.querySelector('.wv-slider-label');
    expect(label.textContent).toContain('3');
    expect(label.textContent).toContain('FPS');
  });
});

describe('DesktopAnimationWidget CSS classes', () => {
  test('wrapper does not have d-none when isDistractionFreeModeActive is false', () => {
    const { container } = renderWidget({ isDistractionFreeModeActive: false });
    expect(container.querySelector('.wv-animation-widget-wrapper')).not.toHaveClass('d-none');
  });

  test('wrapper has d-none when isDistractionFreeModeActive is true', () => {
    const { container } = renderWidget({ isDistractionFreeModeActive: true });
    expect(container.querySelector('.wv-animation-widget-wrapper')).toHaveClass('d-none');
  });

  test('inner widget does not have subdaily class when subDailyMode is false', () => {
    const { container } = renderWidget({ subDailyMode: false });
    expect(container.querySelector('#wv-animation-widget')).not.toHaveClass('subdaily');
  });

  test('inner widget has subdaily class when subDailyMode is true', () => {
    const { container } = renderWidget({ subDailyMode: true });
    expect(container.querySelector('#wv-animation-widget')).toHaveClass('subdaily');
  });

  test('chevron-down icon has wv-minimize class', () => {
    renderWidget();
    expect(screen.getByTestId('fa-icon-chevron-down')).toHaveClass('wv-minimize');
  });

  test('times icon has wv-close class', () => {
    renderWidget();
    expect(screen.getByTestId('fa-icon-times')).toHaveClass('wv-close');
  });
});

describe('DesktopAnimationWidget Draggable props', () => {
  test('passes widgetPosition as position', () => {
    const position = { x: 50, y: 100 };
    renderWidget({ widgetPosition: position });
    expect(draggableCapture.position).toEqual(position);
  });

  test('passes handleDragStart as onStart', () => {
    renderWidget();
    expect(draggableCapture.onStart).toBe(defaultProps.handleDragStart);
  });

  test('passes onExpandedDrag as onDrag', () => {
    renderWidget();
    expect(draggableCapture.onDrag).toBe(defaultProps.onExpandedDrag);
  });

  test('passes "body" as bounds', () => {
    renderWidget();
    expect(draggableCapture.bounds).toBe('body');
  });

  test('passes ".no-drag, .date-arrows" as cancel', () => {
    renderWidget();
    expect(draggableCapture.cancel).toBe('.no-drag, .date-arrows');
  });

  test('passes ".wv-animation-widget-header" as handle', () => {
    renderWidget();
    expect(draggableCapture.handle).toBe('.wv-animation-widget-header');
  });
});

describe('DesktopAnimationWidget TimeScaleIntervalChange props', () => {
  test('passes interval as timeScaleChangeUnit', () => {
    renderWidget({ interval: 'month' });
    expect(timeScaleCapture.timeScaleChangeUnit).toBe('month');
  });

  test('passes hasSubdailyLayers', () => {
    renderWidget({ hasSubdailyLayers: true });
    expect(timeScaleCapture.hasSubdailyLayers).toBe(true);
  });

  test('passes customModalType.ANIMATION as modalType', () => {
    renderWidget({ customModalType: { ANIMATION: 'ANIMATION' } });
    expect(timeScaleCapture.modalType).toBe('ANIMATION');
  });

  test('passes isPlaying as isDisabled', () => {
    renderWidget({ isPlaying: true });
    expect(timeScaleCapture.isDisabled).toBe(true);
  });

  test('isDisabled is false when not playing', () => {
    renderWidget({ isPlaying: false });
    expect(timeScaleCapture.isDisabled).toBe(false);
  });
});

describe('DesktopAnimationWidget CustomIntervalSelector props', () => {
  test('passes animationCustomModalOpen as modalOpen', () => {
    renderWidget({ animationCustomModalOpen: true });
    expect(customIntervalCapture.modalOpen).toBe(true);
  });

  test('passes hasSubdailyLayers', () => {
    renderWidget({ hasSubdailyLayers: true });
    expect(customIntervalCapture.hasSubdailyLayers).toBe(true);
  });
});

describe('DesktopAnimationWidget PlayButton props', () => {
  test('passes isPlaying as playing', () => {
    renderWidget({ isPlaying: true });
    expect(playButtonCapture.playing).toBe(true);
  });

  test('passes onPushPlay as play', () => {
    renderWidget();
    expect(playButtonCapture.play).toBe(defaultProps.onPushPlay);
  });

  test('passes onPushPause as pause', () => {
    renderWidget();
    expect(playButtonCapture.pause).toBe(defaultProps.onPushPause);
  });

  test('passes playDisabled as isDisabled', () => {
    renderWidget({ playDisabled: true });
    expect(playButtonCapture.isDisabled).toBe(true);
  });
});

describe('DesktopAnimationWidget LoopButton props', () => {
  test('passes looping', () => {
    renderWidget({ looping: true });
    expect(loopButtonCapture.looping).toBe(true);
  });

  test('passes onLoop', () => {
    renderWidget();
    expect(loopButtonCapture.onLoop).toBe(defaultProps.onLoop);
  });
});

describe('DesktopAnimationWidget GifButton props', () => {
  test('passes zeroDates', () => {
    renderWidget();
    expect(gifButtonCapture.zeroDates).toBe(defaultProps.zeroDates);
  });

  test('passes numberOfFrames', () => {
    renderWidget({ numberOfFrames: 25 });
    expect(gifButtonCapture.numberOfFrames).toBe(25);
  });
});

describe('DesktopAnimationWidget DateRangeSelector props', () => {
  test('passes idSuffix as animation-widget', () => {
    renderWidget();
    expect(dateRangeSelectorCapture.idSuffix).toBe('animation-widget');
  });

  test('passes startDate', () => {
    const startDate = new Date('2023-03-01');
    renderWidget({ startDate });
    expect(dateRangeSelectorCapture.startDate).toBe(startDate);
  });

  test('passes endDate', () => {
    const endDate = new Date('2023-03-31');
    renderWidget({ endDate });
    expect(dateRangeSelectorCapture.endDate).toBe(endDate);
  });

  test('passes onDateChange as setDateRange', () => {
    renderWidget();
    expect(dateRangeSelectorCapture.setDateRange).toBe(defaultProps.onDateChange);
  });

  test('passes minDate', () => {
    const minDate = new Date('2019-01-01');
    renderWidget({ minDate });
    expect(dateRangeSelectorCapture.minDate).toBe(minDate);
  });

  test('passes maxDate', () => {
    const maxDate = new Date('2024-01-01');
    renderWidget({ maxDate });
    expect(dateRangeSelectorCapture.maxDate).toBe(maxDate);
  });

  test('passes subDailyMode', () => {
    renderWidget({ subDailyMode: true });
    expect(dateRangeSelectorCapture.subDailyMode).toBe(true);
  });

  test('passes isPlaying as isDisabled', () => {
    renderWidget({ isPlaying: true });
    expect(dateRangeSelectorCapture.isDisabled).toBe(true);
  });

  test('isDisabled is false when not playing', () => {
    renderWidget({ isPlaying: false });
    expect(dateRangeSelectorCapture.isDisabled).toBe(false);
  });
});

describe('DesktopAnimationWidget FPS slider', () => {
  test('slider has correct attributes', () => {
    renderWidget({ speed: 3 });
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('step', '0.5');
    expect(slider).toHaveAttribute('min', '0.5');
    expect(slider).toHaveAttribute('max', '10');
    expect(slider).toHaveValue('3');
  });

  test('slider is disabled when isPlaying is true', () => {
    renderWidget({ isPlaying: true });
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  test('slider is enabled when isPlaying is false', () => {
    renderWidget({ isPlaying: false });
    expect(screen.getByRole('slider')).not.toBeDisabled();
  });

  test('onChange calls setSpeed with parsed float value', () => {
    renderWidget({ speed: 5 });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7.5' } });
    expect(defaultProps.setSpeed).toHaveBeenCalledWith(7.5);
  });

  test('onChange calls onSlide with the current speed prop (not the new value)', () => {
    renderWidget({ speed: 5 });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7.5' } });
    expect(defaultProps.onSlide).toHaveBeenCalledWith(5);
  });

  test('onChange with integer string value parses correctly', () => {
    renderWidget({ speed: 2 });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } });
    expect(defaultProps.setSpeed).toHaveBeenCalledWith(4);
    expect(defaultProps.onSlide).toHaveBeenCalledWith(2);
  });
});

describe('DesktopAnimationWidget icon interactions', () => {
  test('clicking chevron-down calls toggleCollapse', () => {
    renderWidget();
    fireEvent.click(screen.getByTestId('fa-icon-chevron-down'));
    expect(defaultProps.toggleCollapse).toHaveBeenCalledTimes(1);
  });

  test('clicking times calls onClose', () => {
    renderWidget();
    fireEvent.click(screen.getByTestId('fa-icon-times'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
