import moment from 'moment';
import util from '../../util/util';

/**
 * Method call to direct the user to Earthdata Search with the necessary URL parameters that
 * encapsulate what the user is intending to try and download data / granules from
 * @param {*} selectedLayer
 * @param {*} extentCoords
 * @param {*} showBoundingBox
 */
export default function openEarthDataSearch(proj, dateSelection, selectedLayer, extentCoords, showBoundingBox) {
  const PROJ_CODES = {
    arctic: '90!0!0!0!0!0',
    geographic: '0.0!-180.0!0!1!0!0,2',
    antarctic: '-90!180!0!2!0!0',
  };
  const { conceptId, daynight } = selectedLayer;
  const { southWest, northEast } = extentCoords;
  const startDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T00:00:00.000Z`;
  const endDate = `${moment.utc(dateSelection).format('YYYY-MM-DD')}T23:59:59.999Z`;
  const params = {
    p: conceptId,
    '[qt]': `${startDate},${endDate}`,
    m: PROJ_CODES[proj],
    'pg[0][dnf]': daynight !== undefined ? daynight : undefined,
    'sb[0]': showBoundingBox ? `${southWest},${northEast}` : undefined,
  };
  const earthDataSearchURL = `https://search.earthdata.nasa.gov/search/granules${util.toQueryString(params)}`;
  window.open(earthDataSearchURL, '_blank');
}
