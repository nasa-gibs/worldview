import React from 'react';
import PropTypes from 'prop-types';
import SearchLayerRow from './search-row';
import CategoryLayerRow from './category-row';
import Scrollbars from '../util/scrollbar';
import util from '../../util/util';
import 'whatwg-fetch'; // fetch() polyfill for IE

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class LayerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filteredRows: props.filteredRows,
      expandedMetadataLayers: [],
      expandedDateRangesLayers: [],
      sourceMetadata: {},
      expandedMeasurements: props.expandedMeasurements,
      activeLayers: props.activeLayers,
      height: props.height,
      listType: props.listType,
      selectedProjection: props.selectedProjection
    };
  }
  toggleMeasurementExpansion(measurementId) {
    var { expandedMeasurements } = this.state;
    if (expandedMeasurements.measurementId) {
    }
  }
  /*
   * Toggles expansion of metadata for a layer given that layer's ID and makes
   * an AJAX request for the metadata if it's missing
   *
   * @method toggleMetadataExpansion
   * @param {string} layer - the layer to be toggled
   * @return {void}
   */
  toggleMetadataExpansion(layerId) {
    var { filteredRows, expandedMetadataLayers } = this.state;
    var isMetadataExpanded = expandedMetadataLayers.find(id => id === layerId);
    if (isMetadataExpanded) {
      expandedMetadataLayers.splice(expandedMetadataLayers.indexOf(layerId), 1);
      expandedMetadataLayers = expandedMetadataLayers.filter(
        id => id !== layerId
      );
    } else {
      expandedMetadataLayers.push(layerId);
      this.setState({ expandedMetadataLayers: expandedMetadataLayers });
      var layer = filteredRows.find(l => l.id === layerId);
      if (!layer.metadata) {
        var { origin, pathname } = window.location;
        var errorMessage = '<p>There was an error loading layer metadata.</p>';
        var uri = `${origin}${pathname}config/metadata/${
          layer.description
        }.html`;
        fetch(uri)
          .then(res => (res.ok ? res.text() : errorMessage))
          .then(body => {
            // Check that we have a metadata html snippet, rather than a fully
            // formed HTML file. Also avoid executing any script or style tags.
            var isMetadataSnippet = !body.match(
              /<(head|body|html|style|script)[^>]*>/i
            );
            layer.metadata = isMetadataSnippet ? body : errorMessage;
            this.setState({ layers: filteredRows });
          });
      }
    }
  }
  getSourceMetadata(source) {
    util.get('config/metadata/' + source.description + '.html').then(data => {
      if (data) {
        let sourceMetadata = this.state.sourceMetadata;
        sourceMetadata[source.id] = { data: data };
        this.setState({ sourceMetaData: sourceMetadata });
      }
    });
  }
  /*
   * Toggles expansion of date ranges for a layer given that layer's ID
   *
   * @method toggleDateRangesExpansion
   * @param {string} layer - The layer being toggled
   * @return {void}
   */
  toggleDateRangesExpansion(layerId) {
    var { expandedDateRangesLayers } = this.state;
    var isDateRangesExpanded = expandedDateRangesLayers.find(
      id => id === layerId
    );
    if (isDateRangesExpanded) {
      expandedDateRangesLayers = expandedDateRangesLayers.filter(
        id => id !== layerId
      );
    } else {
      expandedDateRangesLayers.push(layerId);
      this.setState({ expandedDateRangesLayers: expandedDateRangesLayers });
    }
  }
  updateSelectedMeasurement(id) {
    if (this.state.selectedMeasurement !== id) {
      this.setState({ selectedMeasurement: id });
    } else {
      this.setState({ selectedMeasurement: null });
    }
  }
  renderCategoryList() {
    const {
      expandedMeasurements,
      selectedMeasurement,
      category,
      activeLayers,
      selectedProjection,
      activeMeasurementIndex,
      sourceMetadata
    } = this.state;
    const {
      measurementConfig,
      layerConfig,
      addLayer,
      removeLayer,
      hasMeasurementSource,
      hasMeasurementSetting
    } = this.props;
    return (
      <div id={category.id + '-list'}>
        {category.measurements.map((measurement, index) => {
          var current = measurementConfig[measurement];
          var isMeasurementExpanded = !!expandedMeasurements[current.id];
          var isSelected = selectedMeasurement === current.id;
          if (hasMeasurementSource(current)) {
            return (
              <CategoryLayerRow
                key={current.id}
                id={current.id}
                index={index}
                activeLayers={activeLayers}
                category={category}
                measurement={current}
                sourceMetadata={sourceMetadata}
                measurementConfig={measurementConfig}
                layerConfig={layerConfig}
                isExpanded={isMeasurementExpanded}
                hasMeasurementSetting={hasMeasurementSetting}
                addLayer={addLayer}
                removeLayer={removeLayer}
                projection={selectedProjection}
                isSelected={isSelected}
                getSourceMetadata={this.getSourceMetadata.bind(this)}
                updateSelectedMeasurement={this.updateSelectedMeasurement.bind(
                  this
                )}
                activeMeasurementIndex={activeMeasurementIndex}
                toggleMetadataExpansion={id => this.toggleMetadataExpansion(id)}
              />
            );
          }
        })}
      </div>
    );
  }
  renderSearchList(filteredRows) {
    const {
      expandedMetadataLayers,
      expandedDateRangesLayers,
      activeLayers
    } = this.state;
    var { addLayer, removeLayer } = this.props;
    return filteredRows.length < 1 ? (
      <div>No results.</div>
    ) : (
      filteredRows.map(layer => {
        var isEnabled = activeLayers.some(l => l.id === layer.id);
        var isMetadataExpanded = expandedMetadataLayers.includes(layer.id);
        var isDateRangesExpanded = expandedDateRangesLayers.includes(layer.id);
        return (
          <SearchLayerRow
            key={layer.id}
            layer={layer}
            isEnabled={isEnabled}
            isMetadataExpanded={isMetadataExpanded}
            isDateRangesExpanded={isDateRangesExpanded}
            onState={addLayer}
            offState={removeLayer}
            toggleMetadataExpansion={id => this.toggleMetadataExpansion(id)}
            toggleDateRangesExpansion={id => this.toggleDateRangesExpansion(id)}
          />
        );
      })
    );
  }
  render() {
    var { filteredRows, height, listType } = this.state;
    return (
      <Scrollbars style={{ maxHeight: height + 'px' }}>
        <div className="layer-picker-list-case">
          {listType === 'search'
            ? this.renderSearchList(filteredRows)
            : this.renderCategoryList()}
        </div>
      </Scrollbars>
    );
  }
  _setListRef(ref) {
    this._layerList = ref;
  }
}
LayerList.defaultProps = {
  listType: 'search',
  expandedMeasurements: {},
  activeMeasurementIndex: 0
};
LayerList.propTypes = {
  addLayer: PropTypes.func,
  removeLayer: PropTypes.func,
  activeLayers: PropTypes.array,
  filteredRows: PropTypes.array,
  height: PropTypes.number,
  listType: PropTypes.string,
  expandedMeasurements: PropTypes.object,
  activeMeasurementIndex: PropTypes.number,
  selectedProjection: PropTypes.string
};

export default LayerList;
