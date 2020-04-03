import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSearch } from '@elastic/react-search-ui';
import SearchLayerRow from './search-layer-row';
import CategoryLayerRow from './category-layer-row';
import 'whatwg-fetch'; // fetch() polyfill for IE
import {
  hasMeasurementSource as hasSourceeSelector,
} from '../../../modules/layers/selectors';
import {
  selectLayer as selectLayerAction,
} from '../../../modules/product-picker/actions';

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
      results,
      selectedLayer,
      selectLayer,
    } = this.props;
    const layer = results.find((l) => l.id === layerId);

    // No result found, clear the metadata detail view by passing null
    if (!layerId) {
      selectLayer(null);
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
          selectLayer(layer);
        });
    } else {
      selectLayer(layer);
    }
  }

  renderCategoryList() {
    const {
      measurementConfig,
      selectedMeasurement,
      hasMeasurementSource,
      category,
      categoryConfig,
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
                  category={categoryToUse}
                  measurement={current}
                  isSelected={isSelected}
                />
              );
            }
          })
        }
      </div>
    );
  }

  renderSearchList() {
    const {
      results,
      activeLayers,
      isMobile,
    } = this.props;

    return (
      results.map((layer) => {
        const isEnabled = activeLayers.some((l) => l.id === layer.id);
        return (
          <SearchLayerRow
            key={layer.id}
            layer={layer}
            isEnabled={isEnabled}
            isMobile={isMobile}
            showLayerMetadata={(id) => this.showLayerMetadata(id)}
            toggleDateRangesExpansion={(id) => this.toggleDateRangesExpansion(id)}
          />
        );
      })
    );
  }

  render() {
    const { listType } = this.props;
    return (
      <div className="layer-picker-list-case layers-all">
        {listType === 'search'
          ? this.renderSearchList()
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
  category: PropTypes.object,
  categoryConfig: PropTypes.object,
  results: PropTypes.array,
  hasMeasurementSource: PropTypes.func,
  isMobile: PropTypes.bool,
  listType: PropTypes.string,
  measurementConfig: PropTypes.object,
  selectedLayer: PropTypes.object,
  selectedMeasurement: PropTypes.string,
  selectLayer: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
  const {
    date,
    productPicker,
    proj,
    compare,
    layers,
    config,
  } = state;
  const {
    category,
    categoryType,
    selectedLayer,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  } = productPicker;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const activeLayers = layers[activeString];
  return {
    categoryConfig: config.categories[categoryType],
    measurementConfig: config.measurements,
    layerConfig: config.layers,
    activeLayers,
    category,
    selectedProjection: proj.id,
    selectedLayer,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
    selectedDate: date.selected,
    hasMeasurementSource: (current) => hasSourceeSelector(current, config, proj.id),
  };
};

const mapDispatchToProps = (dispatch) => ({
  selectLayer: (layer) => {
    dispatch(selectLayerAction(layer));
  },
});

export default withSearch(
  ({ results }) => ({ results }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(LayerList));
