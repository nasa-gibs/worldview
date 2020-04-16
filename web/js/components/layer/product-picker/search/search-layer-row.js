import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../../modules/layers/actions';
import { getActiveLayers } from '../../../../modules/layers/selectors';
import RenderSplitLayerTitle from '../renderSplitTitle';

/**
 * A single layer search result row
 * @class LayerRow
 * @extends React.Component
 */
class SearchLayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.toggleEnabled = this.toggleEnabled.bind(this);
    this.toggleShowMetadata = this.toggleShowMetadata.bind(this);
  }

  /**
   * Toggle layer checked state
   * @method toggleEnabled
   * @return {void}
   */
  toggleEnabled() {
    const {
      isEnabled, addLayer, removeLayer, layer,
    } = this.props;
    if (isEnabled) removeLayer(layer.id);
    if (!isEnabled) addLayer(layer.id);
  }

  /**
   * Show metadata for this layer
   * @method showMetadata
   * @param {e} event
   * @return {void}
   */
  toggleShowMetadata() {
    const {
      layer,
      showLayerMetadata,
      selectedLayer,
    } = this.props;
    if (!(selectedLayer && layer.id === selectedLayer.id)) {
      showLayerMetadata(layer.id);
    } else {
      // Allow click to deselect on mobile
      showLayerMetadata(null);
    }
  }

  render() {
    const { isEnabled, layer, selectedLayer } = this.props;
    const { id, description } = layer;
    const isMetadataShowing = selectedLayer && id === selectedLayer.id;
    const rowClass = isMetadataShowing
      ? 'search-row layers-all-layer selected'
      : 'search-row layers-all-layer';
    const checkboxClass = isEnabled ? 'wv-checkbox checked' : 'wv-checkbox';

    return (
      <div id={`${id}-search-row`} className={rowClass}>
        <div className={checkboxClass}>
          <input
            type="checkbox"
            id={`${id}-checkbox`}
            name={`${id}-checkbox`}
            checked={isEnabled}
            onChange={this.toggleEnabled}
          />
        </div>
        <div className="layers-all-header" onClick={this.toggleShowMetadata}>
          <RenderSplitLayerTitle layer={layer} />
          {description && !isMetadataShowing && (
            <FontAwesomeIcon icon={faInfoCircle} />
          )}
        </div>
      </div>
    );
  }
}
SearchLayerRow.propTypes = {
  isEnabled: PropTypes.bool,
  layer: PropTypes.object,
  addLayer: PropTypes.func,
  removeLayer: PropTypes.func,
  selectedLayer: PropTypes.object,
  showLayerMetadata: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
  const { date, productPicker } = state;
  const activeLayerMap = getActiveLayers(state);
  return {
    isEnabled: !!activeLayerMap[ownProps.layer.id],
    selectedDate: date.selected,
    selectedLayer: productPicker.selectedLayer,
  };
};

const mapDispatchToProps = (dispatch) => ({
  addLayer: (id) => {
    dispatch(addLayerAction(id));
  },
  removeLayer: (id) => {
    dispatch(removeLayerAction(id));
  },
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayerRow);
