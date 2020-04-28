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

// State selectors
const getConfig = ({ config }) => config;
const getProjection = ({ proj }) => proj && proj.id;
const getProductPicker = ({ productPicker }) => productPicker;
const getSelectedDate = ({ date }) => date && date.selected;

export const getLayersForProjection = createSelector(
  [getConfig, getProjection, getSelectedDate],
  (config, projection, selectedDate) => {
    const filteredRows = buildLayerFacetProps(config, selectedDate)
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
