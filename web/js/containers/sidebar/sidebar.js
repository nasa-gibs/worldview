import { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  get as lodashGet,
  isEqual as lodashEqual,
} from 'lodash';
import { TabContent, TabPane } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import LayersContainer from './layers-container';
import ChartingLayerMenu from './charting';
import Events from './events';
import SmartHandoff from './smart-handoff';
import CompareCase from './compare';
import FooterContent from './footer-content';
import AddLayersContent from './add-layers-content';
import CollapsedButton from '../../components/sidebar/collapsed-button';
import NavCase from '../../components/sidebar/nav/nav-case';
import {
  loadCustom as loadCustomPalette,
} from '../../modules/palettes/util';
import {
  loadedCustomPalettes as loadedCustomPalettesAction,
} from '../../modules/palettes/actions';
import { getSelectedDate } from '../../modules/date/selectors';
import { getPermalink } from '../../modules/link/util';

import {
  requestEvents as requestEventsActionCreator,
  requestSources as requestSourcesActionCreator,
} from '../../modules/natural-events/actions';
import { getAllActiveLayers } from '../../modules/layers/selectors';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import ErrorBoundary from '../error-boundary';
import {
  changeTab as changeTabAction,
  toggleSidebarCollapse as toggleSidebarCollapseAction,
  expandSidebar as expandSidebarAction,
} from '../../modules/sidebar/actions';
import history from '../../main';
import safeLocalStorage from '../../util/local-storage';
import usePrevious from '../../util/customHooks';

const { SIDEBAR_COLLAPSED } = safeLocalStorage.keys;

const getActiveTabs = function(config) {
  const { features } = config;
  return {
    download: features.smartHandoffs,
    layers: true,
    events: features.naturalEvents,
  };
};

function Sidebar(props) {
  const {
    activeTab,
    activeString,
    changeTab,
    chartingModeAccessible,
    collapseExpandToggle,
    config,
    displayStaticMap,
    eventsData,
    eventsSources,
    hasEventRequestError,
    isCollapsed,
    isCompareMode,
    isChartMode,
    isDataDisabled,
    isDistractionFreeModeActive,
    isEmbedModeActive,
    isKioskModeActive,
    isLoadingEvents,
    isMobile,
    loadedCustomPalettes,
    mapIsRendered,
    numberOfLayers,
    onTabClick,
    requestEvents,
    requestSources,
    screenHeight,
    selectedDate,
    selectedMap,
    tabTypes,
  } = props;

  const [subComponentHeight, setSubComponentHeight] = useState(700);
  const [isEventsTabDisabledEmbed, setIsEventsTabDisabledEmbed] = useState(false);
  const [sidebarHeight, setSidebarHeight] = useState(0);

  const sidebarElementRef = useRef(null);
  const addLayersElementRef = useRef(null);
  const footerElementRef = useRef(null);

  const prevActiveTab = usePrevious(activeTab);
  const prevSelectedMap = usePrevious(selectedMap);
  const prevMapIsRendered = usePrevious(mapIsRendered);

  function updateDimensions() {
    const footerHeight = lodashGet(footerElementRef, 'current.clientHeight') || 20;
    const addLayersHeight = lodashGet(addLayersElementRef, 'current.clientHeight') || 30;
    const compareModeHeight = isCompareMode ? 80 : 40;
    const tabHeight = isMobile ? compareModeHeight : 32;
    const groupCheckboxHeight = 35;
    let newHeight;
    if (!isMobile) {
      const iconHeight = 53;
      const topOffset = 10;
      const basePadding = 130;
      newHeight = screenHeight -
        (iconHeight + topOffset + tabHeight + groupCheckboxHeight +
          basePadding + footerHeight + addLayersHeight) -
        10;
    } else {
      newHeight = screenHeight - (tabHeight + groupCheckboxHeight + footerHeight + addLayersHeight);
    }
    if (isChartMode && newHeight > 300) {
      newHeight -= 130;
    }
    // Issue #1415: This was checking for subComponentHeight !== newHeight.
    // Sometimes it would get stuck in a loop in which the newHeight
    // would vary by a single pixel on each render. Hack fix is to
    // only update when changed by more than a single pixel. This probably
    // needs a refactoring.
    if (Math.abs(subComponentHeight - newHeight) > 1) {
      setSubComponentHeight(newHeight);
    }
  }

  // componentDidMount
  useEffect(() => {
    const customPalettePromise = loadCustomPalette(config);
    customPalettePromise.then((customs) => {
      loadedCustomPalettes(customs);
    });
    requestSources();
    // prevent events tab if embed init layers tab
    if (isEmbedModeActive && activeTab === 'layers') {
      setIsEventsTabDisabledEmbed(true);
    }
  }, []);

  // componentDidUpdate
  useEffect(() => {
    const mapChange = mapIsRendered && !lodashEqual(selectedMap, prevSelectedMap);
    const mapRenderedChange = mapIsRendered && mapIsRendered !== prevMapIsRendered;
    const tabChange = activeTab !== prevActiveTab;
    const firstLoad = tabChange && !isLoadingEvents && (!eventsData || !eventsData.length);

    if (activeTab === 'events' && (mapRenderedChange || mapChange || firstLoad)) {
      requestEvents();
    }
    updateDimensions();
    const sidebarHeightNew = lodashGet(sidebarElementRef, 'current.clientHeight');
    if (sidebarHeightNew !== sidebarHeight) {
      setSidebarHeight(sidebarHeightNew);
    }
  });

  function toggleSidebar() {
    const isNowCollapsed = !isCollapsed;
    if (isMobile) {
      return collapseExpandToggle();
    }
    googleTagManager.pushEvent({
      event: 'sidebar_chevron',
    });
    const storageValue = isNowCollapsed ? 'collapsed' : 'expanded';
    safeLocalStorage.setItem(SIDEBAR_COLLAPSED, storageValue);
    return collapseExpandToggle();
  }

  function getProductsToRender(activeTabArg, isCompareModeArg, isChartModeArg) {
    if (isCompareModeArg) {
      return (
        <CompareCase
          isActive={activeTabArg === 'layers'}
          height={subComponentHeight}
        />
      );
    } if (isChartModeArg) {
      return (
        <ChartingLayerMenu
          height={subComponentHeight}
          isActive={activeTabArg === 'layers'}
          compareState={activeString}
          chartState={isChartModeArg}
          chartingModeAccessible={chartingModeAccessible}
        />
      );
    } if (!isCompareModeArg && !isChartModeArg) {
      return (
        <LayersContainer
          height={subComponentHeight}
          isActive={activeTabArg === 'layers'}
          compareState={activeString}
        />
      );
    }
    return undefined;
  }

  function handleWorldviewLogoClick(e, permalink) {
    e.preventDefault();
    if (window.location.search === '') return; // Nothing to reset
    let msg;
    if (isEmbedModeActive) {
      msg = 'Do you want to open full featured @NAME@ in a new tab with current content loaded?';

      if (window.confirm(msg)) {
        window.open(permalink, '_blank');
      }
    } else {
      msg = 'Do you want to reset @NAME@ to its defaults? You will lose your current state.';

      if (window.confirm(msg)) {
        googleTagManager.pushEvent({
          event: 'logo_page_reset',
        });
        document.location.href = '/';
      }
    }
  }

  function renderSidebarLogo() {
    const permalink = getPermalink(history.location.search, selectedDate);
    const WVLogoTitle = isEmbedModeActive
      ? 'Click to Open This @NAME@ Map in a New Tab'
      : 'Click to Reset @NAME@ to Defaults';
    const embedWVLogoLink = isEmbedModeActive ? permalink : '/';
    const mobileImgURL = 'brand/images/wv-logo-mobile.svg?v=@BUILD_NONCE@';
    const wvName = !isMobile ? 'Worldview' : '';

    const sidebarStyle = isMobile
      ? {
        background: `url(${mobileImgURL}) no-repeat center rgb(40 40 40 / 85%)`,
        display: 'block',
        height: '42px',
        width: '56px',
        padding: '5px',
        top: '10px',
        left: '10px',
        borderRadius: '5px',
        border: '1px solid #333',
        position: 'absolute',
      }
      : {
        background: `url(${mobileImgURL}) no-repeat 15px center/52px rgb(40 40 40 / 85%)`,
        display: 'block',
        width: '286px',
        height: '65px',
        padding: '10px 76px',
        position: 'absolute',
        top: '10px',
        left: '10px',
        borderRight: '1px solid #333',
        borderLeft: '1px solid #333',
        borderTop: '1px solid #333',
        borderBottom: 'transparent',
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px',
        boxSizing: 'border-box',
        fontFamily: 'Inter',
        fontWeight: '300',
        fontSize: '36px',
        textDecoration: 'none',
        color: '#fff',
        lineHeight: '45px',
      };

    return (
      isKioskModeActive
        ? (
          <span
            id="wv-logo"
            className={isDistractionFreeModeActive ? 'wv-logo-distraction-free-mode' : ''}
            style={sidebarStyle}
          >
            {wvName}
          </span>
        )
        : (
          <a
            href={embedWVLogoLink}
            title={WVLogoTitle}
            id="wv-logo"
            className={isDistractionFreeModeActive ? 'wv-logo-distraction-free-mode' : ''}
            style={sidebarStyle}
            onClick={(e) => handleWorldviewLogoClick(e, permalink)}
          >
            {wvName}
          </a>
        )
    );
  }

  if ((isMobile || isEmbedModeActive) && activeTab === 'download') changeTab('layers');
  const { naturalEvents } = config.features;
  const { smartHandoffs } = config.features;

  const embedModeHeight = isEmbedModeActive
    ? '95vh'
    : `${screenHeight}px`;
  const maxHeight = isCollapsed
    ? '0'
    : embedModeHeight;
  const displayStyle = isDistractionFreeModeActive ? 'none' : 'block';

  const mobileWVSidebarStyle = !isDistractionFreeModeActive && isMobile
    ? {
      position: 'static',
    }
    : null;

  const mobileProductHolderStyle = !isDistractionFreeModeActive && isMobile && !isEmbedModeActive
    ? {
      cssFloat: 'left',
      left: '0',
      minWidth: '238px',
      width: '100%',
      height: '100%',
      position: 'absolute !important',
      overflow: 'hidden',
      background: 'rgb(38 43 49)',
      top: '0',
      zIndex: 1000,
      maxHeight: `${maxHeight}`,
      display: `{${displayStyle}} !important`,
    }
    : {
      maxHeight: `${maxHeight}`,
    };
  const productsHolderStyle = isDistractionFreeModeActive && !isMobile
    ? {
      display: 'none',
    }
    : mobileProductHolderStyle;

  return (
    <ErrorBoundary>
      <section id="wv-sidebar" style={mobileWVSidebarStyle}>
        {!displayStaticMap && renderSidebarLogo()}
        {!isDistractionFreeModeActive && isCollapsed && (
          <CollapsedButton
            isMobile={isMobile}
            isEmbed={isEmbedModeActive}
            onclick={toggleSidebar}
            numberOfLayers={numberOfLayers}
          />
        )}
        <div
          id="products-holder"
          className="products-holder-case"
          style={productsHolderStyle}
          ref={(el) => { sidebarElementRef.current = el; }}
        >
          <NavCase
            activeTab={activeTab}
            onTabClick={onTabClick}
            tabTypes={tabTypes}
            isMobile={isMobile}
            toggleSidebar={toggleSidebar}
            isCompareMode={isCompareMode}
            isChartMode={isChartMode}
            isDataDisabled={isDataDisabled}
            isEventsTabDisabledEmbed={isEventsTabDisabledEmbed}
          />
          <TabContent activeTab={activeTab}>
            <TabPane tabId="layers">
              {getProductsToRender(activeTab, isCompareMode, isChartMode)}
              <AddLayersContent
                ref={(el) => { addLayersElementRef.current = el; }}
                isActive={activeTab === 'layers'}
                compareState={activeString}
              />
            </TabPane>
            {naturalEvents && activeTab === 'events' && (
              <TabPane tabId="events">
                <Events
                  height={subComponentHeight}
                  isLoading={isLoadingEvents}
                  hasRequestError={hasEventRequestError}
                  eventsData={eventsData}
                  sources={eventsSources}
                />
              </TabPane>
            )}
            {smartHandoffs && activeTab === 'download' && (
              <TabPane tabId="download">
                <SmartHandoff
                  isActive={activeTab === 'download'}
                  tabTypes={tabTypes}
                />
              </TabPane>
            )}
            {
              !isKioskModeActive && (
                <FooterContent
                  ref={(el) => { footerElementRef.current = el; }}
                  tabTypes={tabTypes}
                  activeTab={activeTab}
                  chartingModeAccessible={chartingModeAccessible}
                  sidebarHeight={sidebarHeight}
                />
              )
            }
          </TabContent>
        </div>
      </section>
    </ErrorBoundary>
  );
}

const mapStateToProps = (state) => {
  const {
    animation,
    compare,
    charting,
    config,
    embed,
    events,
    layers,
    measure,
    modal,
    map,
    requestedEvents,
    requestedEventSources,
    screenSize,
    sidebar,
    ui,
  } = state;

  const chartingModeAccessible = layers.active.layers.filter((layer) => Object.prototype.hasOwnProperty.call(layer, 'palette') && state.palettes.rendered[layer.palette.id] && state.palettes.rendered[layer.palette.id].maps[0].type === 'continuous' && layer.layerPeriod === 'Daily' && !layer.disableCharting).length > 0;
  const isLoadingEvents = requestedEvents.isLoading ||
    requestedEventSources.isLoading;
  const hasEventRequestError = !!(requestedEvents.error ||
    requestedEventSources.error);

  const eventsData = getFilteredEvents(state);
  const eventsSources = lodashGet(requestedEventSources, 'response');
  const { screenHeight } = screenSize;
  const { isDistractionFreeModeActive, isKioskModeActive, displayStaticMap } = ui;
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
  const isMobile = screenSize.isMobileDevice;
  // Collapse when Image download / GIF /  is open or measure tool active
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;
  const selectedMap = map && map.ui && map.ui.selected;

  return {
    activeTab,
    activeString,
    chartingModeAccessible,
    config,
    displayStaticMap,
    eventsData,
    eventsSources,
    numberOfLayers,
    hasEventRequestError,
    isCollapsed: isMobile ? mobileCollapsed : isCollapsed || shouldBeCollapsed,
    isCompareMode: compare.active,
    isChartMode: charting.active,
    isDataDisabled: events.isAnimatingToEvent,
    isDistractionFreeModeActive,
    isEmbedModeActive,
    isKioskModeActive,
    isLoadingEvents,
    isMobile,
    selectedMap,
    mapIsRendered: selectedMap && selectedMap.isRendered(),
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
    dispatch(loadedCustomPalettesAction(customs));
  },
  requestEvents: () => {
    dispatch(requestEventsActionCreator());
  },
  requestSources: () => {
    dispatch(requestSourcesActionCreator());
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
  chartingModeAccessible: PropTypes.bool,
  collapseExpandToggle: PropTypes.func,
  config: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  displayStaticMap: PropTypes.bool,
  eventsData: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  eventsSources: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  hasEventRequestError: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isCompareMode: PropTypes.bool,
  isChartMode: PropTypes.bool,
  isDataDisabled: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isKioskModeActive: PropTypes.bool,
  isLoadingEvents: PropTypes.bool,
  isMobile: PropTypes.bool,
  loadedCustomPalettes: PropTypes.func,
  mapIsRendered: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onTabClick: PropTypes.func,
  screenHeight: PropTypes.number,
  selectedMap: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  tabTypes: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  requestEvents: PropTypes.func,
  requestSources: PropTypes.func,
  selectedDate: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
};
