
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
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
  toggleMeasureActive as toggleMeasureActiveAction,
  addMeasurement as addMeasurementAction,
  removeMeasurement as removeMeasurementAction,
  removeAllMeasurements as removeAllMeasurementsAction,
} from '../../modules/measure/actions';
import {
  transformLineStringArc,
  transformPolygonArc,
  getFormattedLength,
  getFormattedArea,
} from '../../map/measure/util';


// TODO may need to keep instaces per projection for these
const allTooltipOverlays = {
  'EPSG:3413': {},
  'EPSG:4326': {},
  'EPSG:3031': {},
};
const allGeometries = {
  'EPSG:3413': {},
  'EPSG:4326': {},
  'EPSG:3031': {},
};
const allSources = {
  'EPSG:3413': new OlVectorSource({ wrapX: false }),
  'EPSG:4326': new OlVectorSource({ wrapX: false }),
  'EPSG:3031': new OlVectorSource({ wrapX: false }),
};

let tooltipElement;
let tooltipOverlay;


/**
 * A component to add measurement functionality to the OL map
 */
function OlMeasureTool (props) {
  let draw;
  let sketch;

  let drawChangeListener;
  let rightClickListener;
  let twoFingerTouchListener;
  let vector;


  console.log(allTooltipOverlays);

  const {
    map, olMap, crs, unitOfMeasure, toggleMeasureActive,
  } = props;

  useEffect(() => {
    if (map && map.rendered) {
      map.ui.events.on('measure-distance', initDistanceMeasurement);
      map.ui.events.on('measure-area', initAreaMeasurement);
      map.ui.events.on('measure-clear', clearMeasurements);
    }
    return () => {
      if (map && map.rendered) {
        map.ui.events.off('measure-distance', initDistanceMeasurement);
        map.ui.events.off('measure-area', initAreaMeasurement);
        map.ui.events.off('measure-clear', clearMeasurements);
      }
    };
  }, [map]);

  useEffect(recalculateAllMeasurements, [unitOfMeasure]);

  const areaBgFill = new OlStyleFill({
    color: 'rgba(213, 78, 33, 0.1)',
  });
  const solidBlackLineStroke = new OlStyleStroke({
    color: 'rgba(0, 0, 0, 1)',
    lineJoin: 'round',
    width: 5,
  });

  /**
   * Call the appropriate transform function to add great circle arcs to
   * lines and polygon edges.  Otherwise pass through unaffected.
   * @param {*} feature
   */
  const styleGeometryFn = (feature) => {
    const geometry = feature.getGeometry();
    if (geometry instanceof OlLineString) {
      return transformLineStringArc(geometry, crs);
    }
    if (geometry instanceof OlGeomPolygon) {
      return transformPolygonArc(geometry, crs);
    }
    return geometry;
  };

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

  const terminateDraw = () => {
    sketch = null;
    tooltipElement = null;
    toggleMeasureActive(false);
    olMap.removeInteraction(draw);
    OlObservableUnByKey(drawChangeListener);
    OlObservableUnByKey(rightClickListener);
    OlObservableUnByKey(twoFingerTouchListener);
    map.ui.events.trigger('enable-click-zoom');
  };

  /**
   * Set the innerHTML of the given tooltip element to the formatted length/area
   * measruement of the given geometry
   * @param {*} geometry
   * @param {*} element
   */
  const setMeasurementTooltip = (geometry, element, proj) => {
    let measurement;
    if (geometry instanceof OlGeomPolygon) {
      measurement = getFormattedArea(geometry, proj, unitOfMeasure);
    }
    if (geometry instanceof OlLineString) {
      measurement = getFormattedLength(geometry, proj, unitOfMeasure);
    }
    element.innerHTML = measurement;
  };

  const drawStartCallback = (evt) => {
    let tooltipCoord;
    map.ui.events.trigger('disable-click-zoom');
    sketch = evt.feature;
    drawChangeListener = sketch.getGeometry().on('change', (e) => {
      const geom = e.target;
      if (geom instanceof OlGeomPolygon) {
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof OlLineString) {
        tooltipCoord = geom.getLastCoordinate();
      }
      setMeasurementTooltip(geom, tooltipElement, crs);
      tooltipOverlay.setPosition(tooltipCoord);
    });
  };

  const drawEndCallback = (evt) => {
    const featureGeom = evt.feature.getGeometry();
    tooltipElement.className = 'tooltip-measure tooltip-static';
    // TODO maybe here is where we insert the "close" element and functionality
    tooltipOverlay.setOffset([0, -7]);

    allGeometries[crs][featureGeom.ol_uid] = featureGeom;
    allTooltipOverlays[crs][featureGeom.ol_uid] = tooltipOverlay;
    terminateDraw();
  };

  /**
   * Initiate a measurement interaction of the given measureType ('distance' or 'area')
   * @param {String} measureType
   */
  function initMeasurement (measureType) {
    const type = measureType === 'area' ? 'Polygon' : 'LineString';
    const source = allSources[crs];

    if (draw) {
      olMap.removeInteraction(draw);
    }
    draw = new OlInteractionDraw({
      source,
      type,
      style: drawStyles,
    });
    olMap.addInteraction(draw);

    if (!vector) {
      vector = new OlVectorLayer({
        source,
        style: vectorStyles,
      });
      vector.setMap(olMap);
    }

    toggleMeasureActive(true);

    tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip-measure tooltip-active';
    tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
    });
    olMap.addOverlay(tooltipOverlay);

    draw.on('drawstart', drawStartCallback);
    draw.on('drawend', drawEndCallback);

    rightClickListener = olMap.on('contextmenu', (evt) => {
      evt.preventDefault();
      terminateDraw();
      olMap.removeOverlay(tooltipOverlay);
    });

    // TODO get this working
    // twoFingerTouchListener = olMap.on('touchstart', (evt) => {
    //   if (evt.touches > 1) {
    //     evt.preventDefault();
    //     terminateDraw();
    //     olMap.removeOverlay(tooltipOverlay);
    //   }
    // });
  }
  const initDistanceMeasurement = () => initMeasurement('distance');
  const initAreaMeasurement = () => initMeasurement('area');

  /**
   * Go through every tooltip and recalculate the measurement based on
   * current settings of unit of measurement
   */
  function recalculateAllMeasurements() {
    Object.keys(allTooltipOverlays).forEach((proj) => {
      Object.keys(allTooltipOverlays[proj]).forEach((id) => {
        const geomForTooltip = allGeometries[proj][id];
        const overlayElement = allTooltipOverlays[proj][id].element.children[0];
        overlayElement.innerHtml = setMeasurementTooltip(geomForTooltip, overlayElement, proj);
        geomForTooltip.changed();
        allTooltipOverlays[proj][id].setOffset([0, -7]);
      });
    });
  }

  /**
   * Clear all existing measurements on the current map projection
   */
  function clearMeasurements () {
    Object.values(allTooltipOverlays[crs]).forEach((overlay) => {
      olMap.removeOverlay(overlay);
    });
    allSources[crs].getFeatures().forEach((feature) => {
      allSources[crs].removeFeature(feature);
    });

    allTooltipOverlays[crs] = {};
    allGeometries[crs] = {};
    allSources[crs] = new OlVectorSource({ wrapX: false });
    terminateDraw();

    olMap.removeOverlay(tooltipOverlay);
    if (vector) {
      vector.getSource().clear();
      vector.setMap(null);
      vector = null;
    }
  }

  return null;
}

OlMeasureTool.propTypes = {
  map: PropTypes.object,
  olMap: PropTypes.object,
  crs: PropTypes.string,
  toggleMeasureActive: PropTypes.func,
  unitOfMeasure: PropTypes.string,
};

const mapDispatchToProps = (dispatch) => ({
  toggleMeasureActive: (isActive) => {
    dispatch(toggleMeasureActiveAction(isActive));
  },
  addMeasurement: (value) => {
    dispatch(addMeasurementAction(value));
  },
  removeMeasurement: (value) => {
    dispatch(removeMeasurementAction(value));
  },
  removeAllMeasurement: () => {
    dispatch(removeAllMeasurementsAction());
  },
});

function mapStateToProps(state) {
  const {
    map,
    proj,
    measure,
  } = state;

  const { unitOfMeasure } = measure;

  return {
    map,
    olMap: map.ui.selected,
    crs: proj.selected.crs,
    unitOfMeasure,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OlMeasureTool);
