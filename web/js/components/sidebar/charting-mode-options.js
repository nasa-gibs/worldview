import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCalendarDay, faInfo } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';

import Draw, { createBox } from 'ol/interaction/Draw.js';

import {
  Circle as OlStyleCircle,
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
} from 'ol/style';
import { transform } from 'ol/proj';
import {
  LineString as OlLineString,
  Polygon as OlGeomPolygon,
} from 'ol/geom';
import { toggleChartingAOIOnOff } from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';
import { CRS } from '../../modules/map/constants';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import {
  transformLineStringArc,
  transformPolygonArc,
} from '../measure-tool/util';

const sources = {};

class ChartingModeOptions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected,
    };
  }

  UNSAFE_componentWillReceiveProps(newProp) {
    const { selected } = this.state;
    if (selected !== newProp.selected) {
      this.setState({ selected: newProp.selected });
    }
  }

  areaBgFill = new OlStyleFill({
    color: 'rgba(213, 78, 33, 0.1)',
  });

  solidBlackLineStroke = new OlStyleStroke({
    color: 'rgba(0, 0, 0, 1)',
    lineJoin: 'round',
    width: 5,
  });

  drawStyles = [
    new OlStyle({
      fill: this.areaBgFill,
      stroke: this.solidBlackLineStroke,
      geometry: this.styleGeometryFn,
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
      geometry: this.styleGeometryFn,
    }),
  ];

  /**
     * Call the appropriate transform function to add great circle arcs to
     * lines and polygon edges.  Otherwise pass through unaffected.
     * @param {*} feature
     */
  styleGeometryFn = (feature) => {
    const { crs } = this.props;
    const geometry = feature.getGeometry();
    if (geometry instanceof OlLineString) {
      return transformLineStringArc(geometry, crs);
    }
    if (geometry instanceof OlGeomPolygon) {
      return transformPolygonArc(geometry, crs);
    }
    return geometry;
  };

  onAoiButtonClick = (evt, props) => {
    console.log('props');
    console.log(this.props);
    console.log('onAoiButtonClick');
    const {
      toggleAOI, olMap, crs, proj,
    } = this.props;
    toggleAOI();

    // Define draw option
    const draw = new Draw({
      source: sources[crs],
      type: 'Circle',
      geometryFunction: createBox(),
      // style: this.drawStyles,
      condition(e) {
        const pixel = [e.originalEvent.x, e.originalEvent.y];
        const coord = olMap.getCoordinateFromPixel(pixel);
        const tCoord = transform(coord, crs, CRS.GEOGRAPHIC);
        return areCoordinatesWithinExtent(proj, tCoord);
      },
    });
    console.log('olMap');
    console.log(olMap);
    olMap.addInteraction(draw);
  }

  render() {
    const {
      isChartingActive,
      isMobile,
      aoiSelected,
      aoiCoordinates,
      timeSpanSingleDate,
      timeSpanStartdate,
      timeSpanEndDate,
    } = this.props;

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
            onClick={this.onAoiButtonClick}
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
}

const mapStateToProps = (state, ownProps) => {
  const {
    charting, map, proj,
  } = state;
  const { crs } = proj.selected;
  return {
    charting, olMap: map.ui.selected, proj, crs,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleAOI: () => {
    dispatch(toggleChartingAOIOnOff());
  },
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true },
)(ChartingModeOptions);

ChartingModeOptions.propTypes = {
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  aoiSelected: PropTypes.bool,
  aoiCoordinates: PropTypes.array,
  timeSpanSingleDate: PropTypes.bool,
  timeSpanStartdate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
  toggleAOI: PropTypes.func,
  olMap: PropTypes.object,
  crs: PropTypes.string,
  proj: PropTypes.object,
};

