import React from 'react';
import ReactDOM from 'react-dom';
import OlOverlay from 'ol/overlay';

import util from '../util/util';
import { DateLine, LineText } from 'worldview-components';

var map,
  overlay1,
  overlay2,
  textOverlay1,
  textOverlay2,
  lineLeft,
  lineRight,
  textLeft,
  textRight,
  proj;

export function mapDateLineBuilder(models, config) {
  var self = {};
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
  self.init = function(Parent, olMap, date) {
    var dimensions;
    map = olMap;
    drawDatelines(map, date);
    proj = models.proj.selected.id;

    Parent.events.on('moveend', function() {
      if (!isGeoProjection()) {
        return;
      }
      updateLineVisibility(true);
      dimensions = position(map);
      update(dimensions);
    });
    Parent.events.on('drag', function() {
      if (!isGeoProjection()) {
        return;
      }
      updateLineVisibility(false);
    });
    Parent.events.on('movestart', function() {
      if (!isGeoProjection()) {
        return;
      }
      updateLineVisibility(false);
    });
    models.date.events.on('select', function() {
      updateDate(models.date[models.date.activeDate]);
    });
    models.proj.events.on('select', function() {
      proj = models.proj.selected.id;
    });
  };
  var isGeoProjection = function() {
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
  var setLineDefaults = function(
    ReactComponent,
    height,
    lineX,
    overlay,
    reactCase,
    tooltip
  ) {
    var props = {
      height: height,
      lineOver: onHover,
      lineOut: onMouseOut,
      lineX: lineX,
      overlay: overlay,
      tooltip: tooltip
    };
    return ReactDOM.render(
      React.createElement(ReactComponent, props),
      reactCase
    );
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
  var setTextDefaults = function(ReactComponent, reactCase, date) {
    var props = {
      dateLeft: util.toISOStringDate(util.dateAdd(date, 'day', 1)),
      dateRight: util.toISOStringDate(date)
    };
    return ReactDOM.render(
      React.createElement(ReactComponent, props),
      reactCase
    );
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
  var updateLineVisibility = function(boo) {
    var state = {
      active: boo
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
  var drawDatelines = function(map, date) {
    var height, leftLineCase, rightLineCase, leftTextCase, rightTextCase;

    leftLineCase = document.createElement('div');
    rightLineCase = document.createElement('div');
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

    textLeft = setTextDefaults(LineText, leftTextCase, date);
    textRight = setTextDefaults(
      LineText,
      rightTextCase,
      util.dateAdd(date, 'day', -1)
    );
    lineLeft = setLineDefaults(
      DateLine,
      height,
      -180,
      textOverlay1,
      leftLineCase,
      textLeft
    );
    lineRight = setLineDefaults(
      DateLine,
      height,
      180,
      textOverlay2,
      rightLineCase,
      textRight
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
  var onHover = function(pixels, overlay, lineX, tooltip) {
    var coords;
    coords = map.getCoordinateFromPixel(pixels);
    overlay.setPosition([lineX, coords[1]]);
    tooltip.setState({
      active: true
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
  var onMouseOut = function(tooltip) {
    tooltip.setState({
      active: false
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
  var updateDate = function(date) {
    var leftState, rightState;
    leftState = {
      dateLeft: util.toISOStringDate(util.dateAdd(date, 'day', 1)),
      dateRight: util.toISOStringDate(date)
    };
    rightState = {
      dateLeft: util.toISOStringDate(date),
      dateRight: util.toISOStringDate(util.dateAdd(date, 'day', -1))
    };
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
  var position = function(map) {
    var extent,
      top,
      topY,
      bottomY,
      bottom,
      height,
      startY,
      topExtent,
      bottomExtent;

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
      topY = map.getPixelFromCoordinate([extent[2], 90])[1];
    } else {
      topY = map.getPixelFromCoordinate(top)[1];
    }
    if (extent[1] > -90) {
      bottomY = map.getPixelFromCoordinate(bottom)[1];
    } else {
      bottomY = map.getPixelFromCoordinate([extent[2], -90])[1];
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
  var update = function(dimensions) {
    var state = {
      height: dimensions[0]
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
  var drawOverlay = function(coordinate, el) {
    var overlay = new OlOverlay({
      element: el,
      stopEvent: false
    });
    overlay.setPosition(coordinate);
    return overlay;
  };

  return self;
}
