
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
} from '../../modules/measure/actions';
import {
  transformLineStringArc,
  transformPolygonArc,
} from '../measure-tool/util';
import MeasureTooltip from '../measure-tool/measure-tooltip';

let tooltipElement;
let tooltipOverlay;
const allMeasurements = {
  'EPSG:3413': {},
  'EPSG:4326': {},
  'EPSG:3031': {},
};
const vectorLayers = {
  'EPSG:3413': null,
  'EPSG:4326': null,
  'EPSG:3031': null,
};
const sources = {
  'EPSG:3413': new OlVectorSource({ wrapX: false }),
  'EPSG:4326': new OlVectorSource({ wrapX: false }),
  'EPSG:3031': new OlVectorSource({ wrapX: false }),
};

/**
 * A component to add measurement functionality to the OL map
 */
function OlMeasureTool (props) {
  let draw;
  let drawChangeListener;
  let rightClickListener;
  let twoFingerTouchListener;

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
    map.ui.events.trigger('enable-click-zoom');
  };

  const drawStartCallback = ({ feature }) => {
    let tooltipCoord;
    map.ui.events.trigger('disable-click-zoom');
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
});

const mapStateToProps = (state) => {
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
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OlMeasureTool);
