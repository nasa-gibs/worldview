/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const capture = {};
  const mockConnect = (msp) => {
    capture.msp = msp;
    return (Component) => Component;
  };
  mockConnect.connectCapture = capture;
  return { ...actual, connect: mockConnect };
});

jest.mock('../../util/context-menu', () => ({
  ContextMenuTrigger: ({ children }) => <div data-testid="context-menu-trigger">{children}</div>,
}));

jest.mock('../../components/context-menu/context-menu', () => () => <div data-testid="right-click-menu" />);
jest.mock('../../components/map/zoom', () => () => <div data-testid="ol-zoom-buttons" />);
jest.mock('../../components/map/rotation', () => () => <div data-testid="ol-rotation-buttons" />);
jest.mock('./ol-vector-interactions', () => () => <div data-testid="ol-vector-interactions" />);
jest.mock('../../components/map/ol-measure-tool', () => () => <div data-testid="ol-measure-tool" />);
jest.mock('../../components/location-search/ol-coordinates-marker', () => () => <div data-testid="ol-coordinates-marker" />);
jest.mock('../../map/natural-events/natural-events', () => () => <div data-testid="natural-events" />);
jest.mock('../../components/dateline/datelines', () => () => <div data-testid="date-lines" />);

jest.mock('../../components/map/ol-coordinates', () => {
  const capture = {};
  const MockOlCoordinates = (props) => {
    Object.assign(capture, props);
    return <div data-testid="ol-coordinates" />;
  };
  MockOlCoordinates.capture = capture;
  return { __esModule: true, default: MockOlCoordinates };
});

import MapInteractions from './map-interactions';

let capturedMapStateToProps;
let olCoordinatesCapture;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  olCoordinatesCapture = jest.requireMock('../../components/map/ol-coordinates').default.capture;
});

const defaultProps = {
  isShowingClick: false,
  isDistractionFreeModeActive: false,
  isCoordinateSearchActive: false,
  isNaturalEventsActive: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(olCoordinatesCapture).forEach((k) => delete olCoordinatesCapture[k]);
});

const renderComponent = (overrides = {}) => render(
  <MapInteractions {...defaultProps} {...overrides} />,
);

describe('MapInteractions rendering', () => {
  test('renders all child components', () => {
    renderComponent();
    expect(screen.getByTestId('context-menu-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('right-click-menu')).toBeInTheDocument();
    expect(screen.getByTestId('ol-zoom-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('ol-rotation-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('ol-coordinates')).toBeInTheDocument();
    expect(screen.getByTestId('ol-vector-interactions')).toBeInTheDocument();
    expect(screen.getByTestId('ol-measure-tool')).toBeInTheDocument();
    expect(screen.getByTestId('ol-coordinates-marker')).toBeInTheDocument();
    expect(screen.getByTestId('date-lines')).toBeInTheDocument();
  });

  test('renders the wv-map div inside ContextMenuTrigger', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#wv-map')).toBeInTheDocument();
  });

  test('renders NaturalEvents when isNaturalEventsActive is true', () => {
    renderComponent({ isNaturalEventsActive: true });
    expect(screen.getByTestId('natural-events')).toBeInTheDocument();
  });

  test('does not render NaturalEvents when isNaturalEventsActive is false', () => {
    renderComponent({ isNaturalEventsActive: false });
    expect(screen.queryByTestId('natural-events')).not.toBeInTheDocument();
  });
});

describe('MapInteractions getMapClasses', () => {
  test('wv-map div always has base wv-map class', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#wv-map')).toHaveClass('wv-map');
  });

  test('adds cursor-pointer when isShowingClick and not isCoordinateSearchActive', () => {
    const { container } = renderComponent({
      isShowingClick: true,
      isCoordinateSearchActive: false,
    });
    expect(container.querySelector('#wv-map')).toHaveClass('cursor-pointer');
  });

  test('does not add cursor-pointer when isShowingClick is false', () => {
    const { container } = renderComponent({
      isShowingClick: false,
      isCoordinateSearchActive: false,
    });
    expect(container.querySelector('#wv-map')).not.toHaveClass('cursor-pointer');
  });

  test('does not add cursor-pointer when isCoordinateSearchActive is true', () => {
    const { container } = renderComponent({
      isShowingClick: true,
      isCoordinateSearchActive: true,
      isDistractionFreeModeActive: true,
    });
    expect(container.querySelector('#wv-map')).not.toHaveClass('cursor-pointer');
  });

  test('adds cursor-crosshair when isCoordinateSearchActive and not isDistractionFreeModeActive', () => {
    const { container } = renderComponent({
      isCoordinateSearchActive: true,
      isDistractionFreeModeActive: false,
    });
    expect(container.querySelector('#wv-map')).toHaveClass('cursor-crosshair');
  });

  test('does not add cursor-crosshair when isDistractionFreeModeActive is true', () => {
    const { container } = renderComponent({
      isCoordinateSearchActive: true,
      isDistractionFreeModeActive: true,
    });
    expect(container.querySelector('#wv-map')).not.toHaveClass('cursor-crosshair');
  });

  test('does not add cursor-crosshair when isCoordinateSearchActive is false', () => {
    const { container } = renderComponent({
      isCoordinateSearchActive: false,
      isDistractionFreeModeActive: false,
    });
    expect(container.querySelector('#wv-map')).not.toHaveClass('cursor-crosshair');
  });

  test('adds distraction-free-active when isDistractionFreeModeActive is true', () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true });
    expect(container.querySelector('#wv-map')).toHaveClass('distraction-free-active');
  });

  test('does not add distraction-free-active when isDistractionFreeModeActive is false', () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: false });
    expect(container.querySelector('#wv-map')).not.toHaveClass('distraction-free-active');
  });

  test('can combine cursor-pointer and distraction-free-active classes', () => {
    const { container } = renderComponent({
      isShowingClick: true,
      isCoordinateSearchActive: false,
      isDistractionFreeModeActive: true,
    });
    const mapDiv = container.querySelector('#wv-map');
    expect(mapDiv).toHaveClass('cursor-pointer');
    expect(mapDiv).toHaveClass('distraction-free-active');
  });
});

describe('MapInteractions OlCoordinates props', () => {
  test('passes show=true when isDistractionFreeModeActive is false', () => {
    renderComponent({ isDistractionFreeModeActive: false });
    expect(olCoordinatesCapture.show).toBe(true);
  });

  test('passes show=false when isDistractionFreeModeActive is true', () => {
    renderComponent({ isDistractionFreeModeActive: true });
    expect(olCoordinatesCapture.show).toBe(false);
  });
});

describe('MapInteractions mapStateToProps', () => {
  const buildState = ({
    naturalEvents = true,
    isCoordinateSearchActive = false,
    isClickable = false,
    isDistractionFreeModeActive = false,
    eventsActive = false,
  } = {}) => ({
    config: { features: { naturalEvents } },
    locationSearch: { isCoordinateSearchActive },
    map: { isClickable },
    ui: { isDistractionFreeModeActive },
    events: { active: eventsActive },
  });

  test('maps map.isClickable to isShowingClick', () => {
    const result = capturedMapStateToProps(buildState({ isClickable: true }));
    expect(result.isShowingClick).toBe(true);
  });

  test('maps ui.isDistractionFreeModeActive', () => {
    const result = capturedMapStateToProps(buildState({ isDistractionFreeModeActive: true }));
    expect(result.isDistractionFreeModeActive).toBe(true);
  });

  test('maps locationSearch.isCoordinateSearchActive', () => {
    const result = capturedMapStateToProps(buildState({ isCoordinateSearchActive: true }));
    expect(result.isCoordinateSearchActive).toBe(true);
  });

  test('isNaturalEventsActive is true when naturalEvents and events.active are both true', () => {
    const result = capturedMapStateToProps(buildState({ naturalEvents: true, eventsActive: true }));
    expect(result.isNaturalEventsActive).toBe(true);
  });

  test('isNaturalEventsActive is false when config.features.naturalEvents is false', () => {
    const result = capturedMapStateToProps(buildState({ naturalEvents: false, eventsActive: true }));
    expect(result.isNaturalEventsActive).toBe(false);
  });

  test('isNaturalEventsActive is false when events.active is false', () => {
    const result = capturedMapStateToProps(buildState({ naturalEvents: true, eventsActive: false }));
    expect(result.isNaturalEventsActive).toBe(false);
  });
});
