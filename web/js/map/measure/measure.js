import { unByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import { getArea, getLength } from 'ol/sphere';
import { MultiLineString, LineString, Polygon } from 'ol/geom';
import Draw from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import arc from 'arc';

const kilometer = 1000;
const mile = 5280;
const metersToFeet = (meters) => meters * 3.28084;
const squareMetersToFeet = (squareMeters) => squareMeters * 10.76391;

export function measure (map, mapUiEvents) {
  let draw;
  let sketch;
  let helpTooltipElement;
  let helpTooltip;
  let measureTooltipElement;
  let measureTooltip;
  let drawChangeListener;
  let vector;
  let allMeasureTooltips = {};
  let allGeometries = {};
  let unitOfMeasure = 'km';
  const self = {};
  const source = new VectorSource();
  const projection = map.getView().getProjection().getCode();
  const referenceProjection = 'EPSG:4326';
  const areaBgFill = new Fill({
    color: 'rgba(213, 78, 33, 0.1)'
  });
  const solidBlackLineStroke = new Stroke({
    color: 'rgba(0, 0, 0, 1)',
    lineJoin: 'round',
    width: 5
  });
  // const solidOrange = 'rgba(255, 100, 6, 1)';
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
      ? 'Click to start drawing.'
      : 'Click to continue drawing. <br/> Double-click to complete.';
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
    helpTooltipElement.classList.remove('hidden');
  };

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
      setMeasurement(geom, measureTooltipElement);
      measureTooltip.setPosition(tooltipCoord);
    });
  };

  function drawEndCallback (evt) {
    setTimeout(() => {
      mapUiEvents.trigger('enable-click-zoom');
    });
    const featureGeom = evt.feature.getGeometry();
    allGeometries[featureGeom.ol_uid] = featureGeom;
    measureTooltipElement.className = 'tooltip-measure tooltip-static';
    measureTooltip.setOffset([0, -7]);
    createMeasureTooltip(featureGeom);
    sketch = null;
    measureTooltipElement = null;
    map.removeOverlay(helpTooltip);
    map.removeInteraction(draw);
    unByKey(drawChangeListener);
  };

  /**
   * Call the appropriate transform function to add great circle arcs to
   * lines and polygon edges.  Otherwise pass through unaffected.
   * @param {*} feature
   */
  function styleGeometryFn (feature) {
    const geometry = feature.getGeometry();
    if (geometry instanceof LineString) {
      return transformLineStringArc(geometry);
    }
    if (geometry instanceof Polygon) {
      return transformPolygonArc(geometry);
    }
    return geometry;
  };

  /**
   * Transforms a LineString of two points to a MultiLineString of multiple points
   * applying a great circle arc transformation
   * @param {*} geom - the geometry object to apply great circle arc transformation to
   */
  function transformLineStringArc (geom) {
    const coords = [];
    const transformedGeom = geom.clone().transform(projection, referenceProjection);
    transformedGeom.forEachSegment((segStart, segEnd) => {
      const start = {
        x: segStart[0],
        y: segStart[1]
      };
      const end = {
        x: segEnd[0],
        y: segEnd[1]
      };
      const arcGen = new arc.GreatCircle(start, end);
      const arcline = arcGen.Arc(25, { offset: 10 });
      arcline.geometries.forEach((arcGeom) => {
        coords.push(arcGeom.coords);
      });
    });
    return new MultiLineString(coords).transform(referenceProjection, projection);
  };

  /**
   * Transforms a Polygon to one with addiitonal points on each edge to account for
   * great circle arc
   * @param {*} geom - the geometry object to apply great circle arc transformation to
   */
  function transformPolygonArc (geom) {
    let coords = [];
    const transformedGeom = geom.clone().transform(projection, referenceProjection);
    const polyCoords = transformedGeom.getCoordinates()[0];
    for (let i = 0; i < polyCoords.length - 1; i++) {
      const start = {
        x: polyCoords[i][0],
        y: polyCoords[i][1]
      };
      const end = {
        x: polyCoords[i + 1][0],
        y: polyCoords[i + 1][1]
      };
      const arcGen = new arc.GreatCircle(start, end);
      const arcline = arcGen.Arc(25, { offset: 10 });
      arcline.geometries.forEach((arcGeom) => {
        coords = coords.concat(arcGeom.coords);
      });
    }
    return new Polygon([coords]).transform(referenceProjection, projection);
  };

  /**
   * Set the innerHTML of the given tooltip element to the formatted length/area
   * measruement of the given geometry
   * @param {*} geometry
   * @param {*} element
   */
  function setMeasurement(geometry, element) {
    let measurement;
    if (geometry instanceof Polygon) {
      measurement = formatArea(geometry);
    }
    if (geometry instanceof LineString) {
      measurement = formatLength(geometry);
    }
    element.innerHTML = measurement;
  }

  /**
   * Convert and format raw measurements to two decimal points
   * @param {*} measurement
   * @param {*} factor
   * @return {String} - The measurement, converted based on factor and locale
   */
  const roundAndLocale = (measurement, factor) => {
    factor = factor || 1;
    return (Math.round(measurement / factor * 100) / 100).toLocaleString();
  };

  /**
   *
   * @param {*} line
   * @return {String} - The formatted distance measurement
   */
  const formatLength = (line) => {
    const metricLength = getLength(line, { projection });
    if (unitOfMeasure === 'km') {
      return metricLength > 100
        ? `${roundAndLocale(metricLength, kilometer)} km`
        : `${roundAndLocale(metricLength)} m`;
    }
    if (unitOfMeasure === 'mi') {
      const imperialLength = metersToFeet(metricLength);
      return imperialLength > (mile / 4)
        ? `${roundAndLocale(imperialLength, mile)} mi`
        : `${roundAndLocale(imperialLength)} ft`;
    }
  };

  /**
   *
   * @param {*} polygon
   * @return {String} - The formatted area measurement
   */
  const formatArea = (polygon) => {
    const metricArea = getArea(polygon, { projection });
    if (unitOfMeasure === 'km') {
      return metricArea > 10000
        ? `${roundAndLocale(metricArea, 1000000)} km<sup>2</sup>`
        : `${roundAndLocale(metricArea)} m<sup>2</sup>`;
    }
    if (unitOfMeasure === 'mi') {
      const imperialArea = squareMetersToFeet(metricArea);
      return imperialArea > (27878400 / 8)
        ? `${roundAndLocale(imperialArea, 27878400)} mi<sup>2</sup>`
        : `${roundAndLocale(imperialArea)} ft<sup>2</sup>`;
    }
  };

  /**
   * Initiate a measurement interaction of the given measureType ('distance' or 'area')
   * @param {String} measureType
   */
  self.initMeasurement = (measureType) => {
    const type = (measureType === 'area' ? 'Polygon' : 'LineString');
    map.on('pointermove', pointerMoveHandler);
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
    draw.on('drawstart', drawStartCallback, this);
    draw.on('drawend', drawEndCallback, this);
  };

  /**
   * Convert unit of measurement on all existing measurments and those created after
   * @param {String} unit - Unit of measurement: 'km' or 'mi'
   */
  self.toggleUnits = (unit) => {
    unitOfMeasure = unit;
    for (const id in allMeasureTooltips) {
      const geomForTooltip = allGeometries[id];
      const tooltipElement = allMeasureTooltips[id].element.children[0];
      tooltipElement.innerHtml = setMeasurement(geomForTooltip, tooltipElement);
    }
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
    map.removeInteraction(draw);
    if (vector) {
      vector.getSource().clear();
      vector.setMap(null);
      vector = null;
    }
  };

  return self;
}
