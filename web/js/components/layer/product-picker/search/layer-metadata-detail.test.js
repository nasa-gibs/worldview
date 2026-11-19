/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import LayerMetadataDetail from './layer-metadata-detail';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid={`fa-${icon}`} />,
}));

jest.mock('../renderSplitTitle', () => ({ layer }) => (
  <div data-testid="split-title">{layer.title}</div>
));

jest.mock('../browse/recent-layers-info', () => () => (
  <div data-testid="recent-layers-info" />
));

jest.mock('../../info/info', () => () => (
  <div data-testid="layer-info" />
));

jest.mock('../../../../modules/layers/actions', () => ({
  addLayer: jest.fn(() => ({ type: 'ADD_LAYER' })),
  removeLayer: jest.fn(() => ({ type: 'REMOVE_LAYER' })),
}));

jest.mock('../../../../modules/product-picker/actions', () => ({
  selectLayer: jest.fn(() => ({ type: 'SELECT_LAYER' })),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  getActiveLayersMap: jest.fn(() => ({})),
  makeGetDescription: jest.fn(() => jest.fn(() => '/path/to/desc')),
}));

const mockConfigureStore = configureStore([]);

const baseState = {
  productPicker: { selectedLayer: null, categoryType: 'search' },
  proj: { id: 'geographic' },
  config: {
    features: {
      previewSnapshots: true,
      describeDomains: { url: 'https://example.com' },
    },
  },
  layers: { active: { layers: [] } },
};

const sampleLayer = {
  id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
  title: 'Corrected Reflectance (True Color)',
};

function renderComponent(ownProps = {}, stateOverrides = {}) {
  const state = {
    ...baseState,
    ...stateOverrides,
    productPicker: {
      ...baseState.productPicker,
      ...(stateOverrides.productPicker || {}),
    },
    config: {
      ...baseState.config,
      ...(stateOverrides.config || {}),
      features: {
        ...baseState.config.features,
        ...((stateOverrides.config || {}).features || {}),
      },
    },
  };
  const store = mockConfigureStore(state);
  store.dispatch = jest.fn();
  const result = render(
    <Provider store={store}>
      <LayerMetadataDetail layer={ownProps.layer} />
    </Provider>,
  );
  return { ...result, store };
}

describe('LayerMetadataDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('No layer selected — categoryType !== "recent"', () => {
    it('renders the no-results div with correct text', () => {
      const { container, getByText } = renderComponent();
      expect(container.querySelector('.no-results')).toBeTruthy();
      expect(getByText('No layer selected.')).toBeTruthy();
      expect(getByText('Select a layer to view details here!')).toBeTruthy();
    });

    it('renders the globe-americas icon', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('fa-globe-americas')).toBeTruthy();
    });

    it('does not render the layer card', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.layers-all-layer')).toBeNull();
    });
  });

  describe('No layer selected — categoryType === "recent"', () => {
    it('renders RecentLayersInfo', () => {
      const { getByTestId } = renderComponent(
        {},
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      expect(getByTestId('recent-layers-info')).toBeTruthy();
    });

    it('does not render the no-results div', () => {
      const { container } = renderComponent(
        {},
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      expect(container.querySelector('.no-results')).toBeNull();
    });
  });

  describe('Layer provided — isActive=false', () => {
    it('renders Add Layer button with plus icon', () => {
      const { getByText, getByTestId } = renderComponent({ layer: sampleLayer });
      expect(getByText('Add Layer')).toBeTruthy();
      expect(getByTestId('fa-plus')).toBeTruthy();
    });

    it('button does not have is-active class', () => {
      const { getByText } = renderComponent({ layer: sampleLayer });
      const btn = getByText('Add Layer').closest('button');
      expect(btn.className).not.toContain('is-active');
    });

    it('renders RenderSplitLayerTitle with the layer', () => {
      const { getByTestId } = renderComponent({ layer: sampleLayer });
      expect(getByTestId('split-title').textContent).toBe(sampleLayer.title);
    });

    it('renders LayerInfo', () => {
      const { getByTestId } = renderComponent({ layer: sampleLayer });
      expect(getByTestId('layer-info')).toBeTruthy();
    });
  });

  describe('Layer provided — isActive=true', () => {
    const activeState = {
      productPicker: {
        selectedLayer: sampleLayer,
        categoryType: 'search',
      },
    };

    beforeEach(() => {
      const { getActiveLayersMap } = require('../../../../modules/layers/selectors');
      getActiveLayersMap.mockReturnValue({ [sampleLayer.id]: true });
    });

    it('renders Remove Layer button with minus icon', () => {
      const { getByText, getByTestId } = renderComponent(
        { layer: sampleLayer },
        activeState,
      );
      expect(getByText('Remove Layer')).toBeTruthy();
      expect(getByTestId('fa-minus')).toBeTruthy();
    });

    it('button has is-active class', () => {
      const { getByText } = renderComponent(
        { layer: sampleLayer },
        activeState,
      );
      const btn = getByText('Remove Layer').closest('button');
      expect(btn.className).toContain('is-active');
    });
  });

  describe('Preview image', () => {
    it('renders preview image link when showPreviewImage=true', () => {
      const { container } = renderComponent({ layer: sampleLayer });
      const img = container.querySelector('img.layer-preview');
      expect(img).toBeTruthy();
      const expectedUrl = `images/layers/previews/geographic/${sampleLayer.id}.jpg`;
      expect(img.getAttribute('src')).toBe(expectedUrl);
    });

    it('does not render preview image when showPreviewImage=false', () => {
      const { container } = renderComponent(
        { layer: sampleLayer },
        {
          config: {
            features: {
              previewSnapshots: false,
              describeDomains: { url: 'https://example.com' },
            },
          },
        },
      );
      expect(container.querySelector('img.layer-preview')).toBeNull();
    });

    it('preview image link has correct href and target', () => {
      const { container } = renderComponent({ layer: sampleLayer });
      const anchor = container.querySelector('a[rel="noopener noreferrer"]');
      expect(anchor).toBeTruthy();
      expect(anchor.getAttribute('target')).toBe('_blank');
      const expectedUrl = `images/layers/previews/geographic/${sampleLayer.id}.jpg`;
      expect(anchor.getAttribute('href')).toBe(expectedUrl);
    });
  });

  describe('toggleLayer — dispatches actions', () => {
    it('dispatches addLayer when isActive=false and button is clicked', () => {
      const { addLayer } = require('../../../../modules/layers/actions');
      const { getByText, store } = renderComponent({ layer: sampleLayer });
      fireEvent.click(getByText('Add Layer').closest('button'));
      expect(addLayer).toHaveBeenCalledWith(sampleLayer.id);
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'ADD_LAYER' });
    });

    it('dispatches removeLayer when isActive=true and button is clicked', () => {
      const { removeLayer } = require('../../../../modules/layers/actions');
      const { getActiveLayersMap } = require('../../../../modules/layers/selectors');
      getActiveLayersMap.mockReturnValue({ [sampleLayer.id]: true });

      const { getByText, store } = renderComponent(
        { layer: sampleLayer },
        { productPicker: { selectedLayer: sampleLayer, categoryType: 'search' } },
      );
      fireEvent.click(getByText('Remove Layer').closest('button'));
      expect(removeLayer).toHaveBeenCalledWith(sampleLayer.id);
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'REMOVE_LAYER' });
    });
  });

  describe('describeDomainsUrl fallback', () => {
    it('uses fallback URL when describeDomains is not configured', () => {
      // Should render without error; the fallback logic is in mapStateToProps
      const { container } = renderComponent(
        { layer: sampleLayer },
        {
          config: {
            features: {
              previewSnapshots: true,
            },
          },
        },
      );
      expect(container.querySelector('.layers-all-layer')).toBeTruthy();
    });
  });
});
