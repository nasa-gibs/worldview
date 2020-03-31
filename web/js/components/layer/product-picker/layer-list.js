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
  /**
   * Handle selecting/showing metadata when there is only a single search result
   */
  componentDidMount() {
    const { selectedLayer } = this.props;
    if (selectedLayer && selectedLayer.id) {
      this.showLayerMetadata(selectedLayer.id);
    }
  }

  /**
   * Handle selecting/showing metadata when there is only a single search result
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { selectedLayer } = this.props;
    if (prevProps.selectedLayer !== selectedLayer) {
      const id = selectedLayer ? selectedLayer.id : null;
      this.showLayerMetadata(id);
    }
  }

  /**
   * Loads metadata for layer (if not previously loaded) and
   * triggers showing in layer detail area
   *
   * @param {string} layerId - the layer id to show metadata for
   * @return {void}
   */
  showLayerMetadata(layerId) {
    const {
      filteredRows,
      selectedLayer,
      showMetadataForLayer,
    } = this.props;
    const layer = filteredRows.find((l) => l.id === layerId);

    // No result found, clear the metadata detail view by passing null
    if (!layerId) {
      showMetadataForLayer(null);
      return;
    }

    // Single result, auto selected, and we have the metadata for it already
    if (selectedLayer && selectedLayer.id === layerId && layer.metadata) {
      return;
    }

    if (!layer.metadata) {
      const errorMessage = '<p>There was an error loading layer metadata.</p>';
      const uri = `config/metadata/layers/${layer.description}.html`;
      fetch(uri)
        .then((res) => (res.ok ? res.text() : errorMessage))
        .then((body) => {
          // Check that we have a metadata html snippet, rather than a fully
          // formed HTML file. Also avoid executing any script or style tags.
          const isMetadataSnippet = !body.match(/<(head|body|html|style|script)[^>]*>/i);
          layer.metadata = isMetadataSnippet ? body : errorMessage;
          showMetadataForLayer(layer);
        });
    } else {
      showMetadataForLayer(layer);
    }
  }

  renderCategoryList() {
    const {
      isMobile,
      measurementConfig,
      layerConfig,
      addLayer,
      removeLayer,
      activeLayers,
      selectedProjection,
      selectedMeasurement,
      hasMeasurementSource,
      hasMeasurementSetting,
      updateSelectedMeasurement,
      category,
      categoryConfig,
      setSourceIndex,
      selectedDate,
      selectedMeasurementSourceIndex,
    } = this.props;

    const categoryToUse = category || categoryConfig.All;
    return (
      <div id={`${categoryToUse.id}-list`}>
        {
          // eslint-disable-next-line array-callback-return
          categoryToUse.measurements.map((measurement, index) => {
            const current = measurementConfig[measurement];
            const isSelected = selectedMeasurement === current.id;
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
                  hasMeasurementSetting={hasMeasurementSetting}
                  addLayer={addLayer}
                  removeLayer={removeLayer}
                  projection={selectedProjection}
                  isSelected={isSelected}
                  selectedDate={selectedDate}
                  isMobile={isMobile}
                  updateSelectedMeasurement={updateSelectedMeasurement}
                  setSourceIndex={setSourceIndex}
                  selectedMeasurementSourceIndex={selectedMeasurementSourceIndex}
                />
              );
            }
          })
        }
      </div>
    );
  }

  renderSearchList(filteredRows) {
    const {
      addLayer,
      removeLayer,
      selectedLayer,
      activeLayers,
      isMobile,
    } = this.props;

    return (
      filteredRows.map((layer) => {
        const isEnabled = activeLayers.some((l) => l.id === layer.id);
        const isMetadataShowing = selectedLayer && layer.id === selectedLayer.id;
        return (
          <SearchLayerRow
            key={layer.id}
            layer={layer}
            isEnabled={isEnabled}
            isMetadataShowing={isMetadataShowing}
            onState={addLayer}
            offState={removeLayer}
            isMobile={isMobile}
            showLayerMetadata={(id) => this.showLayerMetadata(id)}
            toggleDateRangesExpansion={(id) => this.toggleDateRangesExpansion(id)}
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
  listType: 'search',
};
LayerList.propTypes = {
  activeLayers: PropTypes.array,
  addLayer: PropTypes.func,
  category: PropTypes.object,
  categoryConfig: PropTypes.object,
  filteredRows: PropTypes.array,
  hasMeasurementSetting: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  isMobile: PropTypes.bool,
  layerConfig: PropTypes.object,
  listType: PropTypes.string,
  measurementConfig: PropTypes.object,
  removeLayer: PropTypes.func,
  selectedDate: PropTypes.object,
  selectedLayer: PropTypes.object,
  selectedMeasurement: PropTypes.string,
  selectedMeasurementSourceIndex: PropTypes.number,
  selectedProjection: PropTypes.string,
  setSourceIndex: PropTypes.func,
  showMetadataForLayer: PropTypes.func,
  updateSelectedMeasurement: PropTypes.func,
};

export default LayerList;
