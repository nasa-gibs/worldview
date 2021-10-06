import {
  sortBy as lodashSortBy,
  indexOf as lodashIndexOf,
} from 'lodash';
import { createSelector } from 'reselect';
import buildLayerFacetProps from './format-config';
import { getSelectedDate } from '../date/selectors';
import util from '../../util/util';

// State selectors
const getConfig = ({ config }) => config;
const getProjection = ({ proj }) => proj && proj.id;
const getProductPicker = ({ productPicker }) => productPicker;
const getCategoryType = ({ productPicker }) => productPicker.categoryType;

export const getLayersForProjection = createSelector(
  [getConfig, getProjection, getSelectedDate],
  (config, projection, selectedDate) => {
    const layersWithFacetProps = buildLayerFacetProps(config, selectedDate)
      // Only use the layers for the active projection
      .filter((layer) => layer.projections[projection])
      .map((layer) => {
        // If there is metadata for the current projection, use that
        const projectionMeta = layer.projections[projection];
        if (projectionMeta.title) layer.title = projectionMeta.title;
        if (projectionMeta.subtitle) layer.subtitle = projectionMeta.subtitle;
        // Decode HTML entities in the subtitle
        if (layer.subtitle && layer.subtitle.includes('&')) {
          layer.subtitle = util.decodeHTML(layer.subtitle);
        }
        return layer;
      });
    return lodashSortBy(layersWithFacetProps, (layer) => lodashIndexOf(config.layerOrder, layer.id));
  },
);

export const getSourcesForProjection = createSelector(
  [getConfig, getProjection, getProductPicker],
  (config, projection, { selectedMeasurement, selectedMeasurementSourceIndex }) => {
    const measurements = Object.values(config.measurements);
    const currentMeasurement = measurements.find(({ id }) => id === selectedMeasurement);
    const sources = currentMeasurement && Object.values(currentMeasurement.sources);
    const sourcesForProj = sources && sources.filter(
      (source) => source.settings.some((layerId) => {
        const { projections, layergroup } = config.layers[layerId];
        return !!projections[projection] && layergroup !== 'Orbital Track';
      }),
    );
    return sourcesForProj && sourcesForProj.sort((a, b) => a.title.localeCompare(b.title));
  },
);

export const getCategoryConfig = createSelector(
  [getConfig, getCategoryType],
  ({ categories, categoryGroupOrder }, categoryType) => {
    const [firstTab] = categoryGroupOrder;
    return categoryType === 'measurements'
      ? categories[firstTab]
      : categories[categoryType];
  },
);
