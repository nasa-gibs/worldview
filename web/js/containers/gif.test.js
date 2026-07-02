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
}));

jest.mock('../modules/date/constants', () => ({
  TIME_SCALE_FROM_NUMBER: {
    1: 'year', 2: 'month', 3: 'day', 4: 'hour', 5: 'minute',
  },
}));

jest.mock('../modules/animation/selectors', () => ({
  __esModule: true,
  default: jest.fn(() => ['image1', 'image2']),
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
const util = require('../util/util').default;
const getImageArray = require('../modules/animation/selectors').default;
const { getStampProps, svgToPng, getNumberOfSteps } = require('../modules/animation/util');
const { changeCropBounds } = require('../modules/animation/actions');

const defaultProps = {
  boundaries: null,
  startDate: new Date('2020-01-01T00:00:00Z'),
  endDate: new Date('2020-01-10T00:00:00Z'),
  startDateStr: '2020 JAN 01',
  endDateStr: '2020 JAN 10',
  getImageArrayFunc: jest.fn(() => ['img']),
  increment: '1 day Between Frames',
  map: {
    ui: {
      selected: {
        getView: jest.fn(() => ({ getZoom: jest.fn(() => 3) })),
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
  url: 'http://snapshot.test',
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
  it('creates a GIF and shows results on success', () => {
    const getImageArrayFunc = jest.fn(() => ['img1', 'img2']);
    const { getByTestId, queryByTestId } = renderComponent({ getImageArrayFunc });
    act(() => {
      mockGifPanelProps.onClick(300, 200);
    });
    expect(getStampProps).toHaveBeenCalled();
    expect(svgToPng).toHaveBeenCalled();
    expect(getImageArrayFunc).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://snapshot.test', showDates: true }),
      { width: 300, height: 200 },
    );
    expect(mockCreateGIF).toHaveBeenCalled();
    // while downloading, the requesting imagery modal shows a spinner
    expect(getByTestId('spinner')).toBeInTheDocument();

    const [options, onComplete] = mockCreateGIF.mock.calls[0];
    act(() => {
      options.progressCallback(42);
    });
    expect(getByTestId('progress')).toHaveAttribute('data-value', '42');
    expect(queryByTestId('spinner')).toBeNull();

    act(() => {
      onComplete({ blob: { size: 1024000 } });
    });
    expect(getByTestId('gif-results')).toBeInTheDocument();
    expect(mockGifResultsProps.gifObject.width).toBe(300);
    // size = round((1024000 / 1024) * 0.001, 2) MB
    expect(mockGifResultsProps.gifObject.size).toBe(1);
  });

  it('resets state when GIF creation errors', () => {
    const { getByTestId, queryByTestId } = renderComponent();
    act(() => {
      mockGifPanelProps.onClick(300, 200);
    });
    const [, onComplete] = mockCreateGIF.mock.calls[0];
    act(() => {
      onComplete({ error: 'failed' });
    });
    expect(queryByTestId('gif-results')).toBeNull();
    expect(getByTestId('gif-panel')).toBeInTheDocument();
  });

  it('resets state when GIF creation is cancelled while mounted', () => {
    const { getByTestId } = renderComponent();
    act(() => {
      mockGifPanelProps.onClick(300, 200);
    });
    const [, onComplete] = mockCreateGIF.mock.calls[0];
    act(() => {
      onComplete({ cancelled: true });
    });
    expect(getByTestId('gif-panel')).toBeInTheDocument();
  });

  it('does not build a GIF when image array is unavailable (too many frames)', () => {
    const getImageArrayFunc = jest.fn(() => false);
    renderComponent({ getImageArrayFunc });
    act(() => {
      mockGifPanelProps.onClick(300, 200);
    });
    expect(mockCreateGIF).not.toHaveBeenCalled();
  });

  it('cancels the gif stream when unmounted while downloading', () => {
    const { unmount } = renderComponent();
    act(() => {
      mockGifPanelProps.onClick(300, 200);
    });
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
    expect(result.url).toBe('http://localhost:3002/api/v1/snapshot');
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

  it('uses configured imageDownload url', () => {
    const state = makeState({
      config: { features: { imageDownload: { url: 'https://snapshots.example' } }, parameters: {} },
    });
    expect(capturedMapState(state).url).toBe('https://snapshots.example');
  });

  it('redirects to parameters.imageDownload with a warning', () => {
    const state = makeState({
      config: { features: {}, parameters: { imageDownload: 'https://override.example' } },
    });
    expect(capturedMapState(state).url).toBe('https://override.example');
    expect(util.warn).toHaveBeenCalledWith('Redirecting GIF download to: https://override.example');
  });

  it('getImageArrayFunc proxies to getImageArray with state', () => {
    const state = makeState();
    const result = capturedMapState(state);
    const arr = result.getImageArrayFunc({ opt: 1 }, { width: 5, height: 5 });
    expect(getImageArray).toHaveBeenCalledWith({ opt: 1 }, { width: 5, height: 5 }, state);
    expect(arr).toEqual(['image1', 'image2']);
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
});
