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

export function measure (map) {
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

    console.log(allGeometries);
    console.log(allMeasureTooltips);
  };

  function getVectorLayer () {
    return new VectorLayer({
      source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(213, 78, 33, 0.1)'
        }),
        stroke: new Stroke({
          color: 'rgba(255, 100, 6, 1)',
          lineJoin: 'round',
          width: 3
        }),
        geometry: styleGeometryFn
      })
    });
  }

  function getDraw (type) {
    return new Draw({
      source,
      type,
      style: new Style({
        fill: new Fill({
          color: 'rgba(213, 78, 33, 0.1)'
        }),
        stroke: new Stroke({
          color: 'rgba(255, 100, 6, 1)',
          lineDash: [10, 20],
          lineJoin: 'round',
          width: 4
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
    });
  };

  const styleGeometryFn = (feature) => {
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
   *
   * @param {*} feature
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
    * Add the map interactionn
    * @param {String} measureType
    */
  function addInteraction(measureType) {
    const type = (measureType === 'area' ? 'Polygon' : 'LineString');
    if (draw) {
      map.removeInteraction(draw);
    }
    draw = getDraw(type);
    if (!vector) {
      vector = getVectorLayer();
      vector.setMap(map);
    }
    map.addInteraction(draw);
    createMeasureTooltip();
    createHelpTooltip();
    draw.on('drawstart', drawStartCallback, this);
    draw.on('drawend', drawEndCallback, this);
  }

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

  const roundAndLocale = (measurement, factor) => {
    factor = factor || 1;
    return (Math.round(measurement / factor * 100) / 100).toLocaleString();
  };

  /**
   *
   * @param {*} polygon
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

  self.initMeasurement = (measureType) => {
    map.on('pointermove', pointerMoveHandler);
    addInteraction(measureType);
  };

  self.toggleUnits = (unit) => {
    unitOfMeasure = unit;
    for (const id in allMeasureTooltips) {
      const geomForTooltip = allGeometries[id];
      const tooltipElement = allMeasureTooltips[id].element.children[0];
      tooltipElement.innerHtml = setMeasurement(geomForTooltip, tooltipElement);
    }
  };

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
