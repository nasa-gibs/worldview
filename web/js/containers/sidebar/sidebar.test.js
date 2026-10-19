/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ───────────────────────────────────────────────────────────────────

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

jest.mock('reactstrap', () => {
  const React = require('react');
  return {
    TabContent: ({ children, activeTab }) => React.createElement('div', { 'data-testid': 'tab-content', 'data-active-tab': activeTab }, children),
    TabPane: ({ children, tabId }) => React.createElement('div', { 'data-testid': `tab-pane-${tabId}` }, children),
  };
});

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));

jest.mock('./layers-container', () => function MockLayersContainer({ isActive, compareState, height }) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'layers-container',
    'data-is-active': String(isActive),
    'data-compare-state': compareState,
    'data-height': String(height),
  });
});

jest.mock('./charting', () => function MockChartingLayerMenu({ isActive, height, compareState, chartState, chartingModeAccessible }) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'charting-layer-menu',
    'data-is-active': String(isActive),
    'data-height': String(height),
  });
});

jest.mock('./events', () => function MockEvents({ height, isLoading, hasRequestError }) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'events',
    'data-height': String(height),
    'data-is-loading': String(isLoading),
  });
});

jest.mock('./smart-handoff', () => function MockSmartHandoff({ isActive }) {
  const React = require('react');
  return React.createElement('div', { 'data-testid': 'smart-handoff', 'data-is-active': String(isActive) });
});

jest.mock('./compare', () => function MockCompareCase({ isActive, height }) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'compare-case',
    'data-is-active': String(isActive),
    'data-height': String(height),
  });
});

jest.mock('./footer-content', () => {
  const React = require('react');
  return React.forwardRef(function MockFooterContent({
    activeTab, tabTypes, chartingModeAccessible, sidebarHeight,
  }, ref) {
    return React.createElement('div', { 'data-testid': 'footer-content', ref });
  });
});

jest.mock('./add-layers-content', () => {
  const React = require('react');
  return React.forwardRef(function MockAddLayersContent({ isActive, compareState }, ref) {
    return React.createElement('div', {
      'data-testid': 'add-layers-content',
      'data-is-active': String(isActive),
      ref,
    });
  });
});

jest.mock('../../components/sidebar/collapsed-button', () => function MockCollapsedButton({ onclick, numberOfLayers, isMobile, isEmbed }) {
  const React = require('react');
  return React.createElement('button', {
    'data-testid': 'collapsed-button',
    'data-num-layers': String(numberOfLayers),
    onClick: onclick,
  }, String(numberOfLayers));
});

jest.mock('../../components/sidebar/nav/nav-case', () => function MockNavCase({
  activeTab, toggleSidebar, isEventsTabDisabledEmbed, isCompareMode, isChartMode,
}) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'nav-case',
    'data-active-tab': activeTab,
    'data-events-tab-disabled': String(isEventsTabDisabledEmbed),
  }, React.createElement('button', { 'data-testid': 'toggle-sidebar', onClick: toggleSidebar }, 'toggle'));
});

jest.mock('../../modules/palettes/util', () => ({
  loadCustom: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../modules/palettes/actions', () => ({
  loadedCustomPalettes: jest.fn(() => ({ type: 'LOADED_CUSTOM_PALETTES' })),
}));

jest.mock('../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2023-01-01')),
}));

jest.mock('../../modules/link/util', () => ({
  getPermalink: jest.fn(() => 'https://worldview.earthdata.nasa.gov?permalink=test'),
}));

jest.mock('../../modules/natural-events/actions', () => ({
  requestEvents: jest.fn(() => ({ type: 'REQUEST_EVENTS' })),
  requestSources: jest.fn(() => ({ type: 'REQUEST_SOURCES' })),
}));

jest.mock('../../modules/layers/selectors', () => ({
  getAllActiveLayers: jest.fn(() => []),
}));

jest.mock('../../modules/natural-events/selectors', () => ({
  getFilteredEvents: jest.fn(() => []),
}));

jest.mock('../error-boundary', () => function MockErrorBoundary({ children }) {
  return children;
});

jest.mock('../../modules/sidebar/actions', () => ({
  changeTab: jest.fn((str) => ({ type: 'CHANGE_TAB', str })),
  toggleSidebarCollapse: jest.fn(() => ({ type: 'TOGGLE_SIDEBAR_COLLAPSE' })),
  expandSidebar: jest.fn(() => ({ type: 'EXPAND_SIDEBAR' })),
}));

jest.mock('../../main', () => ({
  __esModule: true,
  default: { location: { search: '' } },
}));

jest.mock('../../util/local-storage', () => ({
  __esModule: true,
  default: {
    keys: { SIDEBAR_COLLAPSED: 'SIDEBAR_COLLAPSED' },
    setItem: jest.fn(),
    getItem: jest.fn(),
  },
}));

jest.mock('../../util/customHooks', () => ({
  __esModule: true,
  default: jest.fn(() => undefined),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import Sidebar from './sidebar';
import googleTagManager from 'googleTagManager';
import { loadCustom as loadCustomPalette } from '../../modules/palettes/util';
import { loadedCustomPalettes as loadedCustomPalettesAction } from '../../modules/palettes/actions';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import { getAllActiveLayers } from '../../modules/layers/selectors';
import { getSelectedDate } from '../../modules/date/selectors';
import {
  requestEvents as requestEventsActionCreator,
  requestSources as requestSourcesActionCreator,
} from '../../modules/natural-events/actions';
import {
  changeTab as changeTabAction,
  toggleSidebarCollapse as toggleSidebarCollapseAction,
  expandSidebar as expandSidebarAction,
} from '../../modules/sidebar/actions';
import safeLocalStorage from '../../util/local-storage';

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
  window.history.pushState({}, '', '/');
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultConfig = {
  features: { naturalEvents: true, smartHandoffs: true },
  layers: {},
};

const defaultProps = {
  activeTab: 'layers',
  activeString: 'active',
  changeTab: jest.fn(),
  chartingModeAccessible: false,
  collapseExpandToggle: jest.fn(),
  config: defaultConfig,
  displayStaticMap: false,
  eventsData: [],
  eventsSources: [],
  hasEventRequestError: false,
  isCollapsed: false,
  isCompareMode: false,
  isChartMode: false,
  isDataDisabled: false,
  isDistractionFreeModeActive: false,
  isEmbedModeActive: false,
  isKioskModeActive: false,
  isLoadingEvents: false,
  isMobile: false,
  loadedCustomPalettes: jest.fn(),
  mapIsRendered: false,
  numberOfLayers: 3,
  onTabClick: jest.fn(),
  requestEvents: jest.fn(),
  requestSources: jest.fn(),
  screenHeight: 800,
  selectedDate: new Date('2023-01-01'),
  selectedMap: null,
  tabTypes: { layers: true, events: true, download: true },
};

const renderComponent = (propOverrides = {}) => render(
  <Sidebar {...defaultProps} {...propOverrides} />,
);

// ─── Sidebar structure ────────────────────────────────────────────────────────

describe('Sidebar structure', () => {
  it('renders #wv-sidebar section', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#wv-sidebar')).toBeInTheDocument();
  });

  it('renders #products-holder div', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#products-holder')).toBeInTheDocument();
  });

  it('renders NavCase', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('nav-case')).toBeInTheDocument();
  });

  it('renders AddLayersContent with isActive=true when activeTab is layers', () => {
    const { getByTestId } = renderComponent({ activeTab: 'layers' });
    expect(getByTestId('add-layers-content')).toHaveAttribute('data-is-active', 'true');
  });

  it('renders AddLayersContent with isActive=false when activeTab is not layers', () => {
    const { getByTestId } = renderComponent({ activeTab: 'events' });
    expect(getByTestId('add-layers-content')).toHaveAttribute('data-is-active', 'false');
  });

  it('renders FooterContent when not kiosk mode', () => {
    const { getByTestId } = renderComponent({ isKioskModeActive: false });
    expect(getByTestId('footer-content')).toBeInTheDocument();
  });

  it('does not render FooterContent in kiosk mode', () => {
    const { queryByTestId } = renderComponent({ isKioskModeActive: true });
    expect(queryByTestId('footer-content')).not.toBeInTheDocument();
  });
});

// ─── Logo rendering ───────────────────────────────────────────────────────────

describe('Logo rendering', () => {
  it('renders logo anchor element when not in kiosk mode', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#wv-logo').tagName).toBe('A');
  });

  it('renders logo span element in kiosk mode', () => {
    const { container } = renderComponent({ isKioskModeActive: true });
    expect(container.querySelector('#wv-logo').tagName).toBe('SPAN');
  });

  it('does not render logo when displayStaticMap is true', () => {
    const { container } = renderComponent({ displayStaticMap: true });
    expect(container.querySelector('#wv-logo')).not.toBeInTheDocument();
  });

  it('logo href is permalink in embed mode', () => {
    const { container } = renderComponent({ isEmbedModeActive: true });
    expect(container.querySelector('#wv-logo').getAttribute('href')).toBe('https://worldview.earthdata.nasa.gov?permalink=test');
  });

  it('logo href is / in non-embed mode', () => {
    const { container } = renderComponent({ isEmbedModeActive: false });
    expect(container.querySelector('#wv-logo').getAttribute('href')).toBe('/');
  });

  it('logo title mentions New Tab in embed mode', () => {
    const { container } = renderComponent({ isEmbedModeActive: true });
    expect(container.querySelector('#wv-logo').getAttribute('title')).toContain('New Tab');
  });

  it('logo title mentions Reset in non-embed mode', () => {
    const { container } = renderComponent({ isEmbedModeActive: false });
    expect(container.querySelector('#wv-logo').getAttribute('title')).toContain('Reset');
  });

  it('logo has distraction-free class when isDistractionFreeModeActive', () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true });
    expect(container.querySelector('#wv-logo').className).toContain('wv-logo-distraction-free-mode');
  });

  it('logo span has distraction-free class in kiosk mode when distraction free', () => {
    const { container } = renderComponent({
      isKioskModeActive: true, isDistractionFreeModeActive: true,
    });
    expect(container.querySelector('#wv-logo').className).toContain('wv-logo-distraction-free-mode');
  });

  it('renders Worldview text on desktop', () => {
    const { container } = renderComponent({ isMobile: false });
    expect(container.querySelector('#wv-logo').textContent).toBe('Worldview');
  });

  it('renders empty logo text on mobile', () => {
    const { container } = renderComponent({ isMobile: true });
    expect(container.querySelector('#wv-logo').textContent).toBe('');
  });
});

// ─── CollapsedButton ──────────────────────────────────────────────────────────

describe('CollapsedButton', () => {
  it('renders when isCollapsed is true and not distraction free', () => {
    const { getByTestId } = renderComponent({ isCollapsed: true });
    expect(getByTestId('collapsed-button')).toBeInTheDocument();
  });

  it('does not render when isCollapsed is false', () => {
    const { queryByTestId } = renderComponent({ isCollapsed: false });
    expect(queryByTestId('collapsed-button')).not.toBeInTheDocument();
  });

  it('does not render when isDistractionFreeModeActive is true', () => {
    const { queryByTestId } = renderComponent({
      isCollapsed: true, isDistractionFreeModeActive: true,
    });
    expect(queryByTestId('collapsed-button')).not.toBeInTheDocument();
  });

  it('passes numberOfLayers to CollapsedButton', () => {
    const { getByTestId } = renderComponent({ isCollapsed: true, numberOfLayers: 7 });
    expect(getByTestId('collapsed-button')).toHaveAttribute('data-num-layers', '7');
  });
});

// ─── getProductsToRender ──────────────────────────────────────────────────────

describe('getProductsToRender', () => {
  it('renders LayersContainer in normal mode', () => {
    const { getByTestId } = renderComponent({ activeTab: 'layers' });
    expect(getByTestId('layers-container')).toBeInTheDocument();
  });

  it('passes compareState to LayersContainer', () => {
    const { getByTestId } = renderComponent({ activeTab: 'layers', activeString: 'activeB' });
    expect(getByTestId('layers-container')).toHaveAttribute('data-compare-state', 'activeB');
  });

  it('renders CompareCase when isCompareMode is true', () => {
    const { getByTestId } = renderComponent({ isCompareMode: true });
    expect(getByTestId('compare-case')).toBeInTheDocument();
  });

  it('does not render LayersContainer when isCompareMode is true', () => {
    const { queryByTestId } = renderComponent({ isCompareMode: true });
    expect(queryByTestId('layers-container')).not.toBeInTheDocument();
  });

  it('renders ChartingLayerMenu when isChartMode is true', () => {
    const { getByTestId } = renderComponent({ isChartMode: true });
    expect(getByTestId('charting-layer-menu')).toBeInTheDocument();
  });

  it('does not render LayersContainer when isChartMode is true', () => {
    const { queryByTestId } = renderComponent({ isChartMode: true });
    expect(queryByTestId('layers-container')).not.toBeInTheDocument();
  });

  it('compare mode takes precedence over chart mode', () => {
    const { getByTestId, queryByTestId } = renderComponent({
      isCompareMode: true, isChartMode: true,
    });
    expect(getByTestId('compare-case')).toBeInTheDocument();
    expect(queryByTestId('charting-layer-menu')).not.toBeInTheDocument();
  });
});

// ─── Events TabPane ───────────────────────────────────────────────────────────

describe('Events TabPane', () => {
  it('renders Events when activeTab is events and naturalEvents enabled', () => {
    const { getByTestId } = renderComponent({ activeTab: 'events' });
    expect(getByTestId('events')).toBeInTheDocument();
  });

  it('does not render Events when naturalEvents feature is false', () => {
    const config = { features: { naturalEvents: false, smartHandoffs: true }, layers: {} };
    const { queryByTestId } = renderComponent({ activeTab: 'events', config });
    expect(queryByTestId('events')).not.toBeInTheDocument();
  });

  it('does not render Events when activeTab is not events', () => {
    const { queryByTestId } = renderComponent({ activeTab: 'layers' });
    expect(queryByTestId('events')).not.toBeInTheDocument();
  });

  it('passes height to Events component', () => {
    const { getByTestId } = renderComponent({ activeTab: 'events', screenHeight: 800 });
    const height = parseInt(getByTestId('events').getAttribute('data-height'), 10);
    expect(height).toBeGreaterThan(0);
  });
});

// ─── Download TabPane ─────────────────────────────────────────────────────────

describe('Download TabPane', () => {
  it('renders SmartHandoff when activeTab is download and smartHandoffs enabled', () => {
    const { getByTestId } = renderComponent({ activeTab: 'download' });
    expect(getByTestId('smart-handoff')).toBeInTheDocument();
  });

  it('does not render SmartHandoff when smartHandoffs feature is false', () => {
    const config = { features: { naturalEvents: true, smartHandoffs: false }, layers: {} };
    const { queryByTestId } = renderComponent({ activeTab: 'download', config });
    expect(queryByTestId('smart-handoff')).not.toBeInTheDocument();
  });

  it('does not render SmartHandoff when activeTab is not download', () => {
    const { queryByTestId } = renderComponent({ activeTab: 'layers' });
    expect(queryByTestId('smart-handoff')).not.toBeInTheDocument();
  });
});

// ─── Tab redirect (download → layers) ────────────────────────────────────────

describe('Tab redirect', () => {
  it('calls changeTab("layers") when isMobile and activeTab is download', () => {
    const changeTab = jest.fn();
    renderComponent({ isMobile: true, activeTab: 'download', changeTab });
    expect(changeTab).toHaveBeenCalledWith('layers');
  });

  it('calls changeTab("layers") when isEmbedModeActive and activeTab is download', () => {
    const changeTab = jest.fn();
    renderComponent({ isEmbedModeActive: true, activeTab: 'download', changeTab });
    expect(changeTab).toHaveBeenCalledWith('layers');
  });

  it('does not call changeTab when desktop non-embed with layers tab', () => {
    const changeTab = jest.fn();
    renderComponent({ activeTab: 'layers', changeTab });
    expect(changeTab).not.toHaveBeenCalled();
  });

  it('does not call changeTab when desktop non-embed with download tab', () => {
    const changeTab = jest.fn();
    renderComponent({ isMobile: false, isEmbedModeActive: false, activeTab: 'download', changeTab });
    expect(changeTab).not.toHaveBeenCalled();
  });
});

// ─── Sidebar styles ───────────────────────────────────────────────────────────

describe('Sidebar styles', () => {
  it('products-holder maxHeight is screenHeight px when not collapsed and not embed', () => {
    const { container } = renderComponent({
      isCollapsed: false, isEmbedModeActive: false, screenHeight: 800,
    });
    expect(container.querySelector('#products-holder').style.maxHeight).toBe('800px');
  });

  it('products-holder maxHeight is 0 when collapsed', () => {
    const { container } = renderComponent({ isCollapsed: true });
    expect(container.querySelector('#products-holder').style.maxHeight).toBe('0');
  });

  it('products-holder maxHeight is 95vh in embed mode when not collapsed', () => {
    const { container } = renderComponent({ isEmbedModeActive: true, isCollapsed: false });
    expect(container.querySelector('#products-holder').style.maxHeight).toBe('95vh');
  });

  it('products-holder has display:none when distraction free and not mobile', () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true, isMobile: false });
    expect(container.querySelector('#products-holder').style.display).toBe('none');
  });

  it('sets #wv-sidebar position:static in mobile non-distraction-free mode', () => {
    const { container } = renderComponent({ isMobile: true, isDistractionFreeModeActive: false });
    expect(container.querySelector('#wv-sidebar').style.position).toBe('static');
  });

  it('does not set #wv-sidebar position in desktop mode', () => {
    const { container } = renderComponent({ isMobile: false });
    expect(container.querySelector('#wv-sidebar').style.position).toBe('');
  });
});

// ─── toggleSidebar ────────────────────────────────────────────────────────────

describe('toggleSidebar', () => {
  it('calls collapseExpandToggle in mobile mode', () => {
    const collapseExpandToggle = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: true, collapseExpandToggle });
    fireEvent.click(getByTestId('toggle-sidebar'));
    expect(collapseExpandToggle).toHaveBeenCalled();
  });

  it('does not fire googleTagManager event in mobile mode', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    fireEvent.click(getByTestId('toggle-sidebar'));
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('calls collapseExpandToggle in desktop mode', () => {
    const collapseExpandToggle = jest.fn();
    const { getByTestId } = renderComponent({ isMobile: false, collapseExpandToggle });
    fireEvent.click(getByTestId('toggle-sidebar'));
    expect(collapseExpandToggle).toHaveBeenCalled();
  });

  it('fires sidebar_chevron gtm event in desktop mode', () => {
    const { getByTestId } = renderComponent({ isMobile: false });
    fireEvent.click(getByTestId('toggle-sidebar'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'sidebar_chevron' });
  });

  it('saves collapsed to localStorage when sidebar is currently expanded (desktop)', () => {
    const { getByTestId } = renderComponent({ isMobile: false, isCollapsed: false });
    fireEvent.click(getByTestId('toggle-sidebar'));
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('SIDEBAR_COLLAPSED', 'collapsed');
  });

  it('saves expanded to localStorage when sidebar is currently collapsed (desktop)', () => {
    const { getByTestId } = renderComponent({ isMobile: false, isCollapsed: true });
    fireEvent.click(getByTestId('toggle-sidebar'));
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('SIDEBAR_COLLAPSED', 'expanded');
  });

  it('CollapsedButton onclick also calls toggleSidebar in desktop mode', () => {
    const collapseExpandToggle = jest.fn();
    const { getByTestId } = renderComponent({
      isMobile: false, isCollapsed: true, collapseExpandToggle,
    });
    fireEvent.click(getByTestId('collapsed-button'));
    expect(collapseExpandToggle).toHaveBeenCalled();
  });
});

// ─── handleWorldviewLogoClick ─────────────────────────────────────────────────

describe('handleWorldviewLogoClick', () => {
  beforeEach(() => {
    window.confirm = jest.fn();
    window.open = jest.fn();
  });

  it('does nothing when window.location.search is empty', () => {
    // default URL is '/' with empty search
    const { container } = renderComponent();
    fireEvent.click(container.querySelector('#wv-logo'));
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('calls window.open with permalink in embed mode when confirmed', () => {
    window.history.pushState({}, '', '/?state=test');
    window.confirm = jest.fn(() => true);
    const { container } = renderComponent({ isEmbedModeActive: true });
    fireEvent.click(container.querySelector('#wv-logo'));
    expect(window.open).toHaveBeenCalledWith(
      'https://worldview.earthdata.nasa.gov?permalink=test',
      '_blank',
    );
  });

  it('does not call window.open when confirm cancelled in embed mode', () => {
    window.history.pushState({}, '', '/?state=test');
    window.confirm = jest.fn(() => false);
    const { container } = renderComponent({ isEmbedModeActive: true });
    fireEvent.click(container.querySelector('#wv-logo'));
    expect(window.open).not.toHaveBeenCalled();
  });

  it('calls gtm logo_page_reset in non-embed mode when confirmed', () => {
    window.history.pushState({}, '', '/?state=test');
    window.confirm = jest.fn(() => true);
    // jsdom logs a navigation error when document.location.href is set; suppress it
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = renderComponent({ isEmbedModeActive: false });
    fireEvent.click(container.querySelector('#wv-logo'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'logo_page_reset' });
  });

  it('does not call gtm when confirm cancelled in non-embed mode', () => {
    window.history.pushState({}, '', '/?state=test');
    window.confirm = jest.fn(() => false);
    const { container } = renderComponent({ isEmbedModeActive: false });
    fireEvent.click(container.querySelector('#wv-logo'));
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('embed confirm prompt contains @NAME@ placeholder', () => {
    window.history.pushState({}, '', '/?state=test');
    window.confirm = jest.fn(() => false);
    const { container } = renderComponent({ isEmbedModeActive: true });
    fireEvent.click(container.querySelector('#wv-logo'));
    expect(window.confirm.mock.calls[0][0]).toContain('@NAME@');
  });

  it('non-embed confirm prompt mentions reset', () => {
    window.history.pushState({}, '', '/?state=test');
    window.confirm = jest.fn(() => false);
    const { container } = renderComponent({ isEmbedModeActive: false });
    fireEvent.click(container.querySelector('#wv-logo'));
    expect(window.confirm.mock.calls[0][0]).toContain('reset');
  });
});

// ─── useEffect on mount ───────────────────────────────────────────────────────

describe('useEffect on mount', () => {
  it('calls loadCustomPalette with config', () => {
    renderComponent();
    expect(loadCustomPalette).toHaveBeenCalledWith(defaultConfig);
  });

  it('calls loadedCustomPalettes with resolved palettes', async () => {
    const palettes = [{ id: 'custom1' }];
    loadCustomPalette.mockResolvedValueOnce(palettes);
    const loadedCustomPalettes = jest.fn();
    renderComponent({ loadedCustomPalettes });
    await waitFor(() => expect(loadedCustomPalettes).toHaveBeenCalledWith(palettes));
  });

  it('calls requestSources on mount', () => {
    const requestSources = jest.fn();
    renderComponent({ requestSources });
    expect(requestSources).toHaveBeenCalled();
  });

  it('sets isEventsTabDisabledEmbed in NavCase when embed mode and layers tab', async () => {
    const { getByTestId } = renderComponent({ isEmbedModeActive: true, activeTab: 'layers' });
    await waitFor(() => {
      expect(getByTestId('nav-case')).toHaveAttribute('data-events-tab-disabled', 'true');
    });
  });

  it('does not set isEventsTabDisabledEmbed when not embed mode', () => {
    const { getByTestId } = renderComponent({ isEmbedModeActive: false, activeTab: 'layers' });
    expect(getByTestId('nav-case')).toHaveAttribute('data-events-tab-disabled', 'false');
  });

  it('does not set isEventsTabDisabledEmbed when embed mode but not layers tab', () => {
    const { getByTestId } = renderComponent({ isEmbedModeActive: true, activeTab: 'events' });
    expect(getByTestId('nav-case')).toHaveAttribute('data-events-tab-disabled', 'false');
  });
});

// ─── useEffect update – requestEvents ────────────────────────────────────────

describe('useEffect update – requestEvents', () => {
  it('calls requestEvents when activeTab is events with no existing data', () => {
    const requestEvents = jest.fn();
    renderComponent({ activeTab: 'events', eventsData: [], isLoadingEvents: false, requestEvents });
    expect(requestEvents).toHaveBeenCalled();
  });

  it('does not call requestEvents when activeTab is not events', () => {
    const requestEvents = jest.fn();
    renderComponent({ activeTab: 'layers', requestEvents });
    expect(requestEvents).not.toHaveBeenCalled();
  });

  it('does not call requestEvents when isLoadingEvents is true', () => {
    const requestEvents = jest.fn();
    renderComponent({ activeTab: 'events', isLoadingEvents: true, requestEvents });
    expect(requestEvents).not.toHaveBeenCalled();
  });

  it('does not call requestEvents when eventsData is non-empty', () => {
    const requestEvents = jest.fn();
    renderComponent({ activeTab: 'events', eventsData: [{ id: '1' }], requestEvents });
    expect(requestEvents).not.toHaveBeenCalled();
  });

  it('calls requestEvents when mapIsRendered is true and activeTab is events', () => {
    const requestEvents = jest.fn();
    renderComponent({ activeTab: 'events', mapIsRendered: true, requestEvents });
    expect(requestEvents).toHaveBeenCalled();
  });
});

// ─── updateDimensions ─────────────────────────────────────────────────────────

describe('updateDimensions', () => {
  it('calculates height for non-mobile desktop (fallback footer/addLayers heights)', async () => {
    // footerHeight=20, addLayersHeight=30, tabHeight=32, groupCheckboxHeight=35
    // iconHeight=53, topOffset=10, basePadding=130
    // newHeight = 800 - (53+10+32+35+130+20+30) - 10 = 480
    const { getByTestId } = renderComponent({ screenHeight: 800, isMobile: false });
    await waitFor(() => {
      expect(getByTestId('layers-container')).toHaveAttribute('data-height', '480');
    });
  });

  it('calculates height for mobile without compare mode', async () => {
    // tabHeight = compareModeHeight = 40 (no compare), groupCheckboxHeight=35
    // newHeight = 800 - (40 + 35 + 20 + 30) = 675
    const { getByTestId } = renderComponent({
      screenHeight: 800, isMobile: true, isCompareMode: false,
    });
    await waitFor(() => {
      expect(getByTestId('layers-container')).toHaveAttribute('data-height', '675');
    });
  });

  it('subtracts 130 from height when isChartMode is true and height > 300', async () => {
    // non-mobile: 480 base height; isChartMode=true → 480-130=350
    const { getByTestId } = renderComponent({
      screenHeight: 800, isMobile: false, isChartMode: true,
    });
    await waitFor(() => {
      expect(getByTestId('charting-layer-menu')).toHaveAttribute('data-height', '350');
    });
  });

  it('uses larger compareModeHeight for mobile in compare mode', async () => {
    // mobile + compare: tabHeight = 80
    // newHeight = 800 - (80 + 35 + 20 + 30) = 635
    const { getByTestId } = renderComponent({
      screenHeight: 800, isMobile: true, isCompareMode: true,
    });
    await waitFor(() => {
      expect(getByTestId('compare-case')).toHaveAttribute('data-height', '635');
    });
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    animation: { gifActive: false },
    compare: { active: false, activeString: 'active' },
    charting: { active: false },
    config: {
      features: { naturalEvents: true, smartHandoffs: true },
      layers: {},
    },
    embed: { isEmbedModeActive: false },
    events: { isAnimatingToEvent: false },
    layers: { active: { layers: [] } },
    measure: { isActive: false },
    modal: { isOpen: false, id: null },
    map: { ui: { selected: null } },
    palettes: { rendered: {}, custom: {} },
    requestedEvents: { isLoading: false, error: null },
    requestedEventSources: { isLoading: false, error: null, response: [] },
    screenSize: { screenHeight: 800, isMobileDevice: false },
    sidebar: { activeTab: 'layers', isCollapsed: false, mobileCollapsed: false },
    ui: { isDistractionFreeModeActive: false, isKioskModeActive: false, displayStaticMap: false },
    ...overrides,
  });

  it('maps activeTab from sidebar.activeTab', () => {
    const state = makeState({ sidebar: { activeTab: 'events', isCollapsed: false, mobileCollapsed: false } });
    expect(capturedMapStateToProps(state).activeTab).toBe('events');
  });

  it('maps activeString from compare.activeString', () => {
    const state = makeState({ compare: { active: false, activeString: 'activeB' } });
    expect(capturedMapStateToProps(state).activeString).toBe('activeB');
  });

  it('maps isCompareMode from compare.active', () => {
    const state = makeState({ compare: { active: true, activeString: 'active' } });
    expect(capturedMapStateToProps(state).isCompareMode).toBe(true);
  });

  it('maps isChartMode from charting.active', () => {
    const state = makeState({ charting: { active: true } });
    expect(capturedMapStateToProps(state).isChartMode).toBe(true);
  });

  it('maps isEmbedModeActive from embed.isEmbedModeActive', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    expect(capturedMapStateToProps(state).isEmbedModeActive).toBe(true);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({ screenSize: { screenHeight: 800, isMobileDevice: true } });
    expect(capturedMapStateToProps(state).isMobile).toBe(true);
  });

  it('maps isKioskModeActive from ui', () => {
    const state = makeState({
      ui: { isDistractionFreeModeActive: false, isKioskModeActive: true, displayStaticMap: false },
    });
    expect(capturedMapStateToProps(state).isKioskModeActive).toBe(true);
  });

  it('maps isDistractionFreeModeActive from ui', () => {
    const state = makeState({
      ui: { isDistractionFreeModeActive: true, isKioskModeActive: false, displayStaticMap: false },
    });
    expect(capturedMapStateToProps(state).isDistractionFreeModeActive).toBe(true);
  });

  it('maps displayStaticMap from ui.displayStaticMap', () => {
    const state = makeState({
      ui: { isDistractionFreeModeActive: false, isKioskModeActive: false, displayStaticMap: true },
    });
    expect(capturedMapStateToProps(state).displayStaticMap).toBe(true);
  });

  it('maps screenHeight from screenSize.screenHeight', () => {
    const state = makeState({ screenSize: { screenHeight: 1200, isMobileDevice: false } });
    expect(capturedMapStateToProps(state).screenHeight).toBe(1200);
  });

  it('maps isLoadingEvents true when requestedEvents.isLoading is true', () => {
    const state = makeState({ requestedEvents: { isLoading: true, error: null } });
    expect(capturedMapStateToProps(state).isLoadingEvents).toBe(true);
  });

  it('maps isLoadingEvents true when requestedEventSources.isLoading is true', () => {
    const state = makeState({
      requestedEventSources: { isLoading: true, error: null, response: [] },
    });
    expect(capturedMapStateToProps(state).isLoadingEvents).toBe(true);
  });

  it('maps hasEventRequestError true when requestedEvents has error', () => {
    const state = makeState({ requestedEvents: { isLoading: false, error: 'network error' } });
    expect(capturedMapStateToProps(state).hasEventRequestError).toBe(true);
  });

  it('maps hasEventRequestError true when requestedEventSources has error', () => {
    const state = makeState({ requestedEventSources: { isLoading: false, error: 'fail', response: [] } });
    expect(capturedMapStateToProps(state).hasEventRequestError).toBe(true);
  });

  it('maps isDataDisabled from events.isAnimatingToEvent', () => {
    const state = makeState({ events: { isAnimatingToEvent: true } });
    expect(capturedMapStateToProps(state).isDataDisabled).toBe(true);
  });

  it('isCollapsed uses mobileCollapsed for mobile', () => {
    const state = makeState({
      screenSize: { screenHeight: 800, isMobileDevice: true },
      sidebar: { activeTab: 'layers', isCollapsed: false, mobileCollapsed: true },
    });
    expect(capturedMapStateToProps(state).isCollapsed).toBe(true);
  });

  it('isCollapsed uses sidebar.isCollapsed for desktop', () => {
    const state = makeState({ sidebar: { activeTab: 'layers', isCollapsed: true, mobileCollapsed: false } });
    expect(capturedMapStateToProps(state).isCollapsed).toBe(true);
  });

  it('isCollapsed true via snapshotModalOpen', () => {
    const state = makeState({ modal: { isOpen: true, id: 'TOOLBAR_SNAPSHOT' } });
    expect(capturedMapStateToProps(state).isCollapsed).toBe(true);
  });

  it('isCollapsed false when modal is open but not snapshot id', () => {
    const state = makeState({ modal: { isOpen: true, id: 'OTHER_MODAL' } });
    expect(capturedMapStateToProps(state).isCollapsed).toBe(false);
  });

  it('isCollapsed true via measure.isActive', () => {
    const state = makeState({ measure: { isActive: true } });
    expect(capturedMapStateToProps(state).isCollapsed).toBe(true);
  });

  it('isCollapsed true via animation.gifActive', () => {
    const state = makeState({ animation: { gifActive: true } });
    expect(capturedMapStateToProps(state).isCollapsed).toBe(true);
  });

  it('numberOfLayers counts all active layers when not embed mode', () => {
    getAllActiveLayers.mockReturnValueOnce([{ id: 'l1', visible: true }, { id: 'l2', visible: false }]);
    const state = makeState();
    expect(capturedMapStateToProps(state).numberOfLayers).toBe(2);
  });

  it('numberOfLayers counts only visible non-Reference layers in embed mode', () => {
    getAllActiveLayers.mockReturnValueOnce([
      { id: 'l1', visible: true, layergroup: 'Overlays' },
      { id: 'l2', visible: false, layergroup: 'Overlays' },
      { id: 'l3', visible: true, layergroup: 'Reference' },
    ]);
    const state = makeState({ embed: { isEmbedModeActive: true } });
    expect(capturedMapStateToProps(state).numberOfLayers).toBe(1);
  });

  it('mapIsRendered is true when selectedMap.isRendered() returns true', () => {
    const mockMap = { isRendered: jest.fn(() => true) };
    const state = makeState({ map: { ui: { selected: mockMap } } });
    expect(capturedMapStateToProps(state).mapIsRendered).toBe(true);
  });

  it('mapIsRendered is falsy when selectedMap is null', () => {
    const state = makeState({ map: { ui: { selected: null } } });
    expect(capturedMapStateToProps(state).mapIsRendered).toBeFalsy();
  });

  it('selectedMap comes from map.ui.selected', () => {
    const mockMap = { isRendered: jest.fn(() => false) };
    const state = makeState({ map: { ui: { selected: mockMap } } });
    expect(capturedMapStateToProps(state).selectedMap).toBe(mockMap);
  });

  it('chartingModeAccessible true for qualifying layer', () => {
    const state = makeState({
      palettes: { rendered: { pal1: { maps: [{ type: 'continuous' }] } }, custom: {} },
      layers: {
        active: {
          layers: [{
            id: 'layer1', palette: { id: 'pal1' }, layerPeriod: 'Daily', disableCharting: false,
          }],
        },
      },
    });
    expect(capturedMapStateToProps(state).chartingModeAccessible).toBe(true);
  });

  it('chartingModeAccessible false when no qualifying layers', () => {
    expect(capturedMapStateToProps(makeState()).chartingModeAccessible).toBe(false);
  });

  it('chartingModeAccessible false when layer has disableCharting=true', () => {
    const state = makeState({
      palettes: { rendered: { pal1: { maps: [{ type: 'continuous' }] } }, custom: {} },
      layers: {
        active: {
          layers: [{
            id: 'layer1', palette: { id: 'pal1' }, layerPeriod: 'Daily', disableCharting: true,
          }],
        },
      },
    });
    expect(capturedMapStateToProps(state).chartingModeAccessible).toBe(false);
  });

  it('chartingModeAccessible false when palette type is not continuous', () => {
    const state = makeState({
      palettes: { rendered: { pal1: { maps: [{ type: 'classification' }] } }, custom: {} },
      layers: {
        active: {
          layers: [{
            id: 'layer1', palette: { id: 'pal1' }, layerPeriod: 'Daily', disableCharting: false,
          }],
        },
      },
    });
    expect(capturedMapStateToProps(state).chartingModeAccessible).toBe(false);
  });

  it('tabTypes.layers is always true', () => {
    expect(capturedMapStateToProps(makeState()).tabTypes.layers).toBe(true);
  });

  it('tabTypes.events reflects features.naturalEvents', () => {
    const state = makeState({
      config: { features: { naturalEvents: false, smartHandoffs: true }, layers: {} },
    });
    expect(capturedMapStateToProps(state).tabTypes.events).toBe(false);
  });

  it('tabTypes.download reflects features.smartHandoffs', () => {
    const state = makeState({
      config: { features: { naturalEvents: true, smartHandoffs: false }, layers: {} },
    });
    expect(capturedMapStateToProps(state).tabTypes.download).toBe(false);
  });

  it('eventsSources maps from requestedEventSources.response', () => {
    const sources = [{ id: 'VIIRS' }];
    const state = makeState({
      requestedEventSources: { isLoading: false, error: null, response: sources },
    });
    expect(capturedMapStateToProps(state).eventsSources).toBe(sources);
  });

  it('calls getSelectedDate with state', () => {
    const state = makeState();
    capturedMapStateToProps(state);
    expect(getSelectedDate).toHaveBeenCalledWith(state);
  });

  it('calls getFilteredEvents with state', () => {
    const state = makeState();
    capturedMapStateToProps(state);
    expect(getFilteredEvents).toHaveBeenCalledWith(state);
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

  it('changeTab dispatches changeTabAction', () => {
    mapped.changeTab('events');
    expect(changeTabAction).toHaveBeenCalledWith('events');
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_TAB', str: 'events' });
  });

  it('onTabClick does nothing when str equals activeStr', () => {
    mapped.onTabClick('events', 'events');
    expect(dispatch).not.toHaveBeenCalled();
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('onTabClick dispatches changeTabAction and fires gtm when tab changes', () => {
    mapped.onTabClick('events', 'layers');
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'events_tab' });
    expect(changeTabAction).toHaveBeenCalledWith('events');
  });

  it('collapseExpandToggle dispatches toggleSidebarCollapseAction', () => {
    mapped.collapseExpandToggle();
    expect(toggleSidebarCollapseAction).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_SIDEBAR_COLLAPSE' });
  });

  it('expandSidebar dispatches expandSidebarAction', () => {
    mapped.expandSidebar();
    expect(expandSidebarAction).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'EXPAND_SIDEBAR' });
  });

  it('loadedCustomPalettes dispatches loadedCustomPalettesAction', () => {
    const customs = [{ id: 'custom1' }];
    mapped.loadedCustomPalettes(customs);
    expect(loadedCustomPalettesAction).toHaveBeenCalledWith(customs);
    expect(dispatch).toHaveBeenCalledWith({ type: 'LOADED_CUSTOM_PALETTES' });
  });

  it('requestEvents dispatches requestEventsActionCreator', () => {
    mapped.requestEvents();
    expect(requestEventsActionCreator).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'REQUEST_EVENTS' });
  });

  it('requestSources dispatches requestSourcesActionCreator', () => {
    mapped.requestSources();
    expect(requestSourcesActionCreator).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'REQUEST_SOURCES' });
  });
});
