
import { get } from 'lodash';
import moment from 'moment';
import { parseTemplate } from 'url-template';
import googleTagManager from 'googleTagManager';

import { TOOLS_EARTHDATA_SEARCH } from './constants';

/**
 * Get startDate and endDate used for granule count query and handoff to EDS
 *
 * @param {*} layer
 * @param {*} selectedDate
 * @param {*} granuleLayers
 * @returns
 */
export const getStartEndDates = (layer, selectedDate, granuleLayers) => {
  const { type, id } = layer;
  let startDate;
  let endDate;

  if (type === 'granule' && Object.keys(granuleLayers).length > 0) {
    const granuleDates = granuleLayers[id] && granuleLayers[id].dates;
    const start = granuleDates[0];
    const end = granuleDates[granuleDates.length - 1];
    startDate = `${moment.utc(start).format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`;
    endDate = `${moment.utc(end).format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`;
  } else {
    startDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T00:00:00.000Z`;
    endDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T23:59:59.999Z`;
  }

  return {
    startDate,
    endDate,
  };
};

function getHandoffParams (queryInput, options) {
  const {
    projection, conceptId, startDate, endDate, currentExtent, showBoundingBox,
  } = options;

  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined) {
      console.error(`${key} is undefined.`);
    } else if (value === {}) {
      console.error(`${key} is an empty object.`);
    }
  });

  const getParam = ({ ValueType, ValueName }) => {
    if (ValueType === 'temporalRange') {
      if (startDate && endDate) {
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
