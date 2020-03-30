import {
  get as lodashGet,
  set as lodashSet,
  forEach as lodashForEach,
} from 'lodash';

const facets = {};
let initialLayersArray;
const initialState = {
  filters: [
    // {
    //   field: "facetPeriod",
    //   values: ["Multi-Day"],
    //   type: "any"
    // }
  ],
  resultsPerPage: Infinity,
};

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

function updateAllFacetCounts(currentFilters) {
  resetFacetCounts();
  facetFields.forEach((facetField) => {
    // Start with a filtered result array that has all OTHER facets applied
    const otherFilters = currentFilters.filter((f) => f.field !== facetField);
    layersMatchFilters(initialLayersArray, otherFilters).forEach((layer) => {
      updateFacetCounts(facetField, layer);
    });
  });
}

function layersMatchFilters(layers, filters) {
  return layers.filter((layer) => filters.every(({ field, values }) => {
    let fieldVal = layer[field];
    fieldVal = Array.isArray(fieldVal) ? fieldVal : [fieldVal];
    const noneSelected = values.includes('None');
    const matches = values.some((value) => fieldVal.includes(value));
    return matches || (noneSelected && !fieldVal[0]);
  }));
}

async function onSearch(requestState, queryConfig) {
  const { filters, searchTerm } = requestState;
  const results = layersMatchFilters(initialLayersArray, filters);
  updateAllFacetCounts(filters);
  return {
    facets: formatFacets(facets),
    results,
    resultSearchTerm: '',
    totalResults: results.length,
  };
}

export default function getSearchConfig(layers) {
  initialLayersArray = layers;
  layers.forEach((layer) => {
    facetFields.forEach((facetField) => {
      updateFacetCounts(facetField, layer);
    });
  });

  return {
    debug: true, // TODO disable for prod
    alwaysSearchOnInitialLoad: true,
    trackUrlState: false,
    initialState,
    onSearch,
    searchQuery: {},
  };
}
