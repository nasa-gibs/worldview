import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('../../../../modules/modal/actions', () => ({
  toggleCustomContent: jest.fn((key, params) => ({ type: 'TOGGLE_CUSTOM_CONTENT', key, params })),
}));
jest.mock('./band-selection-menu', () => function MockBandSelectionMenu() {
  return <div data-testid="band-selection-menu" />;
});

import BandSelectionParentInfoMenu from './band-selection-parent-info-menu';
import { toggleCustomContent } from '../../../../modules/modal/actions';

const mockStore = configureStore([]);
const store = mockStore({});

const rgbLayer = {
  id: 'HLS_Customizable_Sentinel',
  title: 'HLS Sentinel',
  bandCombo: {
    r: 'B04',
    g: 'B03',
    b: 'B02',
    expression: undefined,
  },
};

const expressionLayer = {
  id: 'HLS_NDVI_Sentinel',
  title: 'HLS NDVI Sentinel',
  bandCombo: {
    r: undefined,
    g: undefined,
    b: undefined,
    expression: '(B08-B04)/(B08+B04)',
  },
};

const renderMenu = (layer = rgbLayer) => render(
  <Provider store={store}>
    <BandSelectionParentInfoMenu layer={layer} />
  </Provider>,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BandSelectionParentInfoMenu', () => {
  describe('static structure', () => {
    it('renders the outer container', () => {
      const { container } = renderMenu();
      expect(container.querySelector('.customize-bands-parent-info')).toBeInTheDocument();
    });

    it('renders the section label', () => {
      renderMenu();
      expect(screen.getByText('Channels and bands assigned:')).toBeInTheDocument();
    });

    it('renders the Customize button', () => {
      renderMenu();
      expect(screen.getByRole('button', { name: /customize band selection/i })).toBeInTheDocument();
    });

    it('renders hr dividers', () => {
      const { container } = renderMenu();
      expect(container.querySelectorAll('hr')).toHaveLength(2);
    });
  });

  describe('valid RGB band display', () => {
    it('shows Red channel label and band name', () => {
      renderMenu();
      expect(screen.getByText('Red:')).toBeInTheDocument();
      expect(screen.getByText('Band B04')).toBeInTheDocument();
    });

    it('shows Green channel label and band name', () => {
      renderMenu();
      expect(screen.getByText('Green:')).toBeInTheDocument();
      expect(screen.getByText('Band B03')).toBeInTheDocument();
    });

    it('shows Blue channel label and band name', () => {
      renderMenu();
      expect(screen.getByText('Blue:')).toBeInTheDocument();
      expect(screen.getByText('Band B02')).toBeInTheDocument();
    });

    it('does not show Expression row when bands are valid', () => {
      renderMenu();
      expect(screen.queryByText('Expression:')).not.toBeInTheDocument();
    });
  });

  describe('expression display (invalid RGB bands)', () => {
    it('shows the Expression label when r/g/b are undefined', () => {
      renderMenu(expressionLayer);
      expect(screen.getByText('Expression:')).toBeInTheDocument();
    });

    it('shows the expression value', () => {
      renderMenu(expressionLayer);
      expect(screen.getByText('(B08-B04)/(B08+B04)')).toBeInTheDocument();
    });

    it('does not show Red/Green/Blue labels when bands are undefined', () => {
      renderMenu(expressionLayer);
      expect(screen.queryByText('Red:')).not.toBeInTheDocument();
      expect(screen.queryByText('Green:')).not.toBeInTheDocument();
      expect(screen.queryByText('Blue:')).not.toBeInTheDocument();
    });

    it('falls back to expression display when r is the string "undefined"', () => {
      const layer = {
        ...rgbLayer,
        bandCombo: { r: 'undefined', g: 'undefined', b: 'undefined', expression: 'some-expr' },
      };
      renderMenu(layer);
      expect(screen.getByText('Expression:')).toBeInTheDocument();
      expect(screen.getByText('some-expr')).toBeInTheDocument();
    });
  });

  describe('Customize button — onCustomizeBandClick', () => {
    it('dispatches toggleCustomContent when Customize is clicked', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      expect(toggleCustomContent).toHaveBeenCalledTimes(1);
    });

    it('dispatches with a key derived from the layer id', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        `BAND_SELECTION_MODAL_${rgbLayer.id}`,
        expect.any(Object),
      );
    });

    it('dispatches with headerText that includes the layer title', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      const params = toggleCustomContent.mock.calls[0][1];
      expect(params.headerText).toContain(rgbLayer.title);
    });

    it('dispatches with backdrop: false', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      const params = toggleCustomContent.mock.calls[0][1];
      expect(params.backdrop).toBe(false);
    });

    it('dispatches with the correct modal class names', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      const params = toggleCustomContent.mock.calls[0][1];
      expect(params.wrapClassName).toBe('clickable-behind-modal');
      expect(params.modalClassName).toBe('sidebar-modal layer-settings-modal');
    });

    it('dispatches with size "lg"', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      const params = toggleCustomContent.mock.calls[0][1];
      expect(params.size).toBe('lg');
    });

    it('dispatches with bodyComponentProps containing the layer object', () => {
      renderMenu();
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      const params = toggleCustomContent.mock.calls[0][1];
      expect(params.bodyComponentProps).toEqual({ layerObj: rgbLayer });
    });

    it('uses a different key for a different layer id', () => {
      renderMenu(expressionLayer);
      fireEvent.click(screen.getByRole('button', { name: /customize band selection/i }));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        `BAND_SELECTION_MODAL_${expressionLayer.id}`,
        expect.any(Object),
      );
    });
  });
});
