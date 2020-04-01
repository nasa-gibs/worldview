import {
  sortBy as lodashSortBy,
  indexOf as lodashIndexOf,
} from 'lodash';
import { createSelector } from 'reselect';
import buildLayerFacetProps from './formatConfig';

const decodeHtml = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const getConfig = (state) => state.config;
const getProjection = (state) => state.proj && state.proj.id;
const getFacetLayers = (state) => buildLayerFacetProps(state.config);

const getLayersForProjection = createSelector(
  [getConfig, getProjection, getFacetLayers],
  (config, projection, layers) => {
    const filteredRows = layers
      // Only use the layers for the active projection
      .filter((layer) => layer.projections[projection])
      .map((layer) => {
        // If there is metadata for the current projection, use that
        const projectionMeta = layer.projections[projection];
        if (projectionMeta.title) layer.title = projectionMeta.title;
        if (projectionMeta.subtitle) layer.subtitle = projectionMeta.subtitle;
        // Decode HTML entities in the subtitle
        if (layer.subtitle) layer.subtitle = decodeHtml(layer.subtitle);
        return layer;
      });
    return lodashSortBy(filteredRows, (layer) => lodashIndexOf(config.layerOrder, layer.id));
  },
);

// eslint-disable-next-line import/prefer-default-export
export const getSearchConfig = createSelector(
  [getLayersForProjection, getConfig, getProjection],
  (layers, config, projection) => {
    initialLayersArray = layers;
    layers.forEach((layer) => {
      facetFields.forEach((facetField) => {
        updateFacetCounts(facetField, layer);
      });
    });

    return {
      // debug: true, // TODO disable for prod
      alwaysSearchOnInitialLoad: true,
      trackUrlState: false,
      initialState,
      onSearch: getOnSearch(config, projection),
      searchQuery: {},
    };
  },
);
