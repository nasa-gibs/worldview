import { promiseLayerGroup } from './util';
/*
 * @method promiseImageryForTime
 * @param  {object} time of data to be displayed on the map.
 * @return {object}      Promise.all
 */
export function promiseImageryForTime(date, layers, state) {
  var viewState;
  var frameState;
  var pixelRatio;
  var promiseArray;
  const map = state.map;
  var cache = map.ui.cache;
  var mapUi = map.ui;
  var selectedMap = map.ui.selected;
  frameState = selectedMap.frameState_; // OL object describing the current map frame

  pixelRatio = frameState.pixelRatio;
  viewState = frameState.viewState;
  promiseArray = layers.map(function(def) {
    var key;
    var layer;

    key = mapUi.layerKey(
      def,
      {
        date: date
      },
      state
    );
    layer = cache.getItem(key);
    if (layer) {
      cache.removeItem(key);
    }
    layer = mapUi.createLayer(def, {
      date: date,
      precache: true
    });
    return promiseLayerGroup(layer, viewState, pixelRatio, selectedMap, def);
  });
  return new Promise(function(resolve) {
    Promise.all(promiseArray).then(function() {
      resolve(date);
    });
  });
}
