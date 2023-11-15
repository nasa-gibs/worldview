import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import {
  UncontrolledTooltip,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isMobileOnly, isTablet } from 'react-device-detect';
import googleTagManager from 'googleTagManager';
import ChartingInfo from '../../components/charting/charting-info';
import Button from '../../components/util/button';
import CompareModeOptions from '../../components/sidebar/compare-mode-options';
import ChartingModeOptions from '../../components/sidebar/charting-mode-options';
import { toggleCompareOnOff, changeMode } from '../../modules/compare/actions';
import {
  toggleChartingModeOnOff,
} from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import { LIMIT_EVENT_REQUEST_COUNT } from '../../modules/natural-events/constants';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import {
  toggleOverlayGroups as toggleOverlayGroupsAction,
} from '../../modules/layers/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

const FooterContent = React.forwardRef((props, ref) => {
  const {
    activeTab,
    changeCompareMode,
    chartingModeAccessible,
    chartFeature,
    compareMode,
    compareFeature,
    eventsData,
    isChartingActive,
    isCompareActive,
    isMobile,
    openChartingInfoModal,
    toggleCharting,
    toggleCompare,
    breakpoints,
    screenWidth,
    isPlaying,
    addLayers,
  } = props;

  const compareBtnText = !isCompareActive
    ? `Start Comparison${isMobile ? ' Mode' : ''}`
    : `Exit Comparison${isMobile ? ' Mode' : ''}`;

  const chartBtnText = !isChartingActive
    ? `Start Charting${isMobile ? ' Mode' : ''}`
    : `Exit Charting${isMobile ? ' Mode' : ''}`;

  const onClickToggleCompare = (e) => {
    e.stopPropagation();
    toggleCompare();
    googleTagManager.pushEvent({ event: 'comparison_mode' });
  };
  const onClickToggleCharting = (e) => {
    e.stopPropagation();
    toggleCharting();
    if (!isChartingActive) {
      openChartingInfoModal();
    }
    googleTagManager.pushEvent({ event: 'charting_mode' });
  };

  const onClickAddLayers = (e) => {
    e.stopPropagation();
    addLayers(isPlaying, isMobile, breakpoints, screenWidth);
    googleTagManager.pushEvent({ event: 'add_layers' });
  };

  const renderLayersFooter = () => (
    <>
      <div>
        <CompareModeOptions
          isActive={isCompareActive}
          isMobile={isMobile}
          selected={compareMode}
          onclick={changeCompareMode}
        />
        {isChartingActive && (
        <ChartingModeOptions
          isChartingActive={isChartingActive}
          isMobile={isMobile}
        />
        )}
      </div>
      <div className="product-buttons">
        {!isChartingActive
        && (
        <Button
          id="layers-add"
          aria-label="Add layers"
          className="layers-add red"
          text="+ Add Layers"
          onClick={onClickAddLayers}
        />
        )}
        {!isChartingActive
          && (
          <Button
            id="compare-toggle-button"
            aria-label={compareBtnText}
            className={!isChartingActive ? 'compare-toggle-button btn' : 'compare-toggle-button btn disabled'}
            style={!compareFeature ? { display: 'none' } : null}
            onClick={!isChartingActive ? onClickToggleCompare : null}
            text={compareBtnText}
          />
          )}
      </div>
      <div className="charting-button">
        {!isMobile && !isCompareActive && chartFeature
          && (
          <Button
            id="chart-toggle-button"
            aria-label={chartBtnText}
            className={!isCompareActive && chartingModeAccessible ? 'chart-toggle-button btn' : 'chart-toggle-button btn disabled'}
            style={!chartFeature ? { display: 'none' } : null}
            onClick={!isCompareActive && chartingModeAccessible ? onClickToggleCharting : null}
            text={chartBtnText}
          />
          )}
      </div>
    </>
  );

  const renderEventsFooter = () => {
    const eventLimitReach = eventsData && eventsData.length === LIMIT_EVENT_REQUEST_COUNT;
    const numEvents = eventsData ? eventsData.length : 0;
    return (
      <div className="event-count">
        {eventsData && eventLimitReach ? (
          <>
            <span>
              {`Showing the first ${numEvents} events`}
            </span>
            <FontAwesomeIcon id="filter-info-icon" icon="info-circle" />
            <UncontrolledTooltip
              placement="right"
              target="filter-info-icon"
            >
              <div>
                More than
                {` ${LIMIT_EVENT_REQUEST_COUNT} `}
                events match the current filter criteria. Narrow your search by date, event type and/or map view.
              </div>
            </UncontrolledTooltip>
          </>
        ) : (
          <span>
            {`Showing ${numEvents} events`}
          </span>
        )}
      </div>
    );
  };

  return (
    <footer ref={ref}>
      {activeTab === 'layers' && renderLayersFooter()}
      {activeTab === 'events' && renderEventsFooter()}
    </footer>
  );
});

const mapStateToProps = (state, ownProps) => {
  const {
    animation, config, compare, charting, screenSize,
  } = state;
  const { isPlaying } = animation;
  const eventsData = getFilteredEvents(state);
  return {
    breakpoints: screenSize.breakpoints,
    chartFeature: config.features.charting,
    compareMode: compare.mode,
    compareFeature: config.features.compare,
    eventsData,
    isChartingActive: charting.active,
    isCompareActive: compare.active,
    isMobile: screenSize.isMobileDevice,
    isPlaying,
    screenWidth: screenSize.screenWidth,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleCompare: () => {
    dispatch(toggleCompareOnOff());
  },
  changeCompareMode: (str) => {
    dispatch(changeMode(str));
  },
  toggleCharting: () => {
    dispatch(toggleChartingModeOnOff());
  },
  toggleOverlayGroups: () => {
    setTimeout(() => {
      dispatch(toggleOverlayGroupsAction());
    });
  },
  openChartingInfoModal: () => {
    // This is the charting tool info window from the wireframes
    dispatch(
      openCustomContent('CHARTING_INFO_MODAL', {
        headerText: 'Charting Tool',
        backdrop: false,
        bodyComponent: ChartingInfo,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'global-settings-modal toolbar-info-modal toolbar-modal',
      }),
    );
  },
  openChartingDateModal: () => {
    dispatch(
      openCustomContent('CHARTING_DATE_MODAL', {
        headerText: 'Charting Mode Date Selection',
        backdrop: false,
        bodyComponent: ChartingInfo,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'global-settings-modal toolbar-info-modal toolbar-modal',
      }),
    );
  },
  addLayers: (isPlaying) => {
    const modalClassName = isMobileOnly || isTablet ? 'custom-layer-dialog-mobile custom-layer-dialog light' : 'custom-layer-dialog light';
    if (isPlaying) {
      dispatch(stopAnimationAction());
    }
    dispatch(
      openCustomContent('LAYER_PICKER_COMPONENT', {
        headerText: null,
        modalClassName,
        backdrop: true,
        CompletelyCustomModal: SearchUiProvider,
        wrapClassName: '',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true },
)(FooterContent);

FooterContent.propTypes = {
  activeTab: PropTypes.string,
  changeCompareMode: PropTypes.func,
  chartFeature: PropTypes.bool,
  chartingModeAccessible: PropTypes.bool,
  compareFeature: PropTypes.bool,
  compareMode: PropTypes.string,
  eventsData: PropTypes.array,
  isChartingActive: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  openChartingInfoModal: PropTypes.func,
  toggleCompare: PropTypes.func,
  toggleCharting: PropTypes.func,
  breakpoints: PropTypes.object,
  isPlaying: PropTypes.bool,
  screenWidth: PropTypes.number,
  addLayers: PropTypes.func,
};
