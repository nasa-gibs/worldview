/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mock DnD ────────────────────────────────────────────────────────────────

let mockUseSortableReturn = {
  attributes: {},
  listeners: {},
  setNodeRef: jest.fn(),
  setActivatorNodeRef: jest.fn(),
  transform: null,
  transition: undefined,
  isDragging: false,
};

jest.mock('@dnd-kit/core', () => {
  const React = require('react');
  return {
    DndContext: ({ children, onDragEnd }) => {
      global.__capturedOnDragEnd = onDragEnd;
      return React.createElement('div', { 'data-testid': 'dnd-context' }, children);
    },
    closestCenter: {},
  };
});

jest.mock('@dnd-kit/sortable', () => {
  const React = require('react');
  return {
    SortableContext: ({ children }) => React.createElement('div', { 'data-testid': 'sortable-context' }, children),
    verticalListSortingStrategy: {},
    arrayMove: jest.fn((arr, from, to) => {
      const result = [...arr];
      const [item] = result.splice(from, 1);
      result.splice(to, 0, item);
      return result;
    }),
    useSortable: jest.fn(() => mockUseSortableReturn),
  };
});

// ─── Mock react-redux ─────────────────────────────────────────────────────────

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

// ─── Mock LayerList ───────────────────────────────────────────────────────────

jest.mock('./layer-list', () => function MockLayerList({
  title, groupId, collapsed, compareState, layerSplit, layers, dragHandleProps, toggleCollapse,
}) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': `layer-list-${groupId}`,
    'data-title': title,
    'data-collapsed': String(collapsed),
    'data-compare-state': compareState,
    'data-layer-split': String(layerSplit),
    'data-layers-count': layers ? String(layers.length) : '0',
    onClick: toggleCollapse,
  });
});

// ─── Mock util ────────────────────────────────────────────────────────────────

jest.mock('../../util/util', () => ({
  cleanId: jest.fn((id) => id.replace(/\s+/g, '-').toLowerCase()),
}));

// ─── Mock selectors ───────────────────────────────────────────────────────────

jest.mock('../../modules/layers/selectors', () => ({
  getAllActiveOverlaysBaselayers: jest.fn(() => ({
    baselayers: [{ id: 'base1', visible: true }],
    overlays: [
      { id: 'overlay1', visible: true, layergroup: 'Overlays' },
      { id: 'overlay2', visible: false, layergroup: 'Reference' },
    ],
  })),
  getActiveOverlayGroups: jest.fn(() => [
    { groupName: 'Group A', layers: ['overlay1'], collapsed: false },
    { groupName: 'Group B', layers: ['overlay2'], collapsed: true },
  ]),
  getActiveLayersMap: jest.fn(() => ({
    overlay1: { id: 'overlay1', visible: true, layergroup: 'Overlays' },
    overlay2: { id: 'overlay2', visible: false, layergroup: 'Reference' },
    base1: { id: 'base1', visible: true },
  })),
  getFilteredOverlayGroups: jest.fn((groups, overlays) => {
    return groups.filter((g) => g.layers.some((id) => overlays.find((o) => o.id === id)));
  }),
}));

// ─── Mock actions ─────────────────────────────────────────────────────────────

jest.mock('../../modules/layers/actions', () => ({
  reorderOverlayGroups: jest.fn(() => ({ type: 'REORDER_OVERLAY_GROUPS' })),
  toggleGroupCollapsed: jest.fn(() => ({ type: 'TOGGLE_GROUP_COLLAPSED' })),
}));

jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn(() => ({ type: 'OPEN_CUSTOM_CONTENT' })),
}));

jest.mock('../../modules/animation/actions', () => ({
  stop: jest.fn(() => ({ type: 'STOP_ANIMATION' })),
}));

// ─── Mock react-device-detect ─────────────────────────────────────────────────

jest.mock('react-device-detect', () => ({
  isMobileOnly: false,
  isTablet: false,
}));

// ─── Mock SearchUiProvider ────────────────────────────────────────────────────

jest.mock('../../components/layer/product-picker/search-ui-provider', () => function MockSearchUiProvider() {
  const React = require('react');
  return React.createElement('div', { 'data-testid': 'search-ui-provider' });
});

// ─── Imports after mocks ──────────────────────────────────────────────────────

import LayersContainer from './layers-container';
import { arrayMove } from '@dnd-kit/sortable';
import {
  getAllActiveOverlaysBaselayers,
  getActiveOverlayGroups,
  getActiveLayersMap,
  getFilteredOverlayGroups,
} from '../../modules/layers/selectors';
import {
  reorderOverlayGroups as reorderOverlayGroupsAction,
  toggleGroupCollapsed as toggleGroupCollapsedAction,
} from '../../modules/layers/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

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
  delete global.__capturedOnDragEnd;
  mockUseSortableReturn = {
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    setActivatorNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  };
  const { useSortable } = jest.requireMock('@dnd-kit/sortable');
  useSortable.mockImplementation(() => mockUseSortableReturn);
});

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const defaultOverlays = [
  { id: 'overlay1', visible: true, layergroup: 'Overlays' },
  { id: 'overlay2', visible: false, layergroup: 'Reference' },
];

const defaultBaselayers = [
  { id: 'base1', visible: true },
];

const defaultOverlayGroups = [
  { groupName: 'Group A', layers: ['overlay1'], collapsed: false },
  { groupName: 'Group B', layers: ['overlay2'], collapsed: true },
];

const defaultActiveLayersMap = {
  overlay1: { id: 'overlay1', visible: true, layergroup: 'Overlays' },
  overlay2: { id: 'overlay2', visible: false, layergroup: 'Reference' },
  base1: { id: 'base1', visible: true },
};

const defaultProps = {
  activeLayersMap: defaultActiveLayersMap,
  baselayers: defaultBaselayers,
  compareState: 'active',
  groupOverlays: false,
  height: 400,
  isActive: true,
  isAnimating: false,
  isEmbedModeActive: false,
  overlayGroups: defaultOverlayGroups,
  overlays: defaultOverlays,
  reorderOverlayGroups: jest.fn(),
  toggleCollapse: jest.fn(),
};

const renderComponent = (propOverrides = {}) => render(
  <LayersContainer {...defaultProps} {...propOverrides} />,
);

// ─── LayersContainer – active/inactive ───────────────────────────────────────

describe('LayersContainer active/inactive', () => {
  it('renders nothing when isActive is false', () => {
    const { container } = renderComponent({ isActive: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders scroll container when isActive is true', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#layers-scroll-container')).toBeInTheDocument();
  });
});

// ─── LayersContainer – scroll container styles ────────────────────────────────

describe('LayersContainer scroll container styles', () => {
  it('sets minHeight to 100px and maxHeight to height+px in normal mode', () => {
    const { container } = renderComponent({ height: 350 });
    const el = container.querySelector('#layers-scroll-container');
    expect(el.style.minHeight).toBe('100px');
    expect(el.style.maxHeight).toBe('350px');
  });

  it('sets minHeight to 25px and maxHeight to 55vh in embed mode', () => {
    const { container } = renderComponent({ isEmbedModeActive: true });
    const el = container.querySelector('#layers-scroll-container');
    expect(el.style.minHeight).toBe('25px');
    expect(el.style.maxHeight).toBe('55vh');
  });

  it('always sets overflowY to auto', () => {
    const { container } = renderComponent();
    const el = container.querySelector('#layers-scroll-container');
    expect(el.style.overflowY).toBe('auto');
  });
});

// ─── LayersContainer – overlay rendering ─────────────────────────────────────

describe('LayersContainer overlay rendering', () => {
  it('renders overlays LayerList when groupOverlays is false', () => {
    const { getByTestId } = renderComponent({ groupOverlays: false });
    expect(getByTestId('layer-list-overlays')).toBeInTheDocument();
  });

  it('renders DndContext when groupOverlays is true', () => {
    const { getByTestId } = renderComponent({ groupOverlays: true });
    expect(getByTestId('dnd-context')).toBeInTheDocument();
  });

  it('renders SortableContext with group names when groupOverlays is true', () => {
    const { getByTestId } = renderComponent({ groupOverlays: true });
    expect(getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('renders a SortableOverlayGroup for each overlayGroup', () => {
    const { getAllByTestId } = renderComponent({ groupOverlays: true });
    // SortableOverlayGroup renders LayerList for each group
    const lists = getAllByTestId(/^layer-list-Group/);
    expect(lists).toHaveLength(2);
  });

  it('does not render DndContext when groupOverlays is false', () => {
    const { queryByTestId } = renderComponent({ groupOverlays: false });
    expect(queryByTestId('dnd-context')).not.toBeInTheDocument();
  });

  it('hides overlays LayerList in embed mode when overlays is empty', () => {
    const { queryByTestId } = renderComponent({
      isEmbedModeActive: true,
      overlays: [],
      groupOverlays: false,
    });
    expect(queryByTestId('layer-list-overlays')).not.toBeInTheDocument();
  });

  it('shows overlays LayerList in embed mode when overlays is non-empty', () => {
    const { getByTestId } = renderComponent({
      isEmbedModeActive: true,
      overlays: defaultOverlays,
      groupOverlays: false,
    });
    expect(getByTestId('layer-list-overlays')).toBeInTheDocument();
  });

  it('passes overlays.length as layerSplit to the overlays LayerList', () => {
    const { getByTestId } = renderComponent({ groupOverlays: false });
    expect(getByTestId('layer-list-overlays')).toHaveAttribute('data-layer-split', String(defaultOverlays.length));
  });
});

// ─── LayersContainer – baselayer rendering ───────────────────────────────────

describe('LayersContainer baselayer rendering', () => {
  it('renders baselayers LayerList', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layer-list-baselayers')).toBeInTheDocument();
  });

  it('hides baselayers in embed mode when baselayers is empty', () => {
    const { queryByTestId } = renderComponent({
      isEmbedModeActive: true,
      baselayers: [],
    });
    expect(queryByTestId('layer-list-baselayers')).not.toBeInTheDocument();
  });

  it('shows baselayers in embed mode when baselayers is non-empty', () => {
    const { getByTestId } = renderComponent({
      isEmbedModeActive: true,
      baselayers: defaultBaselayers,
    });
    expect(getByTestId('layer-list-baselayers')).toBeInTheDocument();
  });

  it('passes overlays.length as layerSplit to baselayers LayerList', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layer-list-baselayers')).toHaveAttribute('data-layer-split', String(defaultOverlays.length));
  });

  it('passes compareState to baselayers LayerList', () => {
    const { getByTestId } = renderComponent({ compareState: 'activeB' });
    expect(getByTestId('layer-list-baselayers')).toHaveAttribute('data-compare-state', 'activeB');
  });
});

// ─── LayersContainer – overlaysCollapsed toggle ───────────────────────────────

describe('LayersContainer collapse toggles', () => {
  it('overlaysCollapsed starts false', () => {
    const { getByTestId } = renderComponent({ groupOverlays: false });
    expect(getByTestId('layer-list-overlays')).toHaveAttribute('data-collapsed', 'false');
  });

  it('toggles overlaysCollapsed when overlays LayerList onClick fires', () => {
    const { getByTestId } = renderComponent({ groupOverlays: false });
    fireEvent.click(getByTestId('layer-list-overlays'));
    expect(getByTestId('layer-list-overlays')).toHaveAttribute('data-collapsed', 'true');
  });

  it('baselayersCollapsed starts false', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layer-list-baselayers')).toHaveAttribute('data-collapsed', 'false');
  });

  it('toggles baselayersCollapsed when baselayers LayerList onClick fires', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('layer-list-baselayers'));
    expect(getByTestId('layer-list-baselayers')).toHaveAttribute('data-collapsed', 'true');
  });

  it('toggles back to false on second click for overlays', () => {
    const { getByTestId } = renderComponent({ groupOverlays: false });
    fireEvent.click(getByTestId('layer-list-overlays'));
    fireEvent.click(getByTestId('layer-list-overlays'));
    expect(getByTestId('layer-list-overlays')).toHaveAttribute('data-collapsed', 'false');
  });
});

// ─── LayersContainer – onDragEnd ─────────────────────────────────────────────

describe('LayersContainer onDragEnd', () => {
  it('returns early when over is null', () => {
    const reorderOverlayGroups = jest.fn();
    renderComponent({ groupOverlays: true, reorderOverlayGroups });
    global.__capturedOnDragEnd({ active: { id: 'Group A' }, over: null });
    expect(reorderOverlayGroups).not.toHaveBeenCalled();
  });

  it('returns early when active.id equals over.id', () => {
    const reorderOverlayGroups = jest.fn();
    renderComponent({ groupOverlays: true, reorderOverlayGroups });
    global.__capturedOnDragEnd({ active: { id: 'Group A' }, over: { id: 'Group A' } });
    expect(reorderOverlayGroups).not.toHaveBeenCalled();
  });

  it('returns early when source group is not found', () => {
    const reorderOverlayGroups = jest.fn();
    renderComponent({ groupOverlays: true, reorderOverlayGroups });
    global.__capturedOnDragEnd({ active: { id: 'Unknown Group' }, over: { id: 'Group B' } });
    expect(reorderOverlayGroups).not.toHaveBeenCalled();
  });

  it('returns early when destination group is not found', () => {
    const reorderOverlayGroups = jest.fn();
    renderComponent({ groupOverlays: true, reorderOverlayGroups });
    global.__capturedOnDragEnd({ active: { id: 'Group A' }, over: { id: 'Unknown Group' } });
    expect(reorderOverlayGroups).not.toHaveBeenCalled();
  });

  it('calls arrayMove and reorderOverlayGroups on valid drag', () => {
    const reorderOverlayGroups = jest.fn();
    renderComponent({ groupOverlays: true, reorderOverlayGroups });
    global.__capturedOnDragEnd({ active: { id: 'Group A' }, over: { id: 'Group B' } });
    expect(arrayMove).toHaveBeenCalled();
    expect(reorderOverlayGroups).toHaveBeenCalledTimes(1);
  });

  it('passes reordered layers concatenated with baselayers to reorderOverlayGroups', () => {
    const reorderOverlayGroups = jest.fn();
    renderComponent({ groupOverlays: true, reorderOverlayGroups });
    global.__capturedOnDragEnd({ active: { id: 'Group A' }, over: { id: 'Group B' } });
    const [newLayers] = reorderOverlayGroups.mock.calls[0];
    // Should end with the baselayer
    expect(newLayers[newLayers.length - 1]).toEqual(defaultBaselayers[0]);
  });

  it('passes reordered groups as second argument to reorderOverlayGroups', () => {
    const reorderOverlayGroups = jest.fn();
    renderComponent({ groupOverlays: true, reorderOverlayGroups });
    global.__capturedOnDragEnd({ active: { id: 'Group A' }, over: { id: 'Group B' } });
    const [, newGroups] = reorderOverlayGroups.mock.calls[0];
    expect(Array.isArray(newGroups)).toBe(true);
    expect(newGroups).toHaveLength(2);
  });
});

// ─── SortableOverlayGroup – rendered via LayersContainer ─────────────────────

describe('SortableOverlayGroup rendering', () => {
  it('renders li with id combining compareState and groupName', () => {
    const { container } = renderComponent({ groupOverlays: true, compareState: 'active' });
    expect(container.querySelector('#active-group-a')).toBeInTheDocument();
  });

  it('renders LayerList inside each group li', () => {
    const { getAllByTestId } = renderComponent({ groupOverlays: true });
    expect(getAllByTestId(/^layer-list-Group/)).toHaveLength(2);
  });

  it('passes groupName as title to LayerList', () => {
    const { getByTestId } = renderComponent({ groupOverlays: true });
    expect(getByTestId('layer-list-Group A')).toHaveAttribute('data-title', 'Group A');
  });

  it('passes collapsed from group to LayerList', () => {
    const { getByTestId } = renderComponent({ groupOverlays: true });
    expect(getByTestId('layer-list-Group A')).toHaveAttribute('data-collapsed', 'false');
    expect(getByTestId('layer-list-Group B')).toHaveAttribute('data-collapsed', 'true');
  });

  it('returns null when group has no layers property', () => {
    const groups = [{ groupName: 'Empty Group', layers: null, collapsed: false }];
    const { queryByTestId } = renderComponent({
      groupOverlays: true,
      overlayGroups: groups,
    });
    expect(queryByTestId('layer-list-Empty Group')).not.toBeInTheDocument();
  });

  it('applies transform style when useSortable returns a transform', () => {
    const { useSortable } = jest.requireMock('@dnd-kit/sortable');
    useSortable.mockReturnValue({
      ...mockUseSortableReturn,
      transform: { x: 10, y: 20 },
      transition: 'transform 200ms',
    });
    const { container } = renderComponent({ groupOverlays: true });
    const li = container.querySelector('li');
    expect(li.style.transform).toBe('translate3d(10px, 20px, 0)');
    expect(li.style.transition).toBe('transform 200ms');
  });

  it('applies opacity style when isDragging is true', () => {
    const { useSortable } = jest.requireMock('@dnd-kit/sortable');
    useSortable.mockReturnValue({
      ...mockUseSortableReturn,
      isDragging: true,
    });
    const { container } = renderComponent({ groupOverlays: true });
    const li = container.querySelector('li');
    expect(li.style.opacity).toBe('0.8');
  });

  it('does not set opacity style when isDragging is false', () => {
    const { container } = renderComponent({ groupOverlays: true });
    const li = container.querySelector('li');
    expect(li.style.opacity).toBe('');
  });

  it('disables useSortable when isEmbedModeActive is true', () => {
    const { useSortable } = jest.requireMock('@dnd-kit/sortable');
    renderComponent({ groupOverlays: true, isEmbedModeActive: true });
    const callArg = useSortable.mock.calls[0][0];
    expect(callArg.disabled).toBe(true);
  });

  it('disables useSortable when isAnimating is true', () => {
    const { useSortable } = jest.requireMock('@dnd-kit/sortable');
    renderComponent({ groupOverlays: true, isAnimating: true });
    const callArg = useSortable.mock.calls[0][0];
    expect(callArg.disabled).toBe(true);
  });

  it('enables useSortable when neither embed nor animating', () => {
    const { useSortable } = jest.requireMock('@dnd-kit/sortable');
    renderComponent({ groupOverlays: true, isEmbedModeActive: false, isAnimating: false });
    const callArg = useSortable.mock.calls[0][0];
    expect(callArg.disabled).toBe(false);
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    compare: { active: false },
    embed: { isEmbedModeActive: false },
    layers: {
      active: { groupOverlays: true },
      activeB: { groupOverlays: false },
    },
    animation: { isPlaying: false },
    screenSize: { isMobileDevice: false, breakpoints: {}, screenWidth: 1024 },
    ...overrides,
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

  it('maps isEmbedModeActive from embed.isEmbedModeActive', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isEmbedModeActive).toBe(true);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({
      screenSize: { isMobileDevice: true, breakpoints: {}, screenWidth: 400 },
    });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.isMobile).toBe(true);
  });

  it('maps breakpoints from screenSize.breakpoints', () => {
    const bp = { sm: 576, md: 768 };
    const state = makeState({
      screenSize: { isMobileDevice: false, breakpoints: bp, screenWidth: 1024 },
    });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.breakpoints).toEqual(bp);
  });

  it('maps screenWidth from screenSize.screenWidth', () => {
    const state = makeState({
      screenSize: { isMobileDevice: false, breakpoints: {}, screenWidth: 800 },
    });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.screenWidth).toBe(800);
  });

  it('uses compareState from ownProps to read groupOverlays', () => {
    const result = capturedMapStateToProps(makeState(), { compareState: 'activeB' });
    expect(result.groupOverlays).toBe(false);
  });

  it('calls getAllActiveOverlaysBaselayers and returns baselayers and overlays', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(getAllActiveOverlaysBaselayers).toHaveBeenCalledWith(state);
    expect(result.baselayers).toEqual([{ id: 'base1', visible: true }]);
    expect(result.overlays.length).toBe(2);
  });

  it('calls getActiveLayersMap and returns activeLayersMap', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(getActiveLayersMap).toHaveBeenCalledWith(state);
    expect(result.activeLayersMap).toBeDefined();
  });

  it('returns empty overlayGroups when groupOverlays is false', () => {
    const result = capturedMapStateToProps(makeState(), { compareState: 'activeB' });
    expect(result.overlayGroups).toEqual([]);
    expect(getActiveOverlayGroups).not.toHaveBeenCalled();
  });

  it('calls getActiveOverlayGroups when groupOverlays is true', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(getActiveOverlayGroups).toHaveBeenCalledWith(state);
    expect(result.overlayGroups.length).toBeGreaterThan(0);
  });

  it('filters baselayers to visible only in embed mode', () => {
    getAllActiveOverlaysBaselayers.mockReturnValueOnce({
      baselayers: [
        { id: 'base1', visible: true },
        { id: 'base2', visible: false },
      ],
      overlays: [],
    });
    const state = makeState({ embed: { isEmbedModeActive: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.baselayers.every((l) => l.visible)).toBe(true);
    expect(result.baselayers.some((l) => !l.visible)).toBe(false);
  });

  it('filters overlays to visible and non-Reference in embed mode', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    const result = capturedMapStateToProps(state, { compareState: 'active' });
    expect(result.overlays.every((l) => l.visible && l.layergroup !== 'Reference')).toBe(true);
  });

  it('calls getFilteredOverlayGroups in embed mode', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    capturedMapStateToProps(state, { compareState: 'active' });
    expect(getFilteredOverlayGroups).toHaveBeenCalled();
  });

  it('does not call getFilteredOverlayGroups when not in embed mode', () => {
    capturedMapStateToProps(makeState(), { compareState: 'active' });
    expect(getFilteredOverlayGroups).not.toHaveBeenCalled();
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

  it('reorderOverlayGroups dispatches reorderOverlayGroupsAction', () => {
    const layers = [{ id: 'overlay1' }];
    const groups = [{ groupName: 'Group A' }];
    mapped.reorderOverlayGroups(layers, groups);
    expect(reorderOverlayGroupsAction).toHaveBeenCalledWith(layers, groups);
    expect(dispatch).toHaveBeenCalledWith({ type: 'REORDER_OVERLAY_GROUPS' });
  });

  it('toggleCollapse dispatches toggleGroupCollapsedAction', () => {
    mapped.toggleCollapse('Group A', true);
    expect(toggleGroupCollapsedAction).toHaveBeenCalledWith('Group A', true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_GROUP_COLLAPSED' });
  });

  it('addLayers dispatches openCustomContent when not animating', () => {
    mapped.addLayers(false);
    expect(stopAnimationAction).not.toHaveBeenCalled();
    expect(openCustomContent).toHaveBeenCalledWith(
      'LAYER_PICKER_COMPONENT',
      expect.objectContaining({ backdrop: true }),
    );
    expect(dispatch).toHaveBeenCalledWith({ type: 'OPEN_CUSTOM_CONTENT' });
  });

  it('addLayers dispatches stop animation before openCustomContent when animating', () => {
    mapped.addLayers(true);
    expect(stopAnimationAction).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_ANIMATION' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'OPEN_CUSTOM_CONTENT' });
  });

  it('addLayers passes headerText null to openCustomContent', () => {
    mapped.addLayers(false);
    const [, opts] = openCustomContent.mock.calls[0];
    expect(opts.headerText).toBeNull();
  });

  it('addLayers sets wrapClassName to empty string', () => {
    mapped.addLayers(false);
    const [, opts] = openCustomContent.mock.calls[0];
    expect(opts.wrapClassName).toBe('');
  });
});
