import React from 'react';
import PropTypes from 'prop-types';
import Button from '../util/button';
import ModeSelection from './mode-selection';
import googleTagManager from 'googleTagManager';
import { get as lodashGet } from 'lodash';
import { toggleCompareOnOff, changeMode } from '../../modules/compare/actions';
import { connect } from 'react-redux';
import {
  getSelectionCounts,
  getDataSelectionSize
} from '../../modules/data/selectors';
import ProductPicker from '../layer/product-picker/product-picker';
import { openCustomContent } from '../../modules/modal/actions';
import { DATA_GET_DATA_CLICK } from '../../modules/data/constants';

class FooterContent extends React.Component {
  render() {
    const {
      showListAllButton,
      isCompareActive,
      compareMode,
      isMobile,
      events,
      activeTab,
      filterEventList,
      onGetData,
      changeCompareMode,
      addLayers,
      toggleCompare,
      counts,
      dataSelectionSize,
      compareFeature
    } = this.props;
    if (activeTab === 'layers') {
      return (
        <React.Fragment>
          <ModeSelection
            isActive={isCompareActive}
            selected={compareMode}
            onclick={changeCompareMode}
          />
          <div className="product-buttons">
            <Button
              text="+ Add Layers"
              id="layers-add"
              className="layers-add red"
              onClick={e => {
                e.stopPropagation();
                addLayers();
                googleTagManager.pushEvent({
                  event: 'add_layers'
                });
              }}
            />
            <Button
              onClick={e => {
                e.stopPropagation();
                toggleCompare();
                googleTagManager.pushEvent({
                  event: 'comparison_mode'
                });
              }}
              className="compare-toggle-button"
              id="compare-toggle-button"
              style={isMobile || !compareFeature ? { display: 'none' } : null}
              text={!isCompareActive ? 'Start Comparison' : 'Exit Comparison'}
            />
          </div>
        </React.Fragment>
      );
    } else if (activeTab === 'events') {
      return (
        <div
          className="events-footer-case"
          style={
            !showListAllButton || !events
              ? { display: 'none' }
              : { display: 'block' }
          }
        >
          <p>Only selected events and events in current map view are listed</p>
          <Button
            className="red"
            onClick={e => {
              e.stopPropagation();
              if (filterEventList) {
                filterEventList(true);
                googleTagManager.pushEvent({
                  event: 'natural_events_list_all'
                });
              }
            }}
            text="List All"
          />
        </div>
      );
    } else {
      var countArray = Object.values(counts);
      var noDataSelected =
        countArray.length === 0
          ? true
          : countArray.reduce((a, b) => a + b, 0) === 0;
      return (
        <div className="data-download-footer-case">
          <Button
            onClick={e => {
              e.stopPropagation();
              onGetData();
              googleTagManager.pushEvent({
                event: 'data_download_button'
              });
            }}
            className={
              noDataSelected
                ? 'wv-data-download-button black no-pointer-events'
                : 'wv-data-download-button red'
            }
            id="compare-toggle-button"
            text={
              dataSelectionSize
                ? 'Download Data (' +
                  Math.round(dataSelectionSize * 100) / 100 +
                  ' MB)'
                : noDataSelected
                  ? 'No Data Selected'
                  : 'Download Selected Data'
            }
          />
        </div>
      );
    }
  }
}
const mapDispatchToProps = dispatch => ({
  toggleCompare: () => {
    dispatch(toggleCompareOnOff());
  },
  changeCompareMode: str => {
    dispatch(changeMode(str));
  },
  onGetData: () => {
    dispatch({ type: DATA_GET_DATA_CLICK });
  },
  addLayers: () => {
    dispatch(
      openCustomContent('LAYER_PICKER_COMPONENT', {
        headerText: null,
        modalClassName: 'custom-layer-dialog light',
        backdrop: true,
        CompletelyCustomModal: ProductPicker,
        wrapClassName: ''
      })
    );
  }
});
function mapStateToProps(state, ownProps) {
  const { activeTab } = ownProps;
  const { requestedEvents, config, layers, data, compare } = state;
  const { showAll } = state.events;
  const { selectedGranules } = data;
  const showListAllButton = !showAll;
  const events = lodashGet(requestedEvents, 'response');
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const activeLayers = layers[activeString];
  const counts = getSelectionCounts(activeLayers, selectedGranules);
  const dataSelectionSize = getDataSelectionSize(selectedGranules);

  return {
    showListAllButton,
    activeTab,
    events,
    counts,
    dataSelectionSize,
    compareFeature: config.features.compare,
    isCompareActive: compare.active,
    compareMode: compare.mode
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FooterContent);

FooterContent.propTypes = {
  showListAllButton: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  compareMode: PropTypes.string,
  isMobile: PropTypes.bool,
  events: PropTypes.array,
  activeTab: PropTypes.string,
  filterEventList: PropTypes.func,
  onGetData: PropTypes.func,
  changeCompareMode: PropTypes.func,
  addLayers: PropTypes.func,
  toggleCompare: PropTypes.func,
  counts: PropTypes.object,
  dataSelectionSize: PropTypes.number,
  compareFeature: PropTypes.bool
};
