import {
  forEach as lodashForEach,
  map as lodashMap,
} from 'lodash';
import moment from 'moment';
import { available } from '../layers/selectors';
import util from '../../util/util';

// WARNING: capitalizing certain props could break other parts of WV
// that read these props, need to watch for that when integrating this code
function capitalizeFirstLetter(string) {
  return !string ? '' : string.charAt(0).toUpperCase() + string.slice(1);
}

function setLayerProp (layer, prop, value) {
  const featuredMeasurement = prop === 'measurements' && (value && value.includes('Featured'));
  if (!layer || featuredMeasurement || !value) {
    return;
  }
  const decodedValue = value.includes('&') ? util.decodeHTML(value) : value;
  if (!layer[prop]) {
    layer[prop] = [decodedValue];
  } else if (!layer[prop].includes(decodedValue)) {
    layer[prop].push(decodedValue);
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
