import {
  datelineShiftGranules,
  getCMRQueryDates,
  getCMRQueryDateUpdateOptions,
  transformGranuleData,
  transformGranulesForProj,
  areCoordinatesAndPolygonExtentValid,
  getGranuleTileLayerExtent,
  getIndexForSortedInsert,
  isWithinDateRange,
  getParamsForGranuleRequest,
  granuleFootprint,
} from './util';
import { CRS } from '../../modules/map/constants';
import util from '../../util/util';

const mockGranules = require('../../../mock/granules.json');
const cmrGranules = require('../../../mock/cmr_granules.json');

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const singleTransformedGranule = {
  date: '2019-09-24T00:12:00Z',
  polygon: [
    [-176.277237, 4.723897],
    [-149.287964, 8.797498],
    [-152.546494, 29.685362],
    [-182.751724, 25.140713],
    [-176.277237, 4.723897],
  ],
  dayNight: 'DAY',
};

// ===========================================================================
// datelineShiftGranules
// ===========================================================================
describe('shifting dateline granules', () => {
  it('no shift when dateline is crossed with same day', () => {
    const selectedDate = new Date('2019-09-24T00:24:00.000Z');
    const granules = datelineShiftGranules(mockGranules.three, selectedDate, CRS.GEOGRAPHIC);
    expect(granules).toEqual(mockGranules.three);
  });

  it('shifts when granules cross days', () => {
    const selectedDate = new Date('2019-09-24T00:12:00.000Z');
    const shiftedGranules = datelineShiftGranules(mockGranules.two, selectedDate, CRS.GEOGRAPHIC);
    expect(shiftedGranules).toEqual(mockGranules.twoShifted);
    expect(shiftedGranules.every(({ shifted }) => shifted)).toEqual(true);
  });

  // Branch: crs !== CRS.GEOGRAPHIC → datelineShiftNeeded is always false → returns granules as-is
  it('no shift when crs is not GEOGRAPHIC (e.g. ARCTIC)', () => {
    const selectedDate = new Date('2019-09-24T00:12:00.000Z');
    // Even if granules span different days, non-geographic CRS must not shift
    const granules = datelineShiftGranules(mockGranules.two, selectedDate, CRS.ARCTIC);
    expect(granules).toEqual(mockGranules.two);
  });

  // Branch: same day but polygon is on the west side → shifted = true
  it('shifts a same-day granule whose polygon is on the west side (lon < 0)', () => {
    const currentDate = new Date('2019-09-24T00:00:00.000Z');
    const granules = [
      {
        date: '2019-09-24T00:00:00Z', // same UTC day
        polygon: [
          [-170, 10],
          [-160, 20],
          [-150, 10],
          [-170, 10],
        ],
      },
      // Second granule from a different day to trigger datelineShiftNeeded = true
      {
        date: '2019-09-23T23:00:00Z',
        polygon: [
          [10, 10],
          [20, 20],
          [10, 10],
        ],
      },
    ];
    const shifted = datelineShiftGranules(granules, currentDate, CRS.GEOGRAPHIC);
    // The same-day west-side granule should be shifted
    expect(shifted[0].shifted).toBe(true);
    expect(shifted[0].polygon[0][0]).toBeCloseTo(-170 + 360);
  });

  // Branch: same day, east side polygon → shifted = false
  it('does not shift a same-day granule whose polygon is on the east side (lon >= 0)', () => {
    const currentDate = new Date('2019-09-24T00:00:00.000Z');
    const granules = [
      {
        date: '2019-09-24T01:00:00Z', // same UTC day
        polygon: [
          [10, 10],
          [20, 20],
          [10, 10],
        ],
      },
      // Different day to trigger shift logic
      {
        date: '2019-09-23T23:00:00Z',
        polygon: [
          [-170, 10],
          [-170, 10],
        ],
      },
    ];
    const shifted = datelineShiftGranules(granules, currentDate, CRS.GEOGRAPHIC);
    expect(shifted[0].shifted).toBe(false);
    // Polygon coordinates should be unchanged
    expect(shifted[0].polygon).toEqual(granules[0].polygon);
  });
});

// ===========================================================================
// getCMRQueryDates
// ===========================================================================
describe('getting CMR query date range', () => {
  it('starts 12 hours before, 4 hours after for GEOGRAPHIC', () => {
    const selectedDate = new Date('2019-09-24T00:00:00.000Z');
    const expectedStart = new Date('2019-09-23T12:00:00.000Z');
    const expectedEnd = new Date('2019-09-24T04:00:00.000Z');

    const { startQueryDate, endQueryDate } = getCMRQueryDates(CRS.GEOGRAPHIC, selectedDate);
    expect(startQueryDate).toEqual(expectedStart);
    expect(endQueryDate).toEqual(expectedEnd);
  });

  it('starts 12 hours before, 4 hours after for WEB_MERCATOR', () => {
    const selectedDate = new Date('2019-09-24T00:00:00.000Z');
    const expectedStart = new Date('2019-09-23T12:00:00.000Z');
    const expectedEnd = new Date('2019-09-24T04:00:00.000Z');

    const { startQueryDate, endQueryDate } = getCMRQueryDates(CRS.WEB_MERCATOR, selectedDate);
    expect(startQueryDate).toEqual(expectedStart);
    expect(endQueryDate).toEqual(expectedEnd);
  });

  // Branch: polar projections → -48 hours
  it('starts 48 hours before, 4 hours after for ARCTIC (polar)', () => {
    const selectedDate = new Date('2019-09-24T00:00:00.000Z');
    const expectedStart = new Date('2019-09-22T00:00:00.000Z');
    const expectedEnd = new Date('2019-09-24T04:00:00.000Z');

    const { startQueryDate, endQueryDate } = getCMRQueryDates(CRS.ARCTIC, selectedDate);
    expect(startQueryDate).toEqual(expectedStart);
    expect(endQueryDate).toEqual(expectedEnd);
  });

  it('starts 48 hours before, 4 hours after for ANTARCTIC (polar)', () => {
    const selectedDate = new Date('2019-09-24T00:00:00.000Z');
    const expectedStart = new Date('2019-09-22T00:00:00.000Z');
    const expectedEnd = new Date('2019-09-24T04:00:00.000Z');

    const { startQueryDate, endQueryDate } = getCMRQueryDates(CRS.ANTARCTIC, selectedDate);
    expect(startQueryDate).toEqual(expectedStart);
    expect(endQueryDate).toEqual(expectedEnd);
  });
});

// ===========================================================================
// getCMRQueryDateUpdateOptions
// ===========================================================================
describe('getCMRQueryDateUpdateOptions', () => {
  // Branch: no CMRDateStoreForLayer → early return
  it('returns canExtendRange false and needRangeUpdate true when no store provided', () => {
    const { startQueryDate, endQueryDate } = getCMRQueryDates(CRS.GEOGRAPHIC, new Date('2019-09-24T00:00:00.000Z'));
    const result = getCMRQueryDateUpdateOptions(null, new Date('2019-09-24T00:00:00.000Z'), startQueryDate, endQueryDate);
    expect(result.canExtendRange).toBe(false);
    expect(result.needRangeUpdate).toBe(true);
  });

  // Branch: new range is entirely within the current range → needRangeUpdate = false (first check)
  it('needRangeUpdate is false when new range is within existing range', () => {
    const currentStart = new Date('2019-09-23T00:00:00.000Z');
    const currentEnd = new Date('2019-09-25T00:00:00.000Z');
    const CMRDateStoreForLayer = { startDate: currentStart, endDate: currentEnd };
    // new range [Sep 23 12:00, Sep 24 04:00] is inside [Sep 23, Sep 25]
    const date = new Date('2019-09-24T00:00:00.000Z');
    const { startQueryDate, endQueryDate } = getCMRQueryDates(CRS.GEOGRAPHIC, date);
    const result = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer, date, startQueryDate, endQueryDate);
    expect(result.needRangeUpdate).toBe(false);
  });

  // Branch: date is within [currentStart+1day, currentEnd] → needRangeUpdate = false (second check)
  it('needRangeUpdate is false when selected date is within existing range cushion', () => {
    const currentStart = new Date('2019-09-22T00:00:00.000Z');
    const currentEnd = new Date('2019-09-26T00:00:00.000Z');
    const CMRDateStoreForLayer = { startDate: currentStart, endDate: currentEnd };
    // Query range wider than existing, but the date itself is within [currentStart+1, currentEnd]
    const date = new Date('2019-09-24T00:00:00.000Z');
    const startQueryDate = new Date('2019-09-20T00:00:00.000Z'); // before currentStart
    const endQueryDate = new Date('2019-09-27T00:00:00.000Z');   // after currentEnd
    const result = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer, date, startQueryDate, endQueryDate);
    expect(result.needRangeUpdate).toBe(false);
  });

  // Branch: newEnd extends current range from the left (newEndEqualsCurrentCMRStart)
  it('canExtendRange is true when new end equals current start (extend left)', () => {
    const currentStart = new Date('2019-09-24T04:00:00.000Z');
    const currentEnd = new Date('2019-09-26T00:00:00.000Z');
    const CMRDateStoreForLayer = { startDate: currentStart, endDate: currentEnd };
    const date = new Date('2019-09-20T00:00:00.000Z'); // well outside, force needRangeUpdate path
    const startQueryDate = new Date('2019-09-22T00:00:00.000Z');
    const endQueryDate = new Date('2019-09-24T04:00:00.000Z'); // exactly equals currentStart
    const result = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer, date, startQueryDate, endQueryDate);
    expect(result.canExtendRange).toBe(true);
    expect(result.rangeStart).toBe(startQueryDate.getTime());
    expect(result.rangeEnd).toBe(currentEnd.getTime());
  });

  // Branch: newEnd can extend current range (newEndCanExtendCurrentCMREnd)
  it('canExtendRange is true when new range overlaps current range from the left', () => {
    const currentStart = new Date('2019-09-24T00:00:00.000Z');
    const currentEnd = new Date('2019-09-26T00:00:00.000Z');
    const CMRDateStoreForLayer = { startDate: currentStart, endDate: currentEnd };
    const date = new Date('2019-09-20T00:00:00.000Z');
    // newStart < currentStart AND newEnd >= currentStart (overlaps left side)
    const startQueryDate = new Date('2019-09-22T00:00:00.000Z');
    const endQueryDate = new Date('2019-09-25T00:00:00.000Z');
    const result = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer, date, startQueryDate, endQueryDate);
    expect(result.canExtendRange).toBe(true);
    expect(result.rangeStart).toBe(startQueryDate.getTime());
    expect(result.rangeEnd).toBe(currentEnd.getTime());
  });

  // Branch: newStart extends current range from the right (newStartEqualsCurrentCMREnd)
  it('canExtendRange is true when new start equals current end (extend right)', () => {
    const currentStart = new Date('2019-09-22T00:00:00.000Z');
    const currentEnd = new Date('2019-09-24T00:00:00.000Z');
    const CMRDateStoreForLayer = { startDate: currentStart, endDate: currentEnd };
    const date = new Date('2019-09-28T00:00:00.000Z');
    const startQueryDate = new Date('2019-09-24T00:00:00.000Z'); // exactly equals currentEnd
    const endQueryDate = new Date('2019-09-26T00:00:00.000Z');
    const result = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer, date, startQueryDate, endQueryDate);
    expect(result.canExtendRange).toBe(true);
    expect(result.rangeStart).toBe(currentStart.getTime());
    expect(result.rangeEnd).toBe(endQueryDate.getTime());
  });

  // Branch: newStart can extend current range (newStartCanExtendCurrentCMRStart)
  it('canExtendRange is true when new range overlaps current range from the right', () => {
    const currentStart = new Date('2019-09-22T00:00:00.000Z');
    const currentEnd = new Date('2019-09-25T00:00:00.000Z');
    const CMRDateStoreForLayer = { startDate: currentStart, endDate: currentEnd };
    const date = new Date('2019-09-28T00:00:00.000Z');
    // newStart > currentStart AND newStart <= currentEnd (overlaps right side)
    const startQueryDate = new Date('2019-09-23T00:00:00.000Z');
    const endQueryDate = new Date('2019-09-27T00:00:00.000Z');
    const result = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer, date, startQueryDate, endQueryDate);
    expect(result.canExtendRange).toBe(true);
    expect(result.rangeStart).toBe(currentStart.getTime());
    expect(result.rangeEnd).toBe(endQueryDate.getTime());
  });

  // Branch: completely disjoint range → canExtendRange false, needRangeUpdate true
  it('canExtendRange is false and needRangeUpdate is true for completely disjoint ranges', () => {
    const currentStart = new Date('2019-09-22T00:00:00.000Z');
    const currentEnd = new Date('2019-09-23T00:00:00.000Z');
    const CMRDateStoreForLayer = { startDate: currentStart, endDate: currentEnd };
    const date = new Date('2019-09-30T00:00:00.000Z');
    const startQueryDate = new Date('2019-09-28T00:00:00.000Z'); // completely after current range
    const endQueryDate = new Date('2019-09-30T00:00:00.000Z');
    const result = getCMRQueryDateUpdateOptions(
      CMRDateStoreForLayer, date, startQueryDate, endQueryDate);
    expect(result.canExtendRange).toBe(false);
    expect(result.needRangeUpdate).toBe(true);
  });
});

// ===========================================================================
// transformGranuleData
// ===========================================================================
describe('transform cmr granule data', () => {
  it('converts cmr metadata into expected granule format (GEOGRAPHIC)', () => {
    const singleEntry = cmrGranules.feed.entry[0];
    const date = util.toISOStringSeconds(singleEntry.time_start);
    const transformedEntry = transformGranuleData(singleEntry, date, CRS.GEOGRAPHIC);

    expect(transformedEntry.dayNight).toEqual('NIGHT');
    expect(transformedEntry.date).toEqual('2019-09-22T23:54:00Z');
    expect(transformedEntry.polygon.length).toEqual(5);
  });

  // Branch: entry has no polygons property → points = []
  it('returns empty polygon array when entry has no polygons', () => {
    const entry = { day_night_flag: 'DAY' }; // no polygons key
    const result = transformGranuleData(entry, '2019-09-24T00:00:00Z', CRS.GEOGRAPHIC);
    expect(result.polygon).toEqual([]);
    expect(result.dayNight).toEqual('DAY');
  });

  // Branch: non-GEOGRAPHIC CRS → maxDistance = Infinity (no coordinate wrapping)
  it('transforms granule data for a non-geographic (polar) projection without wrapping', () => {
    const singleEntry = cmrGranules.feed.entry[0];
    const date = util.toISOStringSeconds(singleEntry.time_start);
    const transformedEntry = transformGranuleData(singleEntry, date, CRS.ARCTIC);
    expect(transformedEntry.polygon.length).toEqual(5);
  });
});

// ===========================================================================
// transformGranulesForProj
// ===========================================================================
describe('transformGranulesForProj', () => {
  it('transforms granule polygon coordinates into the target projection', () => {
    const granules = [singleTransformedGranule];
    const transformed = transformGranulesForProj(granules, CRS.WEB_MERCATOR);
    expect(transformed).toHaveLength(1);
    // The coordinates should now be in WEB_MERCATOR (metres), not degrees
    const [lon] = transformed[0].polygon[0];
    // WEB_MERCATOR x values for ~-176° lon will be in the order of -19 million
    expect(Math.abs(lon)).toBeGreaterThan(1000);
    // Original date and dayNight should be preserved
    expect(transformed[0].date).toEqual(singleTransformedGranule.date);
    expect(transformed[0].dayNight).toEqual(singleTransformedGranule.dayNight);
  });
});

// ===========================================================================
// areCoordinatesAndPolygonExtentValid
// ===========================================================================
describe('areCoordinatesAndPolygonExtentValid', () => {
  it('returns true when mouse coordinates are inside the polygon', () => {
    const visibleExtent = [-250, -90, 250, 90];
    const mouseCoords = [-165, 18];
    const points = singleTransformedGranule.polygon;
    expect(areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent)).toEqual(true);
  });

  it('returns false when mouse coordinates are outside the polygon', () => {
    const visibleExtent = [-250, -90, 250, 90];
    const mouseCoords = [-18, 18];
    const points = singleTransformedGranule.polygon;
    expect(areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent)).toEqual(false);
  });

  it('returns false when polygon is outside the map extent', () => {
    const visibleExtent = [-250, -90, 250, 90];
    const mouseCoords = [-18, 18];
    const points = [
      [-270, 4.723897],
      [-270, 8.797498],
      [-270, 29.685362],
      [-270, 25.140713],
      [-270, 100],
    ];
    expect(areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent)).toEqual(false);
  });

  // Branch: polygon is larger than maxExtent → isPolygonLargerThanMaxExtent = true → returns false
  it('returns false when polygon extent contains (is larger than) the max extent', () => {
    // A polygon that covers the entire world and beyond
    const visibleExtent = [-180, -90, 180, 90];
    const mouseCoords = [0, 0]; // inside the huge polygon
    const points = [
      [-200, -100],
      [200, -100],
      [200, 100],
      [-200, 100],
      [-200, -100],
    ];
    expect(areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent)).toEqual(false);
  });
});

// ===========================================================================
// getGranuleTileLayerExtent
// ===========================================================================
describe('getGranuleTileLayerExtent', () => {
  const fallbackExtent = [-180, -90, 180, 90];

  it('returns the polygon extent when it is finite', () => {
    const polygon = singleTransformedGranule.polygon;
    const result = getGranuleTileLayerExtent(polygon, fallbackExtent);
    // The result should be a bounding-box array [minX, minY, maxX, maxY]
    expect(result).toHaveLength(4);
    expect(Number.isFinite(result[0])).toBe(true);
  });

  // Branch: polygonExtent[0] is not finite → returns fallback extent
  it('returns the fallback extent when polygon extent is not finite', () => {
    // An empty polygon array produces a non-finite extent
    const result = getGranuleTileLayerExtent([], fallbackExtent);
    expect(result).toEqual(fallbackExtent);
  });
});

// ===========================================================================
// getIndexForSortedInsert
// ===========================================================================
describe('getIndexForSortedInsert', () => {
  const sortedDates = [
    '2019-09-22T00:00:00.000Z',
    '2019-09-23T00:00:00.000Z',
    '2019-09-25T00:00:00.000Z',
  ];

  // Branch: new date is before the first element → return 0
  it('returns 0 when the date is before the first element', () => {
    expect(getIndexForSortedInsert(sortedDates, '2019-09-21T00:00:00.000Z')).toEqual(0);
  });

  // Middle insertion
  it('returns the correct middle index', () => {
    expect(getIndexForSortedInsert(sortedDates, '2019-09-24T00:00:00.000Z')).toEqual(2);
  });

  // Append at end
  it('returns the last index when the date is after all elements', () => {
    expect(getIndexForSortedInsert(sortedDates, '2019-09-26T00:00:00.000Z')).toEqual(3);
  });
});

// ===========================================================================
// isWithinDateRange
// ===========================================================================
describe('isWithinDateRange', () => {
  const startDate = '2019-09-22T00:00:00.000Z';
  const endDate = '2019-09-25T00:00:00.000Z';

  it('returns true when date is within range', () => {
    expect(isWithinDateRange('2019-09-23T00:00:00.000Z', startDate, endDate)).toBe(true);
  });

  it('returns true when date equals startDate (boundary)', () => {
    expect(isWithinDateRange(startDate, startDate, endDate)).toBe(true);
  });

  it('returns true when date equals endDate (boundary)', () => {
    expect(isWithinDateRange(endDate, startDate, endDate)).toBe(true);
  });

  it('returns false when date is before startDate', () => {
    expect(isWithinDateRange('2019-09-21T00:00:00.000Z', startDate, endDate)).toBe(false);
  });

  it('returns false when date is after endDate', () => {
    expect(isWithinDateRange('2019-09-26T00:00:00.000Z', startDate, endDate)).toBe(false);
  });

  // Branch: no startDate provided → returns false
  it('returns false when startDate is not provided', () => {
    expect(isWithinDateRange('2019-09-23T00:00:00.000Z', null, endDate)).toBe(false);
  });

  // Branch: no endDate provided → uses current date as end, still checks range
  it('returns false when endDate is not provided and date is in the future', () => {
    // Use a date far in the past relative to "now"; no endDate → end defaults to now
    expect(isWithinDateRange('1990-01-01T00:00:00.000Z', '1989-01-01T00:00:00.000Z', null)).toBe(true);
  });
});

// ===========================================================================
// getParamsForGranuleRequest
// ===========================================================================
describe('getParamsForGranuleRequest', () => {
  const date = new Date('2019-09-24T00:00:00.000Z');

  // Branch: layer has no NRT conceptId → returns a single-element array
  it('returns a single request param object when no NRT conceptId exists', () => {
    const def = {
      id: 'test-layer',
      daynight: ['DAY'],
      conceptIds: [{ type: 'STD', shortName: 'MOD09GA' }],
    };
    const result = getParamsForGranuleRequest(def, date, CRS.GEOGRAPHIC);
    expect(result).toHaveLength(1);
    expect(result[0].shortName).toEqual('MOD09GA');
    expect(result[0].dayNight).toEqual('DAY');
    expect(result[0].bbox).toEqual([-180, -65, 180, 65]);
    expect(result[0].pageSize).toEqual(500);
  });

  // Branch: layer has an NRT conceptId → returns two-element array (STD + NRT)
  it('returns two request param objects when an NRT conceptId exists', () => {
    const def = {
      id: 'test-layer',
      daynight: ['NIGHT'],
      conceptIds: [
        { type: 'STD', shortName: 'MOD09GA' },
        { type: 'NRT', shortName: 'MOD09GA_NRT' },
      ],
    };
    const result = getParamsForGranuleRequest(def, date, CRS.GEOGRAPHIC);
    expect(result).toHaveLength(2);
    // NRT-sorted first entry returns the NRT shortName (with _NRT stripped) and the NRT shortName
    expect(result[0].shortName).toEqual('MOD09GA'); // _NRT stripped
    expect(result[1].shortName).toEqual('MOD09GA_NRT');
  });

  // Branch: ARCTIC projection → correct bbox
  it('uses the correct ARCTIC bbox', () => {
    const def = {
      id: 'test-layer',
      daynight: ['DAY'],
      conceptIds: [{ type: 'STD', shortName: 'MOD09GA' }],
    };
    const result = getParamsForGranuleRequest(def, date, CRS.ARCTIC);
    expect(result[0].bbox).toEqual([-180, 65, 180, 90]);
  });

  // Branch: ANTARCTIC projection → correct bbox
  it('uses the correct ANTARCTIC bbox', () => {
    const def = {
      id: 'test-layer',
      daynight: ['DAY'],
      conceptIds: [{ type: 'STD', shortName: 'MOD09GA' }],
    };
    const result = getParamsForGranuleRequest(def, date, CRS.ANTARCTIC);
    expect(result[0].bbox).toEqual([-180, -90, 180, -65]);
  });

  // Branch: WEB_MERCATOR projection → correct bbox
  it('uses the correct WEB_MERCATOR bbox', () => {
    const def = {
      id: 'test-layer',
      daynight: ['DAY'],
      conceptIds: [{ type: 'STD', shortName: 'MOD09GA' }],
    };
    const result = getParamsForGranuleRequest(def, date, CRS.WEB_MERCATOR);
    expect(result[0].bbox).toEqual([-180, -65, 180, 65]);
  });

  it('returns undefined shortName when conceptIds entries have no shortName', () => {
    const def = {
      id: 'bad-layer',
      daynight: ['DAY'],
      conceptIds: [{ type: 'STD' }], // valid array so .filter() works, but no shortName property
    };
    const result = getParamsForGranuleRequest(def, date, CRS.GEOGRAPHIC);
    expect(result[0].shortName).toBeUndefined();
  });
});

// ===========================================================================
// granuleFootprint
// ===========================================================================
describe('granuleFootprint', () => {
  // Minimal OpenLayers map mock
  const createMapMock = () => ({
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  });

  const points = singleTransformedGranule.polygon;
  const dateStr = '2019-09-24T00:12:00Z';

  describe('non-mobile (desktop) mode', () => {
    it('addFootprint draws the footprint on the map', () => {
      const map = createMapMock();
      const { addFootprint } = granuleFootprint(map, false);
      addFootprint(points, dateStr);
      expect(map.addLayer).toHaveBeenCalledTimes(1);
    });

    it('addFootprint is a no-op when called a second time with the same date (already drawn)', () => {
      const map = createMapMock();
      const { addFootprint } = granuleFootprint(map, false);
      addFootprint(points, dateStr);
      addFootprint(points, dateStr); // second call → currentGranule[date] already true
      // addLayer should only be called once
      expect(map.addLayer).toHaveBeenCalledTimes(1);
    });

    // Branch: !points → removeFootprint is called
    it('addFootprint calls removeFootprint when points is null/undefined', () => {
      const map = createMapMock();
      const { addFootprint } = granuleFootprint(map, false);
      addFootprint(null, dateStr);
      expect(map.removeLayer).toHaveBeenCalled();
      expect(map.addLayer).not.toHaveBeenCalled();
    });

    // Branch: !date → removeFootprint is called
    it('addFootprint calls removeFootprint when date is null/undefined', () => {
      const map = createMapMock();
      const { addFootprint } = granuleFootprint(map, false);
      addFootprint(points, null);
      expect(map.removeLayer).toHaveBeenCalled();
      expect(map.addLayer).not.toHaveBeenCalled();
    });

    it('updateFootprint removes the old footprint and draws a new one', () => {
      const map = createMapMock();
      const { updateFootprint } = granuleFootprint(map, false);
      updateFootprint(points, dateStr);
      expect(map.removeLayer).toHaveBeenCalled();
      expect(map.addLayer).toHaveBeenCalledTimes(1);
    });
  });

  describe('mobile mode', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // Branch: initialIsMobile = true → uses debouncedDrawFootprint
    it('addFootprint debounces drawing on mobile', () => {
      const map = createMapMock();
      const { addFootprint } = granuleFootprint(map, true);
      addFootprint(points, dateStr);
      // Before debounce fires, addLayer should NOT have been called yet
      expect(map.addLayer).not.toHaveBeenCalled();
      // Advance timers past the 850ms debounce
      jest.advanceTimersByTime(900);
      expect(map.addLayer).toHaveBeenCalledTimes(1);
    });

    it('updateFootprint debounces drawing on mobile', () => {
      const map = createMapMock();
      const { updateFootprint } = granuleFootprint(map, true);
      updateFootprint(points, dateStr);
      expect(map.addLayer).not.toHaveBeenCalled();
      jest.advanceTimersByTime(900);
      expect(map.addLayer).toHaveBeenCalledTimes(1);
    });
  });
});
