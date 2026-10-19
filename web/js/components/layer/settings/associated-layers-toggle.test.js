/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('../../../modules/layers/actions', () => ({
  addLayer: jest.fn((id) => ({ type: 'ADD_LAYER', id })),
  removeLayer: jest.fn((id) => ({ type: 'REMOVE_LAYER', id })),
}));
jest.mock('../../../modules/layers/util', () => ({
  getOrbitTrackTitle: jest.fn((layer) => `${layer.title} Track`),
}));
jest.mock('../../../modules/layers/selectors', () => ({
  getActiveLayersMap: jest.fn(),
}));
jest.mock('../../util/checkbox', () => {
  function MockCheckbox({
    id, checked, onCheck, label,
  }) {
    return (
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          data-testid={`checkbox-${id}`}
        />
        {label}
      </label>
    );
  }
  return MockCheckbox;
});

import AssociatedLayersToggle from './associated-layers-toggle';
import { addLayer, removeLayer } from '../../../modules/layers/actions';
import { getActiveLayersMap } from '../../../modules/layers/selectors';

const mockStore = configureStore([]);

const granuleLayer = { id: 'granule-1', title: 'Granule Layer (A)', type: 'granule' };
const orbitLayer = { id: 'orbit-1', title: 'Orbit Layer', track: 'ascending' };
const compositeLayer = { id: 'composite-1', title: 'Composite Layer (B)' };

const buildStore = (configLayers = {}, activeLayersMap = {}) => {
  getActiveLayersMap.mockReturnValue(activeLayersMap);
  return mockStore({ config: { layers: configLayers } });
};

const renderToggle = (layer, configLayers = {}, activeLayersMap = {}) => render(
  <Provider store={buildStore(configLayers, activeLayersMap)}>
    <AssociatedLayersToggle layer={layer} />
  </Provider>,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AssociatedLayersToggle', () => {
  describe('layout', () => {
    it('renders the Associated Layers heading', () => {
      renderToggle({ associatedLayers: [], orbitTracks: [] }, {});
      expect(screen.getByText('Associated Layers')).toBeInTheDocument();
    });

    it('renders the outer container', () => {
      const { container } = renderToggle({ associatedLayers: [], orbitTracks: [] }, {});
      expect(container.querySelector('.layer-orbit-tracks')).toBeInTheDocument();
    });
  });

  describe('layer title logic', () => {
    it('renders "Granule - " prefix for granule type layers', () => {
      renderToggle(
        { associatedLayers: ['granule-1'] },
        { 'granule-1': granuleLayer },
      );
      expect(screen.getByText(/Granule - Granule Layer/)).toBeInTheDocument();
    });

    it('renders "Orbit Track - " prefix for layers with a track', () => {
      renderToggle(
        { associatedLayers: ['orbit-1'] },
        { 'orbit-1': orbitLayer },
      );
      expect(screen.getByText('Orbit Track - Orbit Layer Track')).toBeInTheDocument();
    });

    it('renders "Daily Composite - " prefix for plain layers', () => {
      renderToggle(
        { associatedLayers: ['composite-1'] },
        { 'composite-1': compositeLayer },
      );
      expect(screen.getByText(/Daily Composite - Composite Layer/)).toBeInTheDocument();
    });

    it('splits title on "(" to remove parenthetical suffix', () => {
      renderToggle(
        { associatedLayers: ['granule-1'] },
        { 'granule-1': granuleLayer },
      );
      expect(screen.queryByText(/\(A\)/)).not.toBeInTheDocument();
    });
  });

  describe('checkbox state', () => {
    it('renders a checked checkbox when the layer is active', () => {
      renderToggle(
        { associatedLayers: ['granule-1'] },
        { 'granule-1': granuleLayer },
        { 'granule-1': granuleLayer },
      );
      expect(screen.getByTestId('checkbox-granule-1')).toBeChecked();
    });

    it('renders an unchecked checkbox when the layer is not active', () => {
      renderToggle(
        { associatedLayers: ['granule-1'] },
        { 'granule-1': granuleLayer },
        {},
      );
      expect(screen.getByTestId('checkbox-granule-1')).not.toBeChecked();
    });
  });

  describe('checkbox interactions', () => {
    it('dispatches addLayer when an inactive layer checkbox is toggled', () => {
      renderToggle(
        { associatedLayers: ['granule-1'] },
        { 'granule-1': granuleLayer },
        {},
      );
      fireEvent.click(screen.getByTestId('checkbox-granule-1'));
      expect(addLayer).toHaveBeenCalledWith('granule-1');
    });

    it('dispatches removeLayer when an active layer checkbox is toggled', () => {
      renderToggle(
        { associatedLayers: ['granule-1'] },
        { 'granule-1': granuleLayer },
        { 'granule-1': granuleLayer },
      );
      fireEvent.click(screen.getByTestId('checkbox-granule-1'));
      expect(removeLayer).toHaveBeenCalledWith('granule-1');
    });
  });

  describe('orbit tracks', () => {
    it('renders orbit track layers from orbitTracks', () => {
      renderToggle(
        { associatedLayers: [], orbitTracks: ['orbit-1'] },
        { 'orbit-1': orbitLayer },
      );
      expect(screen.getByText('Orbit Track - Orbit Layer Track')).toBeInTheDocument();
    });

    it('renders both associatedLayers and orbitTracks together', () => {
      renderToggle(
        { associatedLayers: ['composite-1'], orbitTracks: ['orbit-1'] },
        { 'composite-1': compositeLayer, 'orbit-1': orbitLayer },
      );
      expect(screen.getByText(/Daily Composite - Composite Layer/)).toBeInTheDocument();
      expect(screen.getByText('Orbit Track - Orbit Layer Track')).toBeInTheDocument();
    });
  });
});
