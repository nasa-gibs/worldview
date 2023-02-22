import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { Draw as OlInteractionDraw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw.js';
import { Vector as OlVectorLayer } from 'ol/layer';
import { transform } from 'ol/proj';
import { Vector as OlVectorSource } from 'ol/source';
import {
  toggleChartingAOIOnOff, updateChartingAOICoordinates, toggleAOISelected, updateChartingDateSelection,
} from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import ChartingInfo from '../charting/charting-info.js';
import ChartingDateComponent from '../charting/charting-date-component';
import {
  drawStyles, vectorStyles,
} from '../charting/charting-aoi-style.js';

const AOIFeatureObj = {};
const vectorLayers = {};
const sources = {};
let init = false;
let draw;

function ChartingModeOptions (props) {
  const {
    activeLayers,
    toggleAreaOfInterestActive,
    toggleAreaOfInterestSelected,
    updateAOICoordinates,
    openChartingInfoModal,
    onChartDateButtonClick,
    openChartingDateModal,
    olMap,
    crs,
    proj,
    projections,
    isChartingActive,
    isMobile,
    aoiSelected,
    aoiActive,
    aoiCoordinates,
    timeSpanSelection,
    timeSpanStartDate,
    timeSpanEndDate,
  } = props;
  console.log(props);

  useEffect(() => {
    if (!init) {
      projections.forEach((key) => {
        AOIFeatureObj[key] = {};
        vectorLayers[key] = null;
        sources[key] = new OlVectorSource({ wrapX: false });
      });
      init = true;
    }
  }, [projections]);

  useEffect(() => {
    resetAreaOfInterest();
    endDrawingAreaOfInterest();
  }, [isChartingActive]);

  useEffect(() => {
    processAreaOfInterestCoordinates();
  }, [aoiCoordinates]);

  const onAreaOfInterestButtonClick = (evt) => {
    toggleAreaOfInterestActive();
    if (!aoiActive) {
      beginDrawingAOI();
    } else {
      endDrawingAreaOfInterest();
    }
  };

  function beginDrawingAOI () {
    resetAreaOfInterest();
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
    // draw.on('drawstart', drawStartCallback);
    draw.on('drawend', drawEndCallback);

    if (!vectorLayers[crs]) {
      vectorLayers[crs] = new OlVectorLayer({
        source: sources[crs],
        style: vectorStyles,
        map: olMap,
      });
    }
  }

  // const drawStartCallback = ({ feature }) => {
  //   console.log('drawStartCallback');
  // };

  /**
   * Triggers when draw is completed
   */
  const drawEndCallback = ({ feature }) => {
    // Add the draw feature to the collection
    AOIFeatureObj[crs][feature.ol_uid] = {
      feature,
    };
    endDrawingAreaOfInterest();
    toggleAreaOfInterestActive();
    toggleAreaOfInterestSelected();
    getAreaOfInterestCoordinates(feature.getGeometry());
  };

  /**
   * End the AOI draw interaction
   */
  function endDrawingAreaOfInterest () {
    if (draw) {
      olMap.removeInteraction(draw);
    }
  }

  /**
   * Clear any existing AOI's from the current map projection
   */
  function resetAreaOfInterest() {
    Object.values(AOIFeatureObj[crs]).forEach(
      ({ feature, overlay }) => {
        sources[crs].removeFeature(feature);
      },
    );

    if (vectorLayers[crs]) {
      vectorLayers[crs].setMap(null);
      vectorLayers[crs] = null;
    }

    toggleAreaOfInterestSelected(false);
    updateAOICoordinates(null);
  }

  function getAreaOfInterestCoordinates(geometry) {
    updateAOICoordinates(geometry.getExtent());
  }

  function processAreaOfInterestCoordinates() {
    // Identify all "live" layers (not hidden)
    const liveLayers = getLiveLayers();
    const topLayer = liveLayers[0];
  }

  /**
   * Filters the layers array & returns those with visible set to 'true'.
   */
  function getLiveLayers() {
    return activeLayers.filter((obj) => obj.visible === true);
  }

  function formatDateString(dateObj) {
    const date = new Date(dateObj);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${year} ${month} ${day}`;
  }

  const primaryDate = formatDateString(timeSpanStartDate);
  const secondaryDate = formatDateString(timeSpanEndDate);

  console.log(`primaryDate: ${primaryDate}`);
  console.log(`secondaryDate: ${secondaryDate}`);

  let aoiTextPrompt = 'Select Area of Interest';
  if (aoiSelected) {
    aoiTextPrompt = 'Area of Interest Selected';
  }

  let singleDateBtnStatus = '';
  let dateRangeBtnStatus = '';
  if (timeSpanSelection === 'single') {
    singleDateBtnStatus = 'btn-active';
    dateRangeBtnStatus = '';
  } else {
    singleDateBtnStatus = '';
    dateRangeBtnStatus = 'btn-active';
  }

  let dateRangeValue;
  if (timeSpanSelection === 'range') {
    dateRangeValue = <div className="charting-end-date">{secondaryDate}</div>;
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
        <FontAwesomeIcon
          icon={faCalendarDay}
          onClick={openChartingDateModal}
        />
        <h3>Time Span:</h3>
        <ButtonGroup size="sm">
          <Button
            id="charting-date-single-button"
            className={`charting-button ${singleDateBtnStatus}`}
            onClick={() => onChartDateButtonClick('single')}
          >
            Single Date
          </Button>
          <Button
            id="charting-date-range-button"
            className={`charting-button ${dateRangeBtnStatus}`}
            onClick={() => onChartDateButtonClick('range')}
          >
            Date Range
          </Button>
        </ButtonGroup>
      </div>
      <div className="charting-date-container">
        <div className="charting-start-date">{primaryDate}</div>
        {dateRangeValue}
      </div>
      <div className="charting-info-container">
        <FontAwesomeIcon
          icon="info-circle"
          onClick={openChartingInfoModal}
        />
      </div>
    </div>
  );
}

const mapStateToProps = (state, ownProps) => {
  const {
    charting, map, proj, config, layers, date,
  } = state;
  const activeLayers = layers.active.layers;
  const { crs } = proj.selected;
  const {
    aoiActive, aoiCoordinates, aoiSelected, timeSpanSelection, timeSpanEndDate, timeSpanStartDate,
  } = charting;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  return {
    olMap: map.ui.selected,
    proj,
    crs,
    projections,
    aoiActive,
    aoiCoordinates,
    aoiSelected,
    activeLayers,
    timeSpanSelection,
    timeSpanEndDate,
    timeSpanStartDate,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleAreaOfInterestActive: () => {
    dispatch(toggleChartingAOIOnOff());
  },
  toggleAreaOfInterestSelected: (featureSetting) => {
    dispatch(toggleAOISelected(featureSetting));
  },
  updateAOICoordinates: (extent) => {
    dispatch(updateChartingAOICoordinates(extent));
  },
  openChartingInfoModal: () => {
    // This is the charting tool info window from the wireframes
    dispatch(
      openCustomContent('CHARTING_INFO_MODAL', {
        headerText: 'Charting Tool',
        backdrop: false,
        bodyComponent: ChartingInfo,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'global-settings-modal toolbar-info-modal toolbar-modal',
      }),
    );
  },
  openChartingDateModal: () => {
    dispatch(
      openCustomContent('CHARTING_DATE_MODAL', {
        headerText: 'Charting Mode Date Selection',
        backdrop: false,
        bodyComponent: ChartingDateComponent,
        wrapClassName: 'clickable-behind-modal',
        modalClassName: 'global-settings-modal toolbar-info-modal toolbar-modal',
      }),
    );
  },
  onChartDateButtonClick: (buttonClicked) => {
    dispatch(updateChartingDateSelection(buttonClicked));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingModeOptions);

ChartingModeOptions.propTypes = {
  activeLayers: PropTypes.array,
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  aoiSelected: PropTypes.bool,
  aoiCoordinates: PropTypes.array,
  timeSpanSelection: PropTypes.string,
  timeSpanStartDate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
  toggleAreaOfInterestActive: PropTypes.func,
  toggleAreaOfInterestSelected: PropTypes.func,
  updateAOICoordinates: PropTypes.func,
  openChartingInfoModal: PropTypes.func,
  openChartingDateModal: PropTypes.func,
  onChartDateButtonClick: PropTypes.func,
  olMap: PropTypes.object,
  crs: PropTypes.string,
  proj: PropTypes.object,
  projections: PropTypes.array,
  aoiActive: PropTypes.bool,
};
