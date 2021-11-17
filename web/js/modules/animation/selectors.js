import { each as lodashEach } from 'lodash';
import util from '../../util/util';
import {
  imageUtilGetCoordsFromPixelValues,
  getDownloadUrl,
} from '../image-download/util';
import { subdailyLayersActive, getLayers } from '../layers/selectors';
import { TIME_SCALE_FROM_NUMBER } from '../date/constants';
import { formatDisplayDate } from '../date/util';

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
export default function getImageArray(
  gifComponentState,
  gifComponentProps,
  dimensions,
  state,
) {
  const {
    animation, proj, map, date, locationSearch,
  } = state;
  const { startDate, endDate, url } = gifComponentProps;
  const { boundaries, showDates } = gifComponentState;
  const {
    customInterval, interval, customDelta, delta, customSelected,
  } = date;
  const a = [];
  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);
  const markerCoordinates = locationSearch.coordinates;
  const isSubDaily = subdailyLayersActive(state);
  let current = fromDate;
  let j = 0;
  let src;
  let strDate;
  let products;
  const useDelta = customSelected && customDelta ? customDelta : delta;
  const increment = customSelected
    ? TIME_SCALE_FROM_NUMBER[customInterval]
    : TIME_SCALE_FROM_NUMBER[interval];

  while (current <= toDate) {
    j += 1;
    strDate = formatDisplayDate(current, isSubDaily);
    products = getProducts(current, state);

    const lonlats = imageUtilGetCoordsFromPixelValues(boundaries, map.ui.selected);
    const dlURL = getDownloadUrl(url, proj, products, lonlats, dimensions, current, false, false, markerCoordinates);

    src = util.format(dlURL, strDate);
    a.push({
      src,
      text: showDates ? strDate : '',
      delay: 1000 / animation.speed,
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
function getProducts(date, state) {
  const layersArray = [];
  const products = getLayers(
    state,
    {
      reverse: true,
      renderable: true,
      date,
    },
  );
  lodashEach(products, (layer) => {
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
}
