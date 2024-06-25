import {
  forEach as lodashForEach,
  map as lodashMap,
  get as lodashGet,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import { available } from '../layers/selectors';
import util from '../../util/util';
import { formatDisplayDate } from '../date/util';

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
        const sources = lodashGet(measurements, `[${measureKey}].sources`);
        if (!sources) {
          throw new Error(`No measurement config entry for "${measureKey}".`);
        }
        lodashForEach(sources, ({ settings = [] }) => {
          settings.forEach((id) => {
            setLayerProp(layers[id], 'categories', subCategoryKey);
          });
        });
      });
    });
  });
}

function setMeasurementCategoryProps(layers, { measurements, categories }) {
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
    layer.coverage = [`Available ${formatDisplayDate(selectedDate)}`];
  }
}

function setTypeProp(layer) {
  const { type } = layer;
  const rasterTypes = ['wms', 'wmts', 'xyz'];
  if (rasterTypes.includes(type)) {
    layer.type = 'Raster (Mosaicked)';
  }
  if (layer.type === 'granule') {
    layer.type = 'Raster (Granule)';
  }
  if (layer.type === 'titiler') {
    layer.type = 'Dynamically-rendered';
  }
  layer.type = capitalizeFirstLetter(layer.type);
  return layer;
}

/**
 * Derive and format facet props from config
 * @param {*} config
 */
export default function buildLayerFacetProps(config, selectedDate) {
  let layers = lodashCloneDeep(config.layers);
  layers = setMeasurementCategoryProps(layers, config);

  return lodashMap(layers, (layer) => {
    setCoverageFacetProp(layer, selectedDate);
    setLayerProp(layer, 'sources', layer.subtitle);
    setTypeProp(layer);
    if (layer.daynight && layer.daynight.length) {
      if (typeof layer.daynight === 'string') {
        layer.daynight = [layer.daynight];
      }
      layer.daynight = layer.daynight.map(capitalizeFirstLetter);
    }
    return layer;
  });
}
