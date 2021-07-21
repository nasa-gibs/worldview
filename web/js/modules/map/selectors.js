import { promiseLayerGroup } from './util';
/*
 * @method promiseImageryForTime
 * @param  {object} time of data to be displayed on the map.
 * @return {object}      Promise.all
 */
export default function promiseImageryForTime(date, layers, state) {
  const { map } = state;
  const {
    cache, selected, createLayer, layerKey,
  } = map.ui;
  const { pixelRatio, viewState } = selected.frameState_; // OL object describing the current map frame

  const promiseArray = layers.map((def) => {
    const key = layerKey(def, { date }, state);
    let layer = cache.getItem(key);

    if (!layer) {
      layer = createLayer(def, { date, precache: true });
    }
    return promiseLayerGroup(layer, viewState, pixelRatio, selected, def);
  });
  return new Promise((resolve) => {
    Promise.all(promiseArray).then(() => resolve(date));
  });
}
