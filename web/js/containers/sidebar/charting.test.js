/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

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

jest.mock('./layer-list', () => function MockLayerList(props) {
  return (
    <div
      data-testid="layer-list"
      data-title={props.title}
      data-group-id={props.groupId}
      data-layer-count={props.layers ? props.layers.length : 0}
      data-layer-split={props.layerSplit}
      data-show-dropdown={String(props.showDropdownBtn)}
    />
  );
});

jest.mock('../../modules/layers/selectors', () => ({
  getAllActiveOverlaysBaselayers: jest.fn(() => ({ baselayers: [], overlays: [] })),
  getActiveOverlayGroups: jest.fn(() => []),
  getActiveLayersMap: jest.fn(() => ({})),
  getFilteredOverlayGroups: jest.fn(() => []),
}));

jest.mock('../../modules/charting/actions', () => ({
  updateActiveChartingLayerAction: jest.fn((id) => ({ type: 'UPDATE_ACTIVE_CHARTING_LAYER', id })),
}));

import ChartingLayerMenu from './charting';
import {
  getAllActiveOverlaysBaselayers,
  getActiveOverlayGroups,
  getActiveLayersMap,
  getFilteredOverlayGroups,
} from '../../modules/layers/selectors';
import { updateActiveChartingLayerAction } from '../../modules/charting/actions';

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
  getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [] });
  getActiveOverlayGroups.mockReturnValue([]);
  getActiveLayersMap.mockReturnValue({});
  getFilteredOverlayGroups.mockReturnValue([]);
});

const defaultProps = {
  activeLayersWithPalettes: [],
  height: 500,
  isActive: true,
  isEmbedModeActive: false,
  updateActiveChartingLayer: jest.fn(),
  renderedPalettes: {},
  activeChartingLayer: null,
};

const renderComponent = (propOverrides = {}) => render(
  <ChartingLayerMenu {...defaultProps} {...propOverrides} />,
);

describe('ChartingLayerMenu rendering', () => {
  it('renders the scroll container when isActive is true', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#layers-scroll-container')).toBeInTheDocument();
  });

  it('renders nothing when isActive is false', () => {
    const { container } = renderComponent({ isActive: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders LayerList with correct props', () => {
    const layers = [{ id: 'layer1' }, { id: 'layer2' }];
    const { getByTestId } = renderComponent({ activeLayersWithPalettes: layers });
    const list = getByTestId('layer-list');
    expect(list).toHaveAttribute('data-title', 'Overlays');
    expect(list).toHaveAttribute('data-group-id', 'overlays');
    expect(list).toHaveAttribute('data-layer-count', '2');
    expect(list).toHaveAttribute('data-layer-split', '2');
    expect(list).toHaveAttribute('data-show-dropdown', 'false');
  });

  it('sets layerSplit to activeLayersWithPalettes.length', () => {
    const layers = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const { getByTestId } = renderComponent({ activeLayersWithPalettes: layers });
    expect(getByTestId('layer-list')).toHaveAttribute('data-layer-split', '3');
  });

  it('always passes showDropdownBtn=false to LayerList', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layer-list')).toHaveAttribute('data-show-dropdown', 'false');
  });
});

// ─── scrollContainerStyles ────────────────────────────────────────────────────

describe('ChartingLayerMenu scroll container styles', () => {
  it('applies height-based maxHeight when not in embed mode', () => {
    const { container } = renderComponent({ height: 400, isEmbedModeActive: false });
    const el = container.querySelector('#layers-scroll-container');
    expect(el.style.maxHeight).toBe('400px');
    expect(el.style.minHeight).toBe('100px');
  });

  it('applies 55vh maxHeight and 25px minHeight in embed mode', () => {
    const { container } = renderComponent({ isEmbedModeActive: true });
    const el = container.querySelector('#layers-scroll-container');
    expect(el.style.maxHeight).toBe('55vh');
    expect(el.style.minHeight).toBe('25px');
  });

  it('sets overflowY to auto', () => {
    const { container } = renderComponent();
    const el = container.querySelector('#layers-scroll-container');
    expect(el.style.overflowY).toBe('auto');
  });
});

// ─── useEffect ────────────────────────────────────────────────────────────────

describe('ChartingLayerMenu useEffect', () => {
  it('calls updateActiveChartingLayer with first non-hidden layer id when renderedPalettes is non-empty and activeChartingLayer is null', () => {
    const updateActiveChartingLayer = jest.fn();
    const activeLayersWithPalettes = [
      { id: 'layer-a', shouldHide: false },
      { id: 'layer-b', shouldHide: false },
    ];
    renderComponent({
      updateActiveChartingLayer,
      activeChartingLayer: null,
      renderedPalettes: { palette1: {} },
      activeLayersWithPalettes,
    });
    expect(updateActiveChartingLayer).toHaveBeenCalledWith('layer-a');
  });

  it('skips hidden layers and picks first visible one', () => {
    const updateActiveChartingLayer = jest.fn();
    const activeLayersWithPalettes = [
      { id: 'hidden-layer', shouldHide: true },
      { id: 'visible-layer', shouldHide: false },
    ];
    renderComponent({
      updateActiveChartingLayer,
      activeChartingLayer: null,
      renderedPalettes: { palette1: {} },
      activeLayersWithPalettes,
    });
    expect(updateActiveChartingLayer).toHaveBeenCalledWith('visible-layer');
  });

  it('does not call updateActiveChartingLayer when activeChartingLayer is already set', () => {
    const updateActiveChartingLayer = jest.fn();
    renderComponent({
      updateActiveChartingLayer,
      activeChartingLayer: 'existing-layer',
      renderedPalettes: { palette1: {} },
      activeLayersWithPalettes: [{ id: 'layer-a', shouldHide: false }],
    });
    expect(updateActiveChartingLayer).not.toHaveBeenCalled();
  });

  it('does not call updateActiveChartingLayer when renderedPalettes is empty', () => {
    const updateActiveChartingLayer = jest.fn();
    renderComponent({
      updateActiveChartingLayer,
      activeChartingLayer: null,
      renderedPalettes: {},
      activeLayersWithPalettes: [{ id: 'layer-a', shouldHide: false }],
    });
    expect(updateActiveChartingLayer).not.toHaveBeenCalled();
  });

  it('re-runs when renderedPalettes changes', () => {
    const updateActiveChartingLayer = jest.fn();
    const activeLayersWithPalettes = [{ id: 'layer-a', shouldHide: false }];
    const { rerender } = renderComponent({
      updateActiveChartingLayer,
      activeChartingLayer: null,
      renderedPalettes: {},
      activeLayersWithPalettes,
    });
    expect(updateActiveChartingLayer).not.toHaveBeenCalled();

    const newPalettes = { palette1: {} };
    rerender(
      <ChartingLayerMenu
        {...defaultProps}
        updateActiveChartingLayer={updateActiveChartingLayer}
        activeChartingLayer={null}
        renderedPalettes={newPalettes}
        activeLayersWithPalettes={activeLayersWithPalettes}
      />,
    );
    expect(updateActiveChartingLayer).toHaveBeenCalledWith('layer-a');
  });
});

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    compare: { active: false },
    charting: { active: true, activeLayer: null },
    embed: { isEmbedModeActive: false },
    layers: {
      active: { groupOverlays: false },
      activeB: { groupOverlays: true },
    },
    animation: { isPlaying: false },
    screenSize: { isMobileDevice: false },
    palettes: { rendered: {} },
    ...overrides,
  });

  beforeEach(() => {
    getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [] });
    getActiveLayersMap.mockReturnValue({});
    getActiveOverlayGroups.mockReturnValue([]);
    getFilteredOverlayGroups.mockReturnValue([]);
  });

  it('maps isAnimating from animation.isPlaying', () => {
    const state = makeState({ animation: { isPlaying: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isAnimating).toBe(true);
  });

  it('maps isCompareActive from compare.active', () => {
    const state = makeState({ compare: { active: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isCompareActive).toBe(true);
  });

  it('maps isChartingActive from charting.active', () => {
    const state = makeState({ charting: { active: true, activeLayer: null } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isChartingActive).toBe(true);
  });

  it('maps activeChartingLayer from charting.activeLayer', () => {
    const state = makeState({ charting: { active: true, activeLayer: 'layer-x' } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.activeChartingLayer).toBe('layer-x');
  });

  it('maps isEmbedModeActive from embed state', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isEmbedModeActive).toBe(true);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({ screenSize: { isMobileDevice: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isMobile).toBe(true);
  });

  it('maps groupOverlays from layers[compareState]', () => {
    const state = makeState();
    expect(capturedMapStateToProps(state, { compareState: 'active' }).groupOverlays).toBe(false);
    expect(capturedMapStateToProps(state, { compareState: 'activeB' }).groupOverlays).toBe(true);
  });

  it('calls getActiveLayersMap with state', () => {
    const state = makeState();
    capturedMapStateToProps(state, { compareState: 'active' });
    expect(getActiveLayersMap).toHaveBeenCalledWith(state);
  });

  it('uses getActiveOverlayGroups when groupOverlays is true', () => {
    const state = makeState();
    capturedMapStateToProps(state, { compareState: 'activeB' });
    expect(getActiveOverlayGroups).toHaveBeenCalledWith(state);
  });

  it('returns empty overlayGroups when groupOverlays is false', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.overlayGroups).toEqual([]);
    expect(getActiveOverlayGroups).not.toHaveBeenCalled();
  });

  it('maps renderedPalettes from palettes.rendered', () => {
    const rendered = { pal1: {} };
    const state = makeState({ palettes: { rendered } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.renderedPalettes).toBe(rendered);
  });

  it('filters hidden and Reference layers in embed mode', () => {
    const overlays = [
      { id: 'vis', visible: true, layergroup: 'Science', palette: { id: 'p1' }, layerPeriod: 'Daily', disableCharting: false },
      { id: 'hidden', visible: false, layergroup: 'Science', palette: { id: 'p2' }, layerPeriod: 'Daily', disableCharting: false },
      { id: 'ref', visible: true, layergroup: 'Reference', palette: { id: 'p3' }, layerPeriod: 'Daily', disableCharting: false },
    ];
    const baselayers = [
      { id: 'base-vis', visible: true },
      { id: 'base-hidden', visible: false },
    ];
    getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers, overlays });
    const state = makeState({ embed: { isEmbedModeActive: true }, palettes: { rendered: {} } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.overlays.map((l) => l.id)).toEqual(['vis']);
    expect(result.baselayers.map((l) => l.id)).toEqual(['base-vis']);
    expect(getFilteredOverlayGroups).toHaveBeenCalled();
  });

  it('does not filter layers when not in embed mode', () => {
    const overlays = [
      { id: 'vis', visible: true, layergroup: 'Science', palette: { id: 'p1' }, layerPeriod: 'Daily', disableCharting: false },
      { id: 'hidden', visible: false, layergroup: 'Science', palette: { id: 'p2' }, layerPeriod: 'Daily', disableCharting: false },
    ];
    getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays });
    const state = makeState({ palettes: { rendered: {} } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.overlays).toHaveLength(2);
    expect(getFilteredOverlayGroups).not.toHaveBeenCalled();
  });

  describe('activeLayersWithPalettes shouldHide logic', () => {
    it('shouldHide is false for a qualifying continuous daily layer with rendered palette', () => {
      const overlay = {
        id: 'good',
        visible: true,
        layergroup: 'Science',
        palette: { id: 'pal1' },
        layerPeriod: 'Daily',
        disableCharting: false,
      };
      getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [overlay] });
      const rendered = { pal1: { maps: [{ type: 'continuous' }] } };
      const state = makeState({ palettes: { rendered } });
      const result = capturedMapStateToProps(state, { compareState: 'active' });
      expect(result.activeLayersWithPalettes[0].shouldHide).toBe(false);
    });

    it('shouldHide is true when layer has no palette', () => {
      const overlay = {
        id: 'no-palette',
        visible: true,
        layergroup: 'Science',
        layerPeriod: 'Daily',
        disableCharting: false,
      };
      getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [overlay] });
      const state = makeState({ palettes: { rendered: {} } });
      const result = capturedMapStateToProps(state, { compareState: 'active' });
      expect(result.activeLayersWithPalettes[0].shouldHide).toBe(true);
    });

    it('shouldHide is true when palette is not rendered', () => {
      const overlay = {
        id: 'unrendered',
        visible: true,
        layergroup: 'Science',
        palette: { id: 'unrendered-pal' },
        layerPeriod: 'Daily',
        disableCharting: false,
      };
      getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [overlay] });
      const state = makeState({ palettes: { rendered: {} } });
      const result = capturedMapStateToProps(state, { compareState: 'active' });
      expect(result.activeLayersWithPalettes[0].shouldHide).toBe(true);
    });

    it('shouldHide is true when palette type is not continuous', () => {
      const overlay = {
        id: 'classification',
        visible: true,
        layergroup: 'Science',
        palette: { id: 'pal-cls' },
        layerPeriod: 'Daily',
        disableCharting: false,
      };
      getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [overlay] });
      const rendered = { 'pal-cls': { maps: [{ type: 'classification' }] } };
      const state = makeState({ palettes: { rendered } });
      const result = capturedMapStateToProps(state, { compareState: 'active' });
      expect(result.activeLayersWithPalettes[0].shouldHide).toBe(true);
    });

    it('shouldHide is true when layerPeriod is not Daily', () => {
      const overlay = {
        id: 'monthly',
        visible: true,
        layergroup: 'Science',
        palette: { id: 'pal-m' },
        layerPeriod: 'Monthly',
        disableCharting: false,
      };
      getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [overlay] });
      const rendered = { 'pal-m': { maps: [{ type: 'continuous' }] } };
      const state = makeState({ palettes: { rendered } });
      const result = capturedMapStateToProps(state, { compareState: 'active' });
      expect(result.activeLayersWithPalettes[0].shouldHide).toBe(true);
    });

    it('shouldHide is true when disableCharting is true', () => {
      const overlay = {
        id: 'disabled',
        visible: true,
        layergroup: 'Science',
        palette: { id: 'pal-d' },
        layerPeriod: 'Daily',
        disableCharting: true,
      };
      getAllActiveOverlaysBaselayers.mockReturnValue({ baselayers: [], overlays: [overlay] });
      const rendered = { 'pal-d': { maps: [{ type: 'continuous' }] } };
      const state = makeState({ palettes: { rendered } });
      const result = capturedMapStateToProps(state, { compareState: 'active' });
      expect(result.activeLayersWithPalettes[0].shouldHide).toBe(true);
    });
  });
});

describe('mapDispatchToProps', () => {
  it('updateActiveChartingLayer dispatches updateActiveChartingLayerAction', () => {
    const dispatch = jest.fn();
    const { updateActiveChartingLayer } = capturedMapDispatchToProps(dispatch);
    updateActiveChartingLayer('my-layer');
    expect(updateActiveChartingLayerAction).toHaveBeenCalledWith('my-layer');
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_ACTIVE_CHARTING_LAYER', id: 'my-layer' });
  });
});
