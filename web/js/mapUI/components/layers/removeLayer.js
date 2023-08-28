import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getActiveLayerGroup } from '../../../modules/layers/selectors';

function RemoveLayer(props) {
  const {
    action,
    compare,
    findLayer,
    map,
    ui,
    updateLayerVisibilities,
  } = props;

  const removeLayer = (layersToRemove) => {
    layersToRemove.forEach((def) => {
      const layer = findLayer(def, compare.activeString);
      if (compare && compare.active) {
        const layerGroup = getActiveLayerGroup({ map, compare });
        if (layerGroup) layerGroup.getLayers().remove(layer);
      } else {
        ui.selected.removeLayer(layer);
      }
    });
    updateLayerVisibilities();
  };

  useEffect(() => {
    if (action.layersToRemove) {
      removeLayer(action.layersToRemove);
    }
  }, [action]);

  return null;
}

const mapStateToProps = (state) => {
  const { compare, map } = state;

  return {
    compare,
    map,
  };
};

export default React.memo(
  connect(
    mapStateToProps,
  )(RemoveLayer),
);

RemoveLayer.propTypes = {
  action: PropTypes.any,
  compare: PropTypes.object,
  findLayer: PropTypes.func,
  map: PropTypes.object,
  ui: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
};
