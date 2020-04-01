import {
  sortBy as lodashSortBy,
  indexOf as lodashIndexOf,
} from 'lodash';
import { createSelector } from 'reselect';
import buildLayerFacetProps from './formatConfig';
import initSearch from './searchConfig';

const decodeHtml = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const getConfig = (state) => state.config;
const getProjection = (state) => state.proj && state.proj.id;

const getLayersForProjection = createSelector(
  [getConfig, getProjection],
  (config, projection) => {
    const filteredRows = buildLayerFacetProps(config)
      // Only use the layers for the active projection
      .filter((layer) => layer.projections[projection])
      .map((layer) => {
        // If there is metadata for the current projection, use that
        const projectionMeta = layer.projections[projection];
        if (projectionMeta.title) layer.title = projectionMeta.title;
        if (projectionMeta.subtitle) layer.subtitle = projectionMeta.subtitle;
        // Decode HTML entities in the subtitle
        if (layer.subtitle.includes('&')) {
          layer.subtitle = decodeHtml(layer.subtitle);
        }
        return layer;
      });
    return lodashSortBy(filteredRows, (layer) => lodashIndexOf(config.layerOrder, layer.id));
  },
);

/**
 * Returns a SearchProvider configuration object.
 * https://github.com/elastic/search-ui/blob/master/ADVANCED.md#advanced-configuration
 */
// eslint-disable-next-line import/prefer-default-export
export const getSearchConfig = createSelector(
  [getLayersForProjection, getConfig, getProjection],
  (layers, config, projection) => ({
    // debug: true,
    alwaysSearchOnInitialLoad: true,
    trackUrlState: false,
    initialState: {},
    onSearch: initSearch(layers, config, projection),
    searchQuery: {},
  }),
);
