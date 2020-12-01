// ArcGIS World Geocoding Service API Request Options
export const GEOSEARCH_REQUEST_OPTIONS = {
  REQUEST_OPTIONS: {
    method: 'GET',
    redirect: 'follow',
  },
  // https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm
  // necessary to filter to remove fast food type suggestions, but still include relavant Places of Interest
  GEOCODE_SUGGEST_CATEGORIES: [
    'Address',
    'Street Address',
    'Populated Place',
    'Education',
    'Land Features',
    'Water Features',
    'Museum',
    'Tourist Attraction',
    'Scientific Research',
    'Government Office',
    'Business Facility',
    'Primary Postal',
    'Airport',
  ],
  // language code EN (English) and required f request format parameters
  CONSTANT_REQUEST_PARAMETERS: 'f=json&langCode=en',
};

const {
  REQUEST_OPTIONS,
  CONSTANT_REQUEST_PARAMETERS,
} = GEOSEARCH_REQUEST_OPTIONS;

/**
 * @param {String} magicKey
 * @param {Object} config
 */
export async function processMagicKey(magicKey, config) {
  const { features: { geocodeSearch: { url: requestUrl } } } = config;
  const request = `${requestUrl}findAddressCandidates?${CONSTANT_REQUEST_PARAMETERS}&outFields=*&magicKey=${magicKey}=`;

  try {
    const response = await fetch(request, REQUEST_OPTIONS);
    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}

/**
 * @param {Array} coordinates
 * @param {Object} config
 */
export async function reverseGeocode(coordinates, config) {
  const { features: { geocodeSearch: { url: requestUrl } } } = config;
  const request = `${requestUrl}reverseGeocode?${CONSTANT_REQUEST_PARAMETERS}&location=${coordinates}`;

  try {
    const response = await fetch(request, REQUEST_OPTIONS);
    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    return console.log('error', error);
  }
}
