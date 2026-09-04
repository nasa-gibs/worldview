/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

const mockCreateGIF = jest.fn();
const mockCancel = jest.fn();
jest.mock('../modules/animation/gifstream', () => ({
  __esModule: true,
  default: class MockGifStream {
    createGIF(...args) { mockCreateGIF(...args); }

    cancel(...args) { mockCancel(...args); }
  },
}));

let mockGifPanelProps = null;
jest.mock('../components/animation-widget/gif-panel', () => (props) => {
  mockGifPanelProps = props;
  return <div data-testid="gif-panel" />;
});

let mockGifResultsProps = null;
jest.mock('../components/animation-widget/gif-post-creation', () => (props) => {
  mockGifResultsProps = props;
  return <div data-testid="gif-results" />;
});

let mockCropProps = null;
jest.mock('../components/util/image-crop', () => (props) => {
  mockCropProps = props;
  return <div data-testid="crop" />;
});

let mockModalProps = null;
jest.mock('reactstrap', () => ({
  Modal: (props) => {
    mockModalProps = props;
    return <div data-testid="modal">{props.children}</div>;
  },
  ModalBody: ({ children }) => <div data-testid="modal-body">{children}</div>,
  ModalHeader: (props) => (
    <div data-testid="modal-header">
      {props.children}
      {props.close}
    </div>
  ),
  Progress: (props) => <div data-testid="progress" data-value={props.value} />,
  Spinner: () => <div data-testid="spinner" />,
}));

jest.mock('ol/proj', () => ({
  transform: jest.fn((coord) => coord),
}));

jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn) => fn,
}));

jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    formatCoordinate: jest.fn((coord) => `fmt(${coord.join(',')})`),
    warn: jest.fn(),
  },
}));

jest.mock('../modules/image-download/util', () => ({
  imageUtilCalculateResolution: jest.fn(() => '1km'),
  imageUtilGetCoordsFromPixelValues: jest.fn(() => [[0, 0], [10, 10]]),
  captureAnimationFrames: jest.fn(() => Promise.resolve({
    frames: [new Blob(), new Blob()],
    timings: [{ load: 1, capture: 2, encode: 3 }],
  })),
}));

jest.mock('../modules/map/util', () => ({
  promiseImageryForTime: jest.fn(() => Promise.resolve()),
}));

jest.mock('../modules/date/actions', () => ({
  selectDate: jest.fn((date) => ({ type: 'SELECT_DATE', date })),
}));

jest.mock('../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2020-01-05T00:00:00Z')),
}));

jest.mock('googleTagManager', () => ({
  __esModule: true,
  default: { pushEvent: jest.fn() },
}));

jest.mock('../modules/date/constants', () => ({
  TIME_SCALE_FROM_NUMBER: {
    1: 'year', 2: 'month', 3: 'day', 4: 'hour', 5: 'minute',
  },
}));

jest.mock('../modules/animation/selectors', () => ({
  __esModule: true,
  default: jest.fn(() => [
    { date: new Date('2020-01-01T00:00:00Z'), text: 'a', delay: 100 },
    { date: new Date('2020-01-02T00:00:00Z'), text: 'b', delay: 100 },
  ]),
}));

jest.mock('../modules/animation/util', () => ({
  getStampProps: jest.fn(() => ({
    stampHeight: 30,
    dateStamp: {
      fontSize: 20, x: 5, y: 6, align: 'left',
    },
  })),
  svgToPng: jest.fn(() => ({ width: 100, height: 30 })),
  getNumberOfSteps: jest.fn(() => 12),
}));

jest.mock('../modules/animation/actions', () => ({
  changeCropBounds: jest.fn((bounds) => ({ type: 'CHANGE_CROP_BOUNDS', bounds })),
}));

jest.mock('../modules/layers/selectors', () => ({
  subdailyLayersActive: jest.fn(() => false),
}));

jest.mock('../modules/date/util', () => ({
  formatDisplayDate: jest.fn((date) => `display-${date}`),
}));

const Gif = require('./gif').default;
const getAnimationFrames = require('../modules/animation/selectors').default;
const { captureAnimationFrames } = require('../modules/image-download/util');
const { promiseImageryForTime } = require('../modules/map/util');
const { getStampProps, svgToPng, getNumberOfSteps } = require('../modules/animation/util');
const { changeCropBounds } = require('../modules/animation/actions');

const defaultProps = {
  boundaries: null,
  startDate: new Date('2020-01-01T00:00:00Z'),
  endDate: new Date('2020-01-10T00:00:00Z'),
  startDateStr: '2020 JAN 01',
  endDateStr: '2020 JAN 10',
  getFramesFunc: jest.fn(() => [
    { date: new Date('2020-01-01T00:00:00Z'), text: 'a', delay: 100 },
  ]),
  promiseImagery: jest.fn(() => Promise.resolve()),
  selectDate: jest.fn(),
  currentDate: new Date('2020-01-05T00:00:00Z'),
  increment: '1 day Between Frames',
  map: {
    ui: {
      selected: {
        getView: jest.fn(() => ({
          getZoom: jest.fn(() => 3),
          getCenter: jest.fn(() => [0, 0]),
        })),
        getCoordinateFromPixel: jest.fn(() => [0, 0]),
      },
    },
  },
  numberOfFrames: 12,
  onBoundaryChange: jest.fn(),
  onClose: jest.fn(),
  proj: { id: 'geographic', crs: 'EPSG:4326', resolutions: [1, 2] },
  screenHeight: 800,
  screenWidth: 1200,
  speed: 3,
};

const renderComponent = (props = {}) => render(<Gif {...defaultProps} {...props} />);

beforeEach(() => {
  jest.clearAllMocks();
  mockGifPanelProps = null;
  mockGifResultsProps = null;
  mockCropProps = null;
  mockModalProps = null;
});

describe('GIF selectable box', () => {
  it('renders the gif panel and crop with default boundaries', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('gif-panel')).toBeInTheDocument();
    expect(getByTestId('crop')).toBeInTheDocument();
    // default boundaries x=500,y=300,x2=700,y2=500
    expect(mockCropProps.x).toBe(500);
    expect(mockCropProps.width).toBe(200);
    expect(mockGifPanelProps.startDate).toBe('2020 JAN 01');
    expect(mockGifPanelProps.numberOfFrames).toBe(12);
  });

  it('toggles the showDates checkbox', () => {
    renderComponent();
    expect(mockGifPanelProps.showDates).toBe(true);
    act(() => {
      mockGifPanelProps.onCheck();
    });
    expect(mockGifPanelProps.showDates).toBe(false);
  });

  it('renders the close button which calls onClose', () => {
    const onClose = jest.fn();
    const { container } = renderComponent({ onClose });
    const btn = container.querySelector('.modal-close-btn');
    btn.click();
    expect(onClose).toHaveBeenCalled();
  });

  it('updates boundaries and modal offsets on crop change', () => {
    const onBoundaryChange = jest.fn();
    renderComponent({ onBoundaryChange });
    act(() => {
      mockCropProps.onChange({
        x: 100, y: 100, width: 80, height: 60,
      });
    });
    expect(onBoundaryChange).toHaveBeenCalledWith({
      x: 100, y: 100, x2: 180, y2: 160,
    });
    expect(mockCropProps.x).toBe(100);
    expect(mockCropProps.width).toBe(80);
  });
});

describe('getModalOffsets placement', () => {
  it('places the modal to the left when it would overflow on the right', () => {
    renderComponent({
      boundaries: {
        x: 700, y: 100, x2: 1100, y2: 300,
      },
    });
    // left = 1120 > 1200-342 → x - padding - width = 700-20-342 = 338
    expect(mockModalProps.style.left).toBe(338);
  });

  it('places the modal below when no room on either side and y < height', () => {
    renderComponent({
      boundaries: {
        x: 50, y: 100, x2: 1190, y2: 300,
      },
    });
    // left = 1210 → 1210-342-20 = 848; y(100) < 280 → top = y2 = 300
    expect(mockModalProps.style.left).toBe(848);
    expect(mockModalProps.style.top).toBe(300);
  });

  it('places the modal above when no room on either side and y >= height', () => {
    renderComponent({
      boundaries: {
        x: 50, y: 400, x2: 1190, y2: 600,
      },
    });
    // top = y - padding - height = 400-20-280 = 100
    expect(mockModalProps.style.top).toBe(100);
  });

  it('clamps the modal to the bottom of the screen', () => {
    renderComponent({
      boundaries: {
        x: 500, y: 700, x2: 700, y2: 780,
      },
    });
    // top = 680; 680+280 > 800 → 800-20-280 = 500
    expect(mockModalProps.style.top).toBe(500);
  });
});

describe('GIF creation flow', () => {
  const clickCreate = async (width = 300, height = 200, resolution = 250) => {
    await act(async () => {
      await mockGifPanelProps.onClick(width, height, resolution);
    });
  };

  it('captures frames then encodes and shows results on success', async () => {
    const { getByTestId } = renderComponent();
    await clickCreate();

    expect(captureAnimationFrames).toHaveBeenCalledWith(
      expect.objectContaining({
        metersPerPixel: 250,
        pixelBbox: [500, 300, 700, 500],
        originalDate: defaultProps.currentDate,
      }),
    );
    expect(getStampProps).toHaveBeenCalled();
    expect(svgToPng).toHaveBeenCalled();
    expect(mockCreateGIF).toHaveBeenCalled();

    const [options, onComplete] = mockCreateGIF.mock.calls[0];
    // Encoding progress occupies the upper half of the bar
    act(() => {
      options.progressCallback(42);
    });
    expect(getByTestId('progress')).toHaveAttribute('data-value', '71');

    act(() => {
      onComplete({ blob: { size: 1024000 } });
    });
    expect(getByTestId('gif-results')).toBeInTheDocument();
    expect(mockGifResultsProps.gifObject.width).toBe(300);
    expect(mockGifResultsProps.gifObject.size).toBe(1);
  });

  it('passes each frame date to the capture routine', async () => {
    renderComponent({
      getFramesFunc: jest.fn(() => [
        { date: new Date('2020-01-01T00:00:00Z'), text: 'a', delay: 100 },
        { date: new Date('2020-01-02T00:00:00Z'), text: 'b', delay: 100 },
      ]),
    });
    await clickCreate();
    const { dates } = captureAnimationFrames.mock.calls[0][0];
    expect(dates).toHaveLength(2);
    expect(dates[0]).toEqual(new Date('2020-01-01T00:00:00Z'));
  });

  it('attaches a captured object URL to every frame', async () => {
    renderComponent();
    await clickCreate();
    const [options] = mockCreateGIF.mock.calls[0];
    options.images.forEach((image) => {
      expect(typeof image.src).toBe('string');
    });
  });

  it('resets state when GIF creation errors', async () => {
    const { getByTestId, queryByTestId } = renderComponent();
    await clickCreate();
    const [, onComplete] = mockCreateGIF.mock.calls[0];
    act(() => {
      onComplete({ error: 'failed' });
    });
    expect(queryByTestId('gif-results')).toBeNull();
    expect(getByTestId('gif-panel')).toBeInTheDocument();
  });

  it('resets state when GIF creation is cancelled while mounted', async () => {
    const { getByTestId } = renderComponent();
    await clickCreate();
    const [, onComplete] = mockCreateGIF.mock.calls[0];
    act(() => {
      onComplete({ cancelled: true });
    });
    expect(getByTestId('gif-panel')).toBeInTheDocument();
  });

  it('returns to the panel when capture is aborted', async () => {
    const abortError = new DOMException('cancelled', 'AbortError');
    captureAnimationFrames.mockRejectedValueOnce(abortError);
    const { getByTestId } = renderComponent();
    await clickCreate();
    expect(mockCreateGIF).not.toHaveBeenCalled();
    expect(getByTestId('gif-panel')).toBeInTheDocument();
  });

  it('does not capture when the frame list is unavailable (too many frames)', async () => {
    const getFramesFunc = jest.fn(() => false);
    renderComponent({ getFramesFunc });
    await clickCreate();
    expect(captureAnimationFrames).not.toHaveBeenCalled();
    expect(mockCreateGIF).not.toHaveBeenCalled();
  });

  it('cancels the gif stream when unmounted while downloading', async () => {
    const { unmount } = renderComponent();
    await clickCreate();
    unmount();
    expect(mockCancel).toHaveBeenCalled();
  });

  it('does not cancel when unmounted while idle', () => {
    const { unmount } = renderComponent();
    unmount();
    expect(mockCancel).not.toHaveBeenCalled();
  });
});

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    screenSize: { screenWidth: 1440, screenHeight: 900 },
    proj: { selected: { id: 'geographic', crs: 'EPSG:4326' } },
    animation: {
      speed: 5,
      startDate: new Date('2020-01-01T00:00:00Z'),
      endDate: new Date('2020-01-05T00:00:00Z'),
      boundaries: { x: 1, y: 2, x2: 3, y2: 4 },
      gifActive: true,
    },
    map: { ui: {} },
    date: {
      customSelected: false,
      autoSelected: false,
      interval: 3,
      customInterval: 4,
      customDelta: 2,
    },
    config: { features: {}, parameters: {} },
    layers: { active: { layers: [] } },
    ...overrides,
  });

  it('maps animation state with standard increment', () => {
    const result = capturedMapState(makeState());
    expect(result.increment).toBe('1 day Between Frames');
    expect(result.speed).toBe(5);
    expect(result.isActive).toBe(true);
    expect(result.numberOfFrames).toBe(12);
    expect(getNumberOfSteps).toHaveBeenCalled();
  });

  it('uses the custom interval when customSelected', () => {
    const state = makeState();
    state.date.customSelected = true;
    const result = capturedMapState(state);
    expect(result.increment).toBe('2 hour Between Frames');
  });

  it('uses Auto Interval when autoSelected', () => {
    const state = makeState();
    state.date.autoSelected = true;
    const result = capturedMapState(state);
    expect(result.increment).toBe('Auto Interval Between Frames');
  });

  it('getFramesFunc proxies to getAnimationFrames with state', () => {
    const state = makeState();
    const result = capturedMapState(state);
    result.getFramesFunc({ opt: 1 });
    expect(getAnimationFrames).toHaveBeenCalledWith({ opt: 1 }, state);
  });

  it('promiseImagery proxies to promiseImageryForTime with state', () => {
    const state = makeState();
    const result = capturedMapState(state);
    const date = new Date('2020-01-02T00:00:00Z');
    result.promiseImagery(date);
    expect(promiseImageryForTime).toHaveBeenCalledWith(state, date);
  });
});

describe('mapDispatchToProps', () => {
  it('onBoundaryChange dispatches changeCropBounds', () => {
    const dispatch = jest.fn();
    const props = capturedMapDispatch(dispatch);
    props.onBoundaryChange({ x: 9 });
    expect(changeCropBounds).toHaveBeenCalledWith({ x: 9 });
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_CROP_BOUNDS', bounds: { x: 9 } });
  });

  it('selectDate dispatches the date action', () => {
    const dispatch = jest.fn();
    const props = capturedMapDispatch(dispatch);
    const date = new Date('2020-01-03T00:00:00Z');
    props.selectDate(date);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_DATE', date });
  });
});
