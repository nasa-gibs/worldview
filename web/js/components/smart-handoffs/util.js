import googleTagManager from 'googleTagManager';
import util from '../../util/util';

/**
 * Method call to direct the user to Earthdata Search with the necessary URL parameters that
 * encapsulate what the user is intending to try and download data / granules from
 * @param {*} proj
 * @param {*} includeDates
 * @param {*} selectedDate
 * @param {*} selectedCollection
 * @param {*} extentCoords
 * @param {*} showBoundingBox
 */
export default function openEarthDataSearch(proj, includeDates, selectedDate, selectedCollection, extentCoords, showBoundingBox) {
  const { value } = selectedCollection;
  googleTagManager.pushEvent({
    event: 'smart_handoffs_open_eds_data_query',
    selected_collection: value,
  });
  const PROJ_CODES = {
    arctic: '90!0!0!0!0!0',
    geographic: '0.0!-180.0!0!1!0!0,2',
    antarctic: '-90!180!0!2!0!0',
  };
  const { southWest, northEast } = extentCoords;
  const params = {
    q: value,
    p: value,
    m: PROJ_CODES[proj],
    'sb[0]': showBoundingBox ? `${southWest},${northEast}` : undefined,
  };

  if (includeDates) {
    const startDate = `${selectedDate}T00:00:00.000Z`;
    const endDate = `${selectedDate}T23:59:59.999Z`;
    params['[qt]'] = `${startDate},${endDate}`;
  }

  const earthDataSearchURL = `https://search.earthdata.nasa.gov/search/granules${util.toQueryString(params)}`;
  window.open(earthDataSearchURL, '_blank');
}
