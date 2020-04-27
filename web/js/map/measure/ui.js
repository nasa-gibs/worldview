import { unByKey as OlObservableUnByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import {
  LineString as OlLineString,
  Polygon as OlGeomPolygon,
} from 'ol/geom';
import { Draw as OlInteractionDraw } from 'ol/interaction';
import { Vector as OlVectorLayer } from 'ol/layer';
import { Vector as OlVectorSource } from 'ol/source';
import {
  Circle as OlStyleCircle,
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
} from 'ol/style';
import {
  transformLineStringArc,
  transformPolygonArc,
  getFormattedLength,
  getFormattedArea,
} from './util';
import { toggleMeasureActive } from '../../modules/measure/actions';

export default function measure(map, mapUiEvents, store) {
  let draw;
  let sketch;
  let measureTooltipElement;
  let measureTooltip;
  let drawChangeListener;
  let rightClickListener;
  let twoFingerTouchListener;
  let vector;
  let allMeasureTooltips = {};
  let allGeometries = {};
  let unitOfMeasure = 'km';
  const self = {};
  const source = new OlVectorSource({ wrapX: false });
  const projection = map.getView().getProjection().getCode();
  const areaBgFill = new OlStyleFill({
    color: 'rgba(213, 78, 33, 0.1)',
  });
  const solidBlackLineStroke = new OlStyleStroke({
    color: 'rgba(0, 0, 0, 1)',
    lineJoin: 'round',
    width: 5,
  });
  const vectorStyles = [
    new OlStyle({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
      geometry: styleGeometryFn,
    }),
    new OlStyle({
      stroke: new OlStyleStroke({
        color: '#fff',
        lineJoin: 'round',
        width: 2,
      }),
      geometry: styleGeometryFn,
    }),
  ];
  const drawStyles = [
    new OlStyle({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
      geometry: styleGeometryFn,
    }),
    new OlStyle({
      stroke: new OlStyleStroke({
        color: '#fff',
        lineDash: [10, 20],
        lineJoin: 'round',
        width: 2,
      }),
      image: new OlStyleCircle({
        radius: 7,
        stroke: new OlStyleStroke({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        fill: new OlStyleFill({
          color: 'rgba(255, 255, 255, 0.3)',
        }),
      }),
      geometry: styleGeometryFn,
    }),
  ];

  function terminateDraw() {
    sketch = null;
    measureTooltipElement = null;
    store.dispatch(toggleMeasureActive(false));
    map.removeInteraction(draw);
    OlObservableUnByKey(drawChangeListener);
    OlObservableUnByKey(rightClickListener);
    OlObservableUnByKey(twoFingerTouchListener);
    mapUiEvents.trigger('enable-click-zoom');
  }

  function createMeasureTooltip(geom) {
    if (!measureTooltipElement) {
      measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = 'tooltip-measure tooltip-active';
      measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center',
      });
    }

    if (geom) {
      allMeasureTooltips[geom.ol_uid] = measureTooltip;
    }
    map.addOverlay(measureTooltip);
  }

  function drawStartCallback(evt) {
    let tooltipCoord;
    mapUiEvents.trigger('disable-click-zoom');
    sketch = evt.feature;
    drawChangeListener = sketch.getGeometry().on('change', (e) => {
      const geom = e.target;
      if (geom instanceof OlGeomPolygon) {
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof OlLineString) {
        tooltipCoord = geom.getLastCoordinate();
      }
      setMeasurementTooltip(geom, measureTooltipElement);
      measureTooltip.setPosition(tooltipCoord);
    });
  }

  function drawEndCallback(evt) {
    const featureGeom = evt.feature.getGeometry();
    allGeometries[featureGeom.ol_uid] = featureGeom;
    measureTooltipElement.className = 'tooltip-measure tooltip-static';
    measureTooltip.setOffset([0, -7]);
    createMeasureTooltip(featureGeom);
    terminateDraw();
  }

  /**
   * Call the appropriate transform function to add great circle arcs to
   * lines and polygon edges.  Otherwise pass through unaffected.
   * @param {*} feature
   */
  function styleGeometryFn(feature) {
    const geometry = feature.getGeometry();
    if (geometry instanceof OlLineString) {
      return transformLineStringArc(geometry, projection);
    }
    if (geometry instanceof OlGeomPolygon) {
      return transformPolygonArc(geometry, projection);
    }
    return geometry;
  }

  /**
   * Set the innerHTML of the given tooltip element to the formatted length/area
   * measruement of the given geometry
   * @param {*} geometry
   * @param {*} element
   */
  function setMeasurementTooltip(geometry, element) {
    let measurement;
    if (geometry instanceof OlGeomPolygon) {
      measurement = getFormattedArea(geometry, projection, unitOfMeasure);
    }
    if (geometry instanceof OlLineString) {
      measurement = getFormattedLength(geometry, projection, unitOfMeasure);
    }
    element.innerHTML = measurement;
  }

  /**
   * Go through every tooltip and recalculate the measurement based on
   * current settings of unit of measurement
   */
  function recalculateAllMeasurements() {
    Object.keys(allMeasureTooltips).forEach((id) => {
      const geomForTooltip = allGeometries[id];
      const tooltipElement = allMeasureTooltips[id].element.children[0];
      tooltipElement.innerHtml = setMeasurementTooltip(geomForTooltip, tooltipElement);
      geomForTooltip.changed();
      allMeasureTooltips[id].setOffset([0, -7]);
    });
  }

  /**
   * Initiate a measurement interaction of the given measureType ('distance' or 'area')
   * @param {String} measureType
   */
  self.initMeasurement = (measureType) => {
    const type = measureType === 'area' ? 'Polygon' : 'LineString';
    if (draw) {
      map.removeInteraction(draw);
    }
    draw = new OlInteractionDraw({ source, type, style: drawStyles });
    if (!vector) {
      vector = new OlVectorLayer({ source, style: vectorStyles });
      vector.setMap(map);
    }
    map.addInteraction(draw);
    createMeasureTooltip();
    store.dispatch(toggleMeasureActive(true));

    draw.on('drawstart', drawStartCallback, this);
    draw.on('drawend', drawEndCallback, this);
    rightClickListener = map.on('contextmenu', (evt) => {
      evt.preventDefault();
      terminateDraw();
      map.removeOverlay(measureTooltip);
    });

    // TODO get this working
    twoFingerTouchListener = map.on('touchstart', (evt) => {
      if (evt.touches > 1) {
        evt.preventDefault();
        terminateDraw();
        map.removeOverlay(measureTooltip);
      }
    });
  };

  /**
   * Convert unit of measurement on all existing measurements and those created after
   * @param {String} unit - Unit of measurement: 'km' or 'mi'
   */
  self.changeUnits = (unit) => {
    unitOfMeasure = unit;
    recalculateAllMeasurements();
  };

  /**
   * Clear all existing measurements on the associated map
   */
  self.clearMeasurements = () => {
    Object.keys(allMeasureTooltips).forEach((id) => {
      map.removeOverlay(allMeasureTooltips[id]);
    });
    allMeasureTooltips = {};
    allGeometries = {};
    terminateDraw();
    map.removeOverlay(measureTooltip);
    if (vector) {
      vector.getSource().clear();
      vector.setMap(null);
      vector = null;
    }
  };

  return self;
}
