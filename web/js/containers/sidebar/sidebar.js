import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { get as lodashGet } from 'lodash';
import { TabContent, TabPane } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import LayersContainer from './layers-container';
import Events from './events';
import SmartHandoff from './smart-handoff';
import CompareCase from './compare';
import FooterContent from './footer-content';
import CollapsedButton from '../../components/sidebar/collapsed-button';
import NavCase from '../../components/sidebar/nav/nav-case';
import {
  loadCustom as loadCustomPalette,
} from '../../modules/palettes/util';
import { loadedCustomPalettes } from '../../modules/palettes/actions';
import {
  requestEvents as requestEventsActionCreator,
  requestSources as requestSourcesActionCreator,
} from '../../modules/natural-events/actions';
import { getAllActiveLayers } from '../../modules/layers/selectors';
import ErrorBoundary from '../error-boundary';
import util from '../../util/util';
import {
  changeTab as changeTabAction,
  toggleSidebarCollapse as toggleSidebarCollapseAction,
  expandSidebar as expandSidebarAction,
} from '../../modules/sidebar/actions';
import safeLocalStorage from '../../util/local-storage';

const { SIDEBAR_COLLAPSED } = safeLocalStorage.keys;

const getActiveTabs = function(config) {
  const { features } = config;
  return {
    download: features.smartHandoffs,
    layers: true,
    events: features.naturalEvents,
  };
};

const resetWorldview = function(e, isDistractionFreeModeActive) {
  e.preventDefault();
  if (!isDistractionFreeModeActive && window.location.search === '') return; // Nothing to reset
  const msg = 'Do you want to reset Worldview to its defaults? You will lose your current state.';
  // eslint-disable-next-line no-alert
  if (window.confirm(msg)) {
    googleTagManager.pushEvent({
      event: 'logo_page_reset',
    });
    document.location.href = '/';
  }
};

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { subComponentHeight: 700 };
    this.toggleSidebar = this.toggleSidebar.bind(this);
  }

  componentDidMount() {
    const { config, loadedCustomPalettes } = this.props;
    const customPalettePromise = loadCustomPalette(config);
    customPalettePromise.then((customs) => {
      loadedCustomPalettes(customs);
    });
    this.updateDimensions();
    this.loadEvents();
    // prevent browser zooming in safari
    if (util.browser.safari) {
      const onGestureCallback = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      this.iconElement.addEventListener('gesturestart', onGestureCallback);
      this.sideBarCase.addEventListener('gesturestart', onGestureCallback);
    }
  }

  componentDidUpdate() {
    this.updateDimensions();
  }

  loadEvents() {
    const {
      isLoadingEvents,
      hasEventRequestError,
      eventsData,
      eventRequestUrl,
      config,
      requestEvents,
      requestSources,
    } = this.props;

    if (!isLoadingEvents && !hasEventRequestError && !eventsData) {
      let eventsRequestURL = `${eventRequestUrl}/events`;
      let sourceRequestURL = `${eventRequestUrl}/sources`;

      const mockEvents = lodashGet(config, 'parameters.mockEvents');
      const mockSources = lodashGet(config, 'parameters.mockSources');

      if (mockEvents) {
        console.warn(`Using mock events data: ${mockEvents}`);
        eventsRequestURL = mockEvents === 'true'
          ? 'mock/events_data.json'
          : `mock/events_data.json-${mockEvents}`;
      }
      if (mockSources) {
        console.warn(`Using mock categories data: ${mockSources}`);
        sourceRequestURL = `mock/categories_data.json-${mockSources}`;
      }
      requestEvents(eventsRequestURL);
      requestSources(sourceRequestURL);
    }
  }

  updateDimensions() {
    const { subComponentHeight } = this.state;
    const footerHeight = lodashGet(this, 'footerElement.clientHeight') || 20;
    const { isMobile, screenHeight } = this.props;
    if (!isMobile && this.iconElement) {
      const iconHeight = this.iconElement.clientHeight;
      const topOffset = Math.abs(this.iconElement.getBoundingClientRect().top);
      const tabHeight = 32;
      const basePadding = 130;
      const newHeight = screenHeight
        - (iconHeight + topOffset + tabHeight + basePadding + footerHeight)
        - 10;
      // Issue #1415: This was checking for subComponentHeight !== newHeight.
      // Sometimes it would get stuck in a loop in which the newHeight
      // would vary by a single pixel on each render. Hack fix is to
      // only update when changed by more than a single pixel. This probably
      // needs a refactoring.
      if (Math.abs(subComponentHeight - newHeight) > 1) {
        this.setState({ subComponentHeight: newHeight });
      }
    } else {
      const tabHeight = 32;
      const newHeight = screenHeight - (tabHeight + footerHeight);
      // See note above
      if (Math.abs(subComponentHeight - newHeight) > 1) {
        this.setState({ subComponentHeight: newHeight });
      }
    }
  }

  toggleSidebar() {
    const {
      isCollapsed,
      collapseExpandToggle,
      isMobile,
    } = this.props;
    const isNowCollapsed = !isCollapsed;
    if (isMobile) {
      return collapseExpandToggle();
    }
    googleTagManager.pushEvent({
      event: 'sidebar_chevron',
    });
    const storageValue = isNowCollapsed ? 'collapsed' : 'expanded';
    safeLocalStorage.setItem(SIDEBAR_COLLAPSED, storageValue);
    collapseExpandToggle();
  }

  getProductsToRender(activeTab, isCompareMode) {
    const { activeString } = this.props;
    const { subComponentHeight } = this.state;
    if (isCompareMode) {
      return (
        <CompareCase
          isActive={activeTab === 'layers'}
          height={subComponentHeight}
        />
      );
    } if (!isCompareMode) {
      return (
        <LayersContainer
          height={subComponentHeight - 48}
          isActive={activeTab === 'layers'}
          compareState={activeString}
        />
      );
    }
  }

  render() {
    const { subComponentHeight } = this.state;
    const {
      config,
      onTabClick,
      numberOfLayers,
      screenHeight,
      isCollapsed,
      isCompareMode,
      isDistractionFreeModeActive,
      activeTab,
      tabTypes,
      isMobile,
      changeTab,
      isDataDisabled,
      isLoadingEvents,
      hasEventRequestError,
      eventsData,
      eventsSources,
    } = this.props;
    if (isMobile && activeTab === 'download') changeTab('layers');
    const wheelCallBack = util.browser.chrome ? util.preventPinch : null;
    const { naturalEvents } = config.features;
    const { smartHandoffs } = config.features;

    return (
      <ErrorBoundary>
        <section id="wv-sidebar">
          <a
            href="/"
            title="Click to Reset Worldview to Defaults"
            id="wv-logo"
            className={isDistractionFreeModeActive ? 'wv-logo-distraction-free-mode' : ''}
            onClick={(e) => resetWorldview(e, isDistractionFreeModeActive)}
            ref={(iconElement) => { this.iconElement = iconElement; }}
            onWheel={wheelCallBack}
          />
          {isCollapsed && (
            <CollapsedButton
              isMobile={isMobile}
              onclick={this.toggleSidebar}
              numberOfLayers={numberOfLayers}
              isDistractionFreeModeActive={isDistractionFreeModeActive}
            />
          )}
          <div
            id="productsHolder"
            className="products-holder-case"
            ref={(el) => {
              this.sideBarCase = el;
            }}
            style={{
              maxHeight: isCollapsed ? '0' : `${screenHeight}px`,
              display: isDistractionFreeModeActive ? 'none' : 'block',
            }}
            onWheel={wheelCallBack}
          >
            {!isCollapsed && (
              <>
                <NavCase
                  activeTab={activeTab}
                  onTabClick={onTabClick}
                  tabTypes={tabTypes}
                  isMobile={isMobile}
                  toggleSidebar={this.toggleSidebar}
                  isCompareMode={isCompareMode}
                  isDataDisabled={isDataDisabled}
                />
                <TabContent activeTab={activeTab}>
                  <TabPane tabId="layers">
                    {this.getProductsToRender(activeTab, isCompareMode)}
                  </TabPane>
                  <TabPane tabId="events">
                    {naturalEvents && activeTab === 'events' && (
                    <Events
                      height={subComponentHeight}
                      isLoading={isLoadingEvents}
                      hasRequestError={hasEventRequestError}
                      eventsData={eventsData}
                      sources={eventsSources}
                    />
                    )}
                  </TabPane>
                  <TabPane tabId="download">
                    {smartHandoffs && (
                      <SmartHandoff
                        isActive={activeTab === 'download'}
                        tabTypes={tabTypes}
                      />
                    )}
                  </TabPane>
                  <footer
                    ref={(footerElement) => { this.footerElement = footerElement; }}
                  >
                    <FooterContent tabTypes={tabTypes} activeTab={activeTab} />
                  </footer>
                </TabContent>
              </>
            )}
          </div>
        </section>
      </ErrorBoundary>
    );
  }
}
function mapStateToProps(state) {
  const {
    browser,
    sidebar,
    compare,
    config,
    modal,
    measure,
    animation,
    events,
    requestedEvents,
    requestedEventSources,
    ui,
  } = state;

  const eventRequestUrl = lodashGet(state, 'config.features.naturalEvents.host');
  const isLoadingEvents = requestedEvents.isLoading
    || requestedEventSources.isLoading;
  const hasEventRequestError = requestedEvents.error
    || requestedEventSources.error;
  const eventsData = lodashGet(requestedEvents, 'response');
  const eventsSources = lodashGet(requestedEventSources, 'response');

  const { screenHeight } = browser;
  const { isDistractionFreeModeActive } = ui;
  const { activeTab, isCollapsed, mobileCollapsed } = sidebar;
  const { activeString } = compare;
  const numberOfLayers = getAllActiveLayers(state).length;
  const tabTypes = getActiveTabs(config);
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  const isMobile = browser.lessThan.medium;
  // Collapse when Image download / GIF /  is open or measure tool active
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;
  return {
    activeTab,
    activeString,
    config,
    eventRequestUrl,
    eventsData,
    eventsSources,
    numberOfLayers,
    hasEventRequestError,
    isCollapsed: isMobile ? mobileCollapsed : isCollapsed || shouldBeCollapsed,
    isCompareMode: compare.active,
    isDataDisabled: events.isAnimatingToEvent,
    isDistractionFreeModeActive,
    isLoadingEvents,
    isMobile,
    screenHeight,
    tabTypes,
  };
}
const mapDispatchToProps = (dispatch) => ({
  changeTab: (str) => {
    dispatch(changeTabAction(str));
  },
  onTabClick: (str, activeStr) => {
    if (str === activeStr) return;
    googleTagManager.pushEvent({
      event: `${str}_tab`,
    });
    dispatch(changeTabAction(str));
  },
  collapseExpandToggle: () => {
    dispatch(toggleSidebarCollapseAction());
  },
  expandSidebar: () => {
    dispatch(expandSidebarAction());
  },
  loadedCustomPalettes: (customs) => {
    dispatch(loadedCustomPalettes(customs));
  },
  requestEvents: (url) => {
    dispatch(requestEventsActionCreator(url));
  },
  requestSources: (url) => {
    dispatch(requestSourcesActionCreator(url));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Sidebar);


Sidebar.propTypes = {
  activeString: PropTypes.string,
  activeTab: PropTypes.string,
  changeTab: PropTypes.func,
  collapseExpandToggle: PropTypes.func,
  config: PropTypes.object,
  eventsData: PropTypes.array,
  eventsSources: PropTypes.array,
  eventRequestUrl: PropTypes.string,
  hasEventRequestError: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isCompareMode: PropTypes.bool,
  isDataDisabled: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isLoadingEvents: PropTypes.bool,
  isMobile: PropTypes.bool,
  loadedCustomPalettes: PropTypes.func,
  numberOfLayers: PropTypes.number,
  onTabClick: PropTypes.func,
  screenHeight: PropTypes.number,
  tabTypes: PropTypes.object,
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
};
