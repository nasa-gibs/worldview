
import { get } from 'lodash';
import googleTagManager from 'googleTagManager';
import { parseTemplate } from 'url-template';
import { TOOLS_EARTHDATA_SEARCH } from './constants';
import util from '../../util/util';

export function parseSmartHandoff(state) {
  const [layerId, conceptId] = state.split(',');
  return {
    layerId,
    conceptId,
  };
}
export function serializeSmartHandoff(currentItemState, state) {
  const activeTab = get(state, 'sidebar.activeTab');
  const { layerId, conceptId } = currentItemState;
  const isActive = activeTab === 'download' && layerId && conceptId;
  return isActive ? [layerId, conceptId].join(',') : undefined;
}

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
export default function openEarthDataSearch(tools, options) {
  const { action } = tools.find(({ name }) => name === TOOLS_EARTHDATA_SEARCH) || {};
  if (!action) return;
  const {
    projection, conceptId, includeDates, selectedDate, currentExtent, showBoundingBox,
  } = options;
  const urlTemplate = parseTemplate(action.Target.UrlTemplate);

  // const { southWest, northEast } = currentExtent;
  const params = {
    q: conceptId,
    p: conceptId,
    projection,
    // 'sb[0]': showBoundingBox ? `${southWest},${northEast}` : undefined,
  };

  // if (includeDates) {
  //   const startDate = `${selectedDate}T00:00:00.000Z`;
  //   const endDate = `${selectedDate}T23:59:59.999Z`;
  //   params['[qt]'] = `${startDate},${endDate}`;
  // }

  const earthDataSearchURL = urlTemplate.expand(params);

  window.open(earthDataSearchURL, '_blank');
  googleTagManager.pushEvent({
    event: 'smart_handoffs_open_eds_data_query',
    selected_collection: conceptId,
  });
}
