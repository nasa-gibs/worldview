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

let mockPanelProps = null;
let mockCropProps = null;
jest.mock('../components/image-download/image-download-panel', () => (props) => {
  mockPanelProps = props;
  return <div data-testid="image-download-panel" />;
});
jest.mock('../components/util/image-crop', () => (props) => {
  mockCropProps = props;
  return <div data-testid="crop" />;
});

jest.mock('./error-boundary', () => ({ children }) => <div>{children}</div>);

jest.mock('ol/proj', () => ({
  transform: jest.fn((coord) => coord),
}));

jest.mock('../modules/image-download/util', () => ({
  getAlertMessageIfCrossesDateline: jest.fn(() => 'dateline-message'),
  imageUtilCalculateResolution: jest.fn(() => '500m'),
  imageUtilGetPixelValuesFromCoords: jest.fn(() => ({
    x: 10, y: 20, x2: 110, y2: 120,
  })),
}));

jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    formatCoordinate: jest.fn((coord) => `fmt(${coord.join(',')})`),
  },
}));

jest.mock('../modules/layers/selectors', () => ({
  getLayers: jest.fn(() => ['layer1']),
  subdailyLayersActive: jest.fn(() => false),
}));

jest.mock('../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2021-01-01T00:00:00Z')),
}));

jest.mock('../modules/modal/actions', () => ({
  onToggle: jest.fn(() => ({ type: 'MODAL_TOGGLE' })),
}));

jest.mock('../modules/image-download/actions', () => ({
  onPanelChange: jest.fn((type, value) => ({ type: 'PANEL_CHANGE', panelType: type, value })),
  updateBoundaries: jest.fn((obj) => ({ type: 'UPDATE_BOUNDARIES', obj })),
}));

jest.mock('../components/location-search/util', () => ({
  getNormalizedCoordinate: jest.fn((coord) => coord),
}));

const ImageDownloadContainer = require('./image-download').default;
const { getLayers: getLayersSelector } = require('../modules/layers/selectors');
const { onToggle } = require('../modules/modal/actions');
const {
  onPanelChange: onPanelChangeAction,
  updateBoundaries,
} = require('../modules/image-download/actions');

const makeMapUi = () => ({
  selected: {
    getCoordinateFromPixel: jest.fn(([x, y]) => [x / 10, y / 10]),
    getView: jest.fn(() => ({
      getZoom: jest.fn(() => 4),
      calculateExtent: jest.fn(() => [0, 0, 100, 100]),
    })),
    getSize: jest.fn(() => [1024, 768]),
  },
});

const defaultProps = {
  closeModal: jest.fn(),
  fileType: 'image/jpeg',
  map: { ui: makeMapUi() },
  onBoundaryChange: jest.fn(),
  onPanelChange: jest.fn(),
  proj: {
    id: 'geographic',
    selected: { crs: 'EPSG:4326', resolutions: [1, 2, 3] },
  },
  url: 'http://snapshot.test',
  date: new Date('2021-01-01T00:00:00Z'),
  getLayers: jest.fn(() => []),
  hasSubdailyLayers: false,
  isWorldfile: false,
  markerCoordinates: [],
  resolution: '250m',
  screenHeight: 800,
  screenWidth: 1200,
  boundaries: null,
};

const renderComponent = (props = {}) => render(
  <ImageDownloadContainer {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  mockPanelProps = null;
  mockCropProps = null;
});

describe('ImageDownloadContainer render', () => {
  it('renders panel and crop with default boundaries centered on screen', () => {
    renderComponent();
    expect(mockPanelProps).not.toBeNull();
    expect(mockCropProps).not.toBeNull();
    // default boundaries: x=500, y=300, x2=700, y2=500
    expect(mockCropProps.x).toBe(500);
    expect(mockCropProps.y).toBe(300);
    expect(mockCropProps.width).toBe(200);
    expect(mockCropProps.height).toBe(200);
    expect(mockPanelProps.resolution).toBe('250m');
    expect(mockPanelProps.datelineMessage).toBe('dateline-message');
  });

  it('uses provided boundaries when present', () => {
    renderComponent({
      boundaries: {
        x: 1, y: 2, x2: 11, y2: 22,
      },
    });
    expect(mockCropProps.x).toBe(1);
    expect(mockCropProps.width).toBe(10);
  });

  it('calculates resolution when none is set', () => {
    renderComponent({ resolution: null });
    expect(mockPanelProps.resolution).toBe('500m');
  });

  it('uses polar file types and resolutions for non-geographic projections', () => {
    renderComponent({
      proj: { id: 'arctic', selected: { crs: 'EPSG:3413', resolutions: [1] } },
    });
    expect(mockPanelProps.fileTypes).toBeDefined();
    expect(mockPanelProps.resolutions).toBeDefined();
  });

  it('onLatLongChange updates boundaries and calls debounced update', () => {
    jest.useFakeTimers();
    renderComponent();
    act(() => {
      mockPanelProps.onLatLongChange([0, 0, 10, 10]);
    });
    expect(mockCropProps.x).toBe(10);
    expect(mockCropProps.y).toBe(20);
    act(() => { jest.advanceTimersByTime(250); });
    expect(defaultProps.onBoundaryChange).toHaveBeenCalledWith({
      x: 10, y: 20, x2: 110, y2: 120,
    });
    jest.useRealTimers();
  });

  it('onBoundaryChange (crop) converts width/height and updates lat/long state', () => {
    jest.useFakeTimers();
    renderComponent();
    act(() => {
      mockCropProps.onChange({
        x: 100, y: 200, width: 50, height: 60,
      });
    });
    expect(mockCropProps.x).toBe(100);
    expect(mockCropProps.width).toBe(50);
    act(() => { jest.advanceTimersByTime(250); });
    expect(defaultProps.onBoundaryChange).toHaveBeenCalledWith({
      x: 100, y: 200, x2: 150, y2: 260,
    });
    jest.useRealTimers();
  });
});

describe('mapStateToProps', () => {
  const makeState = (configFeatures = {}) => ({
    config: { features: configFeatures },
    proj: { id: 'geographic', selected: { crs: 'EPSG:4326' } },
    screenSize: { screenWidth: 1440, screenHeight: 900 },
    locationSearch: { coordinates: [5, 6] },
    map: { ui: makeMapUi() },
    imageDownload: {
      isWorldfile: true,
      fileType: 'image/png',
      resolution: '1km',
      boundaries: { x: 0, y: 0, x2: 5, y2: 5 },
    },
  });

  it('maps image download state with the default snapshot URL', () => {
    const result = capturedMapState(makeState());
    expect(result.url).toBe('http://localhost:3002/api/v1/snapshot');
    expect(result.isWorldfile).toBe(true);
    expect(result.fileType).toBe('image/png');
    expect(result.resolution).toBe('1km');
    expect(result.screenWidth).toBe(1440);
    expect(result.markerCoordinates).toEqual([5, 6]);
  });

  it('uses configured imageDownload URL when present', () => {
    const result = capturedMapState(makeState({ imageDownload: { url: 'https://wvs.earthdata.nasa.gov/api/v1/snapshot' } }));
    expect(result.url).toBe('https://wvs.earthdata.nasa.gov/api/v1/snapshot');
  });

  it('getLayers invokes the layers selector with reverse and renderable', () => {
    const state = makeState();
    const result = capturedMapState(state);
    result.getLayers();
    expect(getLayersSelector).toHaveBeenCalledWith(state, { reverse: true, renderable: true });
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let props;
  beforeEach(() => {
    dispatch = jest.fn();
    props = capturedMapDispatch(dispatch);
  });

  it('onClose dispatches modal toggle', () => {
    props.onClose();
    expect(onToggle).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'MODAL_TOGGLE' });
  });

  it('onPanelChange dispatches the panel change action', () => {
    props.onPanelChange('fileType', 'image/png');
    expect(onPanelChangeAction).toHaveBeenCalledWith('fileType', 'image/png');
  });

  it('onBoundaryChange dispatches updateBoundaries', () => {
    const bounds = { x: 1 };
    props.onBoundaryChange(bounds);
    expect(updateBoundaries).toHaveBeenCalledWith(bounds);
  });
});
