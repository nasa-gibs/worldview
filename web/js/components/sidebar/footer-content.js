import React from 'react';
import PropTypes from 'prop-types';
import Button from '../util/button';
import ModeSelection from './mode-selection';
import googleTagManager from 'googleTagManager';

class FooterContent extends React.Component {
  render() {
    const {
      showListAllButton,
      isCompareMode,
      comparisonType,
      isMobile,
      eventsData,
      activeTab,
      filterEventList,
      onGetData,
      changeCompareMode,
      addLayers,
      toggleMode,
      getDataSelectionCounts,
      getDataSelectionSize,
      compareFeature
    } = this.props;
    if (activeTab === 'layers') {
      return (
        <React.Fragment>
          <ModeSelection
            isActive={isCompareMode}
            selected={comparisonType}
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
                toggleMode();
                googleTagManager.pushEvent({
                  event: 'comparison_mode'
                });
              }}
              className="compare-toggle-button"
              id="compare-toggle-button"
              style={isMobile || !compareFeature ? { display: 'none' } : null}
              text={!isCompareMode ? 'Start Comparison' : 'Exit Comparison'}
            />
          </div>
        </React.Fragment>
      );
    } else if (activeTab === 'events') {
      return (
        <div
          className="events-footer-case"
          style={
            !showListAllButton || !eventsData.events.length
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
      var counts = getDataSelectionCounts();
      var validSize = getDataSelectionSize();
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
              validSize
                ? 'Download Data (' + Math.round(validSize * 100) / 100 + ' MB)'
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

FooterContent.propTypes = {
  showListAllButton: PropTypes.bool,
  isCompareMode: PropTypes.bool,
  comparisonType: PropTypes.string,
  isMobile: PropTypes.bool,
  eventsData: PropTypes.object,
  activeTab: PropTypes.string,
  filterEventList: PropTypes.func,
  onGetData: PropTypes.func,
  changeCompareMode: PropTypes.func,
  addLayers: PropTypes.func,
  toggleMode: PropTypes.func,
  getDataSelectionCounts: PropTypes.func,
  getDataSelectionSize: PropTypes.func,
  compareFeature: PropTypes.bool
};
export default FooterContent;
