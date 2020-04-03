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

// State selectors
const getConfig = ({ config }) => config;
const getProjection = ({ proj }) => proj && proj.id;
const getProductPicker = ({ productPicker }) => productPicker;

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
export const getSearchConfig = createSelector(
  [getLayersForProjection, getConfig, getProjection],
  initSearch,
);

export const getMeasurementSource = createSelector(
  [getConfig, getProductPicker],
  (config, { selectedMeasurement, selectedMeasurementSourceIndex }) => {
    const measurements = Object.values(config.measurements);
    const currentMeasurement = measurements.find(({ id }) => id === selectedMeasurement);
    const sources = currentMeasurement && Object.values(currentMeasurement.sources);
    const sortedSources = sources && sources.sort((a, b) => a.title.localeCompare(b.title));
    return sortedSources && sortedSources[selectedMeasurementSourceIndex];
  },
);
