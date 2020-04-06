import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSearch } from '@elastic/react-search-ui';
import SearchLayerRow from './search-layer-row';
import 'whatwg-fetch'; // fetch() polyfill for IE
import {
  selectLayer as selectLayerAction,
} from '../../../../modules/product-picker/actions';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class SearchLayerList extends React.Component {
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


  render() {
    const { results, isMobile } = this.props;
    return (
      <div className="layer-picker-list-case layers-all">
        {
          results.map((layer) => (
            <SearchLayerRow
              key={layer.id}
              layer={layer}
              isMobile={isMobile}
              showLayerMetadata={(id) => this.showLayerMetadata(id)}
            />
          ))

        }
      </div>
    );
  }
}

SearchLayerList.propTypes = {
  results: PropTypes.array,
  isMobile: PropTypes.bool,
  selectedLayer: PropTypes.object,
  selectLayer: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
  const { productPicker } = state;
  const { selectedLayer } = productPicker;
  return {
    selectedLayer,
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
)(SearchLayerList));
