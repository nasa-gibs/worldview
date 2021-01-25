import googleTagManager from 'googleTagManager';
import util from '../../util/util';

/**
 * Method call to direct the user to Earthdata Search with the necessary URL parameters that
 * encapsulate what the user is intending to try and download data / granules from
 * @param {*} proj
 * @param {*} selectedDate
 * @param {*} selectedLayer
 * @param {*} extentCoords
 * @param {*} showBoundingBox
 */
export default function openEarthDataSearch(proj, selectedDate, selectedLayer, extentCoords, showBoundingBox) {
  googleTagManager.pushEvent({
    event: 'smart_handoffs_open_eds',
  });
  const PROJ_CODES = {
    arctic: '90!0!0!0!0!0',
    geographic: '0.0!-180.0!0!1!0!0,2',
    antarctic: '-90!180!0!2!0!0',
  };
  const { conceptIds, daynight } = selectedLayer;
  const { southWest, northEast } = extentCoords;
  const startDate = `${selectedDate}T00:00:00.000Z`;
  const endDate = `${selectedDate}T23:59:59.999Z`;
  const bestConceptId = conceptIds.reduce((prev, curr) => (curr.type === 'NRT' ? curr : prev)).value;
  const params = {
    p: bestConceptId,
    '[qt]': `${startDate},${endDate}`,
    m: PROJ_CODES[proj],
    'pg[0][dnf]': daynight !== undefined ? daynight : undefined,
    'sb[0]': showBoundingBox ? `${southWest},${northEast}` : undefined,
  };
  const earthDataSearchURL = `https://search.earthdata.nasa.gov/search/granules${util.toQueryString(params)}`;
  window.open(earthDataSearchURL, '_blank');
}
