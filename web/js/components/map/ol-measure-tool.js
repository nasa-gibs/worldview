
import React from 'react';
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
  // changeUnits as changeUnitsAction,
} from '../../modules/measure/actions';
import {
  transformLineStringArc,
  transformPolygonArc,
  getFormattedLength,
  getFormattedArea,
} from '../../map/measure/util';

let draw;
let sketch;
let measureTooltipElement;
let measureTooltip;
let drawChangeListener;
let rightClickListener;
let twoFingerTouchListener;
let vector;
const source = new OlVectorSource({ wrapX: false });
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
const styleGeometryFn = (projection) => (feature) => {
  const geometry = feature.getGeometry();
  if (geometry instanceof OlLineString) {
    return transformLineStringArc(geometry, projection);
  }
  if (geometry instanceof OlGeomPolygon) {
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
const setMeasurementTooltip = (geometry, element, projection, unitOfMeasure) => {
  let measurement;
  if (geometry instanceof OlGeomPolygon) {
    measurement = getFormattedArea(geometry, projection, unitOfMeasure);
  }
  if (geometry instanceof OlLineString) {
    measurement = getFormattedLength(geometry, projection, unitOfMeasure);
  }
  element.innerHTML = measurement;
};

const drawStartCallback = (projection, unitOfMeasure) => (evt) => {
  let tooltipCoord;
  // TODO re-enable
  // mapUiEvents.trigger('disable-click-zoom');
  sketch = evt.feature;
  drawChangeListener = sketch.getGeometry().on('change', (e) => {
    const geom = e.target;
    if (geom instanceof OlGeomPolygon) {
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof OlLineString) {
      tooltipCoord = geom.getLastCoordinate();
    }
    setMeasurementTooltip(geom, measureTooltipElement, projection, unitOfMeasure);
    measureTooltip.setPosition(tooltipCoord);
  });
};

/**
 * A component to add measurement functionality to the OL map
 */
class OlMeasureTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allMeasureTooltips: {},
      allGeometries: {},
    };
  }

  componentDidUpdate (prevProps, prevState) {
    const { unitOfMeasure, map } = this.props;
    if (prevProps.unitOfMeasure !== unitOfMeasure) {
      this.recalculateAllMeasurements();
    }
    if (prevProps.map.rendered !== map.rendered && map.rendered) {
      this.registerEventListeners();
    }
  }

  registerEventListeners() {
    const { map } = this.props;
    map.ui.events.on('measure-distance', () => this.initMeasurement('distance'));
    map.ui.events.on('measure-area', () => this.initMeasurement('area'));
    map.ui.events.on('measure-clear', this.clearMeasurements);
  }

  terminateDraw() {
    const { olMap, toggleMeasureActive } = this.props;
    sketch = null;
    measureTooltipElement = null;
    toggleMeasureActive(false);
    olMap.removeInteraction(draw);
    OlObservableUnByKey(drawChangeListener);
    OlObservableUnByKey(rightClickListener);
    OlObservableUnByKey(twoFingerTouchListener);

    // TODO re-enable
    // mapUiEvents.trigger('enable-click-zoom');
  }

  createMeasureTooltip(geom) {
    const { olMap } = this.props;

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
      this.setState((prevState) => ({
        allMeasureTooltips: {
          ...prevState.allMeasureTooltips,
          [geom.ol_uid]: measureTooltip,
        },
      }));
    }
    olMap.addOverlay(measureTooltip);
  }

  // eslint-disable-next-line class-methods-use-this

  // TODO wrangle use of "this" keyword
  drawEndCallback(evt) {
    const featureGeom = evt.feature.getGeometry();
    this.setState((prevState) => ({
      allGeometries: {
        ...prevState.allGeometries,
        [featureGeom.ol_uid]: featureGeom,
      },
    }));
    measureTooltipElement.className = 'tooltip-measure tooltip-static';
    measureTooltip.setOffset([0, -7]);
    this.createMeasureTooltip(featureGeom);
    this.terminateDraw();
  }

  getDrawStyles() {
    const { projection } = this.props;
    return [
      new OlStyle({
        fill: areaBgFill,
        stroke: solidBlackLineStroke,
        geometry: styleGeometryFn(projection),
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
        geometry: styleGeometryFn(projection),
      }),
    ];
  }

  getVectorStyles() {
    const { projection } = this.props;
    return [
      new OlStyle({
        fill: areaBgFill,
        stroke: solidBlackLineStroke,
        geometry: styleGeometryFn(projection),
      }),
      new OlStyle({
        stroke: new OlStyleStroke({
          color: '#fff',
          lineJoin: 'round',
          width: 2,
        }),
        geometry: styleGeometryFn(projection),
      }),
    ];
  }

  /**
   * Initiate a measurement interaction of the given measureType ('distance' or 'area')
   * @param {String} measureType
   */
  initMeasurement (measureType) {
    const {
      olMap, projection, unitOfMeasure, toggleMeasureActive,
    } = this.props;
    const type = measureType === 'area' ? 'Polygon' : 'LineString';
    if (draw) {
      olMap.removeInteraction(draw);
    }
    draw = new OlInteractionDraw({
      source,
      type,
      style: this.getDrawStyles(),
    });
    if (!vector) {
      vector = new OlVectorLayer({
        source,
        style: this.getVectorStyles(),
      });
      vector.setMap(olMap);
    }
    olMap.addInteraction(draw);
    this.createMeasureTooltip();

    toggleMeasureActive(true);

    draw.on('drawstart', drawStartCallback(projection, unitOfMeasure), this);
    draw.on('drawend', this.drawEndCallback);

    rightClickListener = olMap.on('contextmenu', function (evt) {
      evt.preventDefault();
      this.terminateDraw();
      olMap.removeOverlay(measureTooltip);
    });

    // TODO get this working
    // twoFingerTouchListener = olMap.on('touchstart', (evt) => {
    //   if (evt.touches > 1) {
    //     evt.preventDefault();
    //     terminateDraw();
    //     olMap.removeOverlay(measureTooltip);
    //   }
    // });
  }

  /**
   * Go through every tooltip and recalculate the measurement based on
   * current settings of unit of measurement
   */
  recalculateAllMeasurements() {
    const { allMeasureTooltips, allGeometries } = this.state;
    const { projection, unitOfMeasure } = this.props;

    Object.keys(allMeasureTooltips).forEach((id) => {
      const geomForTooltip = allGeometries[id];
      const tooltipElement = allMeasureTooltips[id].element.children[0];
      tooltipElement.innerHtml = setMeasurementTooltip(
        geomForTooltip,
        tooltipElement,
        projection,
        unitOfMeasure,
      );
      geomForTooltip.changed();
      allMeasureTooltips[id].setOffset([0, -7]);
    });
  }

  /**
   * Clear all existing measurements on the map
   */
  clearMeasurements () {
    const { allMeasureTooltips } = this.state;
    const { olMap } = this.props;

    Object.keys(allMeasureTooltips).forEach((id) => {
      olMap.removeOverlay(allMeasureTooltips[id]);
    });
    this.setState({
      allGeometries: {},
      allMeasureTooltips: {},
    });
    this.terminateDraw();
    olMap.removeOverlay(measureTooltip);
    if (vector) {
      vector.getSource().clear();
      vector.setMap(null);
      vector = null;
    }
  }

  render() {
    return null;
  }
}

OlMeasureTool.propTypes = {
  map: PropTypes.object,
  olMap: PropTypes.object,
  projection: PropTypes.string,
  toggleMeasureActive: PropTypes.func,
  unitOfMeasure: PropTypes.string,
};

const mapDispatchToProps = (dispatch) => ({
  toggleMeasureActive: (isActive) => {
    dispatch(toggleMeasureActiveAction(isActive));
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
    projection: proj.selected.crs,
    unitOfMeasure,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OlMeasureTool);
