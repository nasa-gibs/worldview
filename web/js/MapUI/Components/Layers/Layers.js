import React, {forwardRef, useImperativeHandle, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { each as lodashEach, } from 'lodash'
import { getLayers } from '../../../modules/layers/selectors'

const Layers = forwardRef((props, ref) => {
  const {
    activeString,
    getGranuleOptions,
    layers,
    compare,
    config,
    defs,
    isCompareActive,
    ui,
    updateLayerVisibilities
  } = props;


  useImperativeHandle(ref, () => ({
    reloadLayers() {
      reloadLayers(granuleOptions)
    }
  }));


 /*
  * Remove Layers from map
  *
  * @method clearLayers
  * @static
  *
  * @param {object} map - Openlayers Map obj
  *
  * @returns {void}
  */
 const clearLayers = function() {
  console.log('clearing layers')
  const activeLayers = ui.selected
    .getLayers()
    .getArray()
    .slice(0);
  lodashEach(activeLayers, (mapLayer) => {
    ui.selected.removeLayer(mapLayer);
  });
  ui.cache.clear();
};

async function reloadLayers(granuleOptions) {
  console.log('reloading layers')
  const map = ui.selected;
  const createLayer = ui.createLayer
  const state = {compare, layers};

  if (!config.features.compare || !isCompareActive) {
    const compareMapDestroyed = !isCompareActive && activeString;
    if (compareMapDestroyed) {
      compareMapUi.destroy();
    }
    clearLayers();
    const layerPromises = defs.map((def) => {
      const options = getGranuleOptions(state, def, activeString, granuleOptions);
      return createLayer(def, options);
    });
    const createdLayers = await Promise.all(layerPromises);
    lodashEach(createdLayers, (l) => { map.addLayer(l); });
  } else {
    const stateArray = [['active', 'selected'], ['activeB', 'selectedB']];
    if (compare && !compare.isCompareA && compare.mode === 'spy') {
      stateArray.reverse(); // Set Layer order based on active A|B group
    }
    clearLayers();
    const stateArrayGroups = stateArray.map(async (arr) => getCompareLayerGroup(arr, state, granuleOptions));
    const compareLayerGroups = await Promise.all(stateArrayGroups);
    compareLayerGroups.forEach((layerGroup) => map.addLayer(layerGroup));
    compareMapUi.create(map, compare.mode);
  }
  updateLayerVisibilities();
}

  return null;

});

const mapDispatchToProps = (state) => {
  const { compare, layers } = state;
  const isCompareActive = compare.active;
  const activeString = compare.activeString;
  const defs = getLayers(state, { reverse: true });



  return {
    activeString,
    defs,
    isCompareActive
  }
}

export default connect(
  mapDispatchToProps
)(Layers);