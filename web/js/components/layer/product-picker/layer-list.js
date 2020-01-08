import React from 'react';
import PropTypes from 'prop-types';
import SearchLayerRow from './search-layer-row';
import CategoryLayerRow from './category-layer-row';
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
      loadedMetadataLayers: [],
      expandedDateRangesLayers: [],
      expandedMeasurements: props.expandedMeasurements,
      selectedLayer: null,
      selectedProjection: props.selectedProjection
    };
  }

  /*
   * Toggles expansion of metadata for a layer given that layer's ID and makes
   * an AJAX request for the metadata if it's missing
   *
   * @method showLayerMetadata
   * @param {string} layer - the layer to be toggled
   * @return {void}
   */
  showLayerMetadata(layerId) {
    var { loadedMetadataLayers } = this.state;
    var { filteredRows, showMetadataForLayer } = this.props;
    const isMetadataExpanded = loadedMetadataLayers.find(id => id === layerId);
    const layer = filteredRows.find(l => l.id === layerId);

    if (isMetadataExpanded) {
      loadedMetadataLayers.splice(loadedMetadataLayers.indexOf(layerId), 1);
      loadedMetadataLayers = loadedMetadataLayers.filter(
        id => id !== layerId
      );
      showMetadataForLayer(layer);
      this.setState({
        selectedLayer: layerId
      });
    } else {
      loadedMetadataLayers.push(layerId);
      this.setState({
        loadedMetadataLayers: loadedMetadataLayers,
        selectedLayer: layerId
      });

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
            showMetadataForLayer(layer);
          });
      } else {
        showMetadataForLayer(layer);
      }
    }
  }

  renderCategoryList() {
    const {
      expandedMeasurements
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
      categoryConfig,
      setSourceIndex,
      selectedDate
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
                measurementConfig={measurementConfig}
                layerConfig={layerConfig}
                isExpanded={isMeasurementExpanded}
                hasMeasurementSetting={hasMeasurementSetting}
                addLayer={addLayer}
                removeLayer={removeLayer}
                projection={selectedProjection}
                isSelected={isSelected}
                updateSelectedMeasurement={updateSelectedMeasurement}
                setSourceIndex={setSourceIndex}
                selectedDate={selectedDate}
              />
            );
          }
        })}
      </div>
    );
  }

  renderSearchList(filteredRows) {
    const {
      loadedMetadataLayers,
      expandedDateRangesLayers,
      selectedLayer
    } = this.state;
    const { addLayer, removeLayer, activeLayers } = this.props;

    return filteredRows.length < 1 ? (
      <h3 className="no-results"> No results found. </h3>
    ) : (
      filteredRows.map(layer => {
        const isEnabled = activeLayers.some(l => l.id === layer.id);
        const isMetadataExpanded = loadedMetadataLayers.includes(layer.id);
        const isMetadataShowing = isMetadataExpanded && layer.id === selectedLayer;
        const isDateRangesExpanded = expandedDateRangesLayers.includes(layer.id);
        return (
          <SearchLayerRow
            key={layer.id}
            layer={layer}
            isEnabled={isEnabled}
            isMetadataShowing={isMetadataShowing}
            isDateRangesExpanded={isDateRangesExpanded}
            onState={addLayer}
            offState={removeLayer}
            showLayerMetadata={id => this.showLayerMetadata(id)}
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
}
LayerList.defaultProps = {
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
  selectedDate: PropTypes.object,
  selectedMeasurement: PropTypes.string,
  selectedProjection: PropTypes.string,
  setSourceIndex: PropTypes.func,
  showMetadataForLayer: PropTypes.func,
  updateSelectedMeasurement: PropTypes.func
};

export default LayerList;
