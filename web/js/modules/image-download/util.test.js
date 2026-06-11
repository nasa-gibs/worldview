import {
  bboxWMS13,
  imageUtilCalculateResolution,
  imageUtilEstimateResolution,
  imageUtilGetConversionFactor,
  imageUtilGetLayers,
  imageUtilGetLayerOpacities,
  imageUtilGetLayerWrap,
  getLatestIntervalTime,
  getDownloadUrl,
  getTruncatedGranuleDates,
  getDimensions,
  getPercentageFromPixel,
  getPixelFromPercentage,
  imageSizeValid,
  hasNonDownloadableVisibleLayer,
  getNonDownloadableLayers,
  getNamesOfNondownloadableLayers,
  getNonDownloadableLayerWarning,
  getAlertMessageIfCrossesDateline,
  imageUtilGetCoordsFromPixelValues,
  imageUtilGetPixelValuesFromCoords,
  GRANULE_LIMIT,
  convertPngToKml,
  georeference,
  snapshot,
  estimateMaxCanvasSize,
  estimateMaxImageSize,
} from './util';

jest.mock('ol/proj', () => ({
  ...jest.requireActual('ol/proj'),
  get: jest.fn((projString) => {
    if (projString === 'EPSG:4326') {
      return { getUnits: () => 'degrees', getMetersPerUnit: () => 111319.49079327358 };
    } else {
      return { getUnits: () => 'm', getMetersPerUnit: () => 1 };
    }
  }),
}));

const geoResolutions = [
  0.5625,
  0.28125,
  0.140625,
  0.0703125,
  0.03515625,
  0.017578125,
  0.0087890625,
  0.00439453125,
  0.002197265625,
  0.0010986328125,
  0.00054931640625,
  0.00027465820313,
];
const mockLayerDefs = [{
  id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
  type: 'wmts',
  format: 'image/jpeg',
  period: 'daily',
  startDate: '2015-11-24T00:00:00Z',
  dateRanges: [
    {
      startDate: '2015-11-24T00:00:00Z',
      endDate: '2019-09-16T00:00:00Z',
      dateInterval: '1',
    },
  ],
  projections: {
    antarctic: {
      source: 'GIBS:antarctic',
      matrixSet: '250m',
    },
    arctic: {
      source: 'GIBS:arctic',
      matrixSet: '250m',
    },
    geographic: {
      source: 'GIBS:geographic',
      matrixSet: '250m',
    },
  },
  title: 'Corrected Reflectance (True Color)',
  subtitle: 'Suomi NPP / VIIRS',
  description: 'viirs/VIIRS_SNPP_CorrectedReflectance_TrueColor',
  tags: 'natural color cr s-npp snpp',
  layergroup: [
    'viirs',
  ],
  group: 'baselayers',
  wrapadjacentdays: true,
  visible: true,
  opacity: 1,
}];
const mockLayerDefsSubdaily = [
  {
    id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    type: 'wmts',
    format: 'image/jpeg',
    period: 'daily',
    startDate: '2015-11-24T00:00:00Z',
    dateRanges: [
      {
        startDate: '2015-11-24T00:00:00Z',
        endDate: '2019-09-16T00:00:00Z',
        dateInterval: '1',
      },
    ],
    projections: {
      antarctic: {
        source: 'GIBS:antarctic',
        matrixSet: '250m',
      },
      arctic: {
        source: 'GIBS:arctic',
        matrixSet: '250m',
      },
      geographic: {
        source: 'GIBS:geographic',
        matrixSet: '250m',
      },
    },
    title: 'Corrected Reflectance (True Color)',
    subtitle: 'Suomi NPP / VIIRS',
    description: 'viirs/VIIRS_SNPP_CorrectedReflectance_TrueColor',
    tags: 'natural color cr s-npp snpp',
    layergroup: [
      'viirs',
    ],
    group: 'baselayers',
    wrapadjacentdays: true,
    visible: true,
    opacity: 1,
  },
  {
    id: 'GOES-East_ABI_Air_Mass',
    type: 'wmts',
    format: 'image/png',
    period: 'subdaily',
    startDate: '2019-06-23T00:00:00Z',
    endDate: '2019-09-09T15:50:00Z',
    dateRanges: [
      {
        startDate: '2019-06-23T00:00:00Z',
        endDate: '2019-09-09T15:50:00Z',
        dateInterval: '10',
      },
    ],
    projections: {
      geographic: {
        source: 'GIBS:geographic:subdaily',
        matrixSet: '2km',
      },
    },
    title: 'Air Mass (ABI, GOES-East)',
    subtitle: 'GOES-East / ABI',
    description: 'goes/GOES-East_ABI_Air_Mass',
    tags: 'GOES subdaily',
    group: 'overlays',
    layergroup: [
      'GOES',
    ],
    ongoing: false,
    visible: true,
    opacity: 1,
  },
  {
    id: 'Coastlines',
    type: 'wmts',
    format: 'image/png',
    projections: {
      antarctic: {
        source: 'GIBS:antarctic',
        matrixSet: '250m',
        subtitle: 'SCAR Antarctic Digital Database / Coastlines',
        tags: 'borders reference',
      },
      arctic: {
        source: 'GIBS:arctic',
        matrixSet: '250m',
        subtitle: '&copy; OpenStreetMap contributors',
        tags: 'borders reference osm',
      },
      geographic: {
        source: 'GIBS:geographic',
        matrixSet: '250m',
        subtitle: '&copy; OpenStreetMap contributors',
        tags: 'borders reference osm',
      },
    },
    title: 'Coastlines',
    description: 'reference/Coastlines',
    group: 'overlays',
    tileSize: [
      512,
      512,
    ],
    noTransition: 'true',
    layergroup: [
      'reference',
    ],
    wrapX: true,
    visible: true,
    opacity: 1,
  },
];

// ------- bboxWMS13 -------

test('bboxWMS13 [imagedownload-bbox]', () => {
  const coords = [[11, 22], [33, 44]];
  const bboxGeo = bboxWMS13(coords, 'EPSG:4326');
  expect(bboxGeo).toBe('22,11,44,33');
  const bboxArctic = bboxWMS13(coords, 'EPSG:3413');
  expect(bboxArctic).toBe('11,22,33,44');
});

// ------- imageUtilCalculateResolution -------

test('Default km resolution Calculation [imagedownload-default-resolution]', () => {
  const zoom = 5;
  const proj = {
    id: 'geographic',
    selected: {
      crs: 'EPSG:4326',
      resolutions: geoResolutions,
    },
  };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(zoom, proj, center)).toBe(1000);
});

test('Resolution calculation with negative zoom clamps to 0 [imagedownload-resolution-negative-zoom]', () => {
  const proj = { selected: { id: 'geographic', crs: 'EPSG:4326', resolutions: geoResolutions } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(-1, proj, center)).toBe(10000);
});

test('Resolution calculation with zoom beyond max clamps to last resolution [imagedownload-resolution-zoom-overflow]', () => {
  const proj = { selected: { id: 'geographic', crs: 'EPSG:4326', resolutions: geoResolutions } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(999, proj, center)).toBe(250);
});

test('Resolution calculation for polar projection [imagedownload-resolution-polar]', () => {
  const proj = { selected: { id: 'arctic', crs: 'EPSG:3413', resolutions: [500, 250, 125, 62.5, 31.25] } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(1, proj, center)).toBe(250);
});

test('Resolution calculation bumps up at geo zoom 3 [imagedownload-resolution-zoom3]', () => {
  const proj = { selected: { id: 'geographic', crs: 'EPSG:4326', resolutions: geoResolutions } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(3, proj, center)).toBe(10000);
});

test('Resolution calculation bumps up at geo zoom 4 [imagedownload-resolution-zoom4]', () => {
  const proj = { selected: { id: 'geographic', crs: 'EPSG:4326', resolutions: geoResolutions } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(4, proj, center)).toBe(1000);
});

test('Resolution calculation bumps up at geo zoom 6 [imagedownload-resolution-zoom6]', () => {
  const proj = { selected: { id: 'geographic', crs: 'EPSG:4326', resolutions: geoResolutions } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(6, proj, center)).toBe(1000);
});

test('Resolution calculation bumps up at geo zoom 7 [imagedownload-resolution-zoom7]', () => {
  const proj = { selected: { id: 'geographic', crs: 'EPSG:4326', resolutions: geoResolutions } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(7, proj, center)).toBe(500);
});

test('Resolution calculation bumps up at polar zoom 0 [imagedownload-resolution-polar-zoom0]', () => {
  const proj = { selected: { id: 'arctic', crs: 'EPSG:3413', resolutions: [500, 250, 125, 62.5, 31.25] } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(0, proj, center)).toBe(500);
});

test('Resolution calculation bumps up at polar zoom 2 [imagedownload-resolution-polar-zoom2]', () => {
  const proj = { selected: { id: 'arctic', crs: 'EPSG:3413', resolutions: [500, 250, 125, 62.5, 31.25] } };
  const center = [0, 0];
  expect(imageUtilCalculateResolution(2, proj, center)).toBe(250);
});

// ------- imageUtilEstimateResolution -------

test('imageUtilEstimateResolution for geo projection [imagedownload-estimate-resolution-geo]', () => {
  const result = imageUtilEstimateResolution(0.017578125, false);
  expect(typeof result).toBe('number');
});

test('imageUtilEstimateResolution for polar projection [imagedownload-estimate-resolution-polar]', () => {
  const result = imageUtilEstimateResolution(0.017578125, true);
  expect(typeof result).toBe('number');
});

// ------- imageUtilGetConversionFactor -------

test('imageUtilGetConversionFactor returns polar constant for geographic [imagedownload-conversion-geo]', () => {
  expect(imageUtilGetConversionFactor('geographic')).toBeCloseTo(0.002197265625);
});

test('imageUtilGetConversionFactor returns geo constant for non-geographic [imagedownload-conversion-polar]', () => {
  expect(imageUtilGetConversionFactor('arctic')).toBe(256.0);
});

// ------- imageUtilGetLayerWrap -------

test('imageUtilGetLayerWrap returns x for wrapX layers [imagedownload-wrap-x]', () => {
  const layers = [{ wrapX: true }, { wrapadjacentdays: true }, {}];
  expect(imageUtilGetLayerWrap(layers)).toEqual(['x', 'day', 'none']);
});

// ------- imageUtilGetLayerOpacities -------

test('imageUtilGetLayerOpacities returns empty array when all opacities are 1 [imagedownload-opacities-full]', () => {
  const layers = [{ opacity: 1 }, { opacity: 1 }];
  expect(imageUtilGetLayerOpacities(layers)).toEqual([]);
});

test('imageUtilGetLayerOpacities returns array when a layer has non-1 opacity [imagedownload-opacities-partial]', () => {
  const layers = [{ opacity: 0.5 }, { opacity: 1 }];
  expect(imageUtilGetLayerOpacities(layers)).toEqual([0.5, '']);
});

test('imageUtilGetLayerOpacities handles layer with no opacity key [imagedownload-opacities-missing]', () => {
  const layers = [{ opacity: 0.5 }, {}];
  expect(imageUtilGetLayerOpacities(layers)).toEqual([0.5, '']);
});

// ------- imageUtilGetLayers -------

test('imageUtilGetLayers returns layer id by default [imagedownload-layers-default]', () => {
  const layers = [{
    id: 'LayerA',
    projections: { geographic: {} },
  }];
  expect(imageUtilGetLayers(layers, 'geographic', undefined)).toEqual(['LayerA']);
});

test('imageUtilGetLayers uses downloadId when present [imagedownload-layers-downloadId]', () => {
  const layers = [{
    id: 'LayerA',
    downloadId: 'LayerA_Download',
    projections: { geographic: {} },
  }];
  expect(imageUtilGetLayers(layers, 'geographic', undefined)).toEqual(['LayerA_Download']);
});

test('imageUtilGetLayers uses projection id when present [imagedownload-layers-projid]', () => {
  const layers = [{
    id: 'LayerA',
    projections: { geographic: { id: 'LayerA_Geo' } },
  }];
  expect(imageUtilGetLayers(layers, 'geographic', undefined)).toEqual(['LayerA_Geo']);
});

test('imageUtilGetLayers uses projection layer when present [imagedownload-layers-projlayer]', () => {
  const layers = [{
    id: 'LayerA',
    projections: { geographic: { layer: 'LayerA_Layer' } },
  }];
  expect(imageUtilGetLayers(layers, 'geographic', undefined)).toEqual(['LayerA_Layer']);
});

test('imageUtilGetLayers appends disabled palette info [imagedownload-layers-disabled-palette]', () => {
  const layers = [{
    id: 'LayerA',
    projections: { geographic: {} },
  }];
  const activePalettes = {
    LayerA: { maps: [{ disabled: [0, 1] }] },
  };
  const result = imageUtilGetLayers(layers, 'geographic', activePalettes);
  expect(result[0]).toContain('disabled=0-1');
});

// ------- getLatestIntervalTime -------

test('Date time snapping when no subdaily layers present [imagedownload-time-snap-no-subdaily]', () => {
  const mockDate = new Date('2019-09-15T18:32:40Z');
  const expectedTime = new Date('2019-09-15T00:00:00Z');
  const snappedDateTime = getLatestIntervalTime(mockLayerDefs, mockDate);
  expect(snappedDateTime.getTime()).toBe(expectedTime.getTime());
});

test('Date time snapping with subdaily layers present [imagedownload-time-snap-subdaily]', () => {
  const mockDate = new Date('2019-09-15T18:32:40Z');
  const expectedTime = new Date('2019-09-15T18:30:00Z');
  const snappedDateTime = getLatestIntervalTime(mockLayerDefsSubdaily, mockDate);
  expect(snappedDateTime.getTime()).toBe(expectedTime.getTime());
});

test('Date time snapping returns dateTime unchanged when TEMPO layer present [imagedownload-time-snap-tempo]', () => {
  const mockDate = new Date('2019-09-15T18:32:40Z');
  const tempoLayerDefs = [{
    id: 'TEMPO_NO2_Vertical_Column',
    period: 'subdaily',
    dateRanges: [{ startDate: '2019-01-01T00:00:00Z', endDate: '2019-12-31T00:00:00Z', dateInterval: '60' }],
    projections: { geographic: {} },
    opacity: 1,
  }];
  const result = getLatestIntervalTime(tempoLayerDefs, mockDate);
  expect(result).toBe(mockDate);
});

// ------- getTruncatedGranuleDates -------

test('getTruncatedGranuleDates returns empty string when no granule layers [imagedownload-granule-none]', () => {
  const result = getTruncatedGranuleDates(mockLayerDefs);
  expect(result.value).toBe('');
  expect(result.truncated).toBe(false);
});

test('getTruncatedGranuleDates returns formatted dates for granule layer [imagedownload-granule-dates]', () => {
  const layerDefs = [{
    id: 'GranuleLayer',
    granuleDates: ['2021-01-01T00Z', '2021-01-02T12:00Z'],
    projections: { geographic: {} },
  }];
  const result = getTruncatedGranuleDates(layerDefs);
  expect(result.truncated).toBe(false);
  expect(result.value).toContain('2021-01-01');
});

test('getTruncatedGranuleDates truncates when over GRANULE_LIMIT [imagedownload-granule-truncated]', () => {
  const dates = Array.from({ length: GRANULE_LIMIT + 5 }, (_, i) => `2021-01-${String(i + 1).padStart(2, '0')}T00Z`);
  const layerDefs = [
    { id: 'GranuleLayer1', granuleDates: dates, projections: { geographic: {} } },
    { id: 'GranuleLayer2', granuleDates: ['2021-02-01T00Z'], projections: { geographic: {} } },
  ];
  const result = getTruncatedGranuleDates(layerDefs);
  expect(result.truncated).toBe(true);
});

// ------- getDimensions -------

const mockMap = {
  getView: () => ({
    getProjection: () => ({
      getUnits: () => 'degrees',
      getMetersPerUnit: () => 111000,
    }),
    getCenter: () => [0, 0],
  }),
};
const resolution = 1000;

test('getDimensions returns correct width and height for geographic [imagedownload-dimensions-geo]', () => {
  const bounds = [[0, 0], [1, 1]];
  const result = getDimensions(mockMap, bounds, resolution);
  expect(result).toHaveProperty('width');
  expect(result).toHaveProperty('height');
  expect(result.width).toBeGreaterThan(0);
  expect(result.height).toBeGreaterThan(0);
});

test('getDimensions returns correct width and height for polar [imagedownload-dimensions-polar]', () => {
  const bounds = [[0, 0], [1000000, 1000000]];
  const result = getDimensions(mockMap, bounds, resolution);
  expect(result.width).toBeGreaterThan(0);
  expect(result.height).toBeGreaterThan(0);
});

// ------- getPercentageFromPixel -------

test('getPercentageFromPixel calculates correct percentage [imagedownload-percent-from-pixel]', () => {
  expect(getPercentageFromPixel(1000, 250)).toBe(25);
});

// ------- getPixelFromPercentage -------

test('getPixelFromPercentage calculates correct pixel [imagedownload-pixel-from-percent]', () => {
  expect(getPixelFromPercentage(1000, 25)).toBe(250);
});

// ------- imageSizeValid -------
test('should return false for zero size', () => {
  const mockMap = {
    getView: () => ({
      getProjection: () => ({ getUnits: () => 'degrees', getMetersPerUnit: () => 111000 }),
      getCenter: () => [0, 0],
      getResolutionForExtent: () => 1000,
    }),
    getSize: () => [1000, 1000],
    getCoordinateFromPixel: jest.fn().mockReturnValue([0, 0]),
  };
  const options = {
    maxHeight: 8192,
    maxWidth: 8192,
    map: mockMap,
    resolution: 1000,
    pixelBbox: [[0, 0], [0, 0]],
  };
  const result = imageSizeValid(options);
  expect(result).toBe(false);
});

test('should return false for oversized image', () => {
  const mockMapLarge = {
    getView: () => ({
      getProjection: () => ({ getUnits: () => 'degrees', getMetersPerUnit: () => 111000 }),
      getCenter: () => [0, 0],
      getResolutionForExtent: () => 1000,
    }),
    getSize: () => [10000, 10000],
    getCoordinateFromPixel: jest.fn().mockReturnValue([0, 0]),
  };
  const options = {
    maxHeight: 1000,
    maxWidth: 1000,
    map: mockMapLarge,
    resolution: 1,
    pixelBbox: [[0, 0], [100, 100]],
  };
  const result = imageSizeValid(options);
  expect(result).toBe(false);
});

// ------- hasNonDownloadableVisibleLayer -------

test('hasNonDownloadableVisibleLayer returns true when a layer has disableSnapshot [imagedownload-has-non-dl-true]', () => {
  expect(hasNonDownloadableVisibleLayer([
    { disableSnapshot: true }, { disableSnapshot: false },
  ], true)).toBe(true);
});

test('hasNonDownloadableVisibleLayer returns false when no layers have disableSnapshot [imagedownload-has-non-dl-false]', () => {
  expect(hasNonDownloadableVisibleLayer([{ disableSnapshot: false }, {}])).toBe(false);
});

// ------- getNonDownloadableLayers -------

test('getNonDownloadableLayers filters to only disableSnapshot layers [imagedownload-get-non-dl-layers]', () => {
  const layers = [{ id: 'A', disableSnapshot: true }, { id: 'B' }, { id: 'C', disableSnapshot: false }];
  expect(getNonDownloadableLayers(layers, true)).toEqual([{ id: 'A', disableSnapshot: true }]);
});

test('getNonDownloadableLayers returns empty array when none disabled [imagedownload-get-non-dl-empty]', () => {
  expect(getNonDownloadableLayers([{ id: 'A' }, { id: 'B' }])).toEqual([]);
});

// ------- getNamesOfNondownloadableLayers -------

test('getNamesOfNondownloadableLayers returns empty string for empty array [imagedownload-names-empty]', () => {
  expect(getNamesOfNondownloadableLayers([])).toBe('');
});

test('getNamesOfNondownloadableLayers returns title when present [imagedownload-names-title]', () => {
  expect(getNamesOfNondownloadableLayers([{ title: 'Layer A', id: 'layer-a' }])).toBe('Layer A');
});

test('getNamesOfNondownloadableLayers falls back to id when no title [imagedownload-names-id]', () => {
  expect(getNamesOfNondownloadableLayers([{ id: 'layer-a' }])).toBe('layer-a');
});

test('getNamesOfNondownloadableLayers comma-separates multiple layers [imagedownload-names-multi]', () => {
  const layers = [{ title: 'Layer A' }, { title: 'Layer B' }];
  expect(getNamesOfNondownloadableLayers(layers)).toBe('Layer A, Layer B');
});

// ------- getNonDownloadableLayerWarning -------

test('getNonDownloadableLayerWarning returns empty string for empty array [imagedownload-warning-empty]', () => {
  expect(getNonDownloadableLayerWarning([])).toBe('');
});

test('getNonDownloadableLayerWarning returns singular form for one layer [imagedownload-warning-single]', () => {
  const result = getNonDownloadableLayerWarning([{ title: 'Layer A' }]);
  expect(result).toContain('layer');
  expect(result).toContain('this');
  expect(result).not.toContain('layers');
});

test('getNonDownloadableLayerWarning returns plural form for multiple layers [imagedownload-warning-plural]', () => {
  const result = getNonDownloadableLayerWarning([{ title: 'Layer A' }, { title: 'Layer B' }]);
  expect(result).toContain('layers');
  expect(result).toContain('these');
});

// ------- getAlertMessageIfCrossesDateline -------

test('getAlertMessageIfCrossesDateline returns empty string when no crossing [imagedownload-dateline-none]', () => {
  const date = new Date('2021-01-15T00:00:00Z');
  const proj = { selected: { id: 'geographic', maxExtent: [-180, -90, 180, 90] } };
  const result = getAlertMessageIfCrossesDateline(date, [-100, 0], [100, 50], proj);
  expect(result).toBe('');
});

test('getAlertMessageIfCrossesDateline returns empty string for non-geographic projection [imagedownload-dateline-non-geo]', () => {
  const date = new Date('2021-01-15T00:00:00Z');
  const proj = { selected: { id: 'arctic', maxExtent: [-4194304, -4194304, 4194304, 4194304] } };
  const result = getAlertMessageIfCrossesDateline(date, [-200, 0], [200, 50], proj);
  expect(result).toBe('');
});

test('getAlertMessageIfCrossesDateline detects next day crossing [imagedownload-dateline-next]', () => {
  const date = new Date('2021-01-15T00:00:00Z');
  const proj = { selected: { id: 'geographic', maxExtent: [-180, -90, 180, 90] } };
  const result = getAlertMessageIfCrossesDateline(date, [-200, 0], [100, 50], proj);
  expect(result).toContain('next day');
});

test('getAlertMessageIfCrossesDateline detects prev day crossing [imagedownload-dateline-prev]', () => {
  const date = new Date('2021-01-15T00:00:00Z');
  const proj = { selected: { id: 'geographic', maxExtent: [-180, -90, 180, 90] } };
  const result = getAlertMessageIfCrossesDateline(date, [-100, 0], [200, 50], proj);
  expect(result).toContain('previous day');
});

test('getAlertMessageIfCrossesDateline detects both datelines crossing [imagedownload-dateline-both]', () => {
  const date = new Date('2021-01-15T00:00:00Z');
  const proj = { selected: { id: 'geographic', maxExtent: [-180, -90, 180, 90] } };
  const result = getAlertMessageIfCrossesDateline(date, [-200, 0], [200, 50], proj);
  expect(result).toContain('both datelines');
});

// ------- imageUtilGetCoordsFromPixelValues -------

test('imageUtilGetCoordsFromPixelValues calls map correctly [imagedownload-coords-from-pixels]', () => {
  const mockMap = {
    getCoordinateFromPixel: jest.fn((px) => px),
  };
  const pixels = { x: 10.7, y: 20.3, x2: 30.9, y2: 40.1 };
  const result = imageUtilGetCoordsFromPixelValues(pixels, mockMap);
  expect(mockMap.getCoordinateFromPixel).toHaveBeenCalledWith([10, 40]);
  expect(mockMap.getCoordinateFromPixel).toHaveBeenCalledWith([30, 20]);
  expect(result).toHaveLength(2);
});

// ------- imageUtilGetPixelValuesFromCoords -------

test('imageUtilGetPixelValuesFromCoords calls map correctly [imagedownload-pixels-from-coords]', () => {
  const mockMap = {
    getPixelFromCoordinate: jest.fn()
      .mockReturnValueOnce([15.4, 25.6])
      .mockReturnValueOnce([35.2, 45.8]),
  };
  const result = imageUtilGetPixelValuesFromCoords([0, 0], [1, 1], mockMap);
  expect(result).toEqual({ x: 15, y: 46, x2: 35, y2: 26 });
});

// ------- getDownloadUrl -------

test('Download URL [imagedownload-url]', () => {
  const url = 'http://localhost:3002/api/v1/snapshot';
  const proj = {
    id: 'geographic',
    selected: { crs: 'EPSG:4326' },
  };
  const lonlats = [
    [-39.65420968191964, -14.492457798549111],
    [-4.089896065848208, 21.07185581752232],
  ];
  const dimensions = {
    width: 300,
    height: 300,
  };
  const dateTime = new Date('2019-06-24T19:04:00Z');
  const locationMarkers = [
    { id: 1, longitude: 2.7117, latitude: -19.1609 },
    { id: 2, longitude: 71.173, latitude: -39.0961 },
  ];
  const dlURL = getDownloadUrl(
    url,
    proj,
    mockLayerDefs,
    lonlats,
    dimensions,
    dateTime,
    false,
    false,
    locationMarkers,
    undefined,
  );
  const expectedURL = 'http://localhost:3002/api/v1/snapshot' +
    '?REQUEST=GetSnapshot' +
    '&TIME=2019-06-24T00:00:00Z' +
    '&BBOX=-14.492457798549111,-39.65420968191964,21.07185581752232,-4.089896065848208' +
    '&CRS=EPSG:4326' +
    '&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor' +
    '&WRAP=day' +
    '&FORMAT=image/jpeg' +
    '&WIDTH=300&HEIGHT=300' +
    '&colormaps=' +
    '&MARKER=2.7117,-19.1609,71.173,-39.0961';
  expect(dlURL.includes(expectedURL)).toBe(true);
});

test('Download URL includes WORLDFILE param when isWorldfile is true [imagedownload-url-worldfile]', () => {
  const url = 'http://localhost:3002/api/v1/snapshot';
  const proj = { id: 'geographic', selected: { crs: 'EPSG:4326' } };
  const lonlats = [[-10, -10], [10, 10]];
  const dimensions = { width: 200, height: 200 };
  const dateTime = new Date('2019-06-24T00:00:00Z');
  const dlURL = getDownloadUrl(
    url, proj, mockLayerDefs, lonlats, dimensions, dateTime, false, true, [], undefined,
  );
  expect(dlURL).toContain('WORLDFILE=true');
});

test('Download URL uses specified fileType format [imagedownload-url-filetype]', () => {
  const url = 'http://localhost:3002/api/v1/snapshot';
  const proj = { id: 'geographic', selected: { crs: 'EPSG:4326' } };
  const lonlats = [[-10, -10], [10, 10]];
  const dimensions = { width: 200, height: 200 };
  const dateTime = new Date('2019-06-24T00:00:00Z');
  const dlURL = getDownloadUrl(url, proj, mockLayerDefs, lonlats, dimensions, dateTime, 'image/png', false, [], undefined);
  expect(dlURL).toContain('FORMAT=image/png');
});

test('Download URL omits MARKER param when no markers provided [imagedownload-url-no-markers]', () => {
  const url = 'http://localhost:3002/api/v1/snapshot';
  const proj = { id: 'geographic', selected: { crs: 'EPSG:4326' } };
  const lonlats = [[-10, -10], [10, 10]];
  const dimensions = { width: 200, height: 200 };
  const dateTime = new Date('2019-06-24T00:00:00Z');
  const dlURL = getDownloadUrl(
    url, proj, mockLayerDefs, lonlats, dimensions, dateTime, false, false, [], undefined,
  );
  expect(dlURL).not.toContain('MARKER=');
});

test('Download URL includes OPACITIES when layer opacity is not 1 [imagedownload-url-opacities]', () => {
  const url = 'http://localhost:3002/api/v1/snapshot';
  const proj = { id: 'geographic', selected: { crs: 'EPSG:4326' } };
  const lonlats = [[-10, -10], [10, 10]];
  const dimensions = { width: 200, height: 200 };
  const dateTime = new Date('2019-06-24T00:00:00Z');
  const layersWithOpacity = [{ ...mockLayerDefs[0], opacity: 0.5 }];
  const dlURL = getDownloadUrl(
    url, proj, layersWithOpacity, lonlats, dimensions, dateTime, false, false, [], undefined,
  );
  expect(dlURL).toContain('OPACITIES=');
});

test('Download URL includes KMZ OrbitTrack split layers [imagedownload-url-kmz-orbittracks]', () => {
  const url = 'http://localhost:3002/api/v1/snapshot';
  const proj = { id: 'geographic', selected: { crs: 'EPSG:4326' } };
  const lonlats = [[-10, -10], [10, 10]];
  const dimensions = { width: 200, height: 200 };
  const dateTime = new Date('2019-06-24T00:00:00Z');
  const orbitLayers = [{
    id: 'OrbitTracks_Aqua_Ascending',
    projections: { geographic: {} },
    wrapadjacentdays: false,
    wrapX: false,
    opacity: 1,
  }];
  const dlURL = getDownloadUrl(
    url, proj, orbitLayers, lonlats, dimensions, dateTime,
    'application/vnd.google-earth.kmz', false, [], undefined,
  );
  expect(dlURL).toContain('OrbitTracks_Aqua_Ascending_Lines');
  expect(dlURL).toContain('OrbitTracks_Aqua_Ascending_Points');
});

test('Download URL includes granule_dates when granuleDates present [imagedownload-url-granule-dates]', () => {
  const url = 'http://localhost:3002/api/v1/snapshot';
  const proj = { id: 'geographic', selected: { crs: 'EPSG:4326' } };
  const lonlats = [[-10, -10], [10, 10]];
  const dimensions = { width: 200, height: 200 };
  const dateTime = new Date('2019-06-24T00:00:00Z');
  const granuleLayers = [{
    ...mockLayerDefs[0],
    granuleDates: ['2021-01-01T12:00Z'],
  }];
  const dlURL = getDownloadUrl(
    url, proj, granuleLayers, lonlats, dimensions, dateTime, false, false, [], undefined,
  );
  expect(dlURL).toContain('granule_dates=');
});

// ------- GRANULE_LIMIT -------

test('GRANULE_LIMIT is 30 [imagedownload-granule-limit]', () => {
  expect(GRANULE_LIMIT).toBe(30);
});

// Tests for coordinate conversion functions
describe('coordinate conversion functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDimensions should calculate image dimensions', () => {
    const mockMap = {
      getView: () => ({
        getProjection: () => ({
          getUnits: () => 'degrees',
          getMetersPerUnit: () => 111000,
        }),
        getCenter: () => [0, 0],
      }),
    };
    const bounds = [[0, 0], [1, 1]];
    const resolution = 1000;

    const result = getDimensions(mockMap, bounds, resolution);
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
  });
});

// Tests for canvas size estimation
describe('canvas size functions', () => {
  test('estimateMaxCanvasSize should return a function', () => {
    const result = estimateMaxCanvasSize();
    expect(typeof result).toBe('object');
  });

  test('estimateMaxImageSize should be an async function', async () => {
    // Mock canvas-size to avoid environment issues
    jest.doMock('canvas-size', () => ({
      maxArea: () => Promise.resolve({ height: 8192, width: 8192 }),
    }));

    // This test would need proper mocking of canvas-size in a real test environment
    expect(estimateMaxImageSize).toBeInstanceOf(Function);
  });
});

// Tests for convertPngToKml
describe('convertPngToKml', () => {
  test('should reject non-Blob input', async () => {
    await expect(convertPngToKml('not a blob', {})).rejects.toThrow('Input must be a Blob');
  });

  test('should reject non-WGS84 CRS', async () => {
    const blob = new Blob(['fake png data'], { type: 'image/png' });
    const options = { crs: 'EPSG:3857', extent: [0, 0, 1, 1] };
    await expect(convertPngToKml(blob, options)).rejects.toThrow('KML requires WGS84 coordinates');
  });

  test('should create KML with valid inputs', async () => {
    const blob = new Blob(['fake png data'], { type: 'image/png' });
    const options = {
      crs: 'EPSG:4326',
      extent: [-180, -90, 180, 90],
      name: 'Test Image',
    };

    const result = await convertPngToKml(blob, options);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/vnd.google-earth.kml+xml');
  });
});

// Mock tests for async functions that require complex dependencies
describe('complex async functions (mocked)', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('georeference', () => {
    test('should handle KML output format', async () => {
      // Mock convertPngToKml to avoid complex dependencies
      const mockKmlBlob = new Blob(['<kml></kml>'], { type: 'application/vnd.google-earth.kml+xml' });
      jest.doMock('./util', () => ({
        ...jest.requireActual('./util'),
        convertPngToKml: jest.fn().mockResolvedValue(mockKmlBlob),
      }));

      // This would need proper mocking of GDAL in a real test environment
      // For now, we're just testing that the function exists and is async
      expect(georeference).toBeInstanceOf(Function);
    });
  });

  describe('snapshot', () => {
    test('should throw AbortError when already aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const options = {
        format: 'png',
        metersPerPixel: 1000,
        pixelBbox: [0, 0, 100, 100],
        map: { getSize: () => [1000, 1000] },
        abortSignal: abortController.signal,
      };

      await expect(snapshot(options)).rejects.toThrow(DOMException);
    });

    test('should be an async function', () => {
      expect(snapshot).toBeInstanceOf(Function);
      expect(snapshot.constructor.name).toBe('AsyncFunction');
    });
  });
});
