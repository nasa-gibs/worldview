import React from 'react';
import PropTypes from 'prop-types';
import { Portal } from 'react-portal';
import { transform } from 'ol/proj';
import DateLine from '../dateline/dateline';
import LineText from '../dateline/text';
import util from '../../util/util';

const DAY_TIME_EXTENT = [-180, -90, 180, 90];
const NIGHT_TIME_EXTENT = [-360, -90, 0, 90];

/*
   * Calculates the height and y-position of the line
   *
   * @method drawOverlay
   * @private
   *
   * @param {Array} coodinate
   * @param {Object} el - DOM object to be append to overlay
   *
   * @returns {void}
   */
const drawOverlay = function(coordinate, el) {
  const overlay = new OlOverlay({
    element: el,
    stopEvent: false,
  });
  overlay.setPosition(coordinate);
  return overlay;
};
export class Datelines extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
    this.isShowingDateline = false;
  }

  renderDatelines() {
    this.map.addOverlay;
  }

  updateDatelines () {
    const { hasDatelines } = this.props;
  }

  /*
   * Calculates the height and y-position of the line
   *
   * @method position
   * @private
   *
   * @param {Object} map - OL map object
   *
   * @returns {void}
   */
  getPosition = function() {
    let extent;
    let top;
    let topY;
    let bottomY;
    let bottom;
    let height;
    let startY;
    let topExtent;
    let bottomExtent;
    const { map } = this;

    if (map.getSize()[0] === 0) {
      return;
    }
    extent = map.getView().calculateExtent(map.getSize());
    top = [extent[2] - 1, extent[3] + 5];
    bottom = [extent[2] - 1, extent[1] - 5];
    topExtent = map.getPixelFromCoordinate([extent[2] - 1, extent[3] - 1]);
    bottomExtent = map.getPixelFromCoordinate([extent[0] + 1, extent[1] + 1]);
    topY = Math.round(topExtent[1] + 5);
    bottomY = Math.round(bottomExtent[1] - 5);
    startY = Math.round(extent[3] + 5);

    if (startY > 90) {
      startY = 90;
      [, topY] = map.getPixelFromCoordinate([extent[2], 90]);
    } else {
      [, topY] = map.getPixelFromCoordinate(top);
    }
    if (extent[1] > -90) {
      [, bottomY] = map.getPixelFromCoordinate(bottom);
    } else {
      [, bottomY] = map.getPixelFromCoordinate([extent[2], -90]);
    }
    height = Math.round(Math.abs(bottomY - topY));
    return [height, startY];
  };

  componentDidMount() {
    const { isNightMode, isInfinite } = props.settings;
    this.leftLineCase = document.createElement('div');
    this.rightLineCase = document.createElement('div');
    this.leftTextCase = document.createElement('div');
    this.rightTextCase = document.createElement('div');
    const extent = isNightMode ? NIGHT_TIME_EXTENT : DAY_TIME_EXTENT;

    // extent = isInfinite
    overlay1 = drawOverlay([extent[0], 90], leftLineCase);
    // overlay2 = drawOverlay([extent[2], 90], rightLineCase);
    // textOverlay1 = drawOverlay([extent[0], 90], leftTextCase);
    // textOverlay2 = drawOverlay([extent[2], 90], rightTextCase);
    // this.map.addOverlay(extent);
  }

  render() {
    const { extent } = this.props;
    const dimension = this.getPosition();
    return (
      <>
        <Portal node={this.leftLineCase}>
          <DateLine
            height={dimension[0]}
            lineX={extent[0]}
          />
          <LineText />
        </Portal>
        <Portal />
      </>
    );
  }
}

OlCoordinates.propTypes = {
  mouseEvents: PropTypes.object.isRequired,
};
