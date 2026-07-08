/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MeasurementMetadataDetail from './measurement-metadata-detail';
import { getSourcesForProjection } from '../../../../modules/product-picker/selectors';

jest.mock('../../info/info', () => () => <div data-testid="layer-info" />);

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <svg data-testid={`fa-icon-${icon}`} />,
}));

jest.mock('../../../../modules/product-picker/selectors', () => ({
  getSourcesForProjection: jest.fn(() => []),
}));

global.fetch = jest.fn();

const mockStore = configureStore([]);

describe('MeasurementMetadataDetail', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      productPicker: {
        category: { title: 'Test Category' },
        selectedMeasurementSourceIndex: 0,
      },
      layers: {
        layerConfig: {
          layer1: {
            id: 'layer1',
            title: 'Layer 1',
            projections: { 'EPSG:4326': true },
          },
          layer2: {
            id: 'layer2',
            title: 'Layer 2',
            projections: { 'EPSG:4326': true },
          },
        },
      },
      config: {
        features: {
          previewSnapshots: true,
          describeDomains: {
            url: 'https://test.nasa.gov',
          },
        },
      },
      proj: {
        id: 'EPSG:4326',
      },
    });

    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders no results message when no source is selected on desktop', () => {
    getSourcesForProjection.mockReturnValue([]);

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    expect(screen.getByTestId('fa-icon-map')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Select a measurement to view details here!')).toBeInTheDocument();
  });

  it('renders no metadata found when no metadata path and no layers', () => {
    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: null,
        settings: [],
      },
    ]);

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    expect(screen.getByTestId('fa-icon-meteor')).toBeInTheDocument();
    expect(screen.getByText('No metadata found.')).toBeInTheDocument();
  });

  it('renders loading message while fetching metadata', () => {
    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: [],
      },
    ]);

    fetch.mockImplementation(() => new Promise(() => {}));

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    expect(screen.getByText('Loading metadata ...')).toBeInTheDocument();
  });

  it('fetches and displays metadata for desktop', async () => {
    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: [],
      },
    ]);

    fetch.mockResolvedValue({
      text: () => Promise.resolve('<p>Test metadata content</p>'),
    });

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Source 1')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      'config/metadata/layers/test-metadata.html',
      expect.any(Object),
    );
  });

  it('fetches and displays metadata for mobile', async () => {
    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: [],
      },
    ]);

    fetch.mockResolvedValue({
      text: () => Promise.resolve('<p>Short metadata</p>'),
    });

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading metadata ...')).not.toBeInTheDocument();
    });
  });

  it('renders metadata expander button on mobile when metadata is long', async () => {
    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: [],
      },
    ]);

    const longMetadata = '<p>' + 'a'.repeat(1100) + '</p>';
    fetch.mockResolvedValue({
      text: () => Promise.resolve(longMetadata),
    });

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(screen.getByText('^')).toBeInTheDocument();
  });

  it('renders metadata expander button on mobile when there are many layers', async () => {
    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: ['layer1'],
      },
    ]);

    fetch.mockResolvedValue({
      text: () => Promise.resolve('<p>Short</p>'),
    });

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(screen.getByText('^')).toBeInTheDocument();
  });

  it('renders layer descriptions with preview images', async () => {
    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: ['layer1'],
      },
    ]);

    fetch.mockResolvedValue({
      text: () => Promise.resolve('<p>Metadata</p>'),
    });

    render(
      <Provider store={store}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Layer 1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('layer-info')).toBeInTheDocument();

    const previewImage = screen.getByRole('img');
    expect(previewImage).toHaveAttribute(
      'src',
      'images/layers/previews/EPSG:4326/layer1.jpg',
    );
  });

  it('filters layers without projections', async () => {
    const storeWithoutProjections = mockStore({
      productPicker: {
        category: { title: 'Test Category' },
        selectedMeasurementSourceIndex: 0,
      },
      layers: {
        layerConfig: {
          layer1: {
            id: 'layer1',
            title: 'Layer 1',
          },
          layer2: {
            id: 'layer2',
            title: 'Layer 2',
            projections: { 'EPSG:4326': true },
          },
        },
      },
      config: {
        features: {
          previewSnapshots: false,
          describeDomains: {
            url: 'https://test.nasa.gov',
          },
        },
      },
      proj: {
        id: 'EPSG:4326',
      },
    });

    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: ['layer1', 'layer2'],
      },
    ]);

    fetch.mockResolvedValue({
      text: () => Promise.resolve('<p>Metadata</p>'),
    });

    render(
      <Provider store={storeWithoutProjections}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Layer 2')).toBeInTheDocument();
    });

    expect(screen.queryByText('Layer 1')).not.toBeInTheDocument();
  });

  it('filters layers based on selected projection', async () => {
    const storeWithDifferentProjection = mockStore({
      productPicker: {
        category: { title: 'Test Category' },
        selectedMeasurementSourceIndex: 0,
      },
      layers: {
        layerConfig: {
          layer1: {
            id: 'layer1',
            title: 'Layer 1',
            projections: { 'EPSG:3857': true },
          },
          layer2: {
            id: 'layer2',
            title: 'Layer 2',
            projections: { 'EPSG:4326': true },
          },
        },
      },
      config: {
        features: {
          previewSnapshots: false,
          describeDomains: {
            url: 'https://test.nasa.gov',
          },
        },
      },
      proj: {
        id: 'EPSG:4326',
      },
    });

    getSourcesForProjection.mockReturnValue([
      {
        id: 'source1',
        title: 'Source 1',
        description: 'test-metadata',
        settings: ['layer1', 'layer2'],
      },
    ]);

    fetch.mockResolvedValue({
      text: () => Promise.resolve('<p>Metadata</p>'),
    });

    render(
      <Provider store={storeWithDifferentProjection}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Layer 2')).toBeInTheDocument();
    });

    expect(screen.queryByText('Layer 1')).not.toBeInTheDocument();
  });

  it('uses default describeDomains URL when not configured', () => {
    const storeWithoutDescribeDomains = mockStore({
      productPicker: {
        category: { title: 'Test Category' },
        selectedMeasurementSourceIndex: 0,
      },
      layers: {
        layerConfig: {},
      },
      config: {
        features: {
          previewSnapshots: false,
        },
      },
      proj: {
        id: 'EPSG:4326',
      },
    });

    getSourcesForProjection.mockReturnValue([]);

    render(
      <Provider store={storeWithoutDescribeDomains}>
        <MeasurementMetadataDetail isMobile={false} />
      </Provider>,
    );

    expect(screen.getByText('Select a measurement to view details here!')).toBeInTheDocument();
  });
});
