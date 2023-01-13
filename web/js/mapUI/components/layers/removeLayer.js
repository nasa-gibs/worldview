import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function RemoveLayer(props) {
  const {
    action,
    compare,
    findLayer,
    ui,
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
        if (ui.selected) ui.selected.getLayers().remove(layer);
      } else {
        ui.selected.removeLayer(layer);
      }
    });
    updateLayerVisibilities();
  };

  return null;
}

const mapStateToProps = (state) => {
  const { compare } = state;

  return {
    compare,
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
  ui: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
};
