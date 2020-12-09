
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  updateMeasurements as updateMeasurementsAction,
} from '../../modules/measure/actions';
import {
  transformLineStringArc,
  transformPolygonArc,
  downloadGeoJSON,
} from '../measure-tool/util';
import MeasureTooltip from '../measure-tool/measure-tooltip';
import util from '../../util/util';

const { events } = util;

let tooltipElement;
let tooltipOverlay;
let init = false;
const allMeasurements = {};
const vectorLayers = {};
const sources = {};

/**
 * A component to add measurement functionality to the OL map
 */
function OlMeasureTool (props) {
  let draw;
  let drawChangeListener;
  let rightClickListener;
  let twoFingerTouchListener;

  const {
    map, olMap, crs, unitOfMeasure, toggleMeasureActive, updateMeasurements, projections,
  } = props;

  useEffect(() => {
    if (!init) {
      projections.forEach((key) => {
        allMeasurements[key] = {};
        vectorLayers[key] = null;
        sources[key] = new OlVectorSource({ wrapX: false });
      });
      init = true;
    }
  }, [projections]);

  useEffect(() => {
    // const dlShapeFiles = () => downloadShapefiles(allMeasurements[crs], crs);
    const dlGeoJSON = () => downloadGeoJSON(allMeasurements[crs], crs);

    if (map && map.rendered) {
      events.on('measure:distance', initDistanceMeasurement);
      events.on('measure:area', initAreaMeasurement);
      events.on('measure:clear', clearMeasurements);
      events.on('measure:download-geojson', dlGeoJSON);
    }
    return () => {
      if (map && map.rendered) {
        events.off('measure:distance', initDistanceMeasurement);
        events.off('measure:area', initAreaMeasurement);
        events.off('measure:clear', clearMeasurements);
        events.off('measure:download-geojson', dlGeoJSON);
      }
    };
  }, [map, unitOfMeasure]);

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

  const renderTooltip = (feature, overlay) => {
    const removeFeature = () => {
      sources[crs].removeFeature(feature);
      olMap.removeOverlay(overlay);
      delete allMeasurements[crs][feature.ol_uid];
      updateMeasurements(allMeasurements);
    };

    ReactDOM.render((
      <MeasureTooltip
        active={!!tooltipElement}
        geometry={feature.getGeometry()}
        crs={crs}
        unitOfMeasure={unitOfMeasure}
        onRemove={removeFeature}
      />
    ), overlay.getElement());
  };

  const terminateDraw = (geom) => {
    tooltipElement = null;
    toggleMeasureActive(false);
    olMap.removeInteraction(draw);
    OlObservableUnByKey(drawChangeListener);
    OlObservableUnByKey(rightClickListener);
    OlObservableUnByKey(twoFingerTouchListener);
    events.trigger('map:enable-click-zoom');
  };

  const drawStartCallback = ({ feature }) => {
    let tooltipCoord;
    events.trigger('map:disable-click-zoom');
    drawChangeListener = feature.getGeometry().on('change', (e) => {
      const geom = e.target;
      if (geom instanceof OlGeomPolygon) {
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof OlLineString) {
        tooltipCoord = geom.getLastCoordinate();
      }
      renderTooltip(feature, tooltipOverlay);
      tooltipOverlay.setPosition(tooltipCoord);
    });
  };

  const drawEndCallback = ({ feature }) => {
    tooltipOverlay.setOffset([0, -7]);
    allMeasurements[crs][feature.ol_uid] = {
      feature,
      overlay: tooltipOverlay,
    };
    updateMeasurements(allMeasurements);
    terminateDraw();
    renderTooltip(feature, tooltipOverlay);
  };

  /**
   * Initiate a measurement interaction of the given measureType ('distance' or 'area')
   * @param {String} measureType
   */
  function initMeasurement (measureType) {
    const type = measureType === 'area' ? 'Polygon' : 'LineString';
    const source = sources[crs];
    if (draw) {
      olMap.removeInteraction(draw);
    }
    draw = new OlInteractionDraw({
      source,
      type,
      style: drawStyles,
    });
    olMap.addInteraction(draw);
    if (!vectorLayers[crs]) {
      vectorLayers[crs] = new OlVectorLayer({
        source,
        style: vectorStyles,
        map: olMap,
      });
    }
    toggleMeasureActive(true);

    tooltipElement = document.createElement('div');
    tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
    });
    olMap.addOverlay(tooltipOverlay);

    draw.on('drawstart', drawStartCallback);
    draw.on('drawend', drawEndCallback);
    rightClickListener = olMap.on('contextmenu', (evt) => {
      evt.preventDefault();
      terminateDraw();
      olMap.removeOverlay(tooltipOverlay);
    });
  }
  const initDistanceMeasurement = () => initMeasurement('distance');
  const initAreaMeasurement = () => initMeasurement('area');

  /**
   * Go through every tooltip and recalculate the measurement based on
   * current settings of unit of measurement
   */
  function recalculateAllMeasurements() {
    Object.values(allMeasurements).forEach((measurementsForProj) => {
      Object.values(measurementsForProj).forEach(
        ({ feature, overlay }) => {
          renderTooltip(feature, overlay);
          feature.getGeometry().changed();
          overlay.setOffset([0, -7]);
        },
      );
    });
  }

  /**
   * Clear all existing measurements on the current map projection
   */
  function clearMeasurements () {
    Object.values(allMeasurements[crs]).forEach(
      ({ feature, overlay }) => {
        olMap.removeOverlay(overlay);
        sources[crs].removeFeature(feature);
      },
    );

    allMeasurements[crs] = {};
    updateMeasurements(allMeasurements);
    terminateDraw();
    olMap.removeOverlay(tooltipOverlay);
    if (vectorLayers[crs]) {
      vectorLayers[crs].setMap(null);
      vectorLayers[crs] = null;
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
  updateMeasurements: (measurements) => {
    dispatch(updateMeasurementsAction(measurements));
  },
});

const mapStateToProps = (state) => {
  const {
    map,
    proj,
    measure,
    config,
  } = state;
  const { unitOfMeasure } = measure;
  const { crs } = proj.selected;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  return {
    map,
    olMap: map.ui.selected,
    crs,
    unitOfMeasure,
    projections,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OlMeasureTool);
