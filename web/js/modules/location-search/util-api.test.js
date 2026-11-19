import {
  LOCATION_SEARCH_REQUEST_OPTIONS,
  processMagicKey,
  reverseGeocode,
} from './util-api';

const { REQUEST_OPTIONS, GEOCODE_SUGGEST_CATEGORIES, CONSTANT_REQUEST_PARAMETERS } =
  LOCATION_SEARCH_REQUEST_OPTIONS;

const config = {
  features: {
    locationSearch: {
      url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/',
    },
  },
};

const mockParsedResponse = {
  candidates: [
    {
      address: 'New York, New York',
      location: { x: -74.006, y: 40.7128 },
    },
  ],
};

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve(JSON.stringify(mockParsedResponse)),
    }),
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('LOCATION_SEARCH_REQUEST_OPTIONS', () => {
  test('REQUEST_OPTIONS has method GET and redirect follow [util-api-request-options]', () => {
    expect(REQUEST_OPTIONS).toEqual({
      method: 'GET',
      redirect: 'follow',
    });
  });

  test('CONSTANT_REQUEST_PARAMETERS equals f=json&langCode=en [util-api-constant-request-params]', () => {
    expect(CONSTANT_REQUEST_PARAMETERS).toEqual('f=json&langCode=en');
  });

  test('GEOCODE_SUGGEST_CATEGORIES is an array [util-api-categories-is-array]', () => {
    expect(Array.isArray(GEOCODE_SUGGEST_CATEGORIES)).toBe(true);
  });

  test('GEOCODE_SUGGEST_CATEGORIES contains expected categories [util-api-categories-content]', () => {
    expect(GEOCODE_SUGGEST_CATEGORIES).toEqual([
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
    ]);
  });

  test('GEOCODE_SUGGEST_CATEGORIES has 13 entries [util-api-categories-length]', () => {
    expect(GEOCODE_SUGGEST_CATEGORIES).toHaveLength(13);
  });
});

describe('processMagicKey', () => {
  test('processMagicKey calls fetch with the correct URL [util-api-process-magic-key-url]', async () => {
    const magicKey = 'test1234';
    await processMagicKey(magicKey, config);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${CONSTANT_REQUEST_PARAMETERS}&outFields=*&magicKey=${magicKey}=`,
      REQUEST_OPTIONS,
    );
  });

  test('processMagicKey returns parsed JSON response [util-api-process-magic-key-response]', async () => {
    const result = await processMagicKey('test1234', config);
    expect(result).toEqual(mockParsedResponse);
  });

  test('processMagicKey calls fetch once [util-api-process-magic-key-fetch-once]', async () => {
    await processMagicKey('test1234', config);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('processMagicKey handles fetch error gracefully [util-api-process-magic-key-error]', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await processMagicKey('test1234', config);
    expect(consoleSpy).toHaveBeenCalledWith('error', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

describe('reverseGeocode', () => {
  test('reverseGeocode calls fetch with the correct URL [util-api-reverse-geocode-url]', async () => {
    const coordinates = [-74.006, 40.7128];
    await reverseGeocode(coordinates, config);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?${CONSTANT_REQUEST_PARAMETERS}&location=${coordinates}`,
      REQUEST_OPTIONS,
    );
  });

  test('reverseGeocode returns parsed JSON response [util-api-reverse-geocode-response]', async () => {
    const result = await reverseGeocode([-74.006, 40.7128], config);
    expect(result).toEqual(mockParsedResponse);
  });

  test('reverseGeocode calls fetch once [util-api-reverse-geocode-fetch-once]', async () => {
    await reverseGeocode([-74.006, 40.7128], config);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('reverseGeocode handles fetch error gracefully [util-api-reverse-geocode-error]', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await reverseGeocode([-74.006, 40.7128], config);
    expect(consoleSpy).toHaveBeenCalledWith('error', expect.any(Error));
    consoleSpy.mockRestore();
  });

  test('reverseGeocode passes coordinate array as string in request URL [util-api-reverse-geocode-coordinates-string]', async () => {
    const coordinates = [-73.7075, 41.59];
    await reverseGeocode(coordinates, config);
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain(`location=${coordinates}`);
  });
});
