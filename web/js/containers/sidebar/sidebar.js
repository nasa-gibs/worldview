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
import { getSelectedDate } from '../../modules/date/selectors';
import { getPermalink } from '../../modules/link/util';
import {
  requestEvents as requestEventsActionCreator,
  requestSources as requestSourcesActionCreator,
  requestCategories as requestCategoriesActionCreator,
} from '../../modules/natural-events/actions';
import { getAllActiveLayers } from '../../modules/layers/selectors';
import ErrorBoundary from '../error-boundary';
import util from '../../util/util';
import {
  changeTab as changeTabAction,
  toggleSidebarCollapse as toggleSidebarCollapseAction,
  expandSidebar as expandSidebarAction,
} from '../../modules/sidebar/actions';
import history from '../../main';
import safeLocalStorage from '../../util/local-storage';
import { initialEventsLoad } from '../../map/natural-events/util';

const { SIDEBAR_COLLAPSED } = safeLocalStorage.keys;

const getActiveTabs = function(config) {
  const { features } = config;
  return {
    download: features.smartHandoffs,
    layers: true,
    events: features.naturalEvents,
  };
};

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      subComponentHeight: 700,
      isEventsTabDisabledEmbed: false,
    };
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.renderSidebarLogo = this.renderSidebarLogo.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.getProductsToRender = this.getProductsToRender.bind(this);
    this.handleWorldviewLogoClick = this.handleWorldviewLogoClick.bind(this);
  }

  componentDidMount() {
    const {
      activeTab, config, isEmbedModeActive, loadedCustomPalettes,
    } = this.props;
    const customPalettePromise = loadCustomPalette(config);
    customPalettePromise.then((customs) => {
      loadedCustomPalettes(customs);
    });
    this.updateDimensions();
    this.loadEvents();
    // prevent events tab if embed init layers tab
    if (isEmbedModeActive && activeTab === 'layers') {
      this.setState({ isEventsTabDisabledEmbed: true });
    }

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
    const { activeTab } = this.props;
    if (activeTab === 'events') {
      this.loadEvents();
    }
    this.updateDimensions();
  }

  loadEvents() {
    const {
      isLoadingEvents,
      hasEventRequestError,
      eventsData,
      config,
      requestEvents,
      requestSources,
      requestCategories,
      selectedYear,
    } = this.props;

    if (!isLoadingEvents && !hasEventRequestError && !eventsData) {
      const { sourcesURL, eventsURL, categoriesURL } = initialEventsLoad(config, selectedYear);
      requestEvents(eventsURL);
      requestSources(sourcesURL);
      requestCategories(categoriesURL);
    }
  }

  updateDimensions() {
    const { subComponentHeight } = this.state;
    const { isMobile, screenHeight } = this.props;
    const footerHeight = lodashGet(this, 'footerElement.clientHeight') || 20;
    const tabHeight = 32;
    let newHeight;
    if (!isMobile) {
      const iconHeight = 53;
      const topOffset = 10;
      const basePadding = 130;
      newHeight = screenHeight
        - (iconHeight + topOffset + tabHeight + basePadding + footerHeight)
        - 10;
    } else {
      newHeight = screenHeight - (tabHeight + footerHeight);
    }
    // Issue #1415: This was checking for subComponentHeight !== newHeight.
    // Sometimes it would get stuck in a loop in which the newHeight
    // would vary by a single pixel on each render. Hack fix is to
    // only update when changed by more than a single pixel. This probably
    // needs a refactoring.
    if (Math.abs(subComponentHeight - newHeight) > 1) {
      this.setState({ subComponentHeight: newHeight });
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

  handleWorldviewLogoClick(e, permalink) {
    e.preventDefault();
    const { isEmbedModeActive } = this.props;
    if (window.location.search === '') return; // Nothing to reset
    let msg;
    if (isEmbedModeActive) {
      msg = 'Do you want to open full featured Worldview in a new tab with current content loaded?';
      // eslint-disable-next-line no-alert
      if (window.confirm(msg)) {
        window.open(permalink, '_blank');
      }
    } else {
      msg = 'Do you want to reset Worldview to its defaults? You will lose your current state.';
      // eslint-disable-next-line no-alert
      if (window.confirm(msg)) {
        googleTagManager.pushEvent({
          event: 'logo_page_reset',
        });
        document.location.href = '/';
      }
    }
  }

  renderSidebarLogo() {
    const {
      isDistractionFreeModeActive,
      isEmbedModeActive,
      selectedDate,
    } = this.props;
    const wheelCallBack = util.browser.chrome ? util.preventPinch : null;
    const permalink = getPermalink(history.location.search, selectedDate);
    const WVLogoTitle = isEmbedModeActive
      ? 'Click to Open This Worldview Map in a New Tab'
      : 'Click to Reset Worldview to Defaults';
    const embedWVLogoLink = isEmbedModeActive ? permalink : '/';

    return (
      <a
        href={embedWVLogoLink}
        title={WVLogoTitle}
        id="wv-logo"
        className={isDistractionFreeModeActive ? 'wv-logo-distraction-free-mode' : ''}
        onClick={(e) => this.handleWorldviewLogoClick(e, permalink)}
        ref={(iconElement) => { this.iconElement = iconElement; }}
        onWheel={wheelCallBack}
      />
    );
  }

  render() {
    const {
      isEventsTabDisabledEmbed,
      subComponentHeight,
    } = this.state;
    const {
      activeTab,
      changeTab,
      config,
      eventsData,
      eventsSources,
      hasEventRequestError,
      isCollapsed,
      isCompareMode,
      isDataDisabled,
      isDistractionFreeModeActive,
      isEmbedModeActive,
      isLoadingEvents,
      isMobile,
      numberOfLayers,
      onTabClick,
      screenHeight,
      tabTypes,
    } = this.props;
    if ((isMobile || isEmbedModeActive) && activeTab === 'download') changeTab('layers');
    const wheelCallBack = util.browser.chrome ? util.preventPinch : null;
    const { naturalEvents } = config.features;
    const { smartHandoffs } = config.features;

    const maxHeight = isCollapsed
      ? '0'
      : isEmbedModeActive
        ? '70vh'
        : `${screenHeight}px`;
    return (
      <ErrorBoundary>
        <section id="wv-sidebar">
          {this.renderSidebarLogo()}
          <>
            {!isDistractionFreeModeActive && isCollapsed && (
            <CollapsedButton
              isMobile={isMobile}
              onclick={this.toggleSidebar}
              numberOfLayers={numberOfLayers}
            />
            )}
            <div
              id="productsHolder"
              className="products-holder-case"
              ref={(el) => {
                this.sideBarCase = el;
              }}
              style={{
                maxHeight,
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
                    isEventsTabDisabledEmbed={isEventsTabDisabledEmbed}
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
          </>
        </section>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    animation,
    browser,
    compare,
    config,
    embed,
    events,
    measure,
    modal,
    requestedEvents,
    requestedEventSources,
    sidebar,
    requestedEventCategories,
    ui,
  } = state;

  const isLoadingEvents = requestedEvents.isLoading
    || requestedEventSources.isLoading
    || requestedEventCategories.isLoading;
  const hasEventRequestError = !!(requestedEvents.error
    || requestedEventSources.error
    || requestedEventCategories.error);
  const eventsData = lodashGet(requestedEvents, 'response');
  const eventsSources = lodashGet(requestedEventSources, 'response');
  const { screenHeight } = browser;
  const { isDistractionFreeModeActive } = ui;
  const { isEmbedModeActive } = embed;
  const { activeTab, isCollapsed, mobileCollapsed } = sidebar;
  const { activeString } = compare;
  const activeLayers = getAllActiveLayers(state);
  let numberOfLayers = activeLayers.length;
  if (isEmbedModeActive) {
    numberOfLayers = activeLayers.filter((layer) => layer.visible && layer.layergroup !== 'Reference').length;
  }
  const tabTypes = getActiveTabs(config);
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  const isMobile = browser.lessThan.medium;
  // Collapse when Image download / GIF /  is open or measure tool active
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;

  return {
    activeTab,
    activeString,
    config,
    eventsData,
    eventsSources,
    numberOfLayers,
    hasEventRequestError,
    isCollapsed: isMobile ? mobileCollapsed : isCollapsed || shouldBeCollapsed,
    isCompareMode: compare.active,
    isDataDisabled: events.isAnimatingToEvent,
    isDistractionFreeModeActive,
    isEmbedModeActive,
    isLoadingEvents,
    isMobile,
    selectedYear: events.selectedYear,
    screenHeight,
    selectedDate: getSelectedDate(state),
    tabTypes,
  };
};

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
  requestCategories: (url) => {
    dispatch(requestCategoriesActionCreator(url));
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
  hasEventRequestError: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isCompareMode: PropTypes.bool,
  isDataDisabled: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isLoadingEvents: PropTypes.bool,
  isMobile: PropTypes.bool,
  loadedCustomPalettes: PropTypes.func,
  numberOfLayers: PropTypes.number,
  onTabClick: PropTypes.func,
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
  screenHeight: PropTypes.number,
  selectedDate: PropTypes.object,
  tabTypes: PropTypes.object,
  selectedYear: PropTypes.number,
  requestCategories: PropTypes.func,
};
