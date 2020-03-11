import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Layers from './layers';
import Events from './events';
import Data from './data';
import { get as lodashGet } from 'lodash';
import CompareCase from './compare';
import FooterContent from './footer-content';
import { TabContent, TabPane } from 'reactstrap';
import CollapsedButton from '../../components/sidebar/collapsed-button';
import NavCase from '../../components/sidebar/nav/nav-case';
import googleTagManager from 'googleTagManager';
import {
  getCheckerboard,
  loadCustom as loadCustomPalette
} from '../../modules/palettes/util';
import { loadedCustomPalettes } from '../../modules/palettes/actions';
import { getLayers } from '../../modules/layers/selectors';
import ErrorBoundary from '../error-boundary';
import util from '../../util/util';
import {
  changeTab,
  toggleSidebarCollapse,
  collapseSidebar,
  expandSidebar
} from '../../modules/sidebar/actions';

const getActiveTabs = function(config) {
  const features = config.features;
  return {
    download: features.dataDownload,
    layers: true,
    events: features.naturalEvents
  };
};
const resetWorldview = function(e, isDistractionFreeModeActive) {
  e.preventDefault();
  if (!isDistractionFreeModeActive && window.location.search === '') return; // Nothing to reset
  var msg =
    'Do you want to reset Worldview to its defaults? You will lose your current state.';
  if (confirm(msg)) {
    googleTagManager.pushEvent({
      event: 'logo_page_reset'
    });
    document.location.href = '/';
  }
};
class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { subComponentHeight: 700 };
    this.checkerBoardPattern = getCheckerboard();
    const customPalettePromise = loadCustomPalette(props.config);
    customPalettePromise.done(customs => {
      props.loadedCustomPalettes(customs);
    });
  }

  componentDidMount() {
    this.updateDimensions();
    // prevent browserzooming in safari
    if (util.browser.safari) {
      const onGestureCallback = e => {
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

  updateDimensions() {
    const { subComponentHeight } = this.state;
    const footerHeight = lodashGet(this, 'footerElement.clientHeight') || 20;
    const { isMobile, screenHeight } = this.props;
    if (!isMobile && this.iconElement) {
      const iconHeight = this.iconElement.clientHeight;
      const topOffset = Math.abs(this.iconElement.getBoundingClientRect().top);
      const tabHeight = 32;
      const basePadding = 130;
      const newHeight =
        screenHeight -
        (iconHeight + topOffset + tabHeight + basePadding + footerHeight) -
        10;
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

  selectEvent(id, date) {
    this.state.selectEvent(id, date);
    if (this.props.isMobile) {
      this.props.collapseSidebar();
    }
  }

  toggleSidebar() {
    const {
      isCollapsed,
      collapseExpandToggle,
      hasLocalStorage,
      isMobile
    } = this.props;
    var isNowCollapsed = !isCollapsed;
    if (isMobile) {
      return collapseExpandToggle();
    }
    googleTagManager.pushEvent({
      event: 'sidebar_chevron'
    });
    if (hasLocalStorage) {
      const storageValue = isNowCollapsed ? 'collapsed' : 'expanded';
      localStorage.setItem('sidebarState', storageValue);
    }
    collapseExpandToggle();
  }

  getProductsToRender(activeTab, isCompareMode) {
    const { subComponentHeight } = this.state;
    if (isCompareMode) {
      return (
        <CompareCase
          isActive={activeTab === 'layers'}
          height={subComponentHeight}
          checkerBoardPattern={this.checkerBoardPattern}
        />
      );
    } else if (!isCompareMode) {
      return (
        <Layers
          height={subComponentHeight}
          isActive={activeTab === 'layers'}
          layerGroupName={this.props.activeString}
          checkerBoardPattern={this.checkerBoardPattern}
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
      isDataDisabled
    } = this.props;
    if (isMobile && activeTab === 'download') changeTab('layers');
    const wheelCallBack = util.browser.chrome ? util.preventPinch : null;
    const naturalEventsFeatureActive = config.features.naturalEvents;
    const dataDownloadFeatureActive = config.features.dataDownload;
    return (
      <ErrorBoundary>
        <section id="wv-sidebar">
          <a
            href="/"
            title="Click to Reset Worldview to Defaults"
            id="wv-logo"
            className={`${isDistractionFreeModeActive ? 'wv-logo-distraction-free-mode' : ''}`}
            onClick={(e) => resetWorldview(e, isDistractionFreeModeActive)}
            ref={iconElement => (this.iconElement = iconElement)}
            onWheel={wheelCallBack}
          />
          <CollapsedButton
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            onclick={this.toggleSidebar.bind(this)}
            numberOfLayers={numberOfLayers}
            isDistractionFreeModeActive={isDistractionFreeModeActive}
          />
          <div
            id="productsHolder"
            className="products-holder-case"
            ref={el => {
              this.sideBarCase = el;
            }}
            style={{
              maxHeight: isCollapsed ? '0' : screenHeight + 'px',
              display: isDistractionFreeModeActive ? 'none' : 'block'
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
                  toggleSidebar={this.toggleSidebar.bind(this)}
                  isCompareMode={isCompareMode}
                  isDataDisabled={isDataDisabled}
                />
                <TabContent activeTab={activeTab}>
                  <TabPane tabId="layers">
                    {this.getProductsToRender(activeTab, isCompareMode)}
                  </TabPane>
                  <TabPane tabId="events">
                    {naturalEventsFeatureActive
                      ? <Events
                        isActive={activeTab === 'events'}
                        height={subComponentHeight}
                      />
                      : null
                    }
                  </TabPane>
                  <TabPane tabId="download">
                    {dataDownloadFeatureActive
                      ? <Data
                        isActive={activeTab === 'download'}
                        height={subComponentHeight}
                        tabTypes={tabTypes}
                      />
                      : null
                    }
                  </TabPane>
                  <footer
                    ref={footerElement => (this.footerElement = footerElement)}
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
    layers,
    config,
    modal,
    measure,
    animation,
    events,
    ui
  } = state;
  const { screenHeight } = browser;
  const isDistractionFreeModeActive = ui.isDistractionFreeModeActive;
  const { activeTab, isCollapsed, mobileCollapsed } = sidebar;
  const { activeString } = compare;
  const numberOfLayers = getLayers(layers[activeString], {}, state).length;
  const tabTypes = getActiveTabs(config);
  const snapshotModalOpen = (modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT');
  const isMobile = browser.lessThan.medium;
  // Collapse when Image download / GIF /  is open or measure tool active
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;
  return {
    activeTab,
    isMobile,
    hasLocalStorage: util.browser.localStorage,
    screenHeight: screenHeight,
    isCompareMode: compare.active,
    activeString,
    numberOfLayers,
    isDataDisabled: events.isAnimatingToEvent,
    isCollapsed: isMobile ? mobileCollapsed : (isCollapsed || shouldBeCollapsed),
    tabTypes,
    config,
    isDistractionFreeModeActive
  };
}
const mapDispatchToProps = dispatch => ({
  changeTab: str => {
    dispatch(changeTab(str));
  },
  onTabClick: (str, activeStr) => {
    if (str === activeStr) return;
    googleTagManager.pushEvent({
      event: str + '_tab'
    });
    dispatch(changeTab(str));
  },
  collapseExpandToggle: () => {
    dispatch(toggleSidebarCollapse());
  },
  collapseSidebar: () => {
    dispatch(collapseSidebar());
  },
  expandSidebar: () => {
    dispatch(expandSidebar());
  },
  loadedCustomPalettes: customs => {
    dispatch(loadedCustomPalettes(customs));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);

Sidebar.defaultProps = {
  maxHeight: 700,
  visibleEvents: {}
};
Sidebar.propTypes = {
  activeString: PropTypes.string,
  activeTab: PropTypes.string,
  changeTab: PropTypes.func,
  collapseExpandToggle: PropTypes.func,
  collapseSidebar: PropTypes.func,
  config: PropTypes.object,
  hasLocalStorage: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isCompareMode: PropTypes.bool,
  isDataDisabled: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  loadedCustomPalettes: PropTypes.func,
  numberOfLayers: PropTypes.number,
  onTabClick: PropTypes.func,
  screenHeight: PropTypes.number,
  tabTypes: PropTypes.object
};
