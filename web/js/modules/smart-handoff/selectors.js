import { getActiveLayers, memoizedAvailable } from '../layers/selectors';
import { buildGranulesUrl, buildCollectionsUrl, buildConceptUrl } from '../../util/cmr';

export const getBaseCmrUrl = ({ config: { features: { cmr } } }) => cmr.url;

export const getGranulesUrl = (state) => {
  const baseUrl = getBaseCmrUrl(state);
  return (params = {}) => buildGranulesUrl(baseUrl, params);
};

export const getCollectionsUrl = (state) => {
  const baseUrl = getBaseCmrUrl(state);
  return (id) => buildCollectionsUrl(baseUrl, id);
};

export const getConceptUrl = (state) => {
  const baseUrl = getBaseCmrUrl(state);
  return (id) => buildConceptUrl(baseUrl, id);
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
    const filteredConceptIds = (conceptIds || [])
      .filter(({ type, value, version }) => type && value && version);
    return isAvailable && projections[proj.id] &&
    !disableSmartHandoff && !!filteredConceptIds.length;
  };
  return getActiveLayers(state).filter(filterForSmartHandoff);
};
