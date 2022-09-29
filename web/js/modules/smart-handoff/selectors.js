
import { getActiveLayers, memoizedAvailable } from '../layers/selectors';
import util from '../../util/util';

const getBaseCmrUrl = ({ config: { features: { cmr } } }) => cmr.url;

// e.g. https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=C2185522599-LANCEMODIS&pageSize=500&temporal=2022-03-28T00%3A00%3A00.000Z%2C2022-03-28T23%3A59%3A59.999Z
export const getGranulesUrl = (state) => {
  const baseUrl = getBaseCmrUrl(state);
  return (params = {}) => {
    const getTemporal = () => {
      if (params.startDate && params.endDate) {
        return `${params.startDate},${params.endDate}`;
      }
    };
    const newParams = {
      bounding_box: params.bbox,
      collection_concept_id: params.conceptId,
      shortName: params.shortName,
      day_night_flag: params.dayNight,
      temporal: getTemporal(),
      pageSize: params.pageSize,
    };
    const queryString = util.toQueryString(newParams);
    return `${baseUrl}granules.json${queryString}`;
  };
};

// e.g. https://cmr.earthdata.nasa.gov/search/collections.json?concept_id=C2208779826-LANCEMODIS
export const getCollectionsUrl = (state) => {
  const baseUrl = getBaseCmrUrl(state);
  return (id) => {
    const params = { concept_id: id };
    return `${baseUrl}collections.json${util.toQueryString(params)}`;
  };
};

// e.g. https://cmr.earthdata.nasa.gov/search/concepts/C2208779826-LANCEMODIS.html
export const getConceptUrl = (state) => {
  const baseUrl = getBaseCmrUrl(state);
  return (id) => `${baseUrl}concepts/${id}`;
};

/**
 * Get array of layers from state that are available and have the necessary metadata for a handoff
 * @param {*} state
 * @returns
 */
export const getValidLayersForHandoffs = (state) => {
  const { proj } = state;
  const filterForSmartHandoff = (layer) => {
    const {
      id, projections, disableSmartHandoff, conceptIds,
    } = layer;
    const isAvailable = memoizedAvailable(state)(id);
    const filteredConceptIds = (conceptIds || []).filter(({ type, value, version }) => type && value && version);
    return isAvailable && projections[proj.id] && !disableSmartHandoff && !!filteredConceptIds.length;
  };
  return getActiveLayers(state).filter(filterForSmartHandoff);
};
