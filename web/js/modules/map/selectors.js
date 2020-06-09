import { promiseLayerGroup } from './util';
/*
 * @method promiseImageryForTime
 * @param  {object} time of data to be displayed on the map.
 * @return {object}      Promise.all
 */
export default function promiseImageryForTime(date, layers, state) {
  const { map } = state;
  const { cache } = map.ui;
  const mapUi = map.ui;
  const selectedMap = map.ui.selected;
  const { pixelRatio, viewState } = selectedMap.frameState_; // OL object describing the current map frame

  const promiseArray = layers.map((def) => new Promise((resolve) => {
    const key = mapUi.layerKey(def, { date }, state);
    let layer = cache.getItem(key);

    if (!layer) {
      layer = mapUi.createLayer(def, { date, precache: true });
    }
    resolve(layer);
  }).then((layer) => promiseLayerGroup(layer, viewState, pixelRatio, selectedMap, def)));
  return new Promise((resolve) => {
    Promise.all(promiseArray).then(() => resolve(date));
  });
}
