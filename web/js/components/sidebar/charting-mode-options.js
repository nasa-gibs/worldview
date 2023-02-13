import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCalendarDay, faInfo } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { Draw as OlInteractionDraw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw.js';
import { Vector as OlVectorLayer } from 'ol/layer';
import { transform } from 'ol/proj';
import { Vector as OlVectorSource } from 'ol/source';
import {
  Circle as OlStyleCircle,
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
} from 'ol/style';
import { toggleChartingAOIOnOff } from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';

const allMeasurements = {};
const vectorLayers = {};
const sources = {};
let init = false;
let draw;

function ChartingModeOptions (props) {
  const {
    toggleAreaOfInterest,
    olMap,
    crs,
    proj,
    projections,
    isChartingActive,
    isMobile,
    aoiSelected,
    aoiActive,
    aoiCoordinates,
    timeSpanSingleDate,
    timeSpanStartdate,
    timeSpanEndDate,
  } = props;

  // Listen for changes in projections
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

  // areaBgFill, solidBlackLineStroke, drawStyles & vectorStyles should be constants
  // & shared with the measurement tool
  const areaBgFill = new OlStyleFill({
    color: 'rgba(213, 78, 33, 0.1)',
  });
  const solidBlackLineStroke = new OlStyleStroke({
    color: 'rgba(0, 0, 0, 1)',
    lineJoin: 'round',
    width: 5,
  });

  const drawStyles = [
    new OlStyle({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
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
    }),
  ];

  const vectorStyles = [
    new OlStyle({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
    }),
    new OlStyle({
      stroke: new OlStyleStroke({
        color: '#fff',
        lineJoin: 'round',
        width: 2,
      }),
    }),
  ];

  const onAreaOfInterestButtonClick = (evt) => {
    // If aoiActive is active & button clicked, the user has elected to end the process
    if (aoiActive) {
      endDrawingAOI();
    }
    beginDrawingAOI();
  };

  // initialize a new Area of interest draw interaction.
  function beginDrawingAOI () {
    toggleAreaOfInterest();

    // Define draw interaction
    draw = new OlInteractionDraw({
      source: sources[crs], // Destination source for the drawn features (i.e. VectorSource)
      type: 'Circle', // Geometry type of the geometries being drawn with this instance.
      style: drawStyles, // Style for sketch features.
      // This is from measurement tool; validate area selected
      condition(e) {
        const pixel = [e.originalEvent.x, e.originalEvent.y];
        const coord = olMap.getCoordinateFromPixel(pixel);
        const tCoord = transform(coord, crs, CRS.GEOGRAPHIC);
        return areCoordinatesWithinExtent(proj, tCoord);
      },
      geometryFunction: createBox(), // Function that is called when a geometry's coordinates are updated.

    });
    olMap.addInteraction(draw);
    draw.on('drawstart', drawStartCallback);
    draw.on('drawend', drawEndCallback);

    if (!vectorLayers[crs]) {
      vectorLayers[crs] = new OlVectorLayer({
        source: sources[crs],
        style: vectorStyles,
        map: olMap,
      });
    }
  }

  const drawStartCallback = ({ feature }) => {
    console.log('drawStartCallback');
    console.log(`feature.ol_uid: ${feature.ol_uid}`);

    // This clears all AOIs, including the current one :-(
    // clearMeasurements(feature);

    // let tooltipCoord;
    // events.trigger(MAP_DISABLE_CLICK_ZOOM);
    // drawChangeListener = feature.getGeometry().on('change', (e) => {
    //   const geom = e.target;
    //   if (geom instanceof OlGeomPolygon) {
    //     tooltipCoord = geom.getInteriorPoint().getCoordinates();
    //   } else if (geom instanceof OlLineString) {
    //     tooltipCoord = geom.getLastCoordinate();
    //   }
    //   renderTooltip(feature, tooltipOverlay);
    //   tooltipOverlay.setPosition(tooltipCoord);
    // });
  };

  const drawEndCallback = ({ feature }) => {
    console.log('drawEndCallback');
    allMeasurements[crs][feature.ol_uid] = {
      feature,
    };
    console.log(allMeasurements[crs]);
    // updateMeasurements(allMeasurements);
    // terminateDraw();
  };

  function endDrawingAOI () {
    console.log('endDrawingAOI');
  }

  /**
   * Clear all existing measurements on the current map projection
   */
  function clearMeasurements (activeFeature) {
    console.log('clearing measurements');
    console.log('allMeasurements[crs]');
    console.log(allMeasurements[crs]);
    Object.values(allMeasurements[crs]).forEach(
      ({ feature, overlay }) => {
        console.log('in forEach');
        console.log(`activeFeature.ol_uid: ${activeFeature.ol_uid}`);
        console.log(`feature.ol_uid: ${feature.ol_uid}`);
        sources[crs].removeFeature(feature);
      },
    );

    allMeasurements[crs] = {};
    // updateMeasurements(allMeasurements);
    // terminateDraw();
    // olMap.removeOverlay(tooltipOverlay);
    if (vectorLayers[crs]) {
      vectorLayers[crs].setMap(null);
      vectorLayers[crs] = null;
    }
  }

  let aoiTextPrompt = 'Select Area of Interest';
  if (aoiSelected) {
    aoiTextPrompt = 'Area of Interest Selected';
  }

  return (
    <div
      id="wv-charting-mode-container"
      className="wv-charting-mode-container"
      style={{ display: isChartingActive && !isMobile ? 'block' : 'none' }}
    >
      <div className="charting-aoi-container">
        <h3>{aoiTextPrompt}</h3>
        <FontAwesomeIcon
          icon={faPencilAlt}
          onClick={onAreaOfInterestButtonClick}
        />
      </div>
      <div className="charting-timespan-container">
        <h3>Time Span:</h3>
        <ButtonGroup size="sm">
          <Button
            id="charting-single-date-button"
            className="charting-button charting-single-date-button"
          >
            One Date
          </Button>
          <Button
            id="charting-date-range-button"
            className="compare-button compare-swipe-button"
          >
            Date Range
          </Button>
        </ButtonGroup>
      </div>
      <div className="charting-date-container">
        <div className="charting-start-date">Start Date</div>
        <div className="charting-end-date">End Date</div>
        <FontAwesomeIcon icon={faCalendarDay} />
        <FontAwesomeIcon icon={faInfo} />
      </div>
    </div>
  );
}

const mapStateToProps = (state, ownProps) => {
  const {
    charting, map, proj, config,
  } = state;
  const { crs } = proj.selected;
  const { aoiActive } = charting;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  return {
    charting, olMap: map.ui.selected, proj, crs, projections, aoiActive,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleAreaOfInterest: () => {
    dispatch(toggleChartingAOIOnOff());
  },
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingModeOptions);

ChartingModeOptions.propTypes = {
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  aoiSelected: PropTypes.bool,
  aoiCoordinates: PropTypes.array,
  timeSpanSingleDate: PropTypes.bool,
  timeSpanStartdate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
  toggleAreaOfInterest: PropTypes.func,
  olMap: PropTypes.object,
  crs: PropTypes.string,
  proj: PropTypes.object,
  projections: PropTypes.array,
  aoiActive: PropTypes.bool,
};

