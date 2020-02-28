import { each as lodashEach } from 'lodash';
import util from '../../util/util';
import {
  imageUtilGetCoordsFromPixelValues,
  getDownloadUrl
} from '../image-download/util';
import { getLayers, hasSubDaily } from '../layers/selectors';
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
  const a = [];
  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);
  const isSubDaily = hasSubDaily(layers[activeString]);
  let current = fromDate;
  let j = 0;
  let src;
  let strDate;
  let products;
  const useDelta = customSelected && customDelta ? customDelta : delta;
  const increment = customSelected
    ? timeScaleFromNumberKey[customInterval]
    : timeScaleFromNumberKey[interval];

  while (current <= toDate) {
    j++;
    if (isSubDaily) {
      strDate = util.toISOStringMinutes(current);
    } else {
      strDate = util.toISOStringDate(current);
    }
    products = getProducts(layers[activeString], current, state);

    const lonlats = imageUtilGetCoordsFromPixelValues(boundaries, map.ui.selected);
    const dlURL = getDownloadUrl(url, proj, products, lonlats, dimensions, current);

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
  const layersArray = [];
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
    const layerDate = new Date(date);
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
