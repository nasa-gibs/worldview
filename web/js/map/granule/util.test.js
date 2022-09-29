
import {
  datelineShiftGranules, getCMRQueryDates, transformGranuleData, areCoordinatesAndPolygonExtentValid,
} from './util';
import util from '../../util/util';

const mockGranules = require('../../../mock/granules.json');
const cmrGranules = require('../../../mock/cmr_granules.json');

const singleTransformedGranule = {
  date: '2019-09-24T00:12:00Z',
  polygon: [
    [
      -176.277237,
      4.723897,
    ],
    [
      -149.287964,
      8.797498,
    ],
    [
      -152.546494,
      29.685362,
    ],
    [
      -182.751724,
      25.140713,
    ],
    [
      -176.277237,
      4.723897,
    ],
  ],
  dayNight: 'DAY',
};

describe('shifting dateline granules', () => {
  it('no shift when datline is crossed with same day', async () => {
    const selectedDate = new Date('2019-09-24T00:24:00.000Z');
    const crs = 'EPSG:4326';
    const granules = datelineShiftGranules(mockGranules.three, selectedDate, crs);

    expect(granules).toEqual(mockGranules.three);
  });

  it('shifts when granules cross days', async () => {
    const selectedDate = new Date('2019-09-24T00:12:00.000Z');
    const crs = 'EPSG:4326';
    const shiftedGranules = datelineShiftGranules(mockGranules.two, selectedDate, crs);

    expect(shiftedGranules).toEqual(mockGranules.twoShifted);
    expect(shiftedGranules.every(({ shifted }) => shifted)).toEqual(true);
  });
});

describe('getting CMR query date range', () => {
  it('starts 8 hours before, 4 hours after, ', () => {
    const selectedDate = new Date('2019-09-24T00:20:00.000Z');
    const expectedStart = new Date('2019-09-23T16:20:00.000Z');
    const expectedEnd = new Date('2019-09-24T04:20:00.000Z');

    const { startQueryDate, endQueryDate } = getCMRQueryDates(selectedDate);
    expect(startQueryDate).toEqual(expectedStart);
    expect(endQueryDate).toEqual(expectedEnd);
  });
});

describe('transform cmr granule data', () => {
  it('converts cmr metadata into expected granule format', () => {
    const singleEntry = cmrGranules.feed.entry[0];
    const date = util.toISOStringSeconds(singleEntry.time_start);
    const crs = 'EPSG:4326';
    const transformedEntry = transformGranuleData(singleEntry, date, crs);

    expect(transformedEntry.dayNight).toEqual('NIGHT');
    expect(transformedEntry.date).toEqual('2019-09-22T23:54:00Z');
    expect(transformedEntry.polygon.length).toEqual(5);
  });
});

describe('areCoordinatesAndPolygonExtentValid', () => {
  it('mouse coordinates inside polygon', () => {
    const visibleExtent = [-250, -90, 250, 90];
    const mouseCoords = [-165, 18];
    const points = singleTransformedGranule.polygon;
    const isValid = areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent);
    expect(isValid).toEqual(true);
  });

  it('mouse coordinates outside polygon', () => {
    const visibleExtent = [-250, -90, 250, 90];
    const mouseCoords = [-18, 18];
    const points = singleTransformedGranule.polygon;
    const isValid = areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent);
    expect(isValid).toEqual(false);
  });

  it('polygon outside map extent', () => {
    const visibleExtent = [-250, -90, 250, 90];
    const mouseCoords = [-18, 18];
    const points = [
      [
        -270,
        4.723897,
      ],
      [
        -270,
        8.797498,
      ],
      [
        -270,
        29.685362,
      ],
      [
        -270,
        25.140713,
      ],
      [
        -270,
        100,
      ],
    ];
    const isValid = areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent);
    expect(isValid).toEqual(false);
  });
});

