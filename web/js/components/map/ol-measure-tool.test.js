import { createElement } from 'react';
import { render, act } from '@testing-library/react';

jest.mock('react-redux', () => ({
  connect: (mapStateToProps, mapDispatchToProps) => {
    globalThis.measureConnectArgs = { mapStateToProps, mapDispatchToProps };
    return (Component) => Component;
  },
}));

jest.mock('../measure-tool/util', () => ({
  transformLineStringArc: jest.fn((g) => g),
  transformPolygonArc: jest.fn((g) => g),
  downloadGeoJSON: jest.fn(),
}));

let mockTooltipProps = null;
jest.mock('../measure-tool/measure-tooltip', () => (props) => {
  mockTooltipProps = props;
  return null;
});

jest.mock('../../modules/location-search/util', () => ({
  areCoordinatesWithinExtent: jest.fn(() => true),
}));

jest.mock('ol/Observable', () => ({ unByKey: jest.fn() }));
jest.mock('ol/proj', () => ({ transform: jest.fn((coord) => coord) }));

jest.mock('ol/Overlay', () => jest.fn());

let mockDrawCallbacks = {};
jest.mock('ol/interaction', () => ({
  Draw: jest.fn().mockImplementation(() => ({
    on: jest.fn((evt, cb) => { mockDrawCallbacks[evt] = cb; }),
    off: jest.fn(),
  })),
}));

jest.mock('ol/layer', () => ({
  Vector: jest.fn().mockImplementation(() => ({ setMap: jest.fn() })),
}));

jest.mock('ol/source', () => ({
  Vector: jest.fn().mockImplementation(() => ({ removeFeature: jest.fn(), wrapX: false })),
}));

jest.mock('ol/style', () => ({
  Circle: jest.fn(),
  Fill: jest.fn(),
  Stroke: jest.fn(),
  Style: jest.fn(),
}));

jest.mock('ol/geom', () => ({
  LineString: jest.fn(),
  Polygon: jest.fn(),
}));

jest.mock('../../modules/measure/actions', () => ({
  toggleMeasureActive: jest.fn((v) => ({ type: 'TOGGLE_MEASURE', payload: v })),
  updateMeasurements: jest.fn((m) => ({ type: 'UPDATE_MEASUREMENTS', payload: m })),
}));

import OlMeasureTool from './ol-measure-tool';
import util from '../../util/util';
import {
  transformLineStringArc,
  transformPolygonArc,
  downloadGeoJSON,
} from '../measure-tool/util';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import { unByKey as OlObservableUnByKey } from 'ol/Observable';
import { LineString as OlLineString, Polygon as OlPolygon } from 'ol/geom';
import { Draw as OlDraw } from 'ol/interaction';
import { Vector as OlVectorLayer } from 'ol/layer';
import OlOverlay from 'ol/Overlay';
import {
  MEASURE_DISTANCE,
  MEASURE_AREA,
  MEASURE_CLEAR,
  MEASURE_DOWNLOAD_GEOJSON,
  MAP_DISABLE_CLICK_ZOOM,
  MAP_ENABLE_CLICK_ZOOM,
} from '../../util/constants';
import { CRS } from '../../modules/map/constants';

const { events } = util;

let overlayCount = 0;
let featureCount = 0;
let capturedMeasurements = null;

const makeOlMap = () => ({
  addInteraction: jest.fn(),
  removeInteraction: jest.fn(),
  addOverlay: jest.fn(),
  removeOverlay: jest.fn(),
  on: jest.fn(() => ({ key: 'listener' })),
  un: jest.fn(),
  getCoordinateFromPixel: jest.fn(() => [0, 0]),
});

const makeMap = (olMap) => ({
  rendered: true,
  ui: {
    proj: {
      geographic: olMap,
      arctic: olMap,
      antarctic: olMap,
    },
  },
});

const defaultProjections = [CRS.GEOGRAPHIC, CRS.ARCTIC, CRS.ANTARCTIC];

const buildProps = (overrides = {}) => {
  const olMap = overrides.olMap !== undefined ? overrides.olMap : makeOlMap();
  const userUpdate = overrides.updateMeasurements || jest.fn();
  return {
    olMap,
    map: overrides.map !== undefined ? overrides.map : makeMap(olMap),
    crs: CRS.GEOGRAPHIC,
    unitOfMeasure: 'km',
    toggleMeasureActive: jest.fn(),
    projections: defaultProjections,
    proj: { selected: { crs: CRS.GEOGRAPHIC } },
    ...overrides,
    updateMeasurements: (measurements) => {
      capturedMeasurements = measurements;
      userUpdate(measurements);
    },
  };
};

const renderTool = (overrides = {}) => {
  const props = buildProps(overrides);
  let result;
  act(() => {
    result = render(createElement(OlMeasureTool, props));
  });
  return { ...result, props, olMap: props.olMap };
};

const rerenderTool = (rerender, props) => {
  act(() => { rerender(createElement(OlMeasureTool, props)); });
};

const trigger = (eventName, ...args) => {
  act(() => { events.trigger(eventName, ...args); });
};

const makeLineGeometry = (lastCoord = [10, 20]) => {
  const geom = Object.create(OlLineString.prototype);
  geom.on = jest.fn();
  geom.getLastCoordinate = jest.fn(() => lastCoord);
  geom.changed = jest.fn();
  return geom;
};

const makePolygonGeometry = (interiorCoord = [5, 5]) => {
  const geom = Object.create(OlPolygon.prototype);
  geom.on = jest.fn();
  geom.getInteriorPoint = jest.fn(() => ({ getCoordinates: () => interiorCoord }));
  geom.changed = jest.fn();
  return geom;
};

const makeFeature = (geometry) => {
  featureCount += 1;
  return { getGeometry: jest.fn(() => geometry), ol_uid: `feat-${featureCount}` };
};

const originalConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('already been passed to createRoot')) return;
    originalConsoleError(...args);
  });
});

afterAll(() => {
  console.error.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDrawCallbacks = {};
  mockTooltipProps = null;

  OlOverlay.mockImplementation(() => {
    overlayCount += 1;
    const element = document.createElement('div');
    return {
      ol_uid: `overlay-${overlayCount}`,
      element,
      setOffset: jest.fn(),
      setPosition: jest.fn(),
      getElement: () => element,
    };
  });
});

afterEach(() => {
  if (capturedMeasurements) {
    Object.keys(capturedMeasurements).forEach((key) => {
      capturedMeasurements[key] = {};
    });
  }
});

describe('OlMeasureTool', () => {
  describe('rendering', () => {
    it('renders null (no DOM output)', () => {
      const { container } = renderTool();
      expect(container.firstChild).toBeNull();
    });

    it('does not throw when map and olMap are null', () => {
      expect(() => renderTool({ map: null, olMap: null })).not.toThrow();
    });

    it('does not throw with an empty projections list', () => {
      expect(() => renderTool({ projections: [] })).not.toThrow();
    });
  });

  describe('event registration', () => {
    it('registers all four measure event handlers when the map is rendered', () => {
      const onSpy = jest.spyOn(events, 'on');
      renderTool();
      const registered = onSpy.mock.calls.map(([evt]) => evt);
      expect(registered).toEqual(expect.arrayContaining([
        MEASURE_DISTANCE, MEASURE_AREA, MEASURE_CLEAR, MEASURE_DOWNLOAD_GEOJSON,
      ]));
      onSpy.mockRestore();
    });

    it('does not register handlers when map.rendered is false', () => {
      const olMap = makeOlMap();
      const onSpy = jest.spyOn(events, 'on');
      renderTool({
        olMap,
        map: {
          rendered: false,
          ui: { proj: { geographic: olMap, arctic: olMap, antarctic: olMap } },
        },
      });
      const registered = onSpy.mock.calls.map(([evt]) => evt);
      expect(registered).not.toContain(MEASURE_DISTANCE);
      onSpy.mockRestore();
    });

    it('deregisters the measure event handlers on unmount', () => {
      const offSpy = jest.spyOn(events, 'off');
      const { unmount } = renderTool();
      act(() => { unmount(); });
      const deregistered = offSpy.mock.calls.map(([evt]) => evt);
      expect(deregistered).toEqual(expect.arrayContaining([
        MEASURE_DISTANCE, MEASURE_AREA, MEASURE_CLEAR, MEASURE_DOWNLOAD_GEOJSON,
      ]));
      offSpy.mockRestore();
    });
  });

  describe('distance measurement', () => {
    it('adds a Draw interaction of type LineString', () => {
      const { olMap } = renderTool();
      trigger(MEASURE_DISTANCE);
      expect(olMap.addInteraction).toHaveBeenCalled();
      expect(OlDraw.mock.calls.at(-1)[0].type).toBe('LineString');
    });

    it('activates measure mode and adds the tooltip overlay', () => {
      const toggleMeasureActive = jest.fn();
      const { olMap } = renderTool({ toggleMeasureActive });
      trigger(MEASURE_DISTANCE);
      expect(toggleMeasureActive).toHaveBeenCalledWith(true);
      expect(olMap.addOverlay).toHaveBeenCalled();
    });

    it('registers a contextmenu listener on the map', () => {
      const { olMap } = renderTool();
      trigger(MEASURE_DISTANCE);
      expect(olMap.on).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('removes the previous Draw interaction when restarted', () => {
      const { olMap } = renderTool();
      trigger(MEASURE_DISTANCE);
      olMap.removeInteraction.mockClear();
      trigger(MEASURE_DISTANCE);
      expect(olMap.removeInteraction).toHaveBeenCalled();
    });
  });

  describe('area measurement', () => {
    it('adds a Draw interaction of type Polygon', () => {
      const { olMap } = renderTool();
      trigger(MEASURE_AREA);
      expect(olMap.addInteraction).toHaveBeenCalled();
      expect(OlDraw.mock.calls.at(-1)[0].type).toBe('Polygon');
    });

    it('activates measure mode', () => {
      const toggleMeasureActive = jest.fn();
      renderTool({ toggleMeasureActive });
      trigger(MEASURE_AREA);
      expect(toggleMeasureActive).toHaveBeenCalledWith(true);
    });
  });

  describe('Draw condition function', () => {
    it('checks coordinates against the projection extent', () => {
      const { olMap } = renderTool();
      trigger(MEASURE_DISTANCE);
      const { condition } = OlDraw.mock.calls.at(-1)[0];
      const result = condition({ originalEvent: { x: 100, y: 200 } });
      expect(olMap.getCoordinateFromPixel).toHaveBeenCalledWith([100, 200]);
      expect(areCoordinatesWithinExtent).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('drawstart callback', () => {
    it('disables click-zoom and listens for geometry changes', () => {
      const triggerSpy = jest.spyOn(events, 'trigger');
      renderTool();
      trigger(MEASURE_DISTANCE);

      const geom = makeLineGeometry();
      act(() => { mockDrawCallbacks.drawstart({ feature: makeFeature(geom) }); });

      expect(triggerSpy).toHaveBeenCalledWith(MAP_DISABLE_CLICK_ZOOM);
      expect(geom.on).toHaveBeenCalledWith('change', expect.any(Function));
      triggerSpy.mockRestore();
    });

    it('positions the tooltip at the LineString last coordinate on change', () => {
      const { rerender, props } = renderTool();
      trigger(MEASURE_DISTANCE);
      rerenderTool(rerender, props);

      const overlay = OlOverlay.mock.results.at(-1).value;
      const lastCoord = [99, 88];
      const geom = makeLineGeometry(lastCoord);
      act(() => { mockDrawCallbacks.drawstart({ feature: makeFeature(geom) }); });

      const changeHandler = geom.on.mock.calls.find(([evt]) => evt === 'change')[1];
      act(() => { changeHandler({ target: geom }); });

      expect(overlay.setPosition).toHaveBeenCalledWith(lastCoord);
    });

    it('positions the tooltip at the Polygon interior point on change', () => {
      const { rerender, props } = renderTool();
      trigger(MEASURE_AREA);
      rerenderTool(rerender, props);

      const overlay = OlOverlay.mock.results.at(-1).value;
      const interior = [3, 4];
      const geom = makePolygonGeometry(interior);
      act(() => { mockDrawCallbacks.drawstart({ feature: makeFeature(geom) }); });

      const changeHandler = geom.on.mock.calls.find(([evt]) => evt === 'change')[1];
      act(() => { changeHandler({ target: geom }); });

      expect(overlay.setPosition).toHaveBeenCalledWith(interior);
    });
  });

  describe('drawend callback', () => {
    const startAndEnd = () => {
      const userUpdate = jest.fn();
      const toggleMeasureActive = jest.fn();
      const {
        rerender, props,
      } = renderTool({ updateMeasurements: userUpdate, toggleMeasureActive });
      trigger(MEASURE_DISTANCE);
      rerenderTool(rerender, props);

      const overlay = OlOverlay.mock.results.at(-1).value;
      const triggerSpy = jest.spyOn(events, 'trigger');
      act(() => { mockDrawCallbacks.drawend({ feature: makeFeature(makeLineGeometry()) }); });
      return {
        overlay, userUpdate, toggleMeasureActive, triggerSpy,
      };
    };

    it('offsets the overlay and stores the measurement', () => {
      const { overlay, userUpdate } = startAndEnd();
      expect(overlay.setOffset).toHaveBeenCalledWith([0, -7]);
      expect(userUpdate).toHaveBeenCalled();
    });

    it('terminates the draw (deactivates and re-enables click zoom)', () => {
      const { toggleMeasureActive, triggerSpy } = startAndEnd();
      expect(toggleMeasureActive).toHaveBeenCalledWith(false);
      expect(triggerSpy).toHaveBeenCalledWith(MAP_ENABLE_CLICK_ZOOM);
      triggerSpy.mockRestore();
    });
  });

  describe('contextmenu (right-click) handling', () => {
    it('terminates the draw and removes the overlay on right-click', () => {
      const toggleMeasureActive = jest.fn();
      const { olMap } = renderTool({ toggleMeasureActive });
      trigger(MEASURE_DISTANCE);

      const contextHandler = olMap.on.mock.calls.find(([evt]) => evt === 'contextmenu')[1];
      const preventDefault = jest.fn();
      const triggerSpy = jest.spyOn(events, 'trigger');
      olMap.removeOverlay.mockClear();
      toggleMeasureActive.mockClear();

      act(() => { contextHandler({ preventDefault }); });

      expect(preventDefault).toHaveBeenCalled();
      expect(toggleMeasureActive).toHaveBeenCalledWith(false);
      expect(olMap.removeOverlay).toHaveBeenCalled();
      expect(OlObservableUnByKey).toHaveBeenCalled();
      expect(triggerSpy).toHaveBeenCalledWith(MAP_ENABLE_CLICK_ZOOM);
      triggerSpy.mockRestore();
    });
  });

  describe('clear measurements', () => {
    it('clears stored measurements and deactivates measure mode', () => {
      const userUpdate = jest.fn();
      const toggleMeasureActive = jest.fn();
      const { olMap } = renderTool({ updateMeasurements: userUpdate, toggleMeasureActive });
      trigger(MEASURE_DISTANCE);
      userUpdate.mockClear();
      toggleMeasureActive.mockClear();
      olMap.removeOverlay.mockClear();

      trigger(MEASURE_CLEAR);

      expect(userUpdate).toHaveBeenCalled();
      expect(toggleMeasureActive).toHaveBeenCalledWith(false);
      expect(olMap.removeOverlay).toHaveBeenCalled();
    });

    it('tears down the vector layer when one exists', () => {
      renderTool();
      trigger(MEASURE_DISTANCE);
      const layerInstance = OlVectorLayer.mock.results.at(-1).value;
      trigger(MEASURE_CLEAR);
      expect(layerInstance.setMap).toHaveBeenCalledWith(null);
    });
  });

  describe('download GeoJSON', () => {
    it('calls downloadGeoJSON for the current projection', () => {
      renderTool();
      trigger(MEASURE_DOWNLOAD_GEOJSON);
      expect(downloadGeoJSON).toHaveBeenCalledWith(expect.anything(), CRS.GEOGRAPHIC);
    });
  });

  describe('styleGeometryFn', () => {
    const getStyleGeometryFn = () => {
      const { Style } = require('ol/style');
      const call = Style.mock.calls.find((args) => args[0] && args[0].geometry);
      return call[0].geometry;
    };

    it('applies a great-circle arc to LineString geometry', () => {
      renderTool();
      const fn = getStyleGeometryFn();
      const geom = Object.create(OlLineString.prototype);
      fn({ getGeometry: () => geom });
      expect(transformLineStringArc).toHaveBeenCalledWith(geom, CRS.GEOGRAPHIC);
    });

    it('applies a great-circle arc to Polygon geometry', () => {
      renderTool();
      const fn = getStyleGeometryFn();
      const geom = Object.create(OlPolygon.prototype);
      fn({ getGeometry: () => geom });
      expect(transformPolygonArc).toHaveBeenCalledWith(geom, CRS.GEOGRAPHIC);
    });

    it('passes other geometry types through unchanged', () => {
      renderTool();
      const fn = getStyleGeometryFn();
      const geom = { type: 'Point' };
      expect(fn({ getGeometry: () => geom })).toBe(geom);
    });
  });

  describe('projection change', () => {
    it('terminates the in-progress draw when the crs changes', () => {
      const olMap = makeOlMap();
      const { rerender, props } = renderTool({ olMap });
      trigger(MEASURE_DISTANCE);
      olMap.removeInteraction.mockClear();

      rerenderTool(rerender, {
        ...props,
        crs: CRS.ARCTIC,
        proj: { selected: { crs: CRS.ARCTIC } },
      });

      expect(olMap.removeInteraction).toHaveBeenCalled();
    });
  });

  describe('recalculateAllMeasurements', () => {
    it('re-renders stored measurements when the unit of measure changes', () => {
      const { rerender, props } = renderTool({ unitOfMeasure: 'km' });
      trigger(MEASURE_DISTANCE);
      rerenderTool(rerender, props);

      const geom = makeLineGeometry();
      act(() => { mockDrawCallbacks.drawend({ feature: makeFeature(geom) }); });

      expect(() => {
        rerenderTool(rerender, { ...props, unitOfMeasure: 'mi' });
      }).not.toThrow();
      expect(geom.changed).toHaveBeenCalled();
    });
  });

  describe('removing an individual measurement', () => {
    it('removes the feature and overlay via the tooltip onRemove callback', () => {
      const userUpdate = jest.fn();
      const { rerender, props } = renderTool({ updateMeasurements: userUpdate });
      trigger(MEASURE_DISTANCE);
      rerenderTool(rerender, props);

      const { olMap } = props;
      act(() => { mockDrawCallbacks.drawend({ feature: makeFeature(makeLineGeometry()) }); });

      expect(mockTooltipProps).not.toBeNull();
      olMap.removeOverlay.mockClear();
      userUpdate.mockClear();
      act(() => { mockTooltipProps.onRemove(); });

      expect(olMap.removeOverlay).toHaveBeenCalled();
      expect(userUpdate).toHaveBeenCalled();
    });
  });

  describe('clearing stored measurements', () => {
    it('removes the overlay for each stored measurement', () => {
      const { rerender, props } = renderTool();
      trigger(MEASURE_DISTANCE);
      rerenderTool(rerender, props);

      const overlay = OlOverlay.mock.results.at(-1).value;
      act(() => { mockDrawCallbacks.drawend({ feature: makeFeature(makeLineGeometry()) }); });

      const { olMap } = props;
      olMap.removeOverlay.mockClear();
      trigger(MEASURE_CLEAR);

      expect(olMap.removeOverlay).toHaveBeenCalledWith(overlay);
    });
  });

  describe('projection change with an active tooltip', () => {
    it('removes the tooltip overlay when a tooltip-active element exists', () => {
      const olMap = makeOlMap();
      const { rerender, props } = renderTool({ olMap });
      trigger(MEASURE_DISTANCE);

      const activeEl = document.createElement('div');
      activeEl.className = 'tooltip-active';
      document.body.appendChild(activeEl);
      olMap.removeOverlay.mockClear();

      rerenderTool(rerender, {
        ...props,
        crs: CRS.ARCTIC,
        proj: { selected: { crs: CRS.ARCTIC } },
      });

      expect(olMap.removeOverlay).toHaveBeenCalled();
      document.body.removeChild(activeEl);
    });
  });

  describe('redux bindings', () => {
    it('mapStateToProps selects the expected slice of state', () => {
      const state = {
        map: { ui: { selected: { id: 'olMap' } }, rendered: true },
        proj: { selected: { crs: CRS.ARCTIC } },
        measure: { unitOfMeasure: 'mi' },
        config: {
          projections: {
            geographic: { crs: CRS.GEOGRAPHIC },
            arctic: { crs: CRS.ARCTIC },
          },
        },
      };
      const result = globalThis.measureConnectArgs.mapStateToProps(state);
      expect(result.crs).toBe(CRS.ARCTIC);
      expect(result.unitOfMeasure).toBe('mi');
      expect(result.olMap).toBe(state.map.ui.selected);
      expect(result.projections).toEqual([CRS.GEOGRAPHIC, CRS.ARCTIC]);
    });

    it('mapDispatchToProps dispatches the measure actions', () => {
      const dispatch = jest.fn();
      const bound = globalThis.measureConnectArgs.mapDispatchToProps(dispatch);
      bound.toggleMeasureActive(true);
      bound.updateMeasurements({ foo: 'bar' });
      expect(dispatch).toHaveBeenCalledTimes(2);
    });
  });
});
