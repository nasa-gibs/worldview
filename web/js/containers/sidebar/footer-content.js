import React from 'react';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import { get as lodashGet } from 'lodash';
import { connect } from 'react-redux';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import ModeSelection from '../../components/sidebar/mode-selection';
import { toggleCompareOnOff, changeMode } from '../../modules/compare/actions';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import { openCustomContent } from '../../modules/modal/actions';
import { toggleListAll } from '../../modules/natural-events/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';
import { getActiveLayers } from '../../modules/layers/selectors';

class FooterContent extends React.Component {
  constructor(props) {
    super(props);
    this.toggleListAll = this.toggleListAll.bind(this);
  }

  toggleListAll() {
    const {
      toggleListAll,
      showAll,
    } = this.props;
    toggleListAll();
    if (showAll) {
      googleTagManager.pushEvent({
        event: 'natural_events_current_view_only',
      });
    } else {
      googleTagManager.pushEvent({
        event: 'natural_events_show_all',
      });
    }
  }

  render() {
    const {
      isCompareActive,
      compareMode,
      isMobile,
      activeTab,
      changeCompareMode,
      addLayers,
      toggleCompare,
      compareFeature,
      showAll,
    } = this.props;
    const compareBtnText = !isCompareActive ? 'Start Comparison' : 'Exit Comparison';
    if (isCompareActive && isMobile) {
      toggleCompare();
    }
    if (activeTab === 'layers') {
      return (
        <>
          <ModeSelection
            isActive={isCompareActive}
            selected={compareMode}
            onclick={changeCompareMode}
          />
          <div className="product-buttons">
            <Button
              id="layers-add"
              aria-label="Add layers"
              className="layers-add red"
              text="+ Add Layers"
              onClick={(e) => {
                e.stopPropagation();
                addLayers();
                googleTagManager.pushEvent({
                  event: 'add_layers',
                });
              }}
            />
            <Button
              id="compare-toggle-button"
              aria-label={compareBtnText}
              className="compare-toggle-button"
              style={isMobile || !compareFeature ? { display: 'none' } : null}
              onClick={(e) => {
                e.stopPropagation();
                toggleCompare();
                googleTagManager.pushEvent({
                  event: 'comparison_mode',
                });
              }}
              text={compareBtnText}
            />
          </div>
        </>
      );
    } if (activeTab === 'events') {
      return (
        <div className="events-footer-case">
          <Checkbox
            className="red"
            id="events-footer-checkbox"
            label="Only show events in current view"
            onCheck={this.toggleListAll}
            text="List All"
            checked={!showAll}
          />
        </div>
      );
    }
    return (
      <div className="data-download-footer-case" />
    );
  }
}
const mapDispatchToProps = (dispatch) => ({
  toggleCompare: () => {
    dispatch(toggleCompareOnOff());
  },
  changeCompareMode: (str) => {
    dispatch(changeMode(str));
  },
  toggleListAll: () => {
    dispatch(toggleListAll());
  },
  addLayers: () => {
    dispatch(stopAnimationAction());
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
function mapStateToProps(state) {
  const {
    requestedEvents, config, compare, browser,
  } = state;
  const { showAll } = state.events;
  const events = lodashGet(requestedEvents, 'response');

  return {
    showAll,
    events,
    isMobile: browser.lessThan.medium,
    compareFeature: config.features.compare,
    isCompareActive: compare.active,
    compareMode: compare.mode,
    toggleListAll,
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FooterContent);

FooterContent.propTypes = {
  activeTab: PropTypes.string,
  addLayers: PropTypes.func,
  changeCompareMode: PropTypes.func,
  compareFeature: PropTypes.bool,
  compareMode: PropTypes.string,
  isCompareActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  showAll: PropTypes.bool,
  toggleCompare: PropTypes.func,
  toggleListAll: PropTypes.func,
};
