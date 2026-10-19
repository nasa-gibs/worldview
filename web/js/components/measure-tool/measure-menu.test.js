/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MeasureMenu from './measure-menu';

jest.mock('../../modules/modal/actions', () => ({
  onToggle: jest.fn(() => ({ type: 'ON_TOGGLE' })),
}));

jest.mock('../../modules/measure/actions', () => ({
  changeUnits: jest.fn((units) => ({ type: 'CHANGE_UNITS', units })),
}));

jest.mock('../../util/util', () => ({
  events: { trigger: jest.fn() },
}));

jest.mock('../util/icon-list', () => function MockIconList({ list, onClick, size }) {
  return (
    <ul data-testid="icon-list" data-size={size}>
      {list.filter((item) => !item.hidden).map((item) => (
        <li key={item.key}>
          <button type="button" data-testid={item.id} onClick={() => onClick(item.key)}>
            {item.text}
          </button>
        </li>
      ))}
    </ul>
  );
});

const mockStore = configureStore([]);

const defaultState = {
  screenSize: { isMobileDevice: false },
  modal: { customProps: { touchDevice: false } },
  measure: {
    unitOfMeasure: 'km',
    allMeasurements: { 'EPSG:4326': {} },
  },
  proj: { selected: { crs: 'EPSG:4326' } },
};

function renderMenu(stateOverrides = {}) {
  const state = {
    ...defaultState,
    ...stateOverrides,
    measure: { ...defaultState.measure, ...(stateOverrides.measure || {}) },
    modal: { ...defaultState.modal, ...(stateOverrides.modal || {}) },
  };
  const store = mockStore(state);
  const utils = render(
    <Provider store={store}>
      <MeasureMenu />
    </Provider>,
  );
  return { ...utils, store };
}

describe('MeasureMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('renders the unit toggle switch', () => {
      renderMenu();
      expect(screen.getByRole('checkbox', { name: /km/i })).toBeInTheDocument();
    });

    it('shows km label when unitOfMeasure is km', () => {
      renderMenu();
      expect(screen.getByText('km')).toBeInTheDocument();
    });

    it('shows mi label when unitOfMeasure is mi', () => {
      renderMenu({ measure: { unitOfMeasure: 'mi', allMeasurements: { 'EPSG:4326': {} } } });
      expect(screen.getByText('mi')).toBeInTheDocument();
    });

    it('unit toggle is unchecked when unit is km', () => {
      renderMenu();
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('unit toggle is checked when unit is mi', () => {
      renderMenu({ measure: { unitOfMeasure: 'mi', allMeasurements: { 'EPSG:4326': {} } } });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('renders the distance and area measure buttons', () => {
      renderMenu();
      expect(screen.getByTestId('measure-distance-button')).toBeInTheDocument();
      expect(screen.getByTestId('measure-area-button')).toBeInTheDocument();
    });

    it('hides remove-measurements button when no measurements exist', () => {
      renderMenu();
      expect(screen.queryByTestId('clear-measurements-button')).toBeNull();
    });

    it('shows remove-measurements button when measurements exist', () => {
      renderMenu({
        measure: {
          unitOfMeasure: 'km',
          allMeasurements: { 'EPSG:4326': { m1: {} } },
        },
      });
      expect(screen.getByTestId('clear-measurements-button')).toBeInTheDocument();
    });

    it('hides download-geojson button when no measurements exist', () => {
      renderMenu();
      expect(screen.queryByTestId('download-geojson-button')).toBeNull();
    });

    it('shows download-geojson button when measurements exist and not mobile', () => {
      renderMenu({
        measure: {
          unitOfMeasure: 'km',
          allMeasurements: { 'EPSG:4326': { m1: {} } },
        },
        screenSize: { isMobileDevice: false },
      });
      expect(screen.getByTestId('download-geojson-button')).toBeInTheDocument();
    });

    it('hides download-geojson button on mobile even when measurements exist', () => {
      renderMenu({
        measure: {
          unitOfMeasure: 'km',
          allMeasurements: { 'EPSG:4326': { m1: {} } },
        },
        screenSize: { isMobileDevice: true },
      });
      expect(screen.queryByTestId('download-geojson-button')).toBeNull();
    });
  });

  describe('icon list size', () => {
    it('uses small icon list for non-touch devices', () => {
      renderMenu({ modal: { customProps: { touchDevice: false } } });
      expect(screen.getByTestId('icon-list')).toHaveAttribute('data-size', 'small');
    });

    it('uses large icon list for touch devices', () => {
      renderMenu({ modal: { customProps: { touchDevice: true } } });
      expect(screen.getByTestId('icon-list')).toHaveAttribute('data-size', 'large');
    });
  });

  describe('interactions', () => {
    it('dispatches changeUnits with mi when toggle is checked', () => {
      const { store } = renderMenu();
      fireEvent.click(screen.getByRole('checkbox'));
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'CHANGE_UNITS', units: 'mi' }));
    });

    it('dispatches changeUnits with km when toggle is unchecked', () => {
      const { store } = renderMenu({ measure: { unitOfMeasure: 'mi', allMeasurements: { 'EPSG:4326': {} } } });
      fireEvent.click(screen.getByRole('checkbox'));
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'CHANGE_UNITS', units: 'km' }));
    });

    it('triggers measure:distance event and closes modal on distance button click', () => {
      const util = require('../../util/util');
      const { store } = renderMenu();
      fireEvent.click(screen.getByTestId('measure-distance-button'));
      expect(util.events.trigger).toHaveBeenCalledWith('measure:distance');
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'ON_TOGGLE' }));
    });

    it('triggers measure:area event and closes modal on area button click', () => {
      const util = require('../../util/util');
      const { store } = renderMenu();
      fireEvent.click(screen.getByTestId('measure-area-button'));
      expect(util.events.trigger).toHaveBeenCalledWith('measure:area');
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'ON_TOGGLE' }));
    });

    it('triggers measure:clear event on remove-measurements click', () => {
      const util = require('../../util/util');
      const { store } = renderMenu({
        measure: {
          unitOfMeasure: 'km',
          allMeasurements: { 'EPSG:4326': { m1: {} } },
        },
      });
      fireEvent.click(screen.getByTestId('clear-measurements-button'));
      expect(util.events.trigger).toHaveBeenCalledWith('measure:clear');
      const actions = store.getActions();
      expect(actions).toContainEqual(expect.objectContaining({ type: 'ON_TOGGLE' }));
    });
  });
});
