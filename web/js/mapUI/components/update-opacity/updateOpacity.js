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

  const updateGranuleLayerOpacity = (def, activeStringArg, opacity, compareArg) => {
    const { id } = def;
    const layers = ui.selected.getLayers().getArray();
    lodashEach(Object.keys(layers), (index) => {
      const layer = layers[index];
      // eslint-disable-next-line no-underscore-dangle
      if (layer.className_ === 'ol-layer') {
        if (compareArg && isCompareActive) {
          const layerGroup = layer.getLayers().getArray();
          lodashEach(Object.keys(layerGroup), (groupIndex) => {
            const compareLayerGroup = layerGroup[groupIndex];
            if (compareLayerGroup.wv.id === id) {
              const tileLayer = compareLayerGroup.getLayers().getArray();

              // inner first granule group tile layer
              const firstTileLayer = tileLayer[0];
              if (firstTileLayer.wv.id === id) {
                if (firstTileLayer.wv.group === activeStringArg) {
                  compareLayerGroup.setOpacity(opacity);
                }
              }
            }
          });
        } else if (layer.wv.id === id) {
          if (layer.wv.group === activeStringArg) {
            layer.setOpacity(opacity);
          }
        }
      }
    });
  };

  /**
   * Sets new opacity to layer
   * @param {object} actionObj - layer Specs
   * @returns {void}
   */
  const updateOpacity = (actionObj) => {
    const { id, opacity } = actionObj;
    const def = lodashFind(activeLayers, { id });
    if (def.type === 'granule') {
      updateGranuleLayerOpacity(def, activeString, opacity, compare);
    } else {
      const layerGroup = findLayer(def, activeString);
      layerGroup.setOpacity(opacity);
      layerGroup.getLayersArray().forEach((l) => {
        l.setOpacity(opacity);
      });
    }
    updateLayerVisibilities();
  };

  useEffect(() => {
    if (action.type === layerConstants.UPDATE_OPACITY) {
      updateOpacity(action);
    }
  }, [action]);

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
  action: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  activeLayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  activeString: PropTypes.string,
  compare: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  findLayer: PropTypes.func,
  isCompareActive: PropTypes.bool,
  ui: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  updateLayerVisibilities: PropTypes.func,
};
