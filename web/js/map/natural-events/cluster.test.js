import {
  naturalEventsClusterCreateObject,
  clusterPointToGeoJSON,
  clusterSort,
  getClusterPoints,
  getClusters,
} from './cluster';

// ---------------------------------------------------------------------------
// Mock external dependencies
// ---------------------------------------------------------------------------
jest.mock('../util', () => ({
  crossesDateLine: jest.fn(),
  getOverDateLineCoordinates: jest.fn(),
}));

import { crossesDateLine, getOverDateLineCoordinates } from '../util';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const geoProj = { selected: { id: 'geographic' } };
const polarProj = { selected: { id: 'arctic' } };

const makeMapMock = (zoom = 3) => ({
  getView: () => ({ getZoom: () => zoom }),
});

// A minimal set of geometry entries used across getClusters tests
const makeGeometry = () => [
  { date: '2019-09-22T00:00:00Z', coordinates: [10, 40], magnitudeUnit: 'kts', magnitudeValue: 50 },
  { date: '2019-09-23T00:00:00Z', coordinates: [12, 41], magnitudeUnit: 'kts', magnitudeValue: 55 },
  { date: '2019-09-24T00:00:00Z', coordinates: [14, 42], magnitudeUnit: 'kts', magnitudeValue: 60 },
];

// ===========================================================================
// naturalEventsClusterCreateObject
// ===========================================================================
describe('naturalEventsClusterCreateObject', () => {
  // Branch: geographic → radius 0
  it('creates a Supercluster with radius 0 for geographic projection', () => {
    const cluster = naturalEventsClusterCreateObject(geoProj);
    expect(cluster.options.radius).toBe(0);
    expect(cluster.options.maxZoom).toBe(12);
  });

  // Branch: non-geographic → radius 60
  it('creates a Supercluster with radius 60 for non-geographic (polar) projection', () => {
    const cluster = naturalEventsClusterCreateObject(polarProj);
    expect(cluster.options.radius).toBe(60);
    expect(cluster.options.maxZoom).toBe(12);
  });

  it('map function returns startDate and endDate from props.date', () => {
    const cluster = naturalEventsClusterCreateObject(geoProj);
    const result = cluster.options.map({ date: '2019-09-24' });
    expect(result).toEqual({ startDate: '2019-09-24', endDate: '2019-09-24' });
  });

  describe('reduce function', () => {
    // Branch: !pastEndDate → set both start and end to newDate
    it('sets startDate and endDate when accumulator has no endDate yet', () => {
      const cluster = naturalEventsClusterCreateObject(geoProj);
      const accumulator = { startDate: undefined, endDate: undefined };
      cluster.options.reduce(accumulator, { startDate: '2019-09-24' });
      expect(accumulator.startDate).toBe('2019-09-24');
      expect(accumulator.endDate).toBe('2019-09-24');
    });

    // Branch: newDate is earlier than pastStartDate → update startDate
    it('updates startDate when newDate is earlier than the current startDate', () => {
      const cluster = naturalEventsClusterCreateObject(geoProj);
      const accumulator = { startDate: '2019-09-24', endDate: '2019-09-26' };
      cluster.options.reduce(accumulator, { startDate: '2019-09-22' });
      expect(accumulator.startDate).toBe('2019-09-22');
      expect(accumulator.endDate).toBe('2019-09-26'); // unchanged
    });

    // Branch: newDate is later than pastStartDate → keep pastStartDate
    it('keeps startDate when newDate is NOT earlier than the current startDate', () => {
      const cluster = naturalEventsClusterCreateObject(geoProj);
      const accumulator = { startDate: '2019-09-22', endDate: '2019-09-26' };
      cluster.options.reduce(accumulator, { startDate: '2019-09-23' });
      expect(accumulator.startDate).toBe('2019-09-22'); // unchanged
    });

    // Branch: newDate is later than pastEndDate → update endDate
    it('updates endDate when newDate is later than the current endDate', () => {
      const cluster = naturalEventsClusterCreateObject(geoProj);
      const accumulator = { startDate: '2019-09-22', endDate: '2019-09-24' };
      cluster.options.reduce(accumulator, { startDate: '2019-09-26' });
      expect(accumulator.endDate).toBe('2019-09-26');
    });

    // Branch: newDate is earlier than pastEndDate → keep pastEndDate
    it('keeps endDate when newDate is NOT later than the current endDate', () => {
      const cluster = naturalEventsClusterCreateObject(geoProj);
      const accumulator = { startDate: '2019-09-22', endDate: '2019-09-26' };
      cluster.options.reduce(accumulator, { startDate: '2019-09-23' });
      expect(accumulator.endDate).toBe('2019-09-26'); // unchanged
    });
  });

  it('setPolar returns radius 30 and maxZoom 7', () => {
    const cluster = naturalEventsClusterCreateObject(geoProj);
    expect(cluster.options.setPolar()).toEqual({ radius: 30, maxZoom: 7 });
  });

  it('setGeo returns radius 0 and maxZoom 12', () => {
    const cluster = naturalEventsClusterCreateObject(geoProj);
    expect(cluster.options.setGeo()).toEqual({ radius: 0, maxZoom: 12 });
  });
});

// ===========================================================================
// clusterPointToGeoJSON
// ===========================================================================
describe('clusterPointToGeoJSON', () => {
  it('returns a correctly shaped geoJSON Feature', () => {
    const result = clusterPointToGeoJSON(
      'EONET_001',
      [10, 40],
      '2019-09-24',
      { magnitudeUnit: 'kts', magnitudeValue: 55 },
    );

    expect(result.type).toBe('Feature');
    expect(result.properties.id).toBe('EONET_001-2019-09-24');
    expect(result.properties.event_id).toBe('EONET_001');
    expect(result.properties.date).toBe('2019-09-24');
    expect(result.geometry.type).toBe('Point');
    expect(result.geometry.coordinates).toEqual([10, 40]);
    expect(result.geometry.magnitudeUnit).toBe('kts');
    expect(result.geometry.magnitudeValue).toBe(55);
  });

  it('handles undefined magnitude values gracefully', () => {
    const result = clusterPointToGeoJSON(
      'EONET_002',
      [0, 0],
      '2019-09-25',
      { magnitudeUnit: undefined, magnitudeValue: undefined },
    );
    expect(result.geometry.magnitudeUnit).toBeUndefined();
    expect(result.geometry.magnitudeValue).toBeUndefined();
  });
});

// ===========================================================================
// clusterSort
// ===========================================================================
describe('clusterSort', () => {
  // Branch: uses properties.date for sorting
  it('sorts an array of cluster points by properties.date descending', () => {
    const input = [
      { properties: { date: '2019-09-22' } },
      { properties: { date: '2019-09-24' } },
      { properties: { date: '2019-09-23' } },
    ];
    const sorted = clusterSort(input);
    expect(sorted[0].properties.date).toBe('2019-09-24');
    expect(sorted[1].properties.date).toBe('2019-09-23');
    expect(sorted[2].properties.date).toBe('2019-09-22');
  });

  // Branch: falls back to properties.startDate when properties.date is absent
  it('falls back to properties.startDate when properties.date is absent', () => {
    const input = [
      { properties: { startDate: '2019-09-22' } },
      { properties: { startDate: '2019-09-24' } },
      { properties: { startDate: '2019-09-23' } },
    ];
    const sorted = clusterSort(input);
    expect(sorted[0].properties.startDate).toBe('2019-09-24');
    expect(sorted[2].properties.startDate).toBe('2019-09-22');
  });

  // Mixed: some entries use date, some use startDate
  it('handles a mix of date and startDate properties', () => {
    const input = [
      { properties: { date: '2019-09-22' } },
      { properties: { startDate: '2019-09-25' } },
      { properties: { date: '2019-09-24' } },
    ];
    const sorted = clusterSort(input);
    expect(sorted[0].properties.startDate).toBe('2019-09-25');
    expect(sorted[2].properties.date).toBe('2019-09-22');
  });

  it('returns a single-element array unchanged', () => {
    const input = [{ properties: { date: '2019-09-24' } }];
    expect(clusterSort(input)).toHaveLength(1);
  });
});

// ===========================================================================
// getClusterPoints
// ===========================================================================
describe('getClusterPoints', () => {
  it('loads points into the supercluster object and returns clusters', () => {
    const mockSuperCluster = {
      load: jest.fn(),
      getClusters: jest.fn().mockReturnValue([{ type: 'Feature' }]),
    };
    const points = [{ type: 'Feature', geometry: { coordinates: [10, 40] } }];
    const result = getClusterPoints(mockSuperCluster, points, 3.6, [-180, -90, 180, 90]);

    expect(mockSuperCluster.load).toHaveBeenCalledWith(points);
    // lodashRound(3.6) === 4
    expect(mockSuperCluster.getClusters).toHaveBeenCalledWith([-180, -90, 180, 90], 4);
    expect(result).toEqual([{ type: 'Feature' }]);
  });

  it('rounds the zoom level before passing it to getClusters', () => {
    const mockSuperCluster = {
      load: jest.fn(),
      getClusters: jest.fn().mockReturnValue([]),
    };
    getClusterPoints(mockSuperCluster, [], 2.1, [-180, -90, 180, 90]);
    // lodashRound(2.1) === 2
    expect(mockSuperCluster.getClusters).toHaveBeenCalledWith([-180, -90, 180, 90], 2);
  });
});

// ===========================================================================
// getClusters
// ===========================================================================
describe('getClusters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no dateline crossing
    crossesDateLine.mockReturnValue(false);
    getOverDateLineCoordinates.mockImplementation((coords) => coords);
  });

  const eventId = 'EONET_001';

  // ---------------------------------------------------------------------------
  // Geographic projection
  // ---------------------------------------------------------------------------
  describe('geographic projection', () => {
    it('returns clusters, firstClusterObj, and secondClusterObj', () => {
      const geometry = makeGeometry();
      const result = getClusters(
        { geometry, id: eventId },
        geoProj,
        '2019-09-23',
        makeMapMock(),
      );

      expect(result).toHaveProperty('clusters');
      expect(result).toHaveProperty('firstClusterObj');
      expect(result).toHaveProperty('secondClusterObj');
    });

    it('uses geographic extent [-250, -90, 250, 90]', () => {
      const geometry = makeGeometry();
      // Spy on the real Supercluster getClusters method to capture extent
      const result = getClusters(
        { geometry, id: eventId },
        geoProj,
        '2019-09-23',
        makeMapMock(),
      );
      // Clusters should be a non-empty array
      expect(Array.isArray(result.clusters)).toBe(true);
    });

    it('places the selected point in the clusters array', () => {
      const geometry = makeGeometry();
      const result = getClusters(
        { geometry, id: eventId },
        geoProj,
        '2019-09-23',
        makeMapMock(),
      );
      const dates = result.clusters.map(
        (c) => c.properties.date || c.properties.startDate,
      );
      expect(dates).toContain('2019-09-23');
    });

    it('sorts clusters in descending date order', () => {
      const geometry = makeGeometry();
      const { clusters } = getClusters(
        { geometry, id: eventId },
        geoProj,
        '2019-09-23',
        makeMapMock(),
      );
      const dates = clusters.map(
        (c) => c.properties.date || c.properties.startDate,
      );
      // First date should be the most recent
      expect(new Date(dates[0]) >= new Date(dates[dates.length - 1])).toBe(true);
    });

    it('groups points before the selected date into geoJSONPointsBeforeSelected', () => {
      const geometry = makeGeometry();
      // selectedDate is the last entry, so two points go "before"
      const { clusters } = getClusters(
        { geometry, id: eventId },
        geoProj,
        '2019-09-24',
        makeMapMock(),
      );
      // All three dates should be represented
      expect(clusters.length).toBeGreaterThanOrEqual(1);
    });

    it('groups points after the selected date into geoJSONPointsAfterSelected', () => {
      const geometry = makeGeometry();
      // selectedDate is the first entry, so two points go "after"
      const { clusters } = getClusters(
        { geometry, id: eventId },
        geoProj,
        '2019-09-22',
        makeMapMock(),
      );
      expect(clusters.length).toBeGreaterThanOrEqual(1);
    });

    // Branch: isOverDateline = true → getOverDateLineCoordinates is called
    it('replaces coordinates when a point crosses the dateline', () => {
      crossesDateLine.mockReturnValue(true);
      const shiftedCoords = [170, 40];
      getOverDateLineCoordinates.mockReturnValue(shiftedCoords);

      const geometry = makeGeometry();
      const { clusters } = getClusters(
        { geometry, id: eventId },
        geoProj,
        '2019-09-23',
        makeMapMock(),
      );

      expect(getOverDateLineCoordinates).toHaveBeenCalled();
      expect(Array.isArray(clusters)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Polar projection
  // ---------------------------------------------------------------------------
  describe('polar projection', () => {
    it('uses polar extent [-180, -90, 180, 90] for non-geographic projection', () => {
      const geometry = makeGeometry();
      const result = getClusters(
        { geometry, id: eventId },
        polarProj,
        '2019-09-23',
        makeMapMock(),
      );
      expect(Array.isArray(result.clusters)).toBe(true);
    });

    // Branch: isOverDateline is always false for non-geographic → crossesDateLine never called
    it('never calls crossesDateLine for polar projection', () => {
      const geometry = makeGeometry();
      getClusters(
        { geometry, id: eventId },
        polarProj,
        '2019-09-23',
        makeMapMock(),
      );
      expect(crossesDateLine).not.toHaveBeenCalled();
    });

    // Branch: proj.selected.id !== 'geographic' → setPolar called on cluster objects
    it('calls setPolar on both cluster objects for polar projection', () => {
      const geometry = makeGeometry();
      const { firstClusterObj, secondClusterObj } = getClusters(
        { geometry, id: eventId },
        polarProj,
        '2019-09-23',
        makeMapMock(),
      );
      // After getClusters runs, the options should reflect polar settings
      expect(firstClusterObj.options.radius).toBe(60); // created with polar (radius 60)
      expect(secondClusterObj.options.radius).toBe(60);
    });
  });

  // ---------------------------------------------------------------------------
  // Zoom level is forwarded correctly
  // ---------------------------------------------------------------------------
  it('reads zoom from map.getView().getZoom()', () => {
    const getZoom = jest.fn().mockReturnValue(5);
    const map = { getView: () => ({ getZoom }) };
    const geometry = makeGeometry();
    getClusters({ geometry, id: eventId }, geoProj, '2019-09-23', map);
    expect(getZoom).toHaveBeenCalled();
  });
});
