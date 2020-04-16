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
import { TOGGLE_VISIBLE_DATELINES } from '../modules/settings/constants';

export function mapDateLineBuilder(models, config, store, ui) {
  const self = {};
  // formatted YYYY-MM-DD (e.g., 2019-06-25) for checking daily change for dateline
  self.date = {};
  let map;
  let overlay1;
  let overlay2;
  let textOverlay1;
  let textOverlay2;
  let leftLineCase;
  let rightLineCase;
  let lineLeft;
  let lineRight;
  let textLeft;
  let textRight;
  let proj;
  let x1 = -180;
  let x2 = 180;
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
      case TOGGLE_VISIBLE_DATELINES:
        updateDatelines(store.getState().settings.hasVisibleDatelines);
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
      dimensions = getPosition(map);
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
  const updateDatelines = function(isVisible) {
    lineLeft.setState({ isVisible });
    lineRight.setState({ isVisible });
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
  self.animation = function(isNightMode, newExtent) {
    const view = map.getView();
    const initialExtent = view.calculateExtent(map.getSize());

    view.animate({ zoom: 1, duration: 2000 },
      () => {
        const rightOverlayPositoon = overlay1.getPosition();
        const deltaCoordX = isNightMode ? 180 : -180;
        const newCoordX = rightOverlayPositoon[0] + deltaCoordX;
        const pixelRightOverlay = map.getPixelFromCoordinate(rightOverlayPositoon);
        const pixelFutureRight = map.getPixelFromCoordinate([newCoordX, rightOverlayPositoon[1]]);
        const deltaPixelX = pixelRightOverlay[0] - pixelFutureRight[0];
        rightLineCase.style.transition = '2s ease-in-out';
        leftLineCase.style.transition = '2s ease-in-out';
        leftLineCase.style.transform = `translate(${deltaPixelX}px)`;
        rightLineCase.style.transform = `translate(${deltaPixelX}px)`;
        setTimeout(() => {
          rightLineCase.style.transition = 'none';
          leftLineCase.style.transition = 'none';
          leftLineCase.style.transform = 'translateX(0)';
          rightLineCase.style.transform = 'translateX(0)';

          self.updateExtents(newExtent);
          view.fit(initialExtent, {
            duration: 2000,
          });
        }, 2000);
      });
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
    let height; let leftTextCase; let
      rightTextCase;

    leftLineCase = document.createElement('div');
    rightLineCase = document.createElement('div');
    leftLineCase.className = 'dateline-case';
    rightLineCase.className = 'dateline-case';
    leftTextCase = document.createElement('div');
    rightTextCase = document.createElement('div');
    height = 0;

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
    let coords;
    coords = map.getCoordinateFromPixel(pixels);
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
  const getPosition = function(map) {
    let extent;
    let top;
    let topY;
    let bottomY;
    let bottom;
    let height;
    let startY;
    let topExtent;
    let bottomExtent;


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
    overlay1.setPosition([x1, dimensions[1]]);
    overlay2.setPosition([x2, dimensions[1]]);
  };
  self.updateExtents = function(newExtent) {
    const dimensions = getPosition(map);
    [x1, , x2] = newExtent;
    overlay1.setPosition([x1, dimensions[1]]);
    overlay2.setPosition([x2, dimensions[1]]);
    textOverlay1.setPosition([x1, dimensions[1]]);
    textOverlay2.setPosition([x2, dimensions[1]]);
    lineLeft.setState({ lineX: x1 });
    lineRight.setState({ lineX: x2 });
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
