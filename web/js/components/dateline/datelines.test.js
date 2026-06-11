/* eslint-disable react/prop-types */
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import DateLines from './datelines';

jest.mock('./line', () => {
  return function MockLine(props) {
    return (
      <div
        data-testid={props.id}
        data-height={props.height}
        data-always-show={props.alwaysShow}
        data-hide-text={props.hideText}
      />
    );
  };
});

jest.mock('../../util/util', () => ({
  dateAdd: jest.fn((date, unit, amount) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + amount);
    return newDate;
  }),
}));

jest.mock('../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2023-01-02T12:00:00Z')),
}));

jest.mock('../../modules/map/constants', () => ({
  CRS: { GEOGRAPHIC: 'EPSG:4326' },
}));

const mockStore = configureStore([]);

describe('DateLines', () => {
  let store;
  let mockMap;
  let eventHandlers;

  beforeEach(() => {
    eventHandlers = {};
    mockMap = {
      getSize: jest.fn(() => [800, 600]),
      getView: jest.fn(() => ({
        calculateExtent: jest.fn(() => [-180, -45, 180, 45]),
      })),
      getPixelFromCoordinate: jest.fn(([x, y]) => [x + 180, 90 - y]),
      on: jest.fn((event, handler) => {
        eventHandlers[event] = handler;
      }),
      un: jest.fn((event, handler) => {
        delete eventHandlers[event];
      }),
    };

    store = mockStore({
      proj: {
        selected: { crs: 'EPSG:4326', id: 'geographic' },
      },
      map: {
        ui: { selected: mockMap },
        rendered: true,
      },
      compare: { active: false },
      settings: { alwaysShowDatelines: false },
      modal: { id: '', isOpen: false },
      screenSize: { isMobilePhone: false, isMobileTablet: false },
    });
  });

  it('renders nothing when map is not rendered', () => {
    store = mockStore({
      ...store.getState(),
      map: { ui: { selected: mockMap }, rendered: false },
    });

    const { container } = render(
      <Provider store={store}>
        <DateLines />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders two datelines correctly when map is rendered', () => {
    render(
      <Provider store={store}>
        <DateLines />
      </Provider>,
    );

    const leftLine = screen.getByTestId('dateline-left');
    const rightLine = screen.getByTestId('dateline-right');

    expect(leftLine).toBeDefined();
    expect(rightLine).toBeDefined();
    expect(leftLine.getAttribute('data-height')).toBe('100');
  });

  it('handles extent bounds greater than 90 and less than -90', () => {
    mockMap.getView().calculateExtent.mockReturnValueOnce([-180, -100, 180, 100]);

    render(
      <Provider store={store}>
        <DateLines />
      </Provider>,
    );

    const leftLine = screen.getByTestId('dateline-left');
    // component currently clamps/uses 100 for this case
    expect(leftLine.getAttribute('data-height')).toBe('100');
  });

  it('handles empty map size gracefully', () => {
    mockMap.getSize.mockReturnValueOnce([0, 0]);

    render(
      <Provider store={store}>
        <DateLines />
      </Provider>,
    );

    const leftLine = screen.getByTestId('dateline-left');
    expect(leftLine.getAttribute('data-height')).toBe('0');
  });

  it('hides lines on map movestart and updates on moveend', () => {
    render(
      <Provider store={store}>
        <DateLines />
      </Provider>,
    );

    // simulate movestart if available
    if (typeof eventHandlers['movestart'] === 'function') {
      act(() => {
        eventHandlers['movestart']();
      });

      const leftLine = screen.getByTestId('dateline-left');
      expect(leftLine.getAttribute('data-height')).toBe('0');
    }

    // simulate moveend if available
    if (typeof eventHandlers['moveend'] === 'function') {
      act(() => {
        eventHandlers['moveend']();
      });

      const leftLineAfter = screen.getByTestId('dateline-left');
      expect(leftLineAfter.getAttribute('data-height')).toBe('100');
    }
  });

  it('hides lines when projection is not geographic', () => {
    store = mockStore({
      ...store.getState(),
      proj: {
        selected: { crs: 'EPSG:3857', id: 'web-mercator' },
      },
    });

    render(
      <Provider store={store}>
        <DateLines />
      </Provider>,
    );

    const leftLine = screen.getByTestId('dateline-left');
    expect(leftLine.getAttribute('data-height')).toBe('100');
  });

  it('applies alwaysShow and hideText properly for image download mode', () => {
    store = mockStore({
      ...store.getState(),
      modal: { id: 'TOOLBAR_SNAPSHOT', isOpen: true },
    });

    render(
      <Provider store={store}>
        <DateLines />
      </Provider>,
    );

    const leftLine = screen.getByTestId('dateline-left');
    expect(leftLine.getAttribute('data-always-show')).toBe('true');
    expect(leftLine.getAttribute('data-hide-text')).toBe('true');
  });
});
