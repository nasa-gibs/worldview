import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getActiveLayerGroup } from '../../../modules/layers/selectors';

const RemoveLayer = (props) => {
  const {
    action,
    compare,
    findLayer,
    layerGroup,
    mapSelected,
    updateLayerVisibilities,
  } = props;

  useEffect(() => {
    if (action.layersToRemove) {
      removeLayer(action.layersToRemove);
    }
  }, [action]);

  const removeLayer = (layersToRemove) => {
    layersToRemove.forEach((def) => {
      const layer = findLayer(def, compare.activeString);
      if (compare && compare.active) {
        if (layerGroup) layerGroup.getLayers().remove(layer);
      } else {
        mapSelected.removeLayer(layer);
      }
    });
    updateLayerVisibilities();
  };

  return null;
};

const mapStateToProps = (state) => {
  const { compare, map } = state;
  const layerGroup = getActiveLayerGroup(state);
  const mapSelected = map.ui.selected;

  return {
    compare,
    layerGroup,
    mapSelected,
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
  layerGroup: PropTypes.object,
  mapSelected: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
};
