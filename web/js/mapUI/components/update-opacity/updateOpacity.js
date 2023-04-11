import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  each as lodashEach,
  find as lodashFind,
} from 'lodash';
import { getActiveLayers } from '../../../modules/layers/selectors';
import * as layerConstants from '../../../modules/layers/constants';

function UpdateOpacity(props) {
  const {
    action,
    activeLayers,
    activeString,
    compare,
    findLayer,
    isCompareActive,
    ui,
    updateLayerVisibilities,
  } = props;

  useEffect(() => {
    if (action.type === layerConstants.UPDATE_OPACITY) {
      updateOpacity(action);
    }
  }, [action]);

  const updateGranuleLayerOpacity = (def, activeString, opacity, compare) => {
    const { id } = def;
    const layers = ui.selected.getLayers().getArray();
    lodashEach(Object.keys(layers), (index) => {
      const layer = layers[index];
      if (layer.className_ === 'ol-layer') {
        if (compare && isCompareActive) {
          const layerGroup = layer.getLayers().getArray();
          lodashEach(Object.keys(layerGroup), (groupIndex) => {
            const compareLayerGroup = layerGroup[groupIndex];
            if (compareLayerGroup.wv.id === id) {
              const tileLayer = compareLayerGroup.getLayers().getArray();

              // inner first granule group tile layer
              const firstTileLayer = tileLayer[0];
              if (firstTileLayer.wv.id === id) {
                if (firstTileLayer.wv.group === activeString) {
                  compareLayerGroup.setOpacity(opacity);
                }
              }
            }
          });
        } else if (layer.wv.id === id) {
          if (layer.wv.group === activeString) {
            layer.setOpacity(opacity);
          }
        }
      }
    });
  };

  /**
   * Sets new opacity to layer
   * @param {object} def - layer Specs
   * @param {number} value - number value
   * @returns {void}
   */
  const updateOpacity = (action) => {
    const { id, opacity } = action;
    const def = lodashFind(activeLayers, { id });
    if (def.type === 'granule') {
      updateGranuleLayerOpacity(def, activeString, opacity, compare);
    } else {
      // find the layer in each projection
      const layerGroup = findLayer(def, activeString);
      // get an array of layers from each projection
      const layerGroupLayers = layerGroup.getLayersArray();
      // need to set opacity for layerGroup and each individual layer
      layerGroup.setOpacity(opacity);
      layerGroupLayers.forEach((l) => {
        l.setOpacity(opacity);
      });
    }
    updateLayerVisibilities();
  };
  return null;
}

const mapStateToProps = (state) => {
  const { compare } = state;
  const isCompareActive = compare.active;
  const activeString = compare.isCompareA ? 'active' : 'activeB';
  const activeLayers = getActiveLayers(state);

  return {
    activeLayers,
    activeString,
    compare,
    isCompareActive,
  };
};

export default connect(
  mapStateToProps,
)(UpdateOpacity);

UpdateOpacity.propTypes = {
  action: PropTypes.object,
  activeLayers: PropTypes.array,
  activeString: PropTypes.string,
  compare: PropTypes.object,
  findLayers: PropTypes.func,
  isCompareActive: PropTypes.bool,
  ui: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
};
