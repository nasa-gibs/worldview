/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    setActivatorNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

jest.mock('@fortawesome/free-solid-svg-icons', () => ({
  faCircleDot: 'faCircleDot',
  faCircle: 'faCircle',
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }) => {
    const React = require('react');
    const iconStr = Array.isArray(icon) ? icon.join('-') : String(icon);
    return React.createElement('span', { 'data-testid': `fa-${iconStr}`, className });
  },
}));

jest.mock('reactstrap', () => {
  const React = require('react');
  return {
    UncontrolledTooltip: ({ children }) => React.createElement('div', { 'data-testid': 'tooltip' }, children),
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
    DropdownMenu: ({ children }) => React.createElement('div', { 'data-testid': 'dropdown-menu' }, children),
    DropdownItem: ({
      children, id, onClick, onPointerDown, onMouseDown,
    }) => React.createElement(
      'button',
      {
        'data-testid': `dropdown-item-${id}`,
        id,
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

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));

jest.mock('../../components/sidebar/paletteLegend', () => function MockPaletteLegend({ layer }) {
  const React = require('react');
  return React.createElement('div', { 'data-testid': `palette-legend-${layer.id}` });
});

jest.mock('../../util/util', () => ({
  encodeId: jest.fn((id) => id),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    trigger: jest.fn(),
  },
}));

jest.mock('../../util/cmr', () => ({
  buildGranulesUrl: jest.fn(() => 'http://mock-cmr'),
  cmrFetch: jest.fn(() => Promise.resolve({ ok: false })),
}));

jest.mock('lodash', () => ({
  isEmpty: jest.fn((val) => !val || (typeof val === 'object' && Object.keys(val).length === 0)),
  get: jest.fn((obj, path) => {
    if (!obj || !path) return undefined;
    try {
      return path.split('.').reduce(
        (acc, key) => (acc !== null && acc !== undefined ? acc[key] : undefined),
        obj,
      );
    } catch {
      return undefined;
    }
  }),
}));

jest.mock('../../modules/palettes/selectors', () => ({
  getPalette: jest.fn(() => ({})),
  getPaletteLegends: jest.fn(() => []),
}));

jest.mock('../../modules/modal/actions', () => ({
  toggleCustomContent: jest.fn(() => ({ type: 'TOGGLE_CUSTOM_CONTENT' })),
  openCustomContent: jest.fn(() => ({ type: 'OPEN_CUSTOM_CONTENT' })),
}));

jest.mock('../../components/layer/info/info', () => function MockLayerInfo() { return null; });
jest.mock('../../components/layer/settings/layer-settings', () => function MockLayerSettings() { return null; });

jest.mock('../../modules/palettes/actions', () => ({
  requestPalette: jest.fn(() => ({ type: 'REQUEST_PALETTE' })),
}));

jest.mock('../../modules/layers/actions', () => ({
  toggleVisibility: jest.fn(() => ({ type: 'TOGGLE_VISIBILITY' })),
  removeLayer: jest.fn(() => ({ type: 'REMOVE_LAYER' })),
}));

jest.mock('./orbit-track', () => function MockOrbitTrack({ trackLayer }) {
  const React = require('react');
  return React.createElement('div', { 'data-testid': `orbit-track-${trackLayer.id}` });
});

jest.mock('./zot', () => function MockZot({ zot }) {
  const React = require('react');
  return React.createElement('div', { 'data-testid': 'zot', 'data-has-zot': String(!!zot) });
});

jest.mock('../../modules/layers/util', () => ({
  isVectorLayerClickable: jest.fn(() => false),
}));

jest.mock('../../modules/alerts/constants', () => ({
  MODAL_PROPERTIES: {
    vectorModalProps: { id: 'vector-modal', props: {} },
    granuleModalProps: { id: 'granule-modal', props: {} },
    zoomModalProps: { id: 'zoom-modal', props: {} },
  },
}));

jest.mock('../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => []),
  makeGetDescription: jest.fn(() => jest.fn(() => 'mock-description-path')),
  getCollections: jest.fn(() => null),
}));

jest.mock('../../mapUI/components/kiosk/tile-measurement/utils/date-util', () => ({
  formatDailyDate: jest.fn(() => '2021-01-01'),
  formatSubdailyDate: jest.fn(() => '2021-01-01T00:00:00'),
}));

jest.mock('../../modules/date/util', () => ({
  coverageDateFormatter: jest.fn((type, date) => String(date)),
}));

jest.mock('../../modules/charting/actions', () => ({
  updateActiveChartingLayerAction: jest.fn(() => ({ type: 'UPDATE_ACTIVE_CHARTING_LAYER' })),
}));

jest.mock('../../components/util/alert', () => function MockAlertUtil({
  id, onDismiss, onClick,
}) {
  const React = require('react');
  return React.createElement(
    'div',
    { 'data-testid': `alert-${id}` },
    React.createElement('button', { 'data-testid': `alert-dismiss-${id}`, onClick: onDismiss }),
    React.createElement('button', { 'data-testid': `alert-action-${id}`, onClick }),
  );
});

jest.mock('../../modules/alerts/actions', () => ({
  enableDDVZoomAlert: jest.fn(() => ({ type: 'ENABLE_DDV_ZOOM_ALERT' })),
  enableDDVLocationAlert: jest.fn(() => ({ type: 'ENABLE_DDV_LOCATION_ALERT' })),
  disableDDVLocationAlert: jest.fn(() => ({ type: 'DISABLE_DDV_LOCATION_ALERT' })),
  disableDDVZoomAlert: jest.fn(() => ({ type: 'DISABLE_DDV_ZOOM_ALERT' })),
}));

import LayerRow from './layer-row';
import { toggleVisibility as toggleVisibilityAction, removeLayer as removeLayerAction } from '../../modules/layers/actions';
import { toggleCustomContent, openCustomContent } from '../../modules/modal/actions';
import { updateActiveChartingLayerAction } from '../../modules/charting/actions';
import { requestPalette as requestPaletteAction } from '../../modules/palettes/actions';
import util from '../../util/util';
import {
  enableDDVZoomAlert as enableDDVZoomAlertAction,
  enableDDVLocationAlert as enableDDVLocationAlertAction,
  disableDDVLocationAlert as disableDDVLocationAlertAction,
  disableDDVZoomAlert as disableDDVZoomAlertAction,
} from '../../modules/alerts/actions';

let capturedMakeMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMakeMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
  util.encodeId.mockImplementation((id) => id);
  const { useSortable } = jest.requireMock('@dnd-kit/sortable');
  useSortable.mockReturnValue({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    setActivatorNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  });
});

const defaultLayer = {
  id: 'layer1',
  title: 'Test Layer',
  subtitle: 'Subtitle',
  type: 'wms',
  palette: {},
};

const defaultProps = {
  compare: { active: false, activeString: 'active' },
  layer: defaultLayer,
  compareState: 'active',
  collections: null,
  ddvLocationAlerts: [],
  ddvZoomAlerts: [],
  paletteLegends: [],
  getPalette: jest.fn(() => ({})),
  palette: { id: 'palette1' },
  renderedPalette: {},
  requestPalette: jest.fn(),
  globalTemperatureUnit: 'K',
  isCustomPalette: false,
  isDistractionFreeModeActive: false,
  isEmbedModeActive: false,
  isLoading: false,
  isMobile: false,
  zot: null,
  names: { title: 'Test Layer', subtitle: 'Subtitle' },
  onRemoveClick: jest.fn(),
  onInfoClick: jest.fn(),
  onOptionsClick: jest.fn(),
  hasClickableFeature: false,
  openVectorAlertModal: jest.fn(),
  openGranuleAlertModal: jest.fn(),
  openZoomAlertModal: jest.fn(),
  toggleVisibility: jest.fn(),
  isDisabled: false,
  isVisible: true,
  hasPalette: false,
  isInProjection: true,
  tracksForLayer: [],
  isVectorLayer: false,
  isChartableLayer: false,
  measurementDescriptionPath: 'description-path',
  isAnimating: false,
  palettes: { rendered: {}, custom: {}, isLoading: {} },
  isChartingActive: false,
  activeChartingLayer: null,
  updateActiveChartingLayer: jest.fn(),
  enableDDVZoomAlert: jest.fn(),
  enableDDVLocationAlert: jest.fn(),
  disableDDVLocationAlert: jest.fn(),
  disableDDVZoomAlert: jest.fn(),
  map: { extent: [-180, -90, 180, 90] },
  selectedDate: new Date('2021-01-01'),
  describeDomainsUrl: 'https://example.com',
  cmrBaseUrl: 'https://cmr.earthdata.nasa.gov',
};

const renderComponent = (propOverrides = {}) => render(
  <LayerRow {...defaultProps} {...propOverrides} />,
);

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('LayerRow rendering', () => {
  it('renders li with correct id when isInProjection', () => {
    const { container } = renderComponent();
    const li = container.querySelector('li');
    expect(li).toBeInTheDocument();
    expect(li.id).toBe('active-layer1');
  });

  it('renders placeholder li when not isInProjection', () => {
    const { container } = renderComponent({ isInProjection: false });
    expect(container.querySelector('li')).toHaveClass('layer-list-placeholder');
  });

  it('renders layer title in h4', () => {
    const { getByText } = renderComponent();
    expect(getByText('Test Layer')).toBeInTheDocument();
  });

  it('renders subtitle paragraph', () => {
    const { container } = renderComponent();
    const p = container.querySelector('p');
    expect(p).toBeInTheDocument();
    expect(p.innerHTML).toBe('Subtitle');
  });

  it('renders Zot component', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('zot')).toBeInTheDocument();
  });

  it('renders visibility button when not embedded and not charting', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.visibility')).toBeInTheDocument();
  });

  it('does not render visibility button when isEmbedModeActive', () => {
    const { container } = renderComponent({ isEmbedModeActive: true });
    expect(container.querySelector('.visibility')).not.toBeInTheDocument();
  });

  it('hides controls when not hovering and not isMobile', () => {
    const { queryByLabelText } = renderComponent({ isMobile: false });
    expect(queryByLabelText('View Options')).not.toBeInTheDocument();
  });

  it('shows dropdown when isMobile', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(getByTestId('dropdown')).toBeInTheDocument();
  });

  it('hides subtitle when layer.shouldHide', () => {
    const { queryByText } = renderComponent({ layer: { ...defaultLayer, shouldHide: true } });
    expect(queryByText('Subtitle')).not.toBeInTheDocument();
  });

  it('uses wv-vector-layer class when isVectorLayer', () => {
    const { container } = renderComponent({ isVectorLayer: true });
    expect(container.querySelector('.wv-vector-layer')).toBeInTheDocument();
  });
});

// ─── Layer item classes ────────────────────────────────────────────────────────

describe('getLayerItemClasses', () => {
  it('layer-visible when isVisible and not disabled', () => {
    const { container } = renderComponent({ isVisible: true });
    expect(container.querySelector('li')).toHaveClass('layer-visible');
  });

  it('layer-hidden when isVisible is false', () => {
    const { container } = renderComponent({ isVisible: false });
    expect(container.querySelector('li')).toHaveClass('layer-hidden');
  });

  it('layer-hidden when isDisabled', () => {
    const { container } = renderComponent({ isDisabled: true });
    expect(container.querySelector('li')).toHaveClass('layer-hidden');
  });

  it('layer-hidden and mini when layer.shouldHide', () => {
    const { container } = renderComponent({ layer: { ...defaultLayer, shouldHide: true } });
    const li = container.querySelector('li');
    expect(li).toHaveClass('layer-hidden');
    expect(li).toHaveClass('mini');
  });

  it('disabled class when isAnimating', () => {
    const { container } = renderComponent({ isAnimating: true });
    expect(container.querySelector('li')).toHaveClass('disabled');
  });

  it('zotted class when zot provided', () => {
    const { container } = renderComponent({ zot: { underZoomValue: 0 } });
    expect(container.querySelector('li')).toHaveClass('zotted');
  });
});

// ─── Visibility toggle ─────────────────────────────────────────────────────────

describe('Visibility toggle', () => {
  it('has layer-visible class when visible and not disabled', () => {
    const { container } = renderComponent({ isVisible: true });
    expect(container.querySelector('.visibility')).toHaveClass('layer-visible');
  });

  it('has layer-hidden class when isVisible is false', () => {
    const { container } = renderComponent({ isVisible: false });
    expect(container.querySelector('.visibility')).toHaveClass('layer-hidden');
  });

  it('has disabled class when isDisabled', () => {
    const { container } = renderComponent({ isDisabled: true });
    expect(container.querySelector('.visibility')).toHaveClass('disabled');
  });

  it('has disabled class when layer.shouldHide', () => {
    const { container } = renderComponent({ layer: { ...defaultLayer, shouldHide: true } });
    expect(container.querySelector('.visibility')).toHaveClass('disabled');
  });

  it('calls toggleVisibility on click when not disabled or animating', () => {
    const toggleVisibility = jest.fn();
    const { container } = renderComponent({ toggleVisibility, isVisible: true });
    fireEvent.click(container.querySelector('.visibility'));
    expect(toggleVisibility).toHaveBeenCalledWith('layer1', false);
  });

  it('does not call toggleVisibility when isAnimating', () => {
    const toggleVisibility = jest.fn();
    const { container } = renderComponent({ isAnimating: true, toggleVisibility });
    fireEvent.click(container.querySelector('.visibility'));
    expect(toggleVisibility).not.toHaveBeenCalled();
  });

  it('does not call toggleVisibility when isDisabled', () => {
    const toggleVisibility = jest.fn();
    const { container } = renderComponent({ isDisabled: true, toggleVisibility });
    fireEvent.click(container.querySelector('.visibility'));
    expect(toggleVisibility).not.toHaveBeenCalled();
  });

  it('shows Hide layer tooltip when visible and not disabled', () => {
    const { getAllByTestId } = renderComponent({ isVisible: true });
    const tooltips = getAllByTestId('tooltip');
    expect(tooltips.some((t) => t.textContent === 'Hide layer')).toBe(true);
  });

  it('shows Show layer tooltip when not visible and not disabled', () => {
    const { getAllByTestId } = renderComponent({ isVisible: false, isDisabled: false });
    const tooltips = getAllByTestId('tooltip');
    expect(tooltips.some((t) => t.textContent === 'Show layer')).toBe(true);
  });
});

// ─── getDisabledTitle ──────────────────────────────────────────────────────────

describe('getDisabledTitle', () => {
  it('shows No data message when layer has no dates', () => {
    const { getAllByTestId } = renderComponent({ isDisabled: true });
    const tooltips = getAllByTestId('tooltip');
    expect(tooltips.some((t) => t.textContent.includes('No data on selected date'))).toBe(true);
  });

  it('shows both dates when layer has startDate and endDate', () => {
    const { getAllByTestId } = renderComponent({
      isDisabled: true,
      layer: { ...defaultLayer, startDate: '2020-01-01', endDate: '2021-12-31', period: 'daily' },
    });
    const tooltips = getAllByTestId('tooltip');
    expect(tooltips.some((t) => t.textContent.includes('2020-01-01'))).toBe(true);
    expect(tooltips.some((t) => t.textContent.includes('2021-12-31'))).toBe(true);
  });

  it('shows Present when only startDate present', () => {
    const { getAllByTestId } = renderComponent({
      isDisabled: true,
      layer: { ...defaultLayer, startDate: '2020-01-01', period: 'daily' },
    });
    const tooltips = getAllByTestId('tooltip');
    expect(tooltips.some((t) => t.textContent.includes('Present'))).toBe(true);
  });
});

// ─── Mouse interactions ────────────────────────────────────────────────────────

describe('Mouse interactions', () => {
  it('shows controls on mouseOver', () => {
    const { container, getByLabelText } = renderComponent({ isMobile: false });
    fireEvent.mouseOver(container.querySelector('li'));
    expect(getByLabelText('View Options')).toBeInTheDocument();
  });

  it('hides controls on mouseLeave', () => {
    const { container, queryByLabelText } = renderComponent({ isMobile: false });
    fireEvent.mouseOver(container.querySelector('li'));
    fireEvent.mouseLeave(container.querySelector('li'));
    expect(queryByLabelText('View Options')).not.toBeInTheDocument();
  });

  it('triggers SIDEBAR_LAYER_HOVER true on mouseOver', () => {
    const { container } = renderComponent();
    fireEvent.mouseOver(container.querySelector('li'));
    expect(util.events.trigger).toHaveBeenCalledWith('sidebar:layer-hover', 'layer1', true);
  });

  it('triggers SIDEBAR_LAYER_HOVER false on mouseLeave', () => {
    const { container } = renderComponent();
    fireEvent.mouseOver(container.querySelector('li'));
    fireEvent.mouseLeave(container.querySelector('li'));
    expect(util.events.trigger).toHaveBeenCalledWith('sidebar:layer-hover', 'layer1', false);
  });

  it('does not trigger events on mouseOver when isMobile', () => {
    const { container } = renderComponent({ isMobile: true });
    util.events.trigger.mockClear();
    fireEvent.mouseOver(container.querySelector('li'));
    expect(util.events.trigger).not.toHaveBeenCalled();
  });

  it('does not trigger events on mouseLeave when isMobile', () => {
    const { container } = renderComponent({ isMobile: true });
    util.events.trigger.mockClear();
    fireEvent.mouseLeave(container.querySelector('li'));
    expect(util.events.trigger).not.toHaveBeenCalled();
  });
});

// ─── Controls ─────────────────────────────────────────────────────────────────

describe('Controls', () => {
  it('renders remove, options, info buttons on hover', () => {
    const { container, getByLabelText } = renderComponent({ isMobile: false });
    fireEvent.mouseOver(container.querySelector('li'));
    expect(getByLabelText('Remove Layer')).toBeInTheDocument();
    expect(getByLabelText('View Options')).toBeInTheDocument();
    expect(getByLabelText('View Description')).toBeInTheDocument();
  });

  it('does not render remove button when isChartingActive', () => {
    const { container, queryByLabelText } = renderComponent({ isChartingActive: true });
    fireEvent.mouseOver(container.querySelector('li'));
    expect(queryByLabelText('Remove Layer')).not.toBeInTheDocument();
  });

  it('does not render controls when isAnimating', () => {
    const { container, queryByLabelText } = renderComponent({ isAnimating: true });
    fireEvent.mouseOver(container.querySelector('li'));
    expect(queryByLabelText('View Options')).not.toBeInTheDocument();
  });

  it('calls onOptionsClick with correct args', () => {
    const onOptionsClick = jest.fn();
    const { container, getByLabelText } = renderComponent({ isMobile: false, onOptionsClick });
    fireEvent.mouseOver(container.querySelector('li'));
    fireEvent.click(getByLabelText('View Options'));
    expect(onOptionsClick).toHaveBeenCalledWith(defaultLayer, 'Test Layer', null);
  });

  it('calls onInfoClick with correct args', () => {
    const onInfoClick = jest.fn();
    const { container, getByLabelText } = renderComponent({ isMobile: false, onInfoClick });
    fireEvent.mouseOver(container.querySelector('li'));
    fireEvent.click(getByLabelText('View Description'));
    expect(onInfoClick).toHaveBeenCalledWith(defaultLayer, 'Test Layer', 'description-path', 'https://example.com');
  });
});

// ─── removeLayer ──────────────────────────────────────────────────────────────

describe('removeLayer', () => {
  it('calls onRemoveClick with layer.id on remove click', () => {
    const onRemoveClick = jest.fn();
    const { container, getByLabelText } = renderComponent({ onRemoveClick });
    fireEvent.mouseOver(container.querySelector('li'));
    fireEvent.click(getByLabelText('Remove Layer'));
    expect(onRemoveClick).toHaveBeenCalledWith('layer1');
  });

  it('calls disableDDVLocationAlert when layer title is in ddvLocationAlerts', () => {
    const disableDDVLocationAlert = jest.fn();
    const { container, getByLabelText } = renderComponent({
      disableDDVLocationAlert,
      ddvLocationAlerts: ['Test Layer'],
    });
    fireEvent.mouseOver(container.querySelector('li'));
    fireEvent.click(getByLabelText('Remove Layer'));
    expect(disableDDVLocationAlert).toHaveBeenCalledWith('Test Layer');
  });

  it('calls disableDDVZoomAlert when layer title is in ddvZoomAlerts', () => {
    const disableDDVZoomAlert = jest.fn();
    const { container, getByLabelText } = renderComponent({
      disableDDVZoomAlert,
      ddvZoomAlerts: ['Test Layer'],
    });
    fireEvent.mouseOver(container.querySelector('li'));
    fireEvent.click(getByLabelText('Remove Layer'));
    expect(disableDDVZoomAlert).toHaveBeenCalledWith('Test Layer');
  });
});

// ─── Dropdown menu ─────────────────────────────────────────────────────────────

describe('Dropdown menu (isMobile)', () => {
  it('toggles dropdown open on toggle click', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(getByTestId('dropdown')).toHaveAttribute('data-is-open', 'false');
    fireEvent.click(getByTestId('dropdown-outer-toggle'));
    expect(getByTestId('dropdown')).toHaveAttribute('data-is-open', 'true');
  });

  it('calls onInfoClick from dropdown info item', () => {
    const onInfoClick = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: true, onInfoClick });
    fireEvent.click(getByTestId('dropdown-item-layer-info-btn-layer1'));
    expect(onInfoClick).toHaveBeenCalledWith(defaultLayer, 'Test Layer', 'description-path', 'https://example.com');
  });

  it('calls onOptionsClick from dropdown options item', () => {
    const onOptionsClick = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: true, onOptionsClick });
    fireEvent.click(getByTestId('dropdown-item-layer-options-btn-layer1'));
    expect(onOptionsClick).toHaveBeenCalledWith(defaultLayer, 'Test Layer', null);
  });

  it('calls onRemoveClick from dropdown remove item', () => {
    const onRemoveClick = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: true, onRemoveClick });
    fireEvent.click(getByTestId('dropdown-item-close-activelayer1'));
    expect(onRemoveClick).toHaveBeenCalledWith('layer1');
  });

  it('closes dropdown on second toggle', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    fireEvent.click(getByTestId('dropdown-outer-toggle'));
    fireEvent.click(getByTestId('dropdown-outer-toggle'));
    expect(getByTestId('dropdown')).toHaveAttribute('data-is-open', 'false');
  });
});

// ─── Charting mode ────────────────────────────────────────────────────────────

describe('Charting mode', () => {
  it('renders radio button when isChartingActive and layer not shouldHide', () => {
    const { container } = renderComponent({ isChartingActive: true });
    expect(container.querySelector('[role="radio"]')).toBeInTheDocument();
  });

  it('radio button has active-chart class when layer matches activeChartingLayer', () => {
    const { container } = renderComponent({ isChartingActive: true, activeChartingLayer: 'layer1' });
    const radio = container.querySelector('[role="radio"]');
    expect(radio).toHaveClass('active-chart');
    expect(radio).toHaveAttribute('aria-checked', 'true');
  });

  it('radio button does not have active-chart for non-active layer', () => {
    const { container } = renderComponent({ isChartingActive: true, activeChartingLayer: 'other' });
    const radio = container.querySelector('[role="radio"]');
    expect(radio).not.toHaveClass('active-chart');
    expect(radio).toHaveAttribute('aria-checked', 'false');
  });

  it('calls updateActiveChartingLayer on radio click when not already active', () => {
    const updateActiveChartingLayer = jest.fn();
    const { container } = renderComponent({
      isChartingActive: true,
      activeChartingLayer: 'other',
      updateActiveChartingLayer,
    });
    fireEvent.click(container.querySelector('[role="radio"]'));
    expect(updateActiveChartingLayer).toHaveBeenCalledWith('layer1');
  });

  it('does not call updateActiveChartingLayer when layer already active', () => {
    const updateActiveChartingLayer = jest.fn();
    const { container } = renderComponent({
      isChartingActive: true,
      activeChartingLayer: 'layer1',
      updateActiveChartingLayer,
    });
    fireEvent.click(container.querySelector('[role="radio"]'));
    expect(updateActiveChartingLayer).not.toHaveBeenCalled();
  });

  it('calls updateActiveChartingLayer on Enter keydown', () => {
    const updateActiveChartingLayer = jest.fn();
    const { container } = renderComponent({
      isChartingActive: true,
      activeChartingLayer: 'other',
      updateActiveChartingLayer,
    });
    fireEvent.keyDown(container.querySelector('[role="radio"]'), { key: 'Enter' });
    expect(updateActiveChartingLayer).toHaveBeenCalledWith('layer1');
  });

  it('does not call updateActiveChartingLayer on non-Enter keydown', () => {
    const updateActiveChartingLayer = jest.fn();
    const { container } = renderComponent({
      isChartingActive: true,
      activeChartingLayer: 'other',
      updateActiveChartingLayer,
    });
    fireEvent.keyDown(container.querySelector('[role="radio"]'), { key: 'Space' });
    expect(updateActiveChartingLayer).not.toHaveBeenCalled();
  });

  it('renders visibility-class anchor when shouldHide and isChartingActive', () => {
    const { container } = renderComponent({
      isChartingActive: true,
      layer: { ...defaultLayer, shouldHide: true },
    });
    expect(container.querySelector('a.visibility')).toBeInTheDocument();
  });

  it('renders faCircleDot when layer is active charting layer', () => {
    const { getByTestId } = renderComponent({ isChartingActive: true, activeChartingLayer: 'layer1' });
    expect(getByTestId('fa-faCircleDot')).toBeInTheDocument();
  });

  it('renders faCircle when layer is not active charting layer', () => {
    const { getByTestId } = renderComponent({ isChartingActive: true, activeChartingLayer: 'other' });
    expect(getByTestId('fa-faCircle')).toBeInTheDocument();
  });
});

// ─── Vector layer icon ────────────────────────────────────────────────────────

describe('Vector layer icon', () => {
  it('renders when isVectorLayer and isVisible', () => {
    const { container } = renderComponent({ isVectorLayer: true, isVisible: true });
    expect(container.querySelector('.layer-pointer-icon')).toBeInTheDocument();
  });

  it('does not render when isVisible is false', () => {
    const { container } = renderComponent({ isVectorLayer: true, isVisible: false });
    expect(container.querySelector('.layer-pointer-icon')).not.toBeInTheDocument();
  });

  it('has disabled class when hasClickableFeature is false', () => {
    const { container } = renderComponent({
      isVectorLayer: true,
      isVisible: true,
      hasClickableFeature: false,
    });
    expect(container.querySelector('.layer-pointer-icon')).toHaveClass('disabled');
  });

  it('does not have disabled class when hasClickableFeature is true', () => {
    const { container } = renderComponent({
      isVectorLayer: true,
      isVisible: true,
      hasClickableFeature: true,
    });
    expect(container.querySelector('.layer-pointer-icon')).not.toHaveClass('disabled');
  });

  it('calls openVectorAlertModal on click', () => {
    const openVectorAlertModal = jest.fn();
    const { container } = renderComponent({
      isVectorLayer: true,
      isVisible: true,
      openVectorAlertModal,
    });
    fireEvent.click(container.querySelector('.layer-pointer-icon'));
    expect(openVectorAlertModal).toHaveBeenCalled();
  });
});

// ─── Chartable icon ───────────────────────────────────────────────────────────

describe('Chartable layer icon', () => {
  it('renders when isChartableLayer, isVisible, and not isChartingActive', () => {
    const { container } = renderComponent({ isChartableLayer: true, isVisible: true });
    expect(container.querySelector('.layer-chartable-icon')).toBeInTheDocument();
  });

  it('does not render when isChartingActive', () => {
    const { container } = renderComponent({
      isChartableLayer: true,
      isVisible: true,
      isChartingActive: true,
    });
    expect(container.querySelector('.layer-chartable-icon')).not.toBeInTheDocument();
  });

  it('does not render when isVisible is false', () => {
    const { container } = renderComponent({ isChartableLayer: true, isVisible: false });
    expect(container.querySelector('.layer-chartable-icon')).not.toBeInTheDocument();
  });
});

// ─── Palette legend ───────────────────────────────────────────────────────────

describe('Palette legend', () => {
  it('renders PaletteLegend when hasPalette and renderedPalette is not empty', () => {
    const { getByTestId } = renderComponent({
      hasPalette: true,
      renderedPalette: { id: 'palette1', maps: [] },
    });
    expect(getByTestId('palette-legend-layer1')).toBeInTheDocument();
  });

  it('does not render when hasPalette is false', () => {
    const { queryByTestId } = renderComponent({ hasPalette: false, renderedPalette: { id: 'p1' } });
    expect(queryByTestId('palette-legend-layer1')).not.toBeInTheDocument();
  });

  it('does not render when renderedPalette is empty', () => {
    const { queryByTestId } = renderComponent({ hasPalette: true, renderedPalette: {} });
    expect(queryByTestId('palette-legend-layer1')).not.toBeInTheDocument();
  });
});

// ─── Orbit tracks ─────────────────────────────────────────────────────────────

describe('Orbit tracks', () => {
  it('renders OrbitTrack for each track', () => {
    const tracks = [{ id: 'track1' }, { id: 'track2' }];
    const { getByTestId } = renderComponent({ tracksForLayer: tracks });
    expect(getByTestId('orbit-track-track1')).toBeInTheDocument();
    expect(getByTestId('orbit-track-track2')).toBeInTheDocument();
  });

  it('renders no OrbitTrack when tracksForLayer is empty', () => {
    const { queryByTestId } = renderComponent({ tracksForLayer: [] });
    expect(queryByTestId(/^orbit-track-/)).not.toBeInTheDocument();
  });
});

// ─── Collection display ───────────────────────────────────────────────────────

describe('Collection display', () => {
  it('renders collection identifier when collections truthy and isVisible', () => {
    const { container } = renderComponent({ collections: { version: '6.0', type: 'NRT' }, isVisible: true });
    const span = container.querySelector('#collection-identifier');
    expect(span).toBeInTheDocument();
    expect(span.textContent).toContain('6.0');
    expect(span.textContent).toContain('NRT');
  });

  it('does not render collection when isVisible is false', () => {
    const { container } = renderComponent({ collections: { version: '6.0', type: 'NRT' }, isVisible: false });
    expect(container.querySelector('#collection-identifier')).not.toBeInTheDocument();
  });

  it('uses bg-secondary badge for NRT type', () => {
    const { container } = renderComponent({ collections: { version: '6.0', type: 'NRT' }, isVisible: true });
    expect(container.querySelector('#collection-identifier').className).toContain('bg-secondary');
  });

  it('uses bg-light badge for non-NRT type', () => {
    const { container } = renderComponent({ collections: { version: '6.0', type: 'STD' }, isVisible: true });
    expect(container.querySelector('#collection-identifier').className).toContain('bg-light');
  });
});

// ─── Sortable / drag ──────────────────────────────────────────────────────────

describe('Drag style', () => {
  it('applies zIndex 1 to li when isDragging', () => {
    const { useSortable } = jest.requireMock('@dnd-kit/sortable');
    useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      setActivatorNodeRef: jest.fn(),
      transform: { x: 5, y: 10 },
      transition: '200ms',
      isDragging: true,
    });
    const { container } = renderComponent();
    expect(container.querySelector('li').style.zIndex).toBe('1');
  });

  it('does not set zIndex when not dragging', () => {
    const { container } = renderComponent();
    expect(container.querySelector('li').style.zIndex).toBe('');
  });
});

// ─── useEffects ────────────────────────────────────────────────────────────────

describe('useEffects', () => {
  it('registers MAP_RUNNING_DATA listener on mount', () => {
    renderComponent();
    expect(util.events.on).toHaveBeenCalledWith('map:running-data', expect.any(Function));
  });

  it('unregisters MAP_RUNNING_DATA listener on unmount', () => {
    const { unmount } = renderComponent();
    unmount();
    expect(util.events.off).toHaveBeenCalledWith('map:running-data', expect.any(Function));
  });

  it('calls requestPalette when hasPalette and renderedPalette empty and not loading', () => {
    const requestPalette = jest.fn();
    renderComponent({ hasPalette: true, renderedPalette: {}, isLoading: false, requestPalette });
    expect(requestPalette).toHaveBeenCalledWith('layer1');
  });

  it('does not call requestPalette when hasPalette false', () => {
    const requestPalette = jest.fn();
    renderComponent({ hasPalette: false, renderedPalette: {}, isLoading: false, requestPalette });
    expect(requestPalette).not.toHaveBeenCalled();
  });

  it('does not call requestPalette when renderedPalette not empty', () => {
    const requestPalette = jest.fn();
    renderComponent({
      hasPalette: true,
      renderedPalette: { maps: [] },
      isLoading: false,
      requestPalette,
    });
    expect(requestPalette).not.toHaveBeenCalled();
  });

  it('does not call requestPalette when isLoading', () => {
    const requestPalette = jest.fn();
    renderComponent({ hasPalette: true, renderedPalette: {}, isLoading: true, requestPalette });
    expect(requestPalette).not.toHaveBeenCalled();
  });

  it('shows buttons when isMobile prop changes from false to true', () => {
    const { rerender, queryByTestId } = render(<LayerRow {...defaultProps} isMobile={false} />);
    expect(queryByTestId('dropdown')).not.toBeInTheDocument();
    rerender(<LayerRow {...defaultProps} isMobile />);
    expect(queryByTestId('dropdown')).toBeInTheDocument();
  });
});

// ─── mapStateToProps (factory) ────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    screenSize: { isMobileDevice: false },
    palettes: { rendered: {}, custom: {}, isLoading: {} },
    config: { layers: {}, features: {} },
    embed: { isEmbedModeActive: false },
    map: { ui: { selected: null }, extent: [-180, -90, 180, 90] },
    compare: { active: false, activeString: 'active' },
    proj: { id: 'EPSG:4326' },
    ui: { isDistractionFreeModeActive: false },
    settings: { globalTemperatureUnit: 'K' },
    animation: { isPlaying: false },
    layers: {},
    date: { selected: new Date('2021-01-01'), selectedB: new Date('2021-06-01') },
    alerts: { ddvZoomAlerts: [], ddvLocationAlerts: [] },
    ...overrides,
  });

  const ownProps = {
    layer: { id: 'layer1', palette: { id: 'palette1' } },
    isVisible: true,
    compareState: 'active',
  };

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState({ screenSize: { isMobileDevice: true } }), ownProps).isMobile).toBe(true);
  });

  it('maps isEmbedModeActive from embed', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState({
      embed: { isEmbedModeActive: true },
    }), ownProps).isEmbedModeActive).toBe(true);
  });

  it('maps isAnimating from animation.isPlaying', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState({ animation: { isPlaying: true } }), ownProps).isAnimating).toBe(true);
  });

  it('maps isDistractionFreeModeActive from ui', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState({
      ui: { isDistractionFreeModeActive: true },
    }), ownProps).isDistractionFreeModeActive).toBe(true);
  });

  it('maps ddvZoomAlerts and ddvLocationAlerts', () => {
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState({ alerts: { ddvZoomAlerts: ['A'], ddvLocationAlerts: ['B'] } }),
      ownProps,
    );
    expect(result.ddvZoomAlerts).toEqual(['A']);
    expect(result.ddvLocationAlerts).toEqual(['B']);
  });

  it('hasPalette is true when layer.palette has id', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState(), ownProps).hasPalette).toBe(true);
  });

  it('hasPalette is false when layer.palette is empty', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState(), { ...ownProps, layer: { id: 'layer1', palette: {} } }).hasPalette).toBe(false);
  });

  it('maps compare from state.compare', () => {
    const msp = capturedMakeMapStateToProps();
    const compare = { active: true, activeString: 'active' };
    expect(msp(makeState({ compare }), ownProps).compare).toEqual(compare);
  });

  it('maps map from state.map', () => {
    const msp = capturedMakeMapStateToProps();
    const mapState = { ui: { selected: null }, extent: [-180, -90, 180, 90] };
    expect(msp(makeState({ map: mapState }), ownProps).map).toEqual(mapState);
  });

  it('isVectorLayer is true when layer.type is vector', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState(), { ...ownProps, layer: { id: 'layer1', type: 'vector', palette: {} } }).isVectorLayer).toBe(true);
  });

  it('isVectorLayer is false for non-vector type', () => {
    const msp = capturedMakeMapStateToProps();
    expect(msp(makeState(), ownProps).isVectorLayer).toBe(false);
  });

  it('selectedDate uses date.selected when activeString is active', () => {
    const selected = new Date('2021-03-15');
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState({ compare: { active: false, activeString: 'active' }, date: { selected, selectedB: new Date() } }),
      ownProps,
    );
    expect(result.selectedDate).toEqual(selected);
  });

  it('selectedDate uses date.selectedB when activeString is not active', () => {
    const selectedB = new Date('2021-06-01');
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState({ compare: { active: false, activeString: 'activeB' }, date: { selected: new Date(), selectedB } }),
      ownProps,
    );
    expect(result.selectedDate).toEqual(selectedB);
  });

  it('isCustomPalette truthy when palettes.custom has layer id', () => {
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState({ palettes: { rendered: {}, custom: { layer1: 'custom' }, isLoading: {} } }),
      ownProps,
    );
    expect(result.isCustomPalette).toBeTruthy();
  });

  it('maps describeDomainsUrl from config', () => {
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState({ config: { layers: {}, features: { describeDomains: { url: 'https://gibs.example.com' } } } }),
      ownProps,
    );
    expect(result.describeDomainsUrl).toBe('https://gibs.example.com');
  });
});

// ─── mapDispatchToProps ───────────────────────────────────────────────────────

describe('mapDispatchToProps', () => {
  it('toggleVisibility dispatches action', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).toggleVisibility('layer1', false);
    expect(toggleVisibilityAction).toHaveBeenCalledWith('layer1', false);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_VISIBILITY' });
  });

  it('onRemoveClick dispatches removeLayerAction', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).onRemoveClick('layer1');
    expect(removeLayerAction).toHaveBeenCalledWith('layer1');
    expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_LAYER' });
  });

  it('openVectorAlertModal dispatches openCustomContent', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).openVectorAlertModal();
    expect(openCustomContent).toHaveBeenCalledWith('vector-modal', {});
    expect(dispatch).toHaveBeenCalledWith({ type: 'OPEN_CUSTOM_CONTENT' });
  });

  it('openGranuleAlertModal dispatches openCustomContent', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).openGranuleAlertModal();
    expect(openCustomContent).toHaveBeenCalledWith('granule-modal', {});
  });

  it('openZoomAlertModal dispatches openCustomContent', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).openZoomAlertModal();
    expect(openCustomContent).toHaveBeenCalledWith('zoom-modal', {});
  });

  it('onOptionsClick dispatches toggleCustomContent', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).onOptionsClick(defaultLayer, 'Test Layer', null);
    expect(toggleCustomContent).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_CUSTOM_CONTENT' });
  });

  it('onInfoClick dispatches toggleCustomContent', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).onInfoClick(defaultLayer, 'Test Layer', 'desc', 'https://example.com');
    expect(toggleCustomContent).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_CUSTOM_CONTENT' });
  });

  it('requestPalette dispatches requestPaletteAction', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).requestPalette('layer1');
    expect(requestPaletteAction).toHaveBeenCalledWith('layer1');
    expect(dispatch).toHaveBeenCalledWith({ type: 'REQUEST_PALETTE' });
  });

  it('updateActiveChartingLayer dispatches action', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).updateActiveChartingLayer('layer1');
    expect(updateActiveChartingLayerAction).toHaveBeenCalledWith('layer1');
  });

  it('enableDDVZoomAlert dispatches action', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).enableDDVZoomAlert('Layer');
    expect(enableDDVZoomAlertAction).toHaveBeenCalledWith('Layer');
  });

  it('disableDDVZoomAlert dispatches action', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).disableDDVZoomAlert('Layer');
    expect(disableDDVZoomAlertAction).toHaveBeenCalledWith('Layer');
  });

  it('enableDDVLocationAlert dispatches action', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).enableDDVLocationAlert('Layer');
    expect(enableDDVLocationAlertAction).toHaveBeenCalledWith('Layer');
  });

  it('disableDDVLocationAlert dispatches action', () => {
    const dispatch = jest.fn();
    capturedMapDispatchToProps(dispatch).disableDDVLocationAlert('Layer');
    expect(disableDDVLocationAlertAction).toHaveBeenCalledWith('Layer');
  });
});

// ─── stopDndActivation and stopPropagation ────────────────────────────────────

describe('stopDndActivation and stopPropagation', () => {
  it('stopDndActivation fires without error on dropdown toggle pointerDown', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(() => fireEvent.pointerDown(getByTestId('dropdown-toggle'))).not.toThrow();
  });

  it('stopDndActivation fires without error on dropdown toggle mouseDown', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(() => fireEvent.mouseDown(getByTestId('dropdown-toggle'))).not.toThrow();
  });

  it('stopPropagation fires without error on options button mouseDown', () => {
    const { container, getByLabelText } = renderComponent({ isMobile: false });
    fireEvent.mouseOver(container.querySelector('li'));
    expect(() => fireEvent.mouseDown(getByLabelText('View Options'))).not.toThrow();
  });

  it('stopPropagation fires without error on info button mouseDown', () => {
    const { container, getByLabelText } = renderComponent({ isMobile: false });
    fireEvent.mouseOver(container.querySelector('li'));
    expect(() => fireEvent.mouseDown(getByLabelText('View Description'))).not.toThrow();
  });
});

// ─── Palette legend embed mode ────────────────────────────────────────────────

describe('Palette legend embed mode', () => {
  it('renders PaletteLegend in embed mode', () => {
    const { getByTestId } = renderComponent({
      hasPalette: true,
      renderedPalette: { id: 'palette1', maps: [] },
      isEmbedModeActive: true,
    });
    expect(getByTestId('palette-legend-layer1')).toBeInTheDocument();
  });

  it('renders PaletteLegend with compare.active=true path', () => {
    const { getByTestId } = renderComponent({
      hasPalette: true,
      renderedPalette: { id: 'palette1', maps: [] },
      compare: { active: true, activeString: 'active' },
    });
    expect(getByTestId('palette-legend-layer1')).toBeInTheDocument();
  });
});

// ─── DDV alert effects (initial render) ──────────────────────────────────────

describe('DDV alert effects', () => {
  it('calls disableDDVZoomAlert when titiler layer is already in zoom alerts on mount', () => {
    const disableDDVZoomAlert = jest.fn();
    renderComponent({
      layer: { ...defaultLayer, type: 'titiler' },
      ddvZoomAlerts: ['Test Layer'],
      disableDDVZoomAlert,
    });
    expect(disableDDVZoomAlert).toHaveBeenCalledWith('Test Layer');
  });

  it('calls disableDDVLocationAlert when titiler layer is already in location alerts on mount', () => {
    const disableDDVLocationAlert = jest.fn();
    renderComponent({
      layer: { ...defaultLayer, type: 'titiler' },
      ddvLocationAlerts: ['Test Layer'],
      disableDDVLocationAlert,
    });
    expect(disableDDVLocationAlert).toHaveBeenCalledWith('Test Layer');
  });
});

// ─── Async CMR effect ─────────────────────────────────────────────────────────

describe('Async CMR effect', () => {
  const cmrLayer = {
    ...defaultLayer,
    enableCMRDataFinder: true,
    conceptIds: [{ value: 'C123' }],
  };

  beforeEach(() => {
    const { cmrFetch } = jest.requireMock('../../util/cmr');
    cmrFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ feed: { entry: [] } }),
    });
  });

  it('does not run CMR fetch when layer.enableCMRDataFinder is false', () => {
    const { cmrFetch } = jest.requireMock('../../util/cmr');
    renderComponent({ layer: { ...defaultLayer, enableCMRDataFinder: false }, isVisible: true });
    expect(cmrFetch).not.toHaveBeenCalled();
  });

  it('does not run CMR fetch when isVisible is false', () => {
    const { cmrFetch } = jest.requireMock('../../util/cmr');
    renderComponent({ layer: cmrLayer, isVisible: false });
    expect(cmrFetch).not.toHaveBeenCalled();
  });

  it('shows granule alert when CMR returns empty entries', async () => {
    const { findByTestId } = renderComponent({ layer: cmrLayer, isVisible: true, zot: null });
    await findByTestId('alert-granule-alert');
  });

  it('shows zoom alert when zot.underZoomValue > 0 and CMR returns empty entries', async () => {
    const { findByTestId } = renderComponent({
      layer: cmrLayer,
      isVisible: true,
      zot: { underZoomValue: 1 },
    });
    await findByTestId('alert-zoom-alert');
  });

  it('dismisses granule alert on dismiss click', async () => {
    const { findByTestId, queryByTestId } = renderComponent({
      layer: cmrLayer,
      isVisible: true,
      zot: null,
    });
    const btn = await findByTestId('alert-dismiss-granule-alert');
    fireEvent.click(btn);
    expect(queryByTestId('alert-granule-alert')).not.toBeInTheDocument();
  });

  it('dismisses zoom alert on dismiss click', async () => {
    const { findByTestId, queryByTestId } = renderComponent({
      layer: cmrLayer,
      isVisible: true,
      zot: { underZoomValue: 1 },
    });
    const btn = await findByTestId('alert-dismiss-zoom-alert');
    fireEvent.click(btn);
    expect(queryByTestId('alert-zoom-alert')).not.toBeInTheDocument();
  });

  it('calls enableDDVZoomAlert for dismissable layer when zoom alert activates', async () => {
    const enableDDVZoomAlert = jest.fn();
    renderComponent({
      layer: { ...cmrLayer, type: 'titiler' },
      isVisible: true,
      zot: { underZoomValue: 1 },
      enableDDVZoomAlert,
      ddvZoomAlerts: [],
    });
    await waitFor(() => expect(enableDDVZoomAlert).toHaveBeenCalledWith('Test Layer'));
  });

  it('calls enableDDVLocationAlert for dismissable layer when granule alert activates', async () => {
    const enableDDVLocationAlert = jest.fn();
    renderComponent({
      layer: { ...cmrLayer, type: 'titiler' },
      isVisible: true,
      zot: null,
      enableDDVLocationAlert,
      ddvLocationAlerts: [],
    });
    await waitFor(() => expect(enableDDVLocationAlert).toHaveBeenCalledWith('Test Layer'));
  });

  it('does not show alerts when CMR response is not ok', async () => {
    const { cmrFetch } = jest.requireMock('../../util/cmr');
    cmrFetch.mockResolvedValue({ ok: false });
    const { queryByTestId } = renderComponent({ layer: cmrLayer, isVisible: true });
    await waitFor(() => expect(cmrFetch).toHaveBeenCalled());
    expect(queryByTestId('alert-granule-alert')).not.toBeInTheDocument();
  });
});

// ─── Additional mapStateToProps branches ──────────────────────────────────────

describe('mapStateToProps additional', () => {
  const makeState = (overrides = {}) => ({
    screenSize: { isMobileDevice: false },
    palettes: { rendered: {}, custom: {}, isLoading: {} },
    config: { layers: {}, features: {} },
    embed: { isEmbedModeActive: false },
    map: { ui: { selected: null }, extent: [-180, -90, 180, 90] },
    compare: { active: false, activeString: 'active' },
    proj: { id: 'EPSG:4326' },
    ui: { isDistractionFreeModeActive: false },
    settings: { globalTemperatureUnit: 'K' },
    animation: { isPlaying: false },
    layers: {},
    date: { selected: new Date('2021-01-01'), selectedB: new Date('2021-06-01') },
    alerts: { ddvZoomAlerts: [], ddvLocationAlerts: [] },
    ...overrides,
  });

  it('isChartableLayer true when all charting conditions met', () => {
    const msp = capturedMakeMapStateToProps();
    const layer = {
      id: 'layer1',
      palette: { id: 'palette1' },
      layerPeriod: 'Daily',
      disableCharting: false,
    };
    const state = makeState({
      palettes: {
        rendered: { palette1: { maps: [{ type: 'continuous' }] } },
        custom: {},
        isLoading: {},
      },
    });
    expect(msp(state, { layer, isVisible: true, compareState: 'active' }).isChartableLayer).toBe(true);
  });

  it('isChartableLayer false when palette type is not continuous', () => {
    const msp = capturedMakeMapStateToProps();
    const layer = { id: 'layer1', palette: { id: 'palette1' }, layerPeriod: 'Daily' };
    const state = makeState({
      palettes: {
        rendered: { palette1: { maps: [{ type: 'classification' }] } },
        custom: {},
        isLoading: {},
      },
    });
    expect(msp(state, { layer, isVisible: true, compareState: 'active' }).isChartableLayer).toBe(false);
  });

  it('hasClickableFeature true when vector, visible, and isVectorLayerClickable returns true', () => {
    const { isVectorLayerClickable } = jest.requireMock('../../modules/layers/util');
    isVectorLayerClickable.mockReturnValue(true);
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState(),
      { layer: { id: 'layer1', type: 'vector', palette: {} }, isVisible: true, compareState: 'active' },
    );
    expect(result.hasClickableFeature).toBe(true);
  });

  it('hasClickableFeature false when isVectorLayerClickable returns false', () => {
    const { isVectorLayerClickable } = jest.requireMock('../../modules/layers/util');
    isVectorLayerClickable.mockReturnValue(false);
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState(),
      { layer: { id: 'layer1', type: 'vector', palette: {} }, isVisible: true, compareState: 'active' },
    );
    expect(result.hasClickableFeature).toBe(false);
  });

  it('globalTemperatureUnit is empty when layer.disableUnitConversion is truthy', () => {
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState({ settings: { globalTemperatureUnit: 'K' } }),
      { layer: { id: 'layer1', palette: {}, disableUnitConversion: true }, isVisible: true, compareState: 'active' },
    );
    expect(result.globalTemperatureUnit).toBe('');
  });

  it('tracksForLayer filters active layers matching orbitTracks', () => {
    const { getActiveLayers } = jest.requireMock('../../modules/layers/selectors');
    getActiveLayers.mockReturnValue([{ id: 'track1' }, { id: 'other' }]);
    const msp = capturedMakeMapStateToProps();
    const result = msp(
      makeState(),
      { layer: { id: 'layer1', palette: {}, orbitTracks: ['track1'] }, isVisible: true, compareState: 'active' },
    );
    expect(result.tracksForLayer).toEqual([{ id: 'track1' }]);
  });
});
