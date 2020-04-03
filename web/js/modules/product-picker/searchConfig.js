import {
  get as lodashGet,
  set as lodashSet,
  forEach as lodashForEach,
  toLower as lodashToLower,
  includes as lodashIncludes,
} from 'lodash';
import {
  getTitles,
} from '../layers/selectors';

const facets = {};
let initialLayersArray;
let configRef;
let projectionRef;

const hideZeroCountFields = [
  'measurements',
];

// TODO pull from a config?
const facetFields = [
  'dataCenter',
  'processingLevelId',
  'facetPeriod',
  'group',
  'collectionDataType',
  'projects',
  'sources',
  'categories',
  'measurements',
  'platforms',
  'active',
  'track',
  'daynight',
];

// Move "None" or "Other" entries to the top or bottom respectively
function moveNoneOther(data) {
  const noneIndex = data.findIndex((item) => item.value === 'None');
  if (noneIndex >= 0) {
    const [noneEntry] = data.splice(noneIndex, 1);
    data.splice(0, 0, noneEntry);
  }
  const otherIndex = data.findIndex((item) => item.value === 'Other');
  if (otherIndex >= 0) {
    const [otherEntry] = data.splice(otherIndex, 1);
    data.splice(data.length, 0, otherEntry);
  }
  return data;
}

// Convert facet count obj into the format search-ui expects
function formatFacets(facetValues, firstFormat) {
  const formattedFacets = {};
  lodashForEach(facetValues, (facetObj, field) => {
    let data = Object.keys(facetObj)
      .map((key) => ({
        count: facetValues[field][key],
        value: key,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

    data = moveNoneOther(data);

    if (hideZeroCountFields.includes(field)) {
      data = data
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    formattedFacets[field] = [{
      field,
      type: 'value',
      data,
    }];
  });
  return formattedFacets;
}

function resetFacetCounts() {
  Object.keys(facets).forEach((facetField) => {
    Object.keys(facets[facetField]).forEach((filterField) => {
      facets[facetField][filterField] = 0;
    });
  });
}

function updateFacetCounts(facetField, layer) {
  let fieldVal = layer[facetField] || 'None';
  fieldVal = Array.isArray(fieldVal) ? fieldVal : [fieldVal];
  fieldVal.forEach((value) => {
    const currentVal = lodashGet(facets, `['${facetField}']['${value}']`) || 0;
    lodashSet(facets, `['${facetField}']['${value}']`, currentVal + 1);
  });
}

function updateAllFacetCounts(currentFilters, searchTerm) {
  resetFacetCounts();
  facetFields.forEach((facetField) => {
    // Start with a filtered result array that has all OTHER facets applied
    const otherFilters = currentFilters.filter((f) => f.field !== facetField);
    layersMatchSearchAndFilters(otherFilters, searchTerm)
      .forEach((layer) => {
        updateFacetCounts(facetField, layer);
      });
  });
}

function layerMatchesFilters(layer, filters) {
  return filters.every(({ field, values }) => {
    let fieldVal = layer[field];
    fieldVal = Array.isArray(fieldVal) ? fieldVal : [fieldVal];
    const noneSelected = values.includes('None');
    const matches = values.some((value) => fieldVal.includes(value));
    return matches || (noneSelected && !fieldVal[0]);
  });
}

function layersMatchSearchAndFilters(currentFilters, searchTerm) {
  const val = searchTerm.toLowerCase();
  const terms = val.split(/ +/);

  // TODO filtering by date availability e.g.:
  // const filteredRows = searchResultRows.filter((layer) => !(filterByAvailable && !availableAtDate(layer, selectedDate)));
  return initialLayersArray.filter((layer) => {
    const filterMatches = layerMatchesFilters(layer, currentFilters);
    const searchMatches = val.length === 0 ? true : !filterSearch(layer, val, terms);
    return filterMatches && searchMatches;
  });
}

// Check for search term match
function filterSearch (layer, val, terms) {
  if (!val) {
    return false;
  }

  let filtered = false;
  const names = getTitles(configRef, layer.id, projectionRef);
  const title = lodashToLower(names.title);
  const subtitle = lodashToLower(names.subtitle);
  const tags = lodashToLower(names.tags);
  const layerId = lodashToLower(layer.id);

  lodashForEach(terms, (term) => {
    filtered = !lodashIncludes(title, term)
      && !lodashIncludes(subtitle, term)
      && !lodashIncludes(tags, term)
      && !lodashIncludes(layerId, term);
    if (filtered) return false;
  });
  return filtered;
}

/**
 *
 * @param {Object} requestState
 *  - https://github.com/elastic/search-ui/blob/master/ADVANCED.md#request-state
 * @returns {Object} responseState
 *  -  https://github.com/elastic/search-ui/blob/master/ADVANCED.md#response-state
 */
async function onSearch (requestState) {
  const { filters, searchTerm } = requestState;
  const results = layersMatchSearchAndFilters(filters, searchTerm);
  updateAllFacetCounts(filters, searchTerm);

  return {
    facets: formatFacets(facets),
    results,
    totalResults: results.length,
  };
}

/**
 *
 * @param {*} layers - layer objects (filtered by projection) with additional facet props
 * @param {*} config - the entire WV config object
 * @param {*} projection - current map projection
 */
export default function initSearch(layers, config, projection) {
  initialLayersArray = layers;
  configRef = config;
  projectionRef = projection;

  layers.forEach((layer) => {
    facetFields.forEach((facetField) => {
      updateFacetCounts(facetField, layer);
    });
  });

  return {
    // debug: true,
    alwaysSearchOnInitialLoad: true,
    trackUrlState: false,
    initialState: {},
    onSearch,
    searchQuery: {},
  };
}
