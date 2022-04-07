
import { get } from 'lodash';
import googleTagManager from 'googleTagManager';
import { parseTemplate } from 'url-template';
import { TOOLS_EARTHDATA_SEARCH } from './constants';

function getHandoffParams (queryInput, options) {
  const {
    projection, conceptId, includeDates, selectedDate, currentExtent, showBoundingBox,
  } = options;

  const getParam = ({ ValueType, ValueName }) => {
    if (ValueType === 'temporalRange') {
      if (includeDates) {
        const startDate = `${selectedDate}T00:00:00.000Z`;
        const endDate = `${selectedDate}T23:59:59.999Z`;
        return {
          [ValueName]: `${startDate},${endDate}`,
        };
      }
    }
    if (ValueType === 'https://schema.org/box') {
      const { southWest, northEast } = currentExtent;
      return {
        [ValueName]: showBoundingBox ? `${southWest},${northEast}` : undefined,
      };
    }
    if (ValueType === 'https://spatialreference.org/ref/epsg/') {
      return {
        [ValueName]: projection,
      };
    }
    if (ValueType === 'conceptId') {
      return {
        [ValueName]: conceptId,
      };
    }
    if (ValueType === 'edscTextQuery') {
      return {
        [ValueName]: conceptId,
      };
    }
  };

  return queryInput.reduce((params, input) => ({
    ...params,
    ...getParam(input),
  }), {});
}

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

  const { Target, QueryInput } = action;
  const urlTemplate = parseTemplate(Target.UrlTemplate);
  const params = getHandoffParams(QueryInput, options);

  window.open(urlTemplate.expand(params), '_blank');

  googleTagManager.pushEvent({
    event: 'smart_handoffs_open_eds_data_query',
    selected_collection: options.conceptId,
  });
}
