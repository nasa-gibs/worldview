import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  cloneDeep as lodashCloneDeep,
  findIndex as lodashFindIndex,
  find as lodashFind,
} from 'lodash';
import { getActiveLayers } from '../../../modules/layers/selectors';
import * as layerConstants from '../../../modules/layers/constants';
import { clearPreload } from '../../../modules/date/actions';

const AddLayer = (props) => {
  const {
    action,
    activeLayersRedux,
    activeString,
    compareMapUi,
    mode,
    preloadNextTiles,
    selected,
    updateLayerVisibilities,
    ui,
  } = props;

  useEffect(() => {
    if (action.type === layerConstants.ADD_LAYER) {
      const def = lodashFind(action.layers, { id: action.id });
      if (def.type === 'granule') {
        ui.processingPromise = new Promise((resolve) => {
          resolve(addLayer(def));
        });
        return addLayer(def);
      }
      clearPreload();
      addLayer(def);
    }
  }, [action]);

  /**
 * Initiates the adding of a layer
 * @param {object} def - layer Specs
 * @returns {void}
 */
  const addLayer = async function(def, date, activeLayers) {
    const { createLayer } = ui;
    date = date || selected;
    activeLayers = activeLayers || activeLayersRedux;
    const reverseLayers = lodashCloneDeep(activeLayers).reverse();
    const index = lodashFindIndex(reverseLayers, { id: def.id });
    const mapLayers = ui.selected.getLayers().getArray();
    const firstLayer = mapLayers[0];

    if (firstLayer && firstLayer.get('group') && firstLayer.get('granule') !== true) {
      const activelayer = firstLayer.get('group') === activeString
        ? firstLayer
        : mapLayers[1];
      const options = {
        date,
        group: activeString,
      };
      const newLayer = await createLayer(def, options);
      activelayer.getLayers().insertAt(index, newLayer);
      compareMapUi.create(ui.selected, mode);
    } else {
      const newLayer = await createLayer(def);
      ui.selected.getLayers().insertAt(index, newLayer);
    }
    updateLayerVisibilities();
    preloadNextTiles();
  };
  return null;
};

const mapStateToProps = (state) => {
  const { compare, date } = state;
  const { activeString, mode } = compare;
  const { selected } = date;
  const activeLayersRedux = getActiveLayers(state);
  return {
    activeLayersRedux,
    activeString,
    mode,
    selected,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearPreload: () => {
    dispatch(clearPreload());
  },
});

export default React.memo(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(AddLayer),
);

AddLayer.propTypes = {
  activeLayersRedux: PropTypes.array,
  activeString: PropTypes.string,
  action: PropTypes.object,
  clearPreload: PropTypes.func,
  mode: PropTypes.string,
  preloadNextTiles: PropTypes.func,
  selected: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
  ui: PropTypes.object,
};
