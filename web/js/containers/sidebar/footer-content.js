import React from 'react';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import { connect } from 'react-redux';
import {
  UncontrolledTooltip,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../components/util/button';
import ModeSelection from '../../components/sidebar/mode-selection';
import { toggleCompareOnOff, changeMode } from '../../modules/compare/actions';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';
import { getEventsFilteredCategories } from '../../modules/natural-events/selectors';
import { LIMIT_EVENT_REQUEST_COUNT } from '../../modules/natural-events/constants';

const FooterContent = React.forwardRef((props, ref) => {
  const {
    isCompareActive,
    compareMode,
    isMobile,
    isPlaying,
    activeTab,
    changeCompareMode,
    addLayers,
    toggleCompare,
    compareFeature,
    eventsData,
  } = props;
  const compareBtnText = !isCompareActive
    ? `Start Comparison${isMobile ? ' Mode' : ''}`
    : `Exit Comparison${isMobile ? ' Mode' : ''}`;

  const onClickAddLayers = (e) => {
    e.stopPropagation();
    addLayers(isPlaying);
    googleTagManager.pushEvent({ event: 'add_layers' });
  };

  const onClickToggleCompare = (e) => {
    e.stopPropagation();
    toggleCompare();
    googleTagManager.pushEvent({ event: 'comparison_mode' });
  };

  const renderLayersFooter = () => (
    <>
      <ModeSelection
        isActive={isCompareActive}
        isMobile={isMobile}
        selected={compareMode}
        onclick={changeCompareMode}
      />
      <div className="product-buttons">
        <Button
          id="layers-add"
          aria-label="Add layers"
          className="layers-add red"
          text="+ Add Layers"
          onClick={onClickAddLayers}
        />
        <Button
          id="compare-toggle-button"
          aria-label={compareBtnText}
          className="compare-toggle-button"
          style={!compareFeature ? { display: 'none' } : null}
          onClick={onClickToggleCompare}
          text={compareBtnText}
        />
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
                events matched the current filter criteria.
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

const mapDispatchToProps = (dispatch) => ({
  toggleCompare: () => {
    dispatch(toggleCompareOnOff());
  },
  changeCompareMode: (str) => {
    dispatch(changeMode(str));
  },
  addLayers: (isPlaying) => {
    if (isPlaying) {
      dispatch(stopAnimationAction());
    }
    dispatch(
      openCustomContent('LAYER_PICKER_COMPONENT', {
        headerText: null,
        modalClassName: 'custom-layer-dialog light',
        backdrop: true,
        CompletelyCustomModal: SearchUiProvider,
        wrapClassName: '',
      }),
    );
  },
});

const mapStateToProps = (state) => {
  const {
    animation, config, compare, browser,
  } = state;
  const { isPlaying } = animation;
  const eventsData = getEventsFilteredCategories(state);

  return {
    isMobile: browser.lessThan.medium,
    isPlaying,
    compareFeature: config.features.compare,
    isCompareActive: compare.active,
    compareMode: compare.mode,
    eventsData,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true },
)(FooterContent);

FooterContent.propTypes = {
  activeTab: PropTypes.string,
  addLayers: PropTypes.func,
  changeCompareMode: PropTypes.func,
  compareFeature: PropTypes.bool,
  compareMode: PropTypes.string,
  eventsData: PropTypes.array,
  isCompareActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isPlaying: PropTypes.bool,
  toggleCompare: PropTypes.func,
};
