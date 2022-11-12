import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  cloneDeep as lodashCloneDeep,
  findIndex as lodashFindIndex,
} from 'lodash'
import { getActiveLayers } from '../../../modules/layers/selectors';

const AddLayer = (props) => {
  const {
    activeLayersRedux,
    def,
    preloadNextTiles,
    selected,
    updateLayerVisibilities,
    ui,
  } = props;

  useEffect(() => {
    if (JSON.stringify(def) === '{}') return;
    addLayer(def);
  }, [def]);

/**
 * Initiates the adding of a layer
 * @param {object} def - layer Specs
 * @returns {void}
 */
  const addLayer = async function(def, date, activeLayers) {
    const createLayer = ui.createLayer;
    date = date || selected;
    activeLayers = activeLayers || activeLayersRedux
    const reverseLayers = lodashCloneDeep(activeLayers).reverse();
    const index = lodashFindIndex(reverseLayers, { id: def.id });
    const mapLayers = ui.selected.getLayers().getArray();
    const firstLayer = mapLayers[0];

    if (firstLayer && firstLayer.get('group') && firstLayer.get('granule') !== true) {
      const activelayer = firstLayer.get('group') === compare.activeString
        ? firstLayer
        : mapLayers[1];
      const options = {
        date,
        group: compare.activeString,
      };
      const newLayer = await createLayer(def, options);
      activelayer.getLayers().insertAt(index, newLayer);
      compareMapUi.create(ui.selected, compare.mode);
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
  const { date } = state;
  const { selected } = date;
  const activeLayersRedux = getActiveLayers(state);
  return {
    activeLayersRedux,
    selected
  }
}

export default React.memo(
  connect(
    mapStateToProps,
  )(AddLayer),
);

AddLayer.propTypes = {
  activeLayersRedux: PropTypes.array,
  def: PropTypes.object,
  preloadNextTiles: PropTypes.func,
  selected: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
  ui: PropTypes.object
};