/* eslint-disable react/no-render-return-value */
import React from 'react';
import ReactDOM from 'react-dom';
import OlOverlay from 'ol/Overlay';

import util from '../util/util';
import DateLine from '../components/dateline/dateline';
import LineText from '../components/dateline/text';
import { CHANGE_STATE as COMPARE_CHANGE_STATE } from '../modules/compare/constants';
import { SELECT_DATE } from '../modules/date/constants';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';

let map;
let overlay1;
let overlay2;
let textOverlay1;
let textOverlay2;
let lineLeft;
let lineRight;
let textLeft;
let textRight;
let proj;

export default function mapDateLineBuilder(models, config, store, ui) {
  const self = {};
  // formatted YYYY-MM-DD (e.g., 2019-06-25) for checking daily change for dateline
  self.date = {};
  /*
   * Sets globals and event listeners
   *
   * @method init
   * @static
   *
   * @param {object} Parent - Map class that we are listeing to
          Note: this is an antipattern - should be adjusted
   * @param {Object} olMap - OL map object
   * @param {Object} date - JS date Object
   *
   * @returns {object} React Component
   */
  /**
   * Suscribe to redux store and listen for
   * specific action types
   */
  const subscribeToStore = function(action) {
    switch (action.type) {
      case SELECT_DATE:
      case LOCATION_POP_ACTION:
      case COMPARE_CHANGE_STATE: {
        const state = store.getState();
        const selectedDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
        const date = state.date[selectedDateStr];
        const isNewDay = compareDateStrings(date);
        if (isNewDay) {
          return updateDate(date);
        }
        break;
      }
      case CHANGE_PROJECTION:
        proj = action.id;
        break;
      default:
        break;
    }
  };
  self.init = function(Parent, olMap, date) {
    let dimensions;
    map = olMap;
    drawDatelines(map, date);
    [self.date] = date.toISOString().split('T');
    proj = store.getState().proj.id;

    Parent.events.on('moveend', () => {
      if (!isGeoProjection()) {
        return;
      }
      updateLineVisibility(true);
      dimensions = position(map);
      update(dimensions);
    });
    Parent.events.on('drag', () => {
      if (!isGeoProjection()) {
        return;
      }
      updateLineVisibility(false);
    });
    Parent.events.on('movestart', () => {
      if (!isGeoProjection()) {
        return;
      }
      updateLineVisibility(false);
    });
    ui.events.on('last-action', subscribeToStore);
  };
  const isGeoProjection = function() {
    if (proj === 'geographic') {
      return true;
    }
    return false;
  };
  /*
   * Add Props to React Compents that creates
   *  a hoverable line SVG
   *
   * @method setLineDefaults
   * @private
   *
   * @param {object} Factory - React component Factory
   * @param {number} height - Lenght of line
   * @param {number} lineX - x coord value
   * @param {object} overlay - OL overlay
   * @param {object} reactCase - Dom El in which to render component
   * @param {object} tooltip - OL overlay that is associated with this widget
   *
   * @returns {object} React Component
   */
  const setLineDefaults = function(
    ReactComponent,
    height,
    lineX,
    overlay,
    reactCase,
    tooltip,
  ) {
    const props = {
      height,
      lineOver: onHover,
      lineOut: onMouseOut,
      lineX,
      overlay,
      tooltip,
    };
    const component = ReactDOM.render(
      React.createElement(ReactComponent, props),
      reactCase,
    );
    return component;
  };

  /*
   * Add Props to React Compents that creates an
   *  SVG text component
   *
   * @method setTextDefaults
   * @private
   *
   * @param {object} Factory - React component Factory
   * @param {object} reactCase - Dom El in which to render component
   * @param {object} date - JS date object
   *
   * @returns {object} React Component
   */
  const setTextDefaults = function(ReactComponent, reactCase, date, isLeft) {
    const props = getTextState(date, isLeft);
    return ReactDOM.render(
      React.createElement(ReactComponent, props),
      reactCase,
    );
  };

  /*
   * @method updateTextState
   * @private
   *
   * @param {object} date - JS date object
   * @param {boolean} isLeft - is this on left or right side of map
   *
   * @returns {object} Object with tooltip state
   */
  const getTextState = function(date, isLeft) {
    const isCompareActive = models.compare && models.compare.active;
    const state = {
      dateLeft: !isCompareActive
        ? util.toISOStringDate(util.dateAdd(date, 'day', 1))
        : isLeft
          ? '+ 1 day'
          : '',
      dateRight: !isCompareActive
        ? util.toISOStringDate(date)
        : isLeft
          ? ''
          : '- 1 day',
    };
    return state;
  };

  /*
   * Updates active state of line Components
   *
   * @method updateLineVisibility
   * @private
   *
   * @param {boolean} boo - component deactivation boolean
   *
   * @returns {void}
   */
  const updateLineVisibility = function(boo) {
    const state = {
      active: boo,
    };
    lineRight.setState(state);
    lineLeft.setState(state);
  };

  /*
   * constructs dateline components
   *
   * @method drawDatelines
   * @private
   *
   * @param {boolean} boo - component deactivation boolean
   *
   * @returns {void}
   */
  const drawDatelines = function(map, date) {
    const leftLineCase = document.createElement('div');
    const rightLineCase = document.createElement('div');
    const leftTextCase = document.createElement('div');
    const rightTextCase = document.createElement('div');
    const height = 0;

    overlay1 = drawOverlay([-180, 90], leftLineCase);
    overlay2 = drawOverlay([180, 90], rightLineCase);
    textOverlay1 = drawOverlay([-180, 90], leftTextCase);
    textOverlay2 = drawOverlay([180, 90], rightTextCase);

    map.addOverlay(overlay1);
    map.addOverlay(overlay2);
    map.addOverlay(textOverlay1);
    map.addOverlay(textOverlay2);

    textLeft = setTextDefaults(LineText, leftTextCase, date, true);
    textRight = setTextDefaults(
      LineText,
      rightTextCase,
      util.dateAdd(date, 'day', -1),
      false,
    );
    lineLeft = setLineDefaults(
      DateLine,
      height,
      -180,
      textOverlay1,
      leftLineCase,
      textLeft,
    );
    lineRight = setLineDefaults(
      DateLine,
      height,
      180,
      textOverlay2,
      rightLineCase,
      textRight,
    );
  };

  /*
   * relocates and shows tooltip on line hover
   *
   * @method onHover
   * @private
   *
   * @param {Array} pixels - pixel array
   * @param {Object} overlay - OL overlay that contains react tooltip
   * @param {Number} lineX - X coordinate of line
   * @param {Object} tooltip - React tooltip that displays line date-info
   *
   * @returns {void}
   */
  const onHover = function(pixels, overlay, lineX, tooltip) {
    const coords = map.getCoordinateFromPixel(pixels);
    overlay.setPosition([lineX, coords[1]]);
    tooltip.setState({
      active: true,
    });
  };

  /*
   * Hides tooltip when mouse is no longer hovering over
   * line
   *
   * @method onMouseOut
   * @private
   *
   * @param {Object} tooltip - React tooltip that displays line date-info
   *
   * @returns {void}
   */
  const onMouseOut = function(tooltip) {
    tooltip.setState({
      active: false,
    });
  };

  /*
   * Updates react tooltip components with correct date
   *
   * @method updateDate
   * @private
   *
   * @param {Object} date - JS date object
   *
   * @returns {void}
   */
  const updateDate = function(date) {
    const leftState = getTextState(date, true);
    const rightState = getTextState(util.dateAdd(date, 'day', -1), false);
    textLeft.setState(leftState);
    textRight.setState(rightState);
  };

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
  const position = function(map) {
    let topY;
    let bottomY;
    let startY;

    if (map.getSize()[0] === 0) {
      return;
    }
    const extent = map.getView().calculateExtent(map.getSize());
    const top = [extent[2] - 1, extent[3] + 5];
    const bottom = [extent[2] - 1, extent[1] - 5];
    const topExtent = map.getPixelFromCoordinate([extent[2] - 1, extent[3] - 1]);
    const bottomExtent = map.getPixelFromCoordinate([extent[0] + 1, extent[1] + 1]);
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
    const height = Math.round(Math.abs(bottomY - topY));
    return [height, startY];
  };

  /*
   * Calculates the height and y-position of the line
   *
   * @method update
   * @private
   *
   * @param {Array} dimensions - Array containing height and y-axis values
   *
   * @returns {void}
   */
  const update = function(dimensions) {
    const state = {
      height: dimensions[0],
    };
    lineRight.setState(state);
    lineLeft.setState(state);
    overlay1.setPosition([-180, dimensions[1]]);
    overlay2.setPosition([180, dimensions[1]]);
  };

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

  /*
   * Check if YYYY-MM-DD changed or a subdaily drag occurred
   *  to determine if new date lines are needed
   *
   * @method compareDateStrings
   * @private
   *
   * @param {object} date
   *
   * @sets {string} self.date - if new date
   * @returns {boolean}
   */
  const compareDateStrings = (date) => {
    const dateString = date.toISOString().split('T')[0];
    if (dateString !== self.date) {
      self.date = dateString;
      return true;
    }
    return false;
  };

  return self;
}
