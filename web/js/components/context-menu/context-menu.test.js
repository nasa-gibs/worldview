/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import copy from 'copy-to-clipboard';
import RightClickMenu from './context-menu';
import util from '../../util/util';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';

jest.mock('../../util/util', () => ({
  events: {
    on: jest.fn(),
    off: jest.fn(),
    trigger: jest.fn(),
  },
  MAP_SINGLE_CLICK: 'map:singleclick',
  MAP_CONTEXT_MENU: 'map:contextmenu',
}));

jest.mock('../../util/context-menu/index', () => ({
  ContextMenu: ({ children }) => <div data-testid="context-menu-wrapper">{children}</div>,
  MenuItem: ({ children, onClick, className, attributes }) => (
    <div data-testid={`menu-item-${attributes?.id}`} className={className} onClick={onClick}>
      {children}
    </div>
  ),
  MenuItemDivider: () => <hr />,
}));

jest.mock('../location-search/copy-tooltip', () => function MockTooltip() {
  return <div data-testid="copy-tooltip" />;
});

jest.mock('copy-to-clipboard', () => jest.fn(() => Promise.resolve()));

jest.mock('ol/proj', () => ({
  transform: jest.fn(() => [0, 0]),
}));

jest.mock('../location-search/util', () => ({
  getFormattedCoordinates: jest.fn(() => '0.000, 0.000'),
  getNormalizedCoordinate: jest.fn(() => [0, 0]),
}));

jest.mock('../../modules/location-search/util', () => ({
  areCoordinatesWithinExtent: jest.fn(() => true),
}));

jest.mock('../../modules/measure/actions', () => ({
  changeUnits: jest.fn(() => ({ type: 'CHANGE_UNITS' })),
}));

const mockStore = configureStore([]);

describe('RightClickMenu', () => {
  let store;
  let eventHandlers = {};

  const getInitialState = (overrides = {}) => ({
    map: {
      ui: {
        selected: {
          getCoordinateFromPixel: jest.fn(() => [0, 0]),
        },
      },
    },
    proj: {
      selected: {
        crs: 'EPSG:4326',
      },
    },
    measure: {
      unitOfMeasure: 'km',
      isActive: false,
      allMeasurements: {
        'EPSG:4326': {
          'measurement-1': {},
        },
      },
    },
    locationSearch: { coordinates: [0, 0], isCoordinateSearchActive: false },
    config: {},
    screenSize: {
      isMobileDevice: false,
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    eventHandlers = {};

    util.events.on.mockImplementation((event, handler) => {
      eventHandlers[event] = handler;
    });

    store = mockStore(getInitialState());
  });

  const triggerContextMenu = (pixel = [0, 0]) => {
    act(() => {
      if (eventHandlers['map:contextmenu']) {
        eventHandlers['map:contextmenu']({
          originalEvent: { preventDefault: jest.fn() },
          pixel,
        });
      }
    });
  };

  const triggerSingleClick = () => {
    act(() => {
      if (eventHandlers['map:singleclick']) {
        eventHandlers['map:singleclick']();
      }
    });
  };

  it('renders correctly and sets up event listeners', () => {
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );
    expect(util.events.on).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );
    unmount();
    expect(util.events.off).toHaveBeenCalled();
  });

  it('shows menu when map context menu event is triggered within extent', () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(true);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    expect(screen.getByTestId('context-menu-wrapper')).toBeDefined();
  });

  it('does not show menu if areCoordinatesWithinExtent is false', () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(false);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    expect(screen.queryByTestId('context-menu-wrapper')).toBeNull();
  });

  it('ignores context menu event if measurement is active', () => {
    store = mockStore(getInitialState({
      measure: { unitOfMeasure: 'km', isActive: true, allMeasurements: { 'EPSG:4326': {} } },
    }));

    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    expect(screen.queryByTestId('context-menu-wrapper')).toBeNull();
  });

  it('hides menu on map single click', () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(true);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    expect(screen.getByTestId('context-menu-wrapper')).toBeDefined();

    triggerSingleClick();
    expect(screen.queryByTestId('context-menu-wrapper')).toBeNull();
  });

  it('handles add place marker click', () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(true);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    const markerItem = screen.getByTestId('menu-item-context-menu-add-marker');
    fireEvent.click(markerItem);

    expect(util.events.trigger).toHaveBeenCalledWith(
      'context-menu:location',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('handles copy coordinates to clipboard', async () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(true);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    const copyItem = screen.getByTestId('menu-item-context-menu-copy');

    await act(async () => {
      fireEvent.click(copyItem);
    });

    expect(copy).toHaveBeenCalled();
  });

  it('handles measure distance click', () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(true);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    const distanceItem = screen.getByTestId('menu-item-context-menu-measure-distance');
    fireEvent.click(distanceItem);

    expect(util.events.trigger).toHaveBeenCalledWith('measure:distance');
  });

  it('handles measure area click', () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(true);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    const areaItem = screen.getByTestId('menu-item-context-menu-measure-area');
    fireEvent.click(areaItem);

    expect(util.events.trigger).toHaveBeenCalledWith('measure:area');
  });

  it('handles clear measurements click', () => {
    areCoordinatesWithinExtent.mockReturnValueOnce(true);
    render(
      <Provider store={store}>
        <RightClickMenu />
      </Provider>,
    );

    triggerContextMenu([100, 100]);
    const clearItem = screen.getByTestId('menu-item-context-menu-clear-measurements');
    fireEvent.click(clearItem);

    expect(util.events.trigger).toHaveBeenCalledWith('measure:clear');
  });
});
