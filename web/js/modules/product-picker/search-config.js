
import {
  get as lodashGet,
  set as lodashSet,
  forEach as lodashForEach,
  toLower as lodashToLower,
  includes as lodashIncludes,
} from 'lodash';
import moment from 'moment';
import { getTitles } from '../layers/selectors';
import { getLayersForProjection } from './selectors';
import facetConfig from './facet-config';
import { getSelectedDate } from '../date/selectors';

let initialLayersArray;
let configRef;
let projectionRef;

const facets = {};
const facetFields = facetConfig.map(({ field }) => field);
const hideZeroCountFields = facetConfig.filter((f) => f.hideZeroCount).map(({ field }) => field);

// Convert facet count obj into the format search-ui expects
function formatFacets(facetValues) {
  const formattedFacets = {};
  lodashForEach(facetValues, (facetObj, field) => {
    let data = Object.keys(facetObj)
      .map((key) => ({
        count: facetValues[field][key],
        value: key,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));

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
  let fieldVal = layer[facetField];
  // For a 'None' option remove this return and assign
  // fieldVal to 'None' when undefined
  if (!fieldVal) {
    return;
  }
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
    layersMatchCriteria(otherFilters, searchTerm)
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

function layersMatchCriteria(currentFilters, searchTerm) {
  const val = searchTerm.toLowerCase();
  const terms = val.split(/ +/);

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
 * If the selected date has changed, we need to update the coverage filter that is date
 * specific to reflect the new date.
 *
 * @param {*} filters
 * @param {*} selectedDate
 */
function updateCoverageFilter (filters, selectedDate) {
  if (!filters || !filters.length) return;
  const formattedDate = moment.utc(selectedDate).format('YYYY MMM DD');
  const oldValueMatch = (value) => !value.includes(formattedDate) && !value.includes('Always');

  filters.forEach((f) => {
    if (f.field !== 'coverage') return;
    f.values = f.values.map(
      (value) => (oldValueMatch(value) ? `Available ${formattedDate}` : value),
    );
  });
}

/**
 *
 * @param {Object} requestState
 *  - https://github.com/elastic/search-ui/blob/master/ADVANCED.md#request-state
 * @returns {Object} responseState
 *  -  https://github.com/elastic/search-ui/blob/master/ADVANCED.md#response-state
 */
async function onSearch ({ filters, searchTerm }) {
  const results = layersMatchCriteria(filters, searchTerm);
  updateAllFacetCounts(filters, searchTerm);

  return {
    facets: formatFacets(facets),
    results,
    totalResults: results.length,
  };
}

/**
 * @param {*} state - current redux state
 *
 * @returns a SearchProvider configuration object.
 * https://github.com/elastic/search-ui/blob/master/ADVANCED.md#advanced-configuration
 */
export default function initSearch(state) {
  const { productPicker, config, proj } = state;
  const { filters, searchTerm } = productPicker;
  const selectedDate = getSelectedDate(state);

  updateCoverageFilter(filters, selectedDate);
  initialLayersArray = getLayersForProjection(state);
  configRef = config;
  projectionRef = proj && proj.id;

  initialLayersArray.forEach((layer) => {
    facetFields.forEach((facetField) => {
      updateFacetCounts(facetField, layer);
    });
  });

  return {
    // debug: true,
    alwaysSearchOnInitialLoad: true,
    trackUrlState: false,
    initialState: {
      filters,
      searchTerm,
    },
    onSearch,
    searchQuery: {},
  };
}
