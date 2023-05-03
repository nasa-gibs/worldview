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
import { DISPLAY_STATIC_MAP } from '../../../modules/ui/constants';

function AddLayer(props) {
  const {
    action,
    activeLayersState,
    activeString,
    compareDate,
    compareMapUi,
    mode,
    preloadNextTiles,
    updateLayerVisibilities,
    ui,
  } = props;

  useEffect(() => {
    if (action.type === layerConstants.ADD_LAYER) {
      const def = lodashFind(action.layers, { id: action.id });
      if (def.type === 'granule') {
        return granuleLayerAdd(def);
      }
      clearPreload();
      addLayer(def);
    } else if (action.type === DISPLAY_STATIC_MAP) {
      addStaticLayer();
    }
  }, [action]);

  // add static layer for kiosk mode in case of gibs/dns failure
  const addStaticLayer = async() => {
    const { createLayer } = ui;
    const newLayer = await createLayer();
    ui.selected.getLayers().insertAt(0, newLayer);
  };

  const granuleLayerAdd = (def) => {
    ui.processingPromise = new Promise((resolve) => {
      resolve(addLayer(def));
    });
  };

  /**
 * Initiates the adding of a layer
 * @param {object} def - layer Specs
 * @returns {void}
 */
  const addLayer = async function(def, layerDate, activeLayersParam) {
    const { createLayer } = ui;
    const date = layerDate || compareDate;
    const activeLayers = activeLayersParam || activeLayersState;
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
}

const mapStateToProps = (state) => {
  const { compare, date } = state;
  const { activeString, mode } = compare;
  const { selected, selectedB } = date;
  const activeLayersState = getActiveLayers(state);
  const compareDate = compare.active && activeString === 'activeB' ? selectedB : selected;
  return {
    activeLayersState,
    compareDate,
    activeString,
    mode,
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
  activeLayersState: PropTypes.array,
  activeString: PropTypes.string,
  action: PropTypes.object,
  clearPreload: PropTypes.func,
  compareMapUi: PropTypes.object,
  mode: PropTypes.string,
  preloadNextTiles: PropTypes.func,
  selected: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
  ui: PropTypes.object,
};
