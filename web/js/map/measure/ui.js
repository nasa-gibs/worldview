import { unByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import { LineString, Polygon } from 'ol/geom';
import { Draw } from 'ol/interaction/';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import {
  transformLineStringArc,
  transformPolygonArc,
  getFormattedLength,
  getFormattedArea
} from './util.js';
import { toggleMeasureActive } from '../../modules/measure/actions';

export function measure (map, mapUiEvents, store) {
  let draw;
  let sketch;
  let helpTooltipElement;
  let helpTooltip;
  let measureTooltipElement;
  let measureTooltip;
  let drawChangeListener;
  let pointerMoveListener;
  let rightClickListener;
  let vector;
  let allMeasureTooltips = {};
  let allGeometries = {};
  let unitOfMeasure = 'km';
  let useGreatCircle = false;
  const self = {};
  const source = new VectorSource();
  const projection = map.getView().getProjection().getCode();
  const areaBgFill = new Fill({
    color: 'rgba(213, 78, 33, 0.1)'
  });
  const solidBlackLineStroke = new Stroke({
    color: 'rgba(0, 0, 0, 1)',
    lineJoin: 'round',
    width: 5
  });
  const vectorStyles = [
    new Style({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
      geometry: styleGeometryFn
    }),
    new Style({
      stroke: new Stroke({
        color: '#fff',
        lineJoin: 'round',
        width: 2
      }),
      geometry: styleGeometryFn
    })
  ];
  const drawStyles = [
    new Style({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
      geometry: styleGeometryFn
    }),
    new Style({
      stroke: new Stroke({
        color: '#fff',
        lineDash: [10, 20],
        lineJoin: 'round',
        width: 2
      }),
      image: new CircleStyle({
        radius: 7,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.3)'
        })
      }),
      geometry: styleGeometryFn
    })
  ];

  function pointerMoveHandler (evt) {
    if (evt.dragging) {
      return;
    }
    const helpMsg = !sketch
      ? 'Click to start drawing. <br/> Right-click to cancel.'
      : 'Click to continue drawing. <br/> Right-click to cancel. <br/> Double-click to complete.';
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
    helpTooltipElement.classList.remove('hidden');
  };

  function terminateDraw() {
    setTimeout(() => {
      mapUiEvents.trigger('enable-click-zoom');
    }, 250);
    sketch = null;
    measureTooltipElement = null;
    store.dispatch(toggleMeasureActive(false));

    map.removeOverlay(helpTooltip);
    map.removeInteraction(draw);
    unByKey(drawChangeListener);
    unByKey(pointerMoveListener);
    unByKey(rightClickListener);
  }

  function createHelpTooltip() {
    if (helpTooltipElement) {
      helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip-measure hidden';
    helpTooltip = new Overlay({
      element: helpTooltipElement,
      offset: [15, 15],
      positioning: 'center-left'
    });
    map.addOverlay(helpTooltip);
  }

  function createMeasureTooltip(geom) {
    if (!measureTooltipElement) {
      measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = 'tooltip-measure tooltip-active';
      measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
      });
    }

    if (geom) {
      allMeasureTooltips[geom.ol_uid] = measureTooltip;
    }
    map.addOverlay(measureTooltip);
  }

  function drawStartCallback (evt) {
    let tooltipCoord;
    mapUiEvents.trigger('disable-click-zoom');
    sketch = evt.feature;
    drawChangeListener = sketch.getGeometry().on('change', (evt) => {
      const geom = evt.target;
      if (geom instanceof Polygon) {
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof LineString) {
        tooltipCoord = geom.getLastCoordinate();
      }
      setMeasurementTooltip(geom, measureTooltipElement);
      measureTooltip.setPosition(tooltipCoord);
    });
  };

  function drawEndCallback (evt) {
    const featureGeom = evt.feature.getGeometry();
    allGeometries[featureGeom.ol_uid] = featureGeom;
    measureTooltipElement.className = 'tooltip-measure tooltip-static';
    measureTooltip.setOffset([0, -7]);
    createMeasureTooltip(featureGeom);
    terminateDraw();
  };

  /**
   * Call the appropriate transform function to add great circle arcs to
   * lines and polygon edges.  Otherwise pass through unaffected.
   * @param {*} feature
   */
  function styleGeometryFn (feature) {
    const geometry = feature.getGeometry();
    if (!useGreatCircle) {
      return geometry;
    }
    if (geometry instanceof LineString) {
      return transformLineStringArc(geometry, projection);
    }
    if (geometry instanceof Polygon) {
      return transformPolygonArc(geometry, projection);
    }
    return geometry;
  };

  /**
   * Set the innerHTML of the given tooltip element to the formatted length/area
   * measruement of the given geometry
   * @param {*} geometry
   * @param {*} element
   */
  function setMeasurementTooltip(geometry, element) {
    let measurement;
    if (geometry instanceof Polygon) {
      measurement = getFormattedArea(geometry, projection, unitOfMeasure, useGreatCircle);
    }
    if (geometry instanceof LineString) {
      measurement = getFormattedLength(geometry, projection, unitOfMeasure, useGreatCircle);
    }
    element.innerHTML = measurement;
  }

  /**
   * Go through every tooltip and recalculate the measurement based on
   * current settings of unit of measurement and great circle
   */
  function recalculateAllMeasurements () {
    for (const id in allMeasureTooltips) {
      const geomForTooltip = allGeometries[id];
      const tooltipElement = allMeasureTooltips[id].element.children[0];
      tooltipElement.innerHtml = setMeasurementTooltip(geomForTooltip, tooltipElement);
      geomForTooltip.changed();
      allMeasureTooltips[id].setOffset([0, -7]);
    }
  }

  /**
   * Initiate a measurement interaction of the given measureType ('distance' or 'area')
   * @param {String} measureType
   */
  self.initMeasurement = (measureType) => {
    const type = (measureType === 'area' ? 'Polygon' : 'LineString');
    if (draw) {
      map.removeInteraction(draw);
    }
    draw = new Draw({ source, type, style: drawStyles });
    if (!vector) {
      vector = new VectorLayer({ source, style: vectorStyles });
      vector.setMap(map);
    }
    map.addInteraction(draw);
    createMeasureTooltip();
    createHelpTooltip();
    store.dispatch(toggleMeasureActive(true));

    draw.on('drawstart', drawStartCallback, this);
    draw.on('drawend', drawEndCallback, this);
    pointerMoveListener = map.on('pointermove', pointerMoveHandler);
    rightClickListener = map.on('contextmenu', (evt) => {
      evt.preventDefault();
      terminateDraw();
      map.removeOverlay(measureTooltip);
    });
  };

  /**
   * Convert unit of measurement on all existing measurments and those created after
   * @param {String} unit - Unit of measurement: 'km' or 'mi'
   */
  self.changeUnits = (unit) => {
    unitOfMeasure = unit;
    recalculateAllMeasurements();
  };

  /**
   *
   */
  self.useGreatCircleMeasurements = (value) => {
    useGreatCircle = value;
    recalculateAllMeasurements();
  };

  /**
   * Clear all existing measurements on the associated map
   */
  self.clearMeasurements = () => {
    for (const id in allMeasureTooltips) {
      map.removeOverlay(allMeasureTooltips[id]);
    }
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
