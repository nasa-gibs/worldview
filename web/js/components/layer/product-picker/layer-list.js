import React from 'react';
import PropTypes from 'prop-types';
import SearchLayerRow from './search-layer-row';
import CategoryLayerRow from './category-layer-row';
import util from '../../../util/util';
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
      expandedMetadataLayers: [],
      expandedDateRangesLayers: [],
      sourceMetadata: {},
      expandedMeasurements: props.expandedMeasurements,
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
    var { expandedMetadataLayers } = this.state;
    var { filteredRows } = this.props;
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
        var uri = `${origin}${pathname}config/metadata/layers/${
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
    if (source.description) {
      util.get('config/metadata/layers/' + source.description + '.html').then(data => {
        if (data) {
          const sourceMetadata = this.state.sourceMetadata;
          sourceMetadata[source.description] = { data: data };
          this.setState({ sourceMetaData: sourceMetadata });
        }
      });
    }
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

  renderCategoryList() {
    const {
      expandedMeasurements,
      activeMeasurementIndex,
      sourceMetadata
    } = this.state;
    const {
      measurementConfig,
      layerConfig,
      addLayer,
      category,
      removeLayer,
      selectedProjection,
      activeLayers,
      hasMeasurementSource,
      selectedMeasurement,
      hasMeasurementSetting,
      updateSelectedMeasurement,
      categoryConfig
    } = this.props;

    const categoryToUse = category || categoryConfig.All;
    return (
      <div id={categoryToUse.id + '-list'}>
        {categoryToUse.measurements.map((measurement, index) => {
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
                category={categoryToUse}
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
                updateSelectedMeasurement={updateSelectedMeasurement}
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
    const { expandedMetadataLayers, expandedDateRangesLayers } = this.state;
    var { addLayer, removeLayer, activeLayers } = this.props;
    return filteredRows.length < 1 ? (
      <div className="no-results"> No results. </div>
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
    const { filteredRows, listType } = this.props;
    return (
      <div className="layer-picker-list-case layers-all">
        {listType === 'search'
          ? this.renderSearchList(filteredRows)
          : this.renderCategoryList()}
      </div>
    );
  }

  _setListRef(ref) {
    this._layerList = ref;
  }
}
LayerList.defaultProps = {
  activeMeasurementIndex: 0,
  expandedMeasurements: {},
  listType: 'search'
};
LayerList.propTypes = {
  activeLayers: PropTypes.array,
  activeMeasurementIndex: PropTypes.number,
  addLayer: PropTypes.func,
  category: PropTypes.object,
  categoryConfig: PropTypes.object,
  expandedMeasurements: PropTypes.object,
  filteredRows: PropTypes.array,
  hasMeasurementSetting: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  layerConfig: PropTypes.object,
  listType: PropTypes.string,
  measurementConfig: PropTypes.object,
  removeLayer: PropTypes.func,
  selectedMeasurement: PropTypes.string,
  selectedProjection: PropTypes.string,
  updateSelectedMeasurement: PropTypes.func
};

export default LayerList;
