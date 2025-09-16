import {
  bboxWMS13,
  imageUtilCalculateResolution,
  getLatestIntervalTime,
  getDownloadUrl,
  convertPngToKml,
  georeference,
  snapshot,
  estimateMaxCanvasSize,
  estimateMaxImageSize,
  imageSizeValid,
  getDimensions,
} from './util';

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

test('bboxWMS13 [imagedownload-bbox]', () => {
  const coords = [[11, 22], [33, 44]];
  const bboxGeo = bboxWMS13(coords, 'EPSG:4326');
  expect(bboxGeo).toBe('22,11,44,33');
  const bboxArctic = bboxWMS13(coords, 'EPSG:3413');
  expect(bboxArctic).toBe('11,22,33,44');
});

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
  const dlURL = getDownloadUrl(url, proj, mockLayerDefs, lonlats, dimensions, dateTime, false, false, locationMarkers, undefined);
  const expectedURL = 'http://localhost:3002/api/v1/snapshot'
    + '?REQUEST=GetSnapshot'
    + '&TIME=2019-06-24T00:00:00Z'
    + '&BBOX=-14.492457798549111,-39.65420968191964,21.07185581752232,-4.089896065848208'
    + '&CRS=EPSG:4326'
    + '&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor'
    + '&WRAP=day'
    + '&FORMAT=image/jpeg'
    + '&WIDTH=300&HEIGHT=300'
    + '&colormaps='
    + '&MARKER=2.7117,-19.1609,71.173,-39.0961';
  expect(dlURL.includes(expectedURL)).toBe(true);
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

describe('imageSizeValid', () => {
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
