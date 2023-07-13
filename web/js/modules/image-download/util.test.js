import {
  bboxWMS13,
  imageUtilCalculateResolution,
  getLatestIntervalTime,
  getDownloadUrl,
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
  const isGeo = true;
  expect(imageUtilCalculateResolution(zoom, isGeo, geoResolutions)).toBe('4');
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
  const dlURL = getDownloadUrl(url, proj, mockLayerDefs, lonlats, dimensions, dateTime, false, false, locationMarkers);
  const expectedURL = 'http://localhost:3002/api/v1/snapshot'
    + '?REQUEST=GetSnapshot'
    + '&TIME=2019-06-24T00:00:00Z'
    + '&BBOX=-14.492457798549111,-39.65420968191964,21.07185581752232,-4.089896065848208'
    + '&CRS=EPSG:4326'
    + '&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor'
    + '&WRAP=day'
    + '&FORMAT=image/jpeg'
    + '&WIDTH=300&HEIGHT=300'
    + '&MARKER=2.7117,-19.1609,71.173,-39.0961';
  expect(dlURL.includes(expectedURL)).toBe(true);
});
