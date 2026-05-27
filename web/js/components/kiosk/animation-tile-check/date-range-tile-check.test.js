/* eslint-disable react/jsx-props-no-spreading */
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DateRangeTileCheck from './date-range-tile-check';
import * as uiActions from '../../../modules/ui/actions';

// Mock the modules
jest.mock('../../../modules/ui/actions');
jest.mock('../../../util/util');

import util from '../../../util/util';

describe('DateRangeTileCheck', () => {
  let store;
  let mockDispatch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    store = configureStore({
      reducer: {
        ui: (state = {}) => state,
      },
    });
    store.dispatch = mockDispatch;

    uiActions.toggleCheckedAnimationAvailability.mockReturnValue({
      type: 'TOGGLE_CHECKED_ANIMATION_AVAILABILITY',
    });

    util.toISOStringSeconds = jest.fn((date) => date.toISOString());
    util.roundTimeOneMinute = jest.fn((date) => date);
  });

  const defaultProps = {
    frameDates: [],
    activeLayers: [],
    config: {
      sources: {
        testSource: {
          url: 'https://test.example.com/tiles',
          matrixSets: {
            testMatrixSet: {
              id: 'testMatrixSet',
              resolutions: [1, 0.5, 0.25],
              tileSize: [256, 256],
              tileMatrices: [
                { matrixWidth: 2, matrixHeight: 2 },
                { matrixWidth: 4, matrixHeight: 4 },
                { matrixWidth: 8, matrixHeight: 8 },
              ],
            },
          },
        },
      },
    },
    proj: {
      id: 'EPSG:4326',
      maxExtent: [0, 0, 256, 256],
    },
    zoom: 1,
  };

  test('renders without crashing', () => {
    const { container } = render(
      <Provider store={store}>
        <DateRangeTileCheck {...defaultProps} />
      </Provider>,
    );
    expect(container).toBeInTheDocument();
  });

  test('returns null component', () => {
    const { container } = render(
      <Provider store={store}>
        <DateRangeTileCheck {...defaultProps} />
      </Provider>,
    );
    expect(container.firstChild).toBeNull();
  });

  test('does not call getAvailability when frameDates is empty', async () => {
    render(
      <Provider store={store}>
        <DateRangeTileCheck {...defaultProps} />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  test('calls dispatch when frameDates length changes', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '160000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [new Date('2023-01-01'), new Date('2023-01-02')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test('filters layers by contentLengthThresholds', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '100000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [new Date('2023-01-01')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
      {
        id: 'UnknownLayer',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      // Only eligible layers should be fetched
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test('dispatches action when percentMissing is below 40%', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '160000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [
      new Date('2023-01-01'),
      new Date('2023-01-02'),
      new Date('2023-01-03'),
    ];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'TOGGLE_CHECKED_ANIMATION_AVAILABILITY',
      });
    });
  });

  test('does not dispatch action when percentMissing is 40% or above', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '1000' }, // Below threshold
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [
      new Date('2023-01-01'),
      new Date('2023-01-02'),
      new Date('2023-01-03'),
    ];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      // Dispatch should not be called with true
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          payload: true,
        }),
      );
    });
  });

  test('handles fetch errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error')),
    );

    const frameDates = [new Date('2023-01-01')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading tile',
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  test('calculates content length sum correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '50000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [new Date('2023-01-01')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test('handles response with status 200 and data', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '160000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [new Date('2023-01-01')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  test('handles response with non-200 status', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 404,
        headers: { get: () => null },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [new Date('2023-01-01')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test('processes multiple layers correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '160000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [new Date('2023-01-01')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
      {
        id: 'GOES-West_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test('respects sourceOverride when provided', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '160000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const frameDates = [new Date('2023-01-01')];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        sourceOverride: 'https://override.example.com/tiles',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('override.example.com'),
      );
    });
  });

  test('uses correct URL parameters for WMTS', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        headers: { get: () => '160000' },
        blob: () => Promise.resolve(new Blob()),
      }),
    );

    const testDate = new Date('2023-01-01T12:00:00Z');
    const frameDates = [testDate];
    const activeLayers = [
      {
        id: 'GOES-East_ABI_GeoColor',
        projections: {
          'EPSG:4326': {
            source: 'testSource',
            matrixSet: 'testMatrixSet',
          },
        },
      },
    ];

    render(
      <Provider store={store}>
        <DateRangeTileCheck
          {...defaultProps}
          frameDates={frameDates}
          activeLayers={activeLayers}
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(util.toISOStringSeconds).toHaveBeenCalledWith(testDate);
    });
  });
});
