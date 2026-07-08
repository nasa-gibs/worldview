/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => {
    const React = require('react');
    return React.createElement('span', { 'data-testid': `fa-icon-${icon}` });
  },
}));

jest.mock('../../components/sidebar/paletteLegend', () => function MockPaletteLegend({
  layer, parentLayer, isDistractionFreeModeActive, isMobile,
}) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'palette-legend',
    'data-layer-id': layer.id,
    'data-parent-layer-id': parentLayer ? parentLayer.id : '',
    'data-distraction-free': String(isDistractionFreeModeActive),
    'data-is-mobile': String(isMobile),
  });
});

jest.mock('../../modules/palettes/selectors', () => ({
  getPalette: jest.fn(() => ({ id: 'default' })),
  getPaletteLegends: jest.fn(() => [{ id: 'legend1' }]),
}));

jest.mock('../../modules/palettes/actions', () => ({
  requestPalette: jest.fn((id) => ({ type: 'REQUEST_PALETTE', id })),
}));

jest.mock('../../modules/layers/util', () => ({
  getOrbitTrackTitle: jest.fn((layer) => `Title for ${layer.id}`),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const capture = {};
  const mockConnect = (msp, mdp) => {
    capture.msp = msp;
    capture.mdp = mdp;
    return (Component) => Component;
  };
  mockConnect.connectCapture = capture;
  return { ...actual, connect: mockConnect };
});

jest.mock('lodash', () => ({
  isEmpty: jest.fn((val) => !val || Object.keys(val).length === 0),
  get: jest.fn((obj, path) => {
    if (!obj || !path) return undefined;
    return path.split(/[.[\]']+/).filter(Boolean)
      .reduce(
        (acc, key) => (acc != null ? acc[key] : undefined),
        obj,
      );
  }),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import OrbitTrack from './orbit-track';
import { getPaletteLegends, getPalette as getPaletteSelector } from '../../modules/palettes/selectors';
import { requestPalette as requestPaletteAction } from '../../modules/palettes/actions';
import { getOrbitTrackTitle } from '../../modules/layers/util';

// ─── Shared captured connect ──────────────────────────────────────────────────

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const trackLayer = { id: 'orbit1', visible: true, palette: { id: 'pal1' } };
const parentLayer = { id: 'parent1' };

const defaultProps = {
  trackLayer,
  parentLayer,
  paletteLegends: [],
  getPalette: jest.fn(() => ({ id: 'default' })),
  renderedPalette: { id: 'pal1' },
  requestPalette: jest.fn(),
  isDistractionFreeModeActive: false,
  isMobile: false,
  hasPalette: true,
};

const renderComponent = (propOverrides = {}) => render(
  <OrbitTrack {...defaultProps} {...propOverrides} />,
);

// ─── OrbitTrack rendering ─────────────────────────────────────────────────────

describe('OrbitTrack rendering', () => {
  it('renders outer div with wv-orbit-track class', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.wv-orbit-track')).toBeInTheDocument();
  });

  it('does not add not-visible class when trackLayer.visible is true', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.wv-orbit-track')).not.toHaveClass('not-visible');
  });

  it('adds not-visible class when trackLayer.visible is false', () => {
    const { container } = renderComponent({ trackLayer: { ...trackLayer, visible: false } });
    expect(container.querySelector('.wv-orbit-track')).toHaveClass('not-visible');
  });

  it('renders satellite FontAwesomeIcon', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('fa-icon-satellite')).toBeInTheDocument();
  });

  it('renders orbit track label span', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.wv-orbit-track-label')).toBeInTheDocument();
  });

  it('displays title from getOrbitTrackTitle', () => {
    getOrbitTrackTitle.mockReturnValue('Ascending');
    const { container } = renderComponent();
    expect(container.querySelector('.wv-orbit-track-label').textContent).toBe('Ascending');
  });

  it('calls getOrbitTrackTitle with trackLayer', () => {
    renderComponent();
    expect(getOrbitTrackTitle).toHaveBeenCalledWith(trackLayer);
  });
});

// ─── OrbitTrack palette via useEffect ────────────────────────────────────────

describe('OrbitTrack palette rendering via useEffect', () => {
  it('renders PaletteLegend when hasPalette and renderedPalette are truthy', async () => {
    const { findByTestId } = renderComponent();
    expect(await findByTestId('palette-legend')).toBeInTheDocument();
  });

  it('passes trackLayer to PaletteLegend', async () => {
    const { findByTestId } = renderComponent();
    expect(await findByTestId('palette-legend')).toHaveAttribute('data-layer-id', 'orbit1');
  });

  it('passes parentLayer to PaletteLegend', async () => {
    const { findByTestId } = renderComponent();
    expect(await findByTestId('palette-legend')).toHaveAttribute('data-parent-layer-id', 'parent1');
  });

  it('passes isDistractionFreeModeActive to PaletteLegend', async () => {
    const { findByTestId } = renderComponent({ isDistractionFreeModeActive: true });
    expect(await findByTestId('palette-legend')).toHaveAttribute('data-distraction-free', 'true');
  });

  it('passes isMobile to PaletteLegend', async () => {
    const { findByTestId } = renderComponent({ isMobile: true });
    expect(await findByTestId('palette-legend')).toHaveAttribute('data-is-mobile', 'true');
  });

  it('does not render PaletteLegend when hasPalette is true but renderedPalette is null', () => {
    const { queryByTestId } = renderComponent({ hasPalette: true, renderedPalette: null });
    expect(queryByTestId('palette-legend')).not.toBeInTheDocument();
  });

  it('still renders PaletteLegend when hasPalette is false (no early return)', async () => {
    const { findByTestId } = renderComponent({ hasPalette: false, renderedPalette: null });
    expect(await findByTestId('palette-legend')).toBeInTheDocument();
  });

  it('calls requestPalette when hasPalette is true but renderedPalette is null', () => {
    const requestPalette = jest.fn();
    renderComponent({ hasPalette: true, renderedPalette: null, requestPalette });
    expect(requestPalette).toHaveBeenCalledWith('orbit1');
  });

  it('does not call requestPalette when renderedPalette is already available', () => {
    const requestPalette = jest.fn();
    renderComponent({ hasPalette: true, renderedPalette: { id: 'pal1' }, requestPalette });
    expect(requestPalette).not.toHaveBeenCalled();
  });

  it('does not call requestPalette when hasPalette is false', () => {
    const requestPalette = jest.fn();
    renderComponent({ hasPalette: false, renderedPalette: null, requestPalette });
    expect(requestPalette).not.toHaveBeenCalled();
  });

  it('renders PaletteLegend after renderedPalette prop changes from null to truthy', async () => {
    const { queryByTestId, rerender, findByTestId } = render(
      <OrbitTrack {...defaultProps} renderedPalette={null} />,
    );
    expect(queryByTestId('palette-legend')).not.toBeInTheDocument();
    await act(async () => {
      rerender(<OrbitTrack {...defaultProps} renderedPalette={{ id: 'pal1' }} />);
    });
    expect(await findByTestId('palette-legend')).toBeInTheDocument();
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    palettes: {
      rendered: {},
      custom: {},
      ...overrides.palettes,
    },
    config: {
      layers: {
        orbit1: { palette: { id: 'pal1' } },
      },
      ...overrides.config,
    },
    ui: { isDistractionFreeModeActive: false, ...overrides.ui },
    screenSize: { isMobileDevice: false, ...overrides.screenSize },
    ...overrides,
  });

  const defaultOwnProps = {
    trackLayer: { id: 'orbit1', palette: { id: 'pal1' } },
    compareState: 'active',
  };

  it('returns trackLayer from ownProps', () => {
    const result = capturedMapStateToProps(makeState(), defaultOwnProps);
    expect(result.trackLayer).toBe(defaultOwnProps.trackLayer);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({ screenSize: { isMobileDevice: true } });
    const result = capturedMapStateToProps(state, defaultOwnProps);
    expect(result.isMobile).toBe(true);
  });

  it('maps isDistractionFreeModeActive from ui', () => {
    const state = makeState({ ui: { isDistractionFreeModeActive: true } });
    const result = capturedMapStateToProps(state, defaultOwnProps);
    expect(result.isDistractionFreeModeActive).toBe(true);
  });

  it('sets hasPalette true when trackLayer.palette is non-empty', () => {
    const result = capturedMapStateToProps(makeState(), defaultOwnProps);
    expect(result.hasPalette).toBe(true);
  });

  it('sets hasPalette false when trackLayer.palette is empty object', () => {
    const ownProps = { ...defaultOwnProps, trackLayer: { id: 'orbit1', palette: {} } };
    const result = capturedMapStateToProps(makeState(), ownProps);
    expect(result.hasPalette).toBe(false);
  });

  it('sets hasPalette false when trackLayer.palette is undefined', () => {
    const ownProps = { ...defaultOwnProps, trackLayer: { id: 'orbit1' } };
    const result = capturedMapStateToProps(makeState(), ownProps);
    expect(result.hasPalette).toBe(false);
  });

  it('returns renderedPalette from palettes.rendered by palette id', () => {
    const paletteData = { id: 'pal1', entries: [] };
    const state = makeState({ palettes: { rendered: { pal1: paletteData }, custom: {} } });
    const result = capturedMapStateToProps(state, defaultOwnProps);
    expect(result.renderedPalette).toBe(paletteData);
  });

  it('returns undefined renderedPalette when not yet rendered', () => {
    const result = capturedMapStateToProps(makeState(), defaultOwnProps);
    expect(result.renderedPalette).toBeUndefined();
  });

  it('returns empty paletteLegends array when renderedPalettes does not have paletteName', () => {
    const result = capturedMapStateToProps(makeState(), defaultOwnProps);
    expect(result.paletteLegends).toEqual([]);
    expect(getPaletteLegends).not.toHaveBeenCalled();
  });

  it('calls getPaletteLegends when hasPalette and palette is rendered', () => {
    const state = makeState({ palettes: { rendered: { pal1: { id: 'pal1' } }, custom: {} } });
    capturedMapStateToProps(state, defaultOwnProps);
    expect(getPaletteLegends).toHaveBeenCalledWith('orbit1', 'active', state);
  });

  it('returns paletteLegends from getPaletteLegends when palette is rendered', () => {
    getPaletteLegends.mockReturnValueOnce([{ id: 'legend1' }]);
    const state = makeState({ palettes: { rendered: { pal1: { id: 'pal1' } }, custom: {} } });
    const result = capturedMapStateToProps(state, defaultOwnProps);
    expect(result.paletteLegends).toEqual([{ id: 'legend1' }]);
  });

  it('returns empty paletteLegends when hasPalette is false', () => {
    const ownProps = { ...defaultOwnProps, trackLayer: { id: 'orbit1', palette: {} } };
    const state = makeState({ palettes: { rendered: { pal1: { id: 'pal1' } }, custom: {} } });
    const result = capturedMapStateToProps(state, ownProps);
    expect(result.paletteLegends).toEqual([]);
  });

  it('sets isCustomPalette true when palettes.custom has trackLayer id', () => {
    const state = makeState({ palettes: { rendered: {}, custom: { orbit1: true } } });
    const result = capturedMapStateToProps(state, defaultOwnProps);
    expect(result.isCustomPalette).toBeTruthy();
  });

  it('sets isCustomPalette falsy when palettes.custom does not have trackLayer id', () => {
    const result = capturedMapStateToProps(makeState(), defaultOwnProps);
    expect(result.isCustomPalette).toBeFalsy();
  });

  it('getPalette calls getPaletteSelector with correct args', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, defaultOwnProps);
    result.getPalette('orbit1', 2);
    expect(getPaletteSelector).toHaveBeenCalledWith('orbit1', 2, 'active', state);
  });

  it('getPalette uses trackLayer.id regardless of layerId argument', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, defaultOwnProps);
    result.getPalette('some-other-id', 0);
    expect(getPaletteSelector).toHaveBeenCalledWith('orbit1', 0, 'active', state);
  });
});

// ─── mapDispatchToProps ───────────────────────────────────────────────────────

describe('mapDispatchToProps', () => {
  let dispatch;
  let mapped;

  beforeEach(() => {
    dispatch = jest.fn();
    mapped = capturedMapDispatchToProps(dispatch);
  });

  it('requestPalette dispatches requestPaletteAction with the layer id', () => {
    mapped.requestPalette('orbit1');
    expect(requestPaletteAction).toHaveBeenCalledWith('orbit1');
    expect(dispatch).toHaveBeenCalledWith({ type: 'REQUEST_PALETTE', id: 'orbit1' });
  });
});
