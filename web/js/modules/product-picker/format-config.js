import {
  forEach as lodashForEach,
  map as lodashMap,
} from 'lodash';
import moment from 'moment';
import { available } from '../layers/selectors';

const periodIntervalMap = {
  daily: 'Day',
  monthly: 'Month',
  yearly: 'Year',
};

// WARNING: capitalizing certain props could break other parts of WV
// that read these props, need to watch for that when integrating this code
function capitalizeFirstLetter(string) {
  return !string ? '' : string.charAt(0).toUpperCase() + string.slice(1);
}

function setLayerProp (layer, prop, value) {
  const featuredMeasurement = prop === 'measurements' && (value && value.includes('Featured'));
  if (!layer || featuredMeasurement) {
    return;
  }
  if (!layer[prop]) {
    layer[prop] = [value];
  } else if (!layer[prop].includes(value)) {
    layer[prop].push(value);
  }
}

function setMeasurementSourceFacetProps (layers, measurements) {
  lodashForEach(measurements, (measureObj, measureKey) => {
    lodashForEach(measureObj.sources, ({ settings = [] }, sourceKey) => {
      settings.forEach((id) => {
        setLayerProp(layers[id], 'measurements', measureKey);
      });
    });
  });
}

function setCategoryFacetProps (layers, measurements, categories) {
  lodashForEach(categories, (categoryObj, categoryKey) => {
    if (categoryKey === 'featured') {
      return;
    }
    lodashForEach(categoryObj, (subCategoryObj, subCategoryKey) => {
      if (subCategoryKey === 'All') {
        return;
      }
      (subCategoryObj.measurements || []).forEach((measureKey) => {
        const { sources } = measurements[measureKey];
        lodashForEach(sources, ({ settings = [] }) => {
          settings.forEach((id) => {
            setLayerProp(layers[id], 'categories', subCategoryKey);
          });
        });
      });
    });
  });
}

function formatFacetProps({ layers, measurements, categories }) {
  setMeasurementSourceFacetProps(layers, measurements);
  setCategoryFacetProps(layers, measurements, categories);
  return layers;
}

function setLayerPeriodFacetProps(layer) {
  const { period, dateRanges } = layer;
  if (!dateRanges) {
    layer.facetPeriod = capitalizeFirstLetter(period);
    return;
  }
  const dateIntervals = (dateRanges || []).map(({ dateInterval }) => dateInterval);
  const firstInterval = Number.parseInt(dateIntervals[0], 10);
  const consistentIntervals = dateIntervals.every((interval) => {
    const parsedInterval = Number.parseInt(interval, 10);
    return parsedInterval === firstInterval;
  });

  layer.facetPeriod = capitalizeFirstLetter(period);

  if (period === 'subdaily' || firstInterval === 1) {
    return;
  }

  if (consistentIntervals && firstInterval <= 16) {
    layer.facetPeriod = `${firstInterval}-${periodIntervalMap[period]}`;
  } else if (layer.id.includes('7Day')) {
    layer.facetPeriod = '7-Day';
  } else if (layer.id.includes('5Day')) {
    layer.facetPeriod = '5-Day';
  } else if (layer.id.includes('Monthly')) {
    layer.facetPeriod = 'Monthly';
  } else if (layer.id.includes('Weekly')) {
    layer.facetPeriod = '7-Day';
  } else {
    layer.facetPeriod = `Multi-${periodIntervalMap[period]}`;
  }
}

function setCoverageFacetProp(layer, selectedDate) {
  const {
    id, startDate, endDate, dateRanges,
  } = layer;
  delete layer.coverage;
  if (!startDate && !endDate && !dateRanges) {
    layer.coverage = ['Always Available'];
  } else if (available(id, selectedDate, [layer], {})) {
    layer.coverage = [`Available ${moment.utc(selectedDate).format('YYYY MMM DD')}`];
  }
}

/**
 * Derive and format facet props from config
 * @param {*} config
 */
export default function buildLayerFacetProps(config, selectedDate) {
  const layers = formatFacetProps(config);

  return lodashMap(layers, (layer) => {
    setCoverageFacetProp(layer, selectedDate);
    setLayerPeriodFacetProps(layer);
    setLayerProp(layer, 'sources', layer.subtitle);
    if (layer.daynight && layer.daynight.length) {
      if (typeof layer.daynight === 'string') {
        layer.daynight = [layer.daynight];
      }
      layer.daynight = layer.daynight.map(capitalizeFirstLetter);
    }
    return layer;
  });
}
