/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('../../../../modules/layers/actions', () => ({
  updateBandCombination: jest.fn((id, bandCombo, layerIndex, selectedPreset) => ({
    type: 'UPDATE_BAND_COMBINATION', id, bandCombo, layerIndex, selectedPreset,
  })),
  removeLayer: jest.fn((id) => ({ type: 'REMOVE_LAYER', id })),
}));
jest.mock('../../../../modules/modal/actions', () => ({
  onClose: jest.fn(() => ({ type: 'MODAL_CLOSE' })),
}));
jest.mock('../../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(),
}));
jest.mock('./menu-components/band-dropdown', () => {
  function MockBandsDropdown({ channel }) {
    return <div data-testid={`band-dropdown-${channel}`} />;
  }
  return MockBandsDropdown;
});
jest.mock('./menu-components/preset-options', () => function MockPresetOptions() {
  return <div data-testid="preset-options" />;
});
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));
jest.mock('reactstrap', () => {
  const actual = jest.requireActual('reactstrap');
  return {
    ...actual,
    UncontrolledTooltip: () => null,
  };
});

import BandSelection from './band-selection-menu';
import { updateBandCombination, removeLayer } from '../../../../modules/layers/actions';
import { onClose } from '../../../../modules/modal/actions';
import { getActiveLayers } from '../../../../modules/layers/selectors';

const mockStore = configureStore([]);

const sentinelLayer = {
  id: 'HLS_Customizable_Sentinel',
  title: 'HLS Sentinel',
  bandCombo: {
    r: 'B04',
    g: 'B03',
    b: 'B02',
    color_formula: 'Gamma RGB 2.5',
    bands_regex: 'B[0-9][0-9A-Za-z]',
  },
};

const landsatLayer = {
  id: 'HLS_Customizable_Landsat',
  title: 'HLS Landsat',
  bandCombo: {
    r: 'B05',
    g: 'B04',
    b: 'B03',
    color_formula: 'Gamma RGB 2.5',
    bands_regex: 'B[0-9][0-9]',
  },
};

const buildStore = (layer, selectedPreset = null) => mockStore({
  compare: { activeString: 'active' },
  layers: {
    active: {
      layers: [{ id: layer.id, selectedPreset }],
    },
  },
});

const renderMenu = (layer = sentinelLayer, selectedPreset = null) => {
  getActiveLayers.mockReturnValue([layer]);
  return render(
    <Provider store={buildStore(layer, selectedPreset)}>
      <BandSelection layerObj={layer} />
    </Provider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BandSelection', () => {
  describe('layout', () => {
    it('renders the outer container', () => {
      const { container } = renderMenu();
      expect(container.querySelector('.customize-bands-container')).toBeInTheDocument();
    });

    it('renders PresetOptions', () => {
      renderMenu();
      expect(screen.getByTestId('preset-options')).toBeInTheDocument();
    });

    it('renders the Confirm Band Selection button', () => {
      renderMenu();
      expect(screen.getByRole('button', { name: /confirm band selection/i })).toBeInTheDocument();
    });
  });

  describe('band channel rows', () => {
    it('shows R, G, B channel rows and dropdowns when bandSelection is valid', () => {
      renderMenu();
      expect(screen.getByText('R:')).toBeInTheDocument();
      expect(screen.getByText('G:')).toBeInTheDocument();
      expect(screen.getByText('B:')).toBeInTheDocument();
      expect(screen.getByTestId('band-dropdown-r')).toBeInTheDocument();
      expect(screen.getByTestId('band-dropdown-g')).toBeInTheDocument();
      expect(screen.getByTestId('band-dropdown-b')).toBeInTheDocument();
    });

    it('hides channel rows when r band is undefined', () => {
      const layer = { ...sentinelLayer, bandCombo: { ...sentinelLayer.bandCombo, r: undefined } };
      renderMenu(layer);
      expect(screen.queryByText('R:')).not.toBeInTheDocument();
      expect(screen.queryByTestId('band-dropdown-r')).not.toBeInTheDocument();
    });

    it('hides channel rows when g band is undefined', () => {
      const layer = { ...sentinelLayer, bandCombo: { ...sentinelLayer.bandCombo, g: undefined } };
      renderMenu(layer);
      expect(screen.queryByText('G:')).not.toBeInTheDocument();
    });

    it('hides channel rows when b band is undefined', () => {
      const layer = { ...sentinelLayer, bandCombo: { ...sentinelLayer.bandCombo, b: undefined } };
      renderMenu(layer);
      expect(screen.queryByText('B:')).not.toBeInTheDocument();
    });

    it('hides channel rows when r band is the string "undefined"', () => {
      const layer = { ...sentinelLayer, bandCombo: { ...sentinelLayer.bandCombo, r: 'undefined' } };
      renderMenu(layer);
      expect(screen.queryByText('R:')).not.toBeInTheDocument();
    });

    it('renders the info tooltip icon when band selection is valid', () => {
      renderMenu();
      expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
    });

    it('renders the "Select a band for each channel" heading when valid', () => {
      renderMenu();
      expect(screen.getByText('Select a band for each channel:')).toBeInTheDocument();
    });
  });

  describe('presetOptions', () => {
    it('renders PresetOptions for a Landsat layer', () => {
      renderMenu(landsatLayer);
      expect(screen.getByTestId('preset-options')).toBeInTheDocument();
    });

    it('renders PresetOptions for a Sentinel layer', () => {
      renderMenu(sentinelLayer);
      expect(screen.getByTestId('preset-options')).toBeInTheDocument();
    });
  });

  describe('confirmSelection', () => {
    it('dispatches removeLayer when Confirm is clicked', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /confirm band selection/i }));
      expect(removeLayer).toHaveBeenCalledWith(sentinelLayer.id);
    });

    it('dispatches updateBandCombination with the initial band selection', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /confirm band selection/i }));
      expect(updateBandCombination).toHaveBeenCalledWith(
        sentinelLayer.id,
        expect.objectContaining({ r: 'B04', g: 'B03', b: 'B02' }),
        0,
        null,
      );
    });

    it('dispatches onClose when Confirm is clicked', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /confirm band selection/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it('dispatches all three actions on a single confirm click', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /confirm band selection/i }));
      expect(removeLayer).toHaveBeenCalledTimes(1);
      expect(updateBandCombination).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('passes the current selectedPreset to updateBandCombination', () => {
      const preset = { id: 'HLS_False_Color_Sentinel', title: 'Color Infrared' };
      renderMenu(sentinelLayer, preset);
      fireEvent.click(screen.getByRole('button', { name: /confirm band selection/i }));
      expect(updateBandCombination).toHaveBeenCalledWith(
        sentinelLayer.id,
        expect.any(Object),
        0,
        preset,
      );
    });

    it('passes layerIndex 0 when the layer is first in activeLayers', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /confirm band selection/i }));
      expect(updateBandCombination).toHaveBeenCalledWith(
        sentinelLayer.id,
        expect.any(Object),
        0,
        null,
      );
    });
  });
});
