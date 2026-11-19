// util.test.js

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('ol/Overlay', () =>
  jest.fn().mockImplementation((opts) => ({
    ...opts,
    getId: jest.fn(() => opts.id),
    getPosition: jest.fn(() => opts.position),
  })),
);

jest.mock('ol/proj', () => ({
  transform: jest.fn((coords) => coords),
}));

jest.mock('../util', () => ({
  mapUtilZoomAction: jest.fn(),
}));

jest.mock('../../modules/date/util', () => ({
  formatDisplayDate: jest.fn((date) => `formatted-${date}`),
}));

jest.mock('../../modules/map/constants', () => ({
  CRS: { GEOGRAPHIC: 'EPSG:4326' },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import OlOverlay from 'ol/Overlay';
import * as olProj from 'ol/proj';
import { mapUtilZoomAction } from '../util';
import { formatDisplayDate } from '../../modules/date/util';
import {
  getTrackPoint,
  getArrows,
  getTrackLines,
  getClusterPointEl,
} from './util';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const geographicProj = () => ({ selected: { id: 'geographic', crs: 'EPSG:4326' } });
const polarProj = () => ({ selected: { id: 'arctic', crs: 'EPSG:3413' } });

const buildClusterPoint = (overrides = {}) => ({
  geometry: {
    coordinates: [10, 20],
    magnitudeValue: null,
    magnitudeUnit: null,
    ...overrides.geometry,
  },
  properties: {
    date: '2023-01-01',
    event_id: 'event-1',
    ...overrides.properties,
  },
});

const buildMap = (pixelOverrides = {}) => {
  const view = {
    getRotation: jest.fn(() => 0),
    getZoom: jest.fn(() => 5),
  };
  return {
    getView: jest.fn(() => view),
    getPixelFromCoordinate: jest.fn((coord) => coord),
    getCoordinateFromPixel: jest.fn((pixel) => pixel),
    ...pixelOverrides,
  };
};

const defaultHighlightOptions = () => ({
  callbackHighlight: jest.fn(),
  callbackUnhighlight: jest.fn(),
  isHighlighted: false,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('natural-events/util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // getTrackPoint
  // -------------------------------------------------------------------------
  describe('getTrackPoint()', () => {
    it('returns an OlOverlay instance', () => {
      const point = getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        defaultHighlightOptions(),
      );
      expect(OlOverlay).toHaveBeenCalled();
      expect(point).toBeDefined();
    });

    it('sets the overlay id to eventID + date string', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        defaultHighlightOptions(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.id).toBe('event-12023-01-01');
    });

    it('uses geographic coordinates unchanged when proj is geographic', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        defaultHighlightOptions(),
      );
      expect(olProj.transform).not.toHaveBeenCalled();
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.position).toEqual([10, 20]);
    });

    it('transforms coordinates for polar projections', () => {
      getTrackPoint(
        polarProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        defaultHighlightOptions(),
      );
      expect(olProj.transform).toHaveBeenCalledWith([10, 20], 'EPSG:4326', 'EPSG:3413');
    });

    it('sets selected className on overlayEl when isSelected is true', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        true,
        jest.fn(),
        defaultHighlightOptions(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.element.className).toBe('track-marker-case track-marker-case-selected');
    });

    it('sets unselected className on overlayEl when isSelected is false', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        defaultHighlightOptions(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.element.className).toBe('track-marker-case');
    });

    it('calls callback with eventID and date on click', () => {
      const callback = jest.fn();
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        callback,
        defaultHighlightOptions(),
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      overlayEl.onclick();
      expect(callback).toHaveBeenCalledWith('event-1', '2023-01-01');
    });

    it('calls callbackHighlight on mouseenter', () => {
      const callbackHighlight = jest.fn();
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        { ...defaultHighlightOptions(), callbackHighlight },
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      overlayEl.onmouseenter();
      expect(callbackHighlight).toHaveBeenCalledWith('event-1', '2023-01-01');
    });

    it('calls callbackUnhighlight on mouseleave', () => {
      const callbackUnhighlight = jest.fn();
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        { ...defaultHighlightOptions(), callbackUnhighlight },
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      overlayEl.onmouseleave();
      expect(callbackUnhighlight).toHaveBeenCalled();
    });

    it('sets textEl className to selected when isHighlighted is true', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        { ...defaultHighlightOptions(), isHighlighted: true },
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const textEl = overlayEl.querySelector('span');
      expect(textEl.className).toBe('track-marker-date track-marker-date-selected');
    });

    it('resets textEl className after 5 seconds when isHighlighted is true', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        { ...defaultHighlightOptions(), isHighlighted: true },
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const textEl = overlayEl.querySelector('span');
      jest.advanceTimersByTime(5000);
      expect(textEl.className).toBe('track-marker-date');
    });

    it('sets textEl className to track-marker-date when isHighlighted is false', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        { ...defaultHighlightOptions(), isHighlighted: false },
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const textEl = overlayEl.querySelector('span');
      expect(textEl.className).toBe('track-marker-date');
    });

    it('sets circleEl height/width/borderRadius when isHighlighted is true', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        { ...defaultHighlightOptions(), isHighlighted: true },
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const circleEl = overlayEl.querySelector('div');
      expect(circleEl.style.height).toBe('13px');
      expect(circleEl.style.width).toBe('13px');
      expect(circleEl.style.borderRadius).toBe('7px');
    });

    it('leaves circleEl height/width/borderRadius empty when isHighlighted is false', () => {
      getTrackPoint(
        geographicProj(),
        buildClusterPoint(),
        false,
        jest.fn(),
        defaultHighlightOptions(),
      );
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const circleEl = overlayEl.querySelector('div');
      expect(circleEl.style.height).toBe('');
      expect(circleEl.style.width).toBe('');
    });

    it('sets textEl top style to -40px when hasMagnitude is true', () => {
      const point = buildClusterPoint({
        geometry: { coordinates: [10, 20], magnitudeValue: 100, magnitudeUnit: 'kts' },
      });
      getTrackPoint(geographicProj(), point, false, jest.fn(), defaultHighlightOptions());
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const textEl = overlayEl.querySelector('span');
      expect(textEl.style.top).toBe('-40px');
    });

    it('sets textEl top style to -28px when hasMagnitude is false', () => {
      getTrackPoint(geographicProj(), buildClusterPoint(),
        false, jest.fn(), defaultHighlightOptions());
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const textEl = overlayEl.querySelector('span');
      expect(textEl.style.top).toBe('-28px');
    });

    it('appends kts magnitude content without superscript', () => {
      const point = buildClusterPoint({
        geometry: { coordinates: [10, 20], magnitudeValue: 150, magnitudeUnit: 'kts' },
      });
      getTrackPoint(geographicProj(), point, false, jest.fn(), defaultHighlightOptions());
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const magnitudeEl = overlayEl.querySelector('span > div');
      expect(magnitudeEl.textContent).toContain('150');
      expect(magnitudeEl.textContent).toContain(' kts');
    });

    it('appends NM magnitude content with superscript 2', () => {
      const point = buildClusterPoint({
        geometry: { coordinates: [10, 20], magnitudeValue: 200, magnitudeUnit: 'NM' },
      });
      getTrackPoint(geographicProj(), point, false, jest.fn(), defaultHighlightOptions());
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const magnitudeEl = overlayEl.querySelector('span > div');
      expect(magnitudeEl.textContent).toContain('200');
      expect(magnitudeEl.querySelector('sup').textContent).toBe('2');
    });

    it('sets overlayEl id and data-id correctly', () => {
      getTrackPoint(geographicProj(), buildClusterPoint(),
        false, jest.fn(), defaultHighlightOptions());
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      expect(overlayEl.id).toBe('track-marker-case-2023-01-01');
      expect(overlayEl.dataset.id).toBe('event-1');
    });

    it('calls formatDisplayDate with the event date', () => {
      getTrackPoint(geographicProj(), buildClusterPoint(),
        false, jest.fn(), defaultHighlightOptions());
      expect(formatDisplayDate).toHaveBeenCalledWith('2023-01-01');
    });
  });

  // -------------------------------------------------------------------------
  // getArrows
  // -------------------------------------------------------------------------
  describe('getArrows()', () => {
    it('returns an OlOverlay instance', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([50, 25]);

      getArrows([[10, 20], [0, 0]], map, false);
      expect(OlOverlay).toHaveBeenCalled();
    });

    it('sets arrowEl className to event-track-arrows', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([50, 25]);

      getArrows([[10, 20], [0, 0]], map, false);
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const arrowEl = overlayEl.querySelector('div');
      expect(arrowEl.className).toBe('event-track-arrows');
    });

    it('sets backgroundSize when isHighlighted is true', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([50, 25]);

      getArrows([[10, 20], [0, 0]], map, true);
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const arrowEl = overlayEl.querySelector('div');
      expect(arrowEl.style.backgroundSize).toBe('200px');
    });

    it('leaves backgroundSize empty when isHighlighted is false', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([50, 25]);

      getArrows([[10, 20], [0, 0]], map, false);
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const arrowEl = overlayEl.querySelector('div');
      expect(arrowEl.style.backgroundSize).toBe('');
    });

    it('computes the rotation angle from coordinate delta and map rotation', () => {
      const map = buildMap();
      map.getView().getRotation.mockReturnValue(0);
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 0]);
      map.getCoordinateFromPixel.mockReturnValue([50, 0]);

      // dxCoord = 10-0=10, dyCoord = 20-0=20 → angle = atan2(20,10) in degrees
      getArrows([[10, 20], [0, 0]], map, false);
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      const expectedAngle = -(Math.atan2(20, 10) * (180 / Math.PI));
      expect(overlayEl.style.transform).toContain(`rotate(${expectedAngle}deg)`);
    });

    it('sets overlay id based on midpoint pixel coordinates', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([50, 25]);

      getArrows([[10, 20], [0, 0]], map, false);
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.id).toContain('arrow');
    });

    it('calls getCoordinateFromPixel to set the overlay position', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([50, 25]);

      getArrows([[10, 20], [0, 0]], map, false);
      expect(map.getCoordinateFromPixel).toHaveBeenCalled();
    });

    it('sets overlayEl dimensions to 1px × 1px', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([50, 25]);

      getArrows([[10, 20], [0, 0]], map, false);
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      expect(overlayEl.style.width).toBe('1px');
      expect(overlayEl.style.height).toBe('1px');
    });
  });

  // -------------------------------------------------------------------------
  // getTrackLines
  // -------------------------------------------------------------------------
  describe('getTrackLines()', () => {
    it('returns undefined when trackCoords is empty', () => {
      const map = buildMap();
      const result = getTrackLines(map, [], 'event-1', '2023-01-01', jest.fn(), defaultHighlightOptions());
      expect(result).toBeUndefined();
    });

    it('returns an OlOverlay when trackCoords has entries', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        defaultHighlightOptions(),
      );
      expect(OlOverlay).toHaveBeenCalled();
    });

    it('sets overlay id to event-track-{eventID}', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        defaultHighlightOptions(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.id).toBe('event-track-event-1');
    });

    it('uses highlighted-track-line class when isHighlighted is true', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        { ...defaultHighlightOptions(), isHighlighted: true },
      );
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.className).toContain('highlighted-track-line');
    });

    it('uses event-track-line class when isHighlighted is false', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        defaultHighlightOptions(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.className).toBe('event-track-line');
    });

    it('creates SVG polyline elements for each track segment', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        defaultHighlightOptions(),
      );
      const svgEl = OlOverlay.mock.calls[0][0].element;
      const polylines = svgEl.querySelectorAll('polyline');
      // 3 polylines per segment: outline, click, line
      expect(polylines.length).toBe(3);
    });

    it('sets stroke to yellow on the line polyline when isHighlighted is true', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        { ...defaultHighlightOptions(), isHighlighted: true },
      );
      const svgEl = OlOverlay.mock.calls[0][0].element;
      // Last polyline is the visible line element
      const polylines = svgEl.querySelectorAll('polyline');
      const lineEl = polylines[polylines.length - 1];
      expect(lineEl.style.stroke).toBe('yellow');
    });

    it('calls callback with eventID and date when clickEl is clicked', () => {
      const callback = jest.fn();
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        callback,
        defaultHighlightOptions(),
      );
      const svgEl = OlOverlay.mock.calls[0][0].element;
      const clickEl = svgEl.querySelector('.clickable-track-line');
      clickEl.onclick();
      expect(callback).toHaveBeenCalledWith('event-1', '2023-01-01');
    });

    it('calls callbackHighlight when clickEl mouseover fires', () => {
      const callbackHighlight = jest.fn();
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        { ...defaultHighlightOptions(), callbackHighlight },
      );
      const svgEl = OlOverlay.mock.calls[0][0].element;
      const clickEl = svgEl.querySelector('.clickable-track-line');
      clickEl.onmouseover();
      expect(callbackHighlight).toHaveBeenCalledWith('event-1', '2023-01-01');
    });

    it('calls callbackUnhighlight when clickEl mouseleave fires', () => {
      const callbackUnhighlight = jest.fn();
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        { ...defaultHighlightOptions(), callbackUnhighlight },
      );
      const svgEl = OlOverlay.mock.calls[0][0].element;
      const clickEl = svgEl.querySelector('.clickable-track-line');
      clickEl.onmouseleave();
      expect(callbackUnhighlight).toHaveBeenCalled();
    });

    it('handles multiple track segments correctly', () => {
      const map = buildMap();
      map.getPixelFromCoordinate
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([50, 25])
        .mockReturnValueOnce([50, 25])
        .mockReturnValueOnce([100, 50])
        .mockReturnValueOnce([0, 0])
        .mockReturnValueOnce([50, 25])
        .mockReturnValueOnce([50, 25])
        .mockReturnValueOnce([100, 50]);
      map.getCoordinateFromPixel.mockReturnValue([0, 0]);

      getTrackLines(
        map,
        [[[0, 0], [5, 5]], [[5, 5], [10, 10]]],
        'event-1',
        '2023-01-01',
        jest.fn(),
        defaultHighlightOptions(),
      );
      const svgEl = OlOverlay.mock.calls[0][0].element;
      const polylines = svgEl.querySelectorAll('polyline');
      expect(polylines.length).toBe(6); // 3 per segment × 2 segments
    });
  });

  // -------------------------------------------------------------------------
  // getClusterPointEl
  // -------------------------------------------------------------------------
  describe('getClusterPointEl()', () => {
    const buildCluster = (overrides = {}) => ({
      geometry: {
        coordinates: [10, 20],
        ...overrides.geometry,
      },
      properties: {
        cluster_id: 'cluster-1',
        point_count_abbreviated: 5,
        startDate: '2023-01-01',
        endDate: '2023-01-10',
        ...overrides.properties,
      },
    });

    const buildPointClusterObj = () => ({
      getClusterExpansionZoom: jest.fn(() => 7),
    });

    it('returns an OlOverlay instance', () => {
      const map = buildMap();
      getClusterPointEl(geographicProj(), buildCluster(), map, buildPointClusterObj());
      expect(OlOverlay).toHaveBeenCalled();
    });

    it('uses geographic coordinates unchanged when proj is geographic', () => {
      const map = buildMap();
      getClusterPointEl(geographicProj(), buildCluster(), map, buildPointClusterObj());
      expect(olProj.transform).not.toHaveBeenCalled();
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.position).toEqual([10, 20]);
    });

    it('transforms coordinates for polar projections', () => {
      const map = buildMap();
      getClusterPointEl(polarProj(), buildCluster(), map, buildPointClusterObj());
      expect(olProj.transform).toHaveBeenCalledWith([10, 20], 'EPSG:4326', 'EPSG:3413');
    });

    it('sets overlay id to clusterId + startDate + endDate', () => {
      const map = buildMap();
      getClusterPointEl(geographicProj(), buildCluster(), map, buildPointClusterObj());
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.id).toBe('cluster-12023-01-012023-01-10');
    });

    it('sets the cluster className to event-track-cluster-point', () => {
      const map = buildMap();
      getClusterPointEl(geographicProj(), buildCluster(), map, buildPointClusterObj());
      const opts = OlOverlay.mock.calls[0][0];
      expect(opts.className).toBe('event-track-cluster-point');
    });

    it('assigns small size class for point count < 10', () => {
      const map = buildMap();
      getClusterPointEl(
        geographicProj(),
        buildCluster({ properties: { point_count_abbreviated: 5 } }),
        map,
        buildPointClusterObj(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      const circleEl = opts.element.querySelector('div');
      expect(circleEl.className).toContain('cluster-marker-small');
    });

    it('assigns medium size class for point count between 10 and 19', () => {
      const map = buildMap();
      getClusterPointEl(
        geographicProj(),
        buildCluster({ properties: { point_count_abbreviated: 15 } }),
        map,
        buildPointClusterObj(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      const circleEl = opts.element.querySelector('div');
      expect(circleEl.className).toContain('cluster-marker-medium');
    });

    it('assigns large size class for point count >= 20', () => {
      const map = buildMap();
      getClusterPointEl(
        geographicProj(),
        buildCluster({ properties: { point_count_abbreviated: 25 } }),
        map,
        buildPointClusterObj(),
      );
      const opts = OlOverlay.mock.calls[0][0];
      const circleEl = opts.element.querySelector('div');
      expect(circleEl.className).toContain('cluster-marker-large');
    });

    it('calls mapUtilZoomAction with correct args when circleEl is clicked', () => {
      const map = buildMap();
      const view = map.getView();
      view.getZoom.mockReturnValue(4);
      const pointClusterObj = buildPointClusterObj();
      pointClusterObj.getClusterExpansionZoom.mockReturnValue(7);

      getClusterPointEl(geographicProj(), buildCluster(), map, pointClusterObj);
      const circleEl = OlOverlay.mock.calls[0][0].element.querySelector('div');
      circleEl.onclick();

      expect(mapUtilZoomAction).toHaveBeenCalledWith(
        map,
        7 - 4, // zoomTo - mapZoom
        450,
        [10, 20],
      );
    });

    it('calls formatDisplayDate for startDate and endDate', () => {
      const map = buildMap();
      getClusterPointEl(geographicProj(), buildCluster(), map, buildPointClusterObj());
      expect(formatDisplayDate).toHaveBeenCalledWith('2023-01-01');
      expect(formatDisplayDate).toHaveBeenCalledWith('2023-01-10');
    });

    it('sets the correct class names on overlayEl and textEl', () => {
      const map = buildMap();
      getClusterPointEl(geographicProj(), buildCluster(), map, buildPointClusterObj());
      const overlayEl = OlOverlay.mock.calls[0][0].element;
      expect(overlayEl.className).toBe('cluster-track-marker-case track-marker-case');
      const textEl = overlayEl.querySelector('span');
      expect(textEl.className).toBe('cluster-track-marker-date track-marker-date');
    });
  });
});
