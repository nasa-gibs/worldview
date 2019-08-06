import { each as lodashEach } from 'lodash';
import util from '../../util/util';
import {
  imageUtilGetCoordsFromPixelValues,
  imageUtilGetLayerOpacities,
  bboxWMS13,
  imageUtilGetLayers
} from '../image-download/util';
import { getLayers } from '../layers/selectors';
import { timeScaleFromNumberKey } from '../date/constants';
/*
 * loops through dates and created image
 * download urls and pushs them to an
 * array
 *
 * @method getImageArray
 * @private
 *
 * @returns {array} array of jpg urls
 *
 */
export function getImageArray(
  gifComponentState,
  gifComponentProps,
  dimensions,
  state
) {
  const { animation, proj, map, date, layers, compare } = state;
  const { startDate, endDate, url } = gifComponentProps;
  const { boundaries, showDates } = gifComponentState;
  const { customInterval, interval, customDelta, delta, customSelected } = date;
  const activeString = compare.activeString;
  var a = [];
  var fromDate = new Date(startDate);
  var toDate = new Date(endDate);
  var current = fromDate;
  var j = 0;
  var src;
  var strDate;
  var lonlats = imageUtilGetCoordsFromPixelValues(boundaries, map.ui.selected);
  var layersArray;
  var opacities;
  let crs = proj.selected.crs;
  let imgFormat = 'image/jpeg';
  var products = getProducts(layers[activeString], fromDate, state);
  const useDelta = customSelected && customDelta ? customDelta : delta;
  const useInterval = customSelected ? customInterval : interval;
  let increment = customSelected
    ? timeScaleFromNumberKey[customInterval]
    : timeScaleFromNumberKey[interval];
  const height = dimensions.height;
  const width = dimensions.width;

  while (current <= toDate) {
    j++;
    if (useInterval > 3) {
      strDate = util.toISOStringSeconds(current);
    } else {
      strDate = util.toISOStringDate(current);
    }
    products = getProducts(layers[activeString], current, state);

    layersArray = imageUtilGetLayers(products, proj.id);
    opacities = imageUtilGetLayerOpacities(products);

    let params = [
      'REQUEST=GetSnapshot',
      `TIME=${util.toISOStringSeconds(current)}`,
      `BBOX=${bboxWMS13(lonlats, crs)}`,
      `CRS=${crs}`,
      `LAYERS=${layersArray.join(',')}`,
      `FORMAT=${imgFormat}`,
      `WIDTH=${width}`,
      `HEIGHT=${height}`
    ];
    if (opacities.length > 0) {
      params.push(`OPACITIES=${opacities.join(',')}`);
    }

    let dlURL = url + '?' + params.join('&') + `&ts=${Date.now()}`;

    src = util.format(dlURL, strDate);
    a.push({
      src: src,
      text: showDates ? strDate : '',
      delay: 1000 / animation.speed
    });
    current = util.dateAdd(current, increment, useDelta);
    if (j > 40) {
      // too many frames
      return false;
    }
  }
  return a;
}
/*
 * retrieves renderable layers
 *
 * @method getProducts
 * @private
 *
 * @returns {array} array of layer objects
 *
 */
var getProducts = function(layers, date, state) {
  let layersArray = [];
  var products = getLayers(
    layers,
    {
      reverse: true,
      renderable: true,
      date
    },
    state
  );
  lodashEach(products, function(layer) {
    let layerDate = new Date(date);
    if (layer.endDate) {
      if (layerDate > new Date(layer.endDate)) return;
    }
    if (layer.visible && new Date(layer.startDate) <= layerDate) {
      layersArray.push(layer);
    } else if (!layer.startDate) {
      layersArray.push(layer);
    }
  });
  return layersArray;
};
