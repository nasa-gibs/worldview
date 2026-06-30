/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

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
    SortableContext: ({ children }) => React.createElement(
      'div',
      { 'data-testid': 'sortable-context' },
      children,
    ),
    verticalListSortingStrategy: {},
    arrayMove: jest.fn((arr, from, to) => {
      const result = [...arr];
      const [item] = result.splice(from, 1);
      result.splice(to, 0, item);
      return result;
    }),
  };
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({
    icon, className, onClick, onPointerDown, onMouseDown,
  }) => {
    const React = require('react');
    return React.createElement('span', {
      'data-testid': `fa-icon-${icon}`,
      className,
      onClick,
      onPointerDown,
      onMouseDown,
    });
  },
}));

jest.mock('reactstrap', () => {
  const React = require('react');
  return {
    Dropdown: ({
      children, isOpen, toggle, className,
    }) => React.createElement(
      'div',
      { 'data-testid': 'dropdown', 'data-is-open': String(isOpen), className },
      React.createElement('button', { 'data-testid': 'dropdown-outer-toggle', onClick: toggle }),
      children,
    ),
    DropdownToggle: ({ children, onPointerDown, onMouseDown }) => React.createElement(
      'button',
      { 'data-testid': 'dropdown-toggle', onPointerDown, onMouseDown },
      children,
    ),
    DropdownMenu: ({ children, onPointerDown, onMouseDown }) => React.createElement(
      'div',
      { 'data-testid': 'dropdown-menu', onPointerDown, onMouseDown },
      children,
    ),
    DropdownItem: ({
      children, id, onClick, onPointerDown, onMouseDown,
    }) => React.createElement(
      'button',
      {
        'data-testid': `dropdown-item-${id}`,
        onClick,
        onPointerDown,
        onMouseDown,
      },
      children,
    ),
  };
});

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

jest.mock('./layer-row', () => function MockLayerRow({
  layer, compareState, isChartingActive, isDisabled, isVisible,
}) {
  return (
    <div
      data-testid={`layer-row-${layer.id}`}
      data-compare-state={compareState}
      data-is-charting={String(isChartingActive)}
      data-is-disabled={String(isDisabled)}
      data-is-visible={String(isVisible)}
    />
  );
});

jest.mock('../../util/util', () => ({
  encodeId: jest.fn((id) => id),
}));

jest.mock('lodash', () => ({
  get: jest.fn((obj, path) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce(
      (acc, key) => (acc !== null && acc !== undefined ? acc[key] : undefined),
      obj,
    );
  }),
}));

jest.mock('../../modules/layers/selectors', () => ({
  replaceSubGroup: jest.fn((layerId, nextLayerId, activeLayers) => activeLayers),
  getZotsForActiveLayers: jest.fn(() => ({ layer1: 'zot-data' })),
  getTitles: jest.fn(() => ({ title: 'Layer Title', subtitle: '' })),
  getActiveLayers: jest.fn(() => [
    { id: 'layer1', layergroup: 'Overlays', visible: true },
    { id: 'layer2', layergroup: 'Reference', visible: false },
  ]),
  memoizedAvailable: jest.fn(() => jest.fn(() => true)),
}));

jest.mock('../../modules/layers/actions', () => ({
  reorderLayers: jest.fn(() => ({ type: 'REORDER_LAYERS' })),
  removeGroup: jest.fn(() => ({ type: 'REMOVE_GROUP' })),
  toggleGroupVisibility: jest.fn(() => ({ type: 'TOGGLE_GROUP_VISIBILITY' })),
}));

import LayerList from './layer-list';
import {
  replaceSubGroup,
  getZotsForActiveLayers,
  getTitles,
  memoizedAvailable,
} from '../../modules/layers/selectors';
import {
  reorderLayers as reorderLayersAction,
  removeGroup as removeGroupAction,
  toggleGroupVisibility as toggleGroupVisibilityAction,
} from '../../modules/layers/actions';

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
});

const defaultLayers = [
  { id: 'layer1', projections: { 'EPSG:4326': true }, visible: true },
  { id: 'layer2', projections: { 'EPSG:4326': true }, visible: false },
];

const defaultProps = {
  activeLayers: [...defaultLayers],
  activeChartingLayer: null,
  available: jest.fn(() => true),
  collapsed: false,
  compareState: 'active',
  dragHandleProps: {},
  getNames: jest.fn(() => ({ title: 'Layer Title', subtitle: '' })),
  groupId: 'group1',
  isAnimating: false,
  isChartingActive: false,
  isMobile: false,
  layerSplit: 0,
  layers: defaultLayers,
  numVisible: 1,
  projId: 'EPSG:4326',
  reorderLayers: jest.fn(),
  removeGroup: jest.fn(),
  title: 'Test Group',
  toggleCollapse: jest.fn(),
  toggleVisibility: jest.fn(),
  zots: {},
};

const renderComponent = (propOverrides = {}) => render(
  <LayerList {...defaultProps} {...propOverrides} />,
);

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('LayerList rendering', () => {
  it('renders container div with id composed of compareState and groupId', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#active-group1')).toBeInTheDocument();
  });

  it('uses correct id with different compareState and groupId', () => {
    const { container } = renderComponent({ compareState: 'activeB', groupId: 'grp2' });
    expect(container.querySelector('#activeB-grp2')).toBeInTheDocument();
  });

  it('renders layer group header', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.layer-group-header')).toBeInTheDocument();
  });

  it('renders title in h3', () => {
    const { container } = renderComponent({ title: 'My Layers' });
    expect(container.querySelector('.layer-group-title').textContent).toContain('My Layers');
  });

  it('appends collapsed count when collapsed is true', () => {
    const { container } = renderComponent({ collapsed: true, numVisible: 1 });
    // layersInProj = both layers (both in EPSG:4326)
    expect(container.querySelector('.layer-group-title').textContent).toContain('(1/2)');
  });

  it('does not append count when collapsed is false', () => {
    const { container } = renderComponent({ collapsed: false });
    expect(container.querySelector('.layer-group-title').textContent).not.toContain('(');
  });

  it('counts only layers in current projection for collapsed total', () => {
    const mixedLayers = [
      { id: 'layer1', projections: { 'EPSG:4326': true }, visible: true },
      { id: 'layer2', projections: { 'EPSG:3413': true }, visible: false },
    ];
    const { container } = renderComponent({
      layers: mixedLayers,
      projId: 'EPSG:4326',
      collapsed: true,
      numVisible: 1,
    });
    expect(container.querySelector('.layer-group-title').textContent).toContain('(1/1)');
  });

  it('renders layer list without hidden class when not collapsed', () => {
    const { container } = renderComponent({ collapsed: false });
    expect(container.querySelector('.category')).not.toHaveClass('hidden');
  });

  it('renders layer list with hidden class when collapsed', () => {
    const { container } = renderComponent({ collapsed: true });
    expect(container.querySelector('.category')).toHaveClass('hidden');
  });

  it('renders a LayerRow for each layer', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layer-row-layer1')).toBeInTheDocument();
    expect(getByTestId('layer-row-layer2')).toBeInTheDocument();
  });

  it('passes compareState to LayerRow', () => {
    const { getByTestId } = renderComponent({ compareState: 'activeB' });
    expect(getByTestId('layer-row-layer1')).toHaveAttribute('data-compare-state', 'activeB');
  });

  it('passes isChartingActive to LayerRow', () => {
    const { getByTestId } = renderComponent({ isChartingActive: true });
    expect(getByTestId('layer-row-layer1')).toHaveAttribute('data-is-charting', 'true');
  });

  it('passes isDisabled based on available(id)', () => {
    const available = jest.fn((id) => id !== 'layer1');
    const { getByTestId } = renderComponent({ available });
    expect(getByTestId('layer-row-layer1')).toHaveAttribute('data-is-disabled', 'true');
    expect(getByTestId('layer-row-layer2')).toHaveAttribute('data-is-disabled', 'false');
  });

  it('passes isVisible from layer.visible', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('layer-row-layer1')).toHaveAttribute('data-is-visible', 'true');
    expect(getByTestId('layer-row-layer2')).toHaveAttribute('data-is-visible', 'false');
  });

  it('renders DndContext', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('dnd-context')).toBeInTheDocument();
  });

  it('renders collapse caret-down icon when not collapsed', () => {
    const { queryByTestId } = renderComponent({ collapsed: false });
    expect(queryByTestId('fa-icon-caret-down')).toBeInTheDocument();
  });

  it('renders collapse caret-left icon when collapsed', () => {
    const { queryByTestId } = renderComponent({ collapsed: true });
    expect(queryByTestId('fa-icon-caret-left')).toBeInTheDocument();
  });

  it('does not render collapse icon when isChartingActive is true', () => {
    const { queryByTestId } = renderComponent({ isChartingActive: true });
    expect(queryByTestId('fa-icon-caret-down')).not.toBeInTheDocument();
    expect(queryByTestId('fa-icon-caret-left')).not.toBeInTheDocument();
  });

  it('spreads dragHandleProps onto the header div', () => {
    const { container } = renderComponent({ dragHandleProps: { 'data-drag': 'handle' } });
    expect(container.querySelector('.layer-group-header')).toHaveAttribute('data-drag', 'handle');
  });
});

// ─── Layer sorting ────────────────────────────────────────────────────────────

describe('LayerList layer sorting', () => {
  const sortLayers = [
    { id: 'layerA', projections: { 'EPSG:4326': true }, visible: true, shouldHide: false },
    { id: 'layerB', projections: { 'EPSG:4326': true }, visible: false, shouldHide: true },
    { id: 'layerC', projections: { 'EPSG:4326': true }, visible: true, shouldHide: false },
  ];

  it('preserves layer order when isChartingActive is false', () => {
    const { getAllByTestId } = render(
      <LayerList {...defaultProps} layers={sortLayers} isChartingActive={false} />,
    );
    const ids = getAllByTestId(/^layer-row-/).map((el) => el.getAttribute('data-testid'));
    expect(ids).toEqual(['layer-row-layerA', 'layer-row-layerB', 'layer-row-layerC']);
  });

  it('sorts shouldHide=true layers to the end when isChartingActive is true', () => {
    const { getAllByTestId } = render(
      <LayerList {...defaultProps} layers={sortLayers} isChartingActive />,
    );
    const ids = getAllByTestId(/^layer-row-/).map((el) => el.getAttribute('data-testid'));
    expect(ids.indexOf('layer-row-layerB')).toBeGreaterThan(ids.indexOf('layer-row-layerA'));
    expect(ids.indexOf('layer-row-layerB')).toBeGreaterThan(ids.indexOf('layer-row-layerC'));
  });

  it('keeps equal shouldHide layers in original order when charting', () => {
    const equalLayers = [
      { id: 'layerX', projections: { 'EPSG:4326': true }, visible: true, shouldHide: false },
      { id: 'layerY', projections: { 'EPSG:4326': true }, visible: true, shouldHide: false },
    ];
    const { getAllByTestId } = render(
      <LayerList {...defaultProps} layers={equalLayers} isChartingActive />,
    );
    const ids = getAllByTestId(/^layer-row-/).map((el) => el.getAttribute('data-testid'));
    expect(ids[0]).toBe('layer-row-layerX');
    expect(ids[1]).toBe('layer-row-layerY');
  });
});

// ─── Dropdown visibility ──────────────────────────────────────────────────────

describe('LayerList dropdown visibility', () => {
  it('does not render dropdown before mouseEnter when isMobile is false', () => {
    const { queryByTestId } = renderComponent({ isMobile: false });
    expect(queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('renders dropdown after mouseEnter when not animating and not charting', () => {
    const { container, getByTestId } = renderComponent({ isMobile: false });
    fireEvent.mouseEnter(container.querySelector('.layer-group-header'));
    expect(getByTestId('dropdown')).toBeInTheDocument();
  });

  it('hides dropdown after mouseLeave', () => {
    const { container, queryByTestId } = renderComponent({ isMobile: false });
    const header = container.querySelector('.layer-group-header');
    fireEvent.mouseEnter(header);
    fireEvent.mouseLeave(header);
    expect(queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('always renders dropdown when isMobile is true', () => {
    const { queryByTestId } = renderComponent({ isMobile: true });
    expect(queryByTestId('dropdown')).toBeInTheDocument();
  });

  it('does not render dropdown when isAnimating even if isMobile', () => {
    const { queryByTestId } = renderComponent({ isMobile: true, isAnimating: true });
    expect(queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('does not render dropdown when isChartingActive even if isMobile', () => {
    const { queryByTestId } = renderComponent({ isMobile: true, isChartingActive: true });
    expect(queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('does not hide dropdown button on mouseLeave when menu is open', () => {
    const { container, getByTestId } = renderComponent({ isMobile: false });
    const header = container.querySelector('.layer-group-header');
    fireEvent.mouseEnter(header);
    fireEvent.click(getByTestId('dropdown-outer-toggle')); // open menu
    fireEvent.mouseLeave(header); // should not hide because menu is open
    expect(getByTestId('dropdown')).toBeInTheDocument();
  });

  it('hides dropdown button when menu is toggled closed', () => {
    const { container, queryByTestId, getByTestId } = renderComponent({ isMobile: false });
    const header = container.querySelector('.layer-group-header');
    fireEvent.mouseEnter(header);
    fireEvent.click(getByTestId('dropdown-outer-toggle')); // open
    fireEvent.click(getByTestId('dropdown-outer-toggle')); // close — also clears showDropdownBtn
    expect(queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('dropdown isOpen starts false', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(getByTestId('dropdown')).toHaveAttribute('data-is-open', 'false');
  });

  it('dropdown isOpen becomes true after toggle click', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    fireEvent.click(getByTestId('dropdown-outer-toggle'));
    expect(getByTestId('dropdown')).toHaveAttribute('data-is-open', 'true');
  });
});

// ─── Dropdown menu item actions ───────────────────────────────────────────────

describe('LayerList dropdown menu actions', () => {
  it('calls toggleVisibility with layer ids and true when Show All is clicked', () => {
    const toggleVisibility = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: true, toggleVisibility });
    fireEvent.click(getByTestId('dropdown-item-show-all'));
    expect(toggleVisibility).toHaveBeenCalledWith(['layer1', 'layer2'], true);
  });

  it('calls toggleVisibility with layer ids and false when Hide All is clicked', () => {
    const toggleVisibility = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: true, toggleVisibility });
    fireEvent.click(getByTestId('dropdown-item-hide-all'));
    expect(toggleVisibility).toHaveBeenCalledWith(['layer1', 'layer2'], false);
  });

  it('calls removeGroup with layer ids when Remove Group is clicked', () => {
    const removeGroup = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: true, removeGroup });
    fireEvent.click(getByTestId('dropdown-item-remove-group'));
    expect(removeGroup).toHaveBeenCalledWith(['layer1', 'layer2']);
  });

  it('passes correct groupLayerIds when layers change', () => {
    const toggleVisibility = jest.fn();
    const extraLayers = [
      ...defaultLayers,
      { id: 'layer3', projections: { 'EPSG:4326': true }, visible: true },
    ];
    const { getByTestId } = renderComponent({
      isMobile: true,
      layers: extraLayers,
      toggleVisibility,
    });
    fireEvent.click(getByTestId('dropdown-item-show-all'));
    expect(toggleVisibility).toHaveBeenCalledWith(['layer1', 'layer2', 'layer3'], true);
  });
});

// ─── Collapse/expand ──────────────────────────────────────────────────────────

describe('LayerList collapse interactions', () => {
  it('calls toggleCollapse with groupId and true when not collapsed', () => {
    const toggleCollapse = jest.fn();
    const { getByTestId } = renderComponent({ toggleCollapse, collapsed: false });
    fireEvent.click(getByTestId('fa-icon-caret-down'));
    expect(toggleCollapse).toHaveBeenCalledWith('group1', true);
  });

  it('calls toggleCollapse with groupId and false when collapsed', () => {
    const toggleCollapse = jest.fn();
    const { getByTestId } = renderComponent({ toggleCollapse, collapsed: true });
    fireEvent.click(getByTestId('fa-icon-caret-left'));
    expect(toggleCollapse).toHaveBeenCalledWith('group1', false);
  });
});

// ─── stopDndActivation ────────────────────────────────────────────────────────

describe('LayerList stopDndActivation', () => {
  it('does not throw when pointer events fire on dropdown toggle', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(() => {
      fireEvent.pointerDown(getByTestId('dropdown-toggle'));
      fireEvent.mouseDown(getByTestId('dropdown-toggle'));
    }).not.toThrow();
  });

  it('does not throw when pointer events fire on dropdown menu', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(() => {
      fireEvent.pointerDown(getByTestId('dropdown-menu'));
      fireEvent.mouseDown(getByTestId('dropdown-menu'));
    }).not.toThrow();
  });

  it('does not throw when pointer events fire on dropdown items', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(() => {
      fireEvent.pointerDown(getByTestId('dropdown-item-show-all'));
    }).not.toThrow();
  });

  it('does not throw when pointer events fire on collapse icon', () => {
    const { getByTestId } = renderComponent();
    expect(() => {
      fireEvent.pointerDown(getByTestId('fa-icon-caret-down'));
      fireEvent.mouseDown(getByTestId('fa-icon-caret-down'));
    }).not.toThrow();
  });
});

// ─── DnD onDragEnd ────────────────────────────────────────────────────────────

describe('LayerList onDragEnd', () => {
  it('returns early when over is null', () => {
    const reorderLayers = jest.fn();
    renderComponent({ reorderLayers });
    global.__capturedOnDragEnd({ active: { id: 'layer1-active' }, over: null });
    expect(reorderLayers).not.toHaveBeenCalled();
  });

  it('returns early when active.id equals over.id', () => {
    const reorderLayers = jest.fn();
    renderComponent({ reorderLayers });
    global.__capturedOnDragEnd({
      active: { id: 'layer1-active' },
      over: { id: 'layer1-active' },
    });
    expect(reorderLayers).not.toHaveBeenCalled();
  });

  it('returns early when active.id is not found in sortableLayerIds', () => {
    const reorderLayers = jest.fn();
    renderComponent({ reorderLayers });
    global.__capturedOnDragEnd({
      active: { id: 'nonexistent-active' },
      over: { id: 'layer2-active' },
    });
    expect(reorderLayers).not.toHaveBeenCalled();
  });

  it('calls replaceSubGroup and reorderLayers on valid drag', () => {
    const reorderLayers = jest.fn();
    renderComponent({ reorderLayers });
    global.__capturedOnDragEnd({
      active: { id: 'layer1-active' },
      over: { id: 'layer2-active' },
    });
    expect(replaceSubGroup).toHaveBeenCalled();
    expect(reorderLayers).toHaveBeenCalledTimes(1);
  });

  it('strips compareState suffix from active.id when calling replaceSubGroup', () => {
    const reorderLayers = jest.fn();
    renderComponent({ reorderLayers, compareState: 'active' });
    global.__capturedOnDragEnd({
      active: { id: 'layer1-active' },
      over: { id: 'layer2-active' },
    });
    const [layerId] = replaceSubGroup.mock.calls[0];
    expect(layerId).toBe('layer1');
  });

  it('passes null as nextLayerId when dragged to last position', () => {
    const reorderLayers = jest.fn();
    // 2 layers: move layer1 (idx 0) to layer2 (idx 1) → destination is last, nextLayerId = null
    renderComponent({ reorderLayers });
    global.__capturedOnDragEnd({
      active: { id: 'layer1-active' },
      over: { id: 'layer2-active' },
    });
    const [, nextLayerId] = replaceSubGroup.mock.calls[0];
    expect(nextLayerId).toBeNull();
  });

  it('passes nextLayerId when dragged to non-last position', () => {
    const threeLayers = [
      { id: 'layer1', projections: { 'EPSG:4326': true }, visible: true },
      { id: 'layer2', projections: { 'EPSG:4326': true }, visible: true },
      { id: 'layer3', projections: { 'EPSG:4326': true }, visible: false },
    ];
    const reorderLayers = jest.fn();
    render(<LayerList {...defaultProps} layers={threeLayers} reorderLayers={reorderLayers} />);
    // Move layer1 (idx 0) to layer2 (idx 1):
    // arrayMove([l1,l2,l3], 0, 1) = [l2,l1,l3]; destination=1, nextIndex=2, nextLayerId='layer3'
    global.__capturedOnDragEnd({
      active: { id: 'layer1-active' },
      over: { id: 'layer2-active' },
    });
    expect(replaceSubGroup).toHaveBeenCalled();
    const [, nextLayerId] = replaceSubGroup.mock.calls[0];
    expect(nextLayerId).toBe('layer3');
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    embed: { isEmbedModeActive: false },
    proj: { id: 'EPSG:4326' },
    config: { layers: {} },
    map: { ui: { selected: null } },
    animation: { isPlaying: false },
    screenSize: { isMobileDevice: false },
    charting: { active: false, activeLayer: null },
    ...overrides,
  });

  it('maps projId from proj.id', () => {
    const state = makeState({ proj: { id: 'EPSG:3413' } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.projId).toBe('EPSG:3413');
  });

  it('maps isAnimating from animation.isPlaying', () => {
    const state = makeState({ animation: { isPlaying: true } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.isAnimating).toBe(true);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({ screenSize: { isMobileDevice: true } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.isMobile).toBe(true);
  });

  it('maps isChartingActive from charting.active', () => {
    const state = makeState({ charting: { active: true, activeLayer: null } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.isChartingActive).toBe(true);
  });

  it('maps activeChartingLayer from charting.activeLayer', () => {
    const state = makeState({ charting: { active: false, activeLayer: 'layer2' } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.activeChartingLayer).toBe('layer2');
  });

  it('maps isEmbedModeActive from embed.isEmbedModeActive', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.isEmbedModeActive).toBe(true);
  });

  it('maps zots to empty object when map.ui.selected is null', () => {
    const state = makeState({ map: { ui: { selected: null } } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.zots).toEqual({});
    expect(getZotsForActiveLayers).not.toHaveBeenCalled();
  });

  it('calls getZotsForActiveLayers and maps zots when map.ui.selected is truthy', () => {
    const state = makeState({ map: { ui: { selected: {} } } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(getZotsForActiveLayers).toHaveBeenCalledWith(state);
    expect(result.zots).toEqual({ layer1: 'zot-data' });
  });

  it('filters Reference layers from activeLayers when isEmbedModeActive', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.activeLayers.every((l) => l.layergroup !== 'Reference')).toBe(true);
    expect(result.activeLayers.some((l) => l.layergroup === 'Overlays')).toBe(true);
  });

  it('includes all activeLayers including Reference when not in embed mode', () => {
    const state = makeState({ embed: { isEmbedModeActive: false } });
    const result = capturedMapStateToProps(state, { layers: [] });
    expect(result.activeLayers).toHaveLength(2);
    expect(result.activeLayers.some((l) => l.layergroup === 'Reference')).toBe(true);
  });

  it('calculates numVisible from visible layers in ownProps.layers', () => {
    const state = makeState();
    const ownLayers = [{ visible: true }, { visible: true }, { visible: false }];
    const result = capturedMapStateToProps(state, { layers: ownLayers });
    expect(result.numVisible).toBe(2);
  });

  it('numVisible is 0 when ownProps.layers is undefined', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, {});
    expect(result.numVisible).toBe(0);
  });

  it('getNames calls getTitles with config, layerId, and projId', () => {
    const state = makeState({ proj: { id: 'EPSG:4326' }, config: { layers: {} } });
    const result = capturedMapStateToProps(state, { layers: [] });
    result.getNames('layer1');
    expect(getTitles).toHaveBeenCalledWith(state.config, 'layer1', 'EPSG:4326');
  });

  it('available calls memoizedAvailable(state) then result with layerId', () => {
    const mockFn = jest.fn(() => true);
    memoizedAvailable.mockReturnValue(mockFn);
    const state = makeState();
    const result = capturedMapStateToProps(state, { layers: [] });
    result.available('layer1');
    expect(memoizedAvailable).toHaveBeenCalledWith(state);
    expect(mockFn).toHaveBeenCalledWith('layer1');
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

  it('reorderLayers dispatches reorderLayersAction with new layer array', () => {
    const newLayers = [{ id: 'layer2' }, { id: 'layer1' }];
    mapped.reorderLayers(newLayers);
    expect(reorderLayersAction).toHaveBeenCalledWith(newLayers);
    expect(dispatch).toHaveBeenCalledWith({ type: 'REORDER_LAYERS' });
  });

  it('removeGroup dispatches removeGroupAction with layer ids', () => {
    const layerIds = ['layer1', 'layer2'];
    mapped.removeGroup(layerIds);
    expect(removeGroupAction).toHaveBeenCalledWith(layerIds);
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_GROUP' });
  });

  it('toggleVisibility dispatches toggleGroupVisibilityAction with layerIds and visible', () => {
    const layerIds = ['layer1', 'layer2'];
    mapped.toggleVisibility(layerIds, false);
    expect(toggleGroupVisibilityAction).toHaveBeenCalledWith(layerIds, false);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_GROUP_VISIBILITY' });
  });
});
