import $ from 'jquery';
import 'jquery-ui/button';
import util from '../util/util';

export function MapRotate(ui, models, map) {
  this.evts = util.events();
  this.intervalId = null;
  var self = this;

  /*
   * Initializes by triggering build methods
   *
   * @method init
   * @static
   *
   * @param {object} map - openLayers map object
   *
   * @param {string} d - projection id string
   *
   * @returns {void}
   */
  this.init = function (map, id) {
    this.buildRotationWidget(map);
    this.setRotationEvents(map, id);
  };
  /*
   * Draws Rotation Widget
   *
   * @method createRotationWidget
   * @static
   *
   * @param {object} map - openLayers map object
   *
   * @returns {void}
   */
  this.buildRotationWidget = function (map) {
    var $map = $('#' + map.getTarget());
    var $rotateLeftButton = $('<button></button>')
      .addClass('wv-map-rotate-left wv-map-zoom')
      .attr('title', 'You may also rotate by holding Alt and dragging the mouse');
    var $lefticon = $('<i></i>')
      .addClass('fa fa-undo');

    var $rotateRightButton = $('<button></button>')
      .addClass('wv-map-rotate-right wv-map-zoom')
      .attr('title', 'You may also rotate by holding Alt and dragging the mouse');
    var $righticon = $('<i></i>')
      .addClass('fa fa-repeat');

    var $resetButton = $('<button></button>')
      .addClass('wv-map-reset-rotation wv-map-zoom')
      .attr('title', 'Click to reset')
      .attr('style', 'width: 43px');

    $rotateLeftButton.append($lefticon);
    $rotateRightButton.append($righticon);
    $map.append($rotateLeftButton)
      .append($resetButton)
      .append($rotateRightButton);
  };
  /*
   * Applies Jquery click events to rotation-widget
   *
   * @method setRotationEvents
   * @static
   *
   * @param {object} map - openLayers map object
   *
   * @param {string} d - projection id string
   *
   * @returns {void}
   */
  this.setRotationEvents = function (map, id) {
    var dur = 500;
    var $leftButton = $('#wv-map-' + id + ' .wv-map-rotate-left');
    var $rightButton = $('#wv-map-' + id + ' .wv-map-rotate-right');
    var $resetButton = $('#wv-map-' + id + ' .wv-map-reset-rotation');

    // Set buttons to animate rotation by 18 degrees. use setInterval to repeat the rotation when mouse button is held
    $leftButton.button({
      text: false
    })
      .mousedown(function () {
        self.intervalId = setInterval(function () {
          self.rotate(10, dur, map);
        }, dur);
        self.rotate(10, dur, map);
      })
      .mouseup(function () {
        clearInterval(self.intervalId);
      })
      .mouseout(function() {
        clearInterval(self.intervalId);
      });

    $rightButton.button({
      text: false
    })
      .mousedown(function () {
        self.intervalId = setInterval(function () {
          self.rotate(-10, dur, map);
        }, dur);
        self.rotate(-10, dur, map);
      })
      .mouseup(function () {
        clearInterval(self.intervalId);
      })
      .mouseout(function() {
        clearInterval(self.intervalId);
      });

    $resetButton.button({
      label: Number(models.map.rotation * (180 / Math.PI))
        .toFixed()
    })
      .mousedown(function () { // reset rotation
        clearInterval(self.intervalId); // stop repeating rotation on mobile
        map.getView()
          .animate({
            duration: 500,
            rotation: 0
          });

        $resetButton.button('option', 'label', '0');
      });
  };

  /**
   * Saves the rotation degrees as a number within -360 & 360 degrees
   *
   * @param  {type} currentDeg  The current rotation degrees
   * @param  {type} currentView The current rotation view
   * @return {type}             Compare the current degrees to 360 degrees minus the new view's degree value.
   *                            This ensures the maximum degrees never exceeds +/- 360.
   *                            The current view is then set to this new value.
   */
  this.saveRotation = function (currentDeg, currentView) {
    if (Math.abs(currentDeg) === 360) {
      currentView.setRotation(0);
    } else if (Math.abs(currentDeg) >= 360) {
      var newNadVal = ((360 - Math.abs(currentDeg)) * (Math.PI / 180));
      if (currentDeg < 0) {
        currentView.setRotation(newNadVal);
      } else {
        currentView.setRotation(-newNadVal);
      }
    }
  };

  /*
   * Called as event listener when map is rotated. Update url to reflect rotation reset
   *
   * @method updateRotation
   * @static
   *
   * @returns {void}
   */
  this.updateRotation = function () {
    var radians,
      currentView,
      currentDeg;

    currentView = ui.selected.getView();
    radians = currentView.getRotation();
    models.map.rotation = radians;
    self.setResetButton(radians);

    currentDeg = (currentView.getRotation() * (180.0 / Math.PI));
    this.saveRotation(currentDeg, currentView);
  };

  /*
   * examines the number of characters present in the
   * reset button and reassigns padding accordingly
   *
   * @method setResetButtonWidth
   * @static
   *
   * @param {number} deg - map rotation degree value
   *
   * @returns {void}
   */
  this.setResetButton = function (radians) {
    var button = $('.wv-map-reset-rotation');
    var deg = radians * (180.0 / Math.PI);
    // Set reset button content
    button.button('option', 'label', Number(deg % 360)
      .toFixed());
    switch (true) {
      case (deg >= 100.0):
        button.find('span')
          .attr('style', 'padding-left: 9px');
        break;
      case (deg <= -100.0):
        button.find('span')
          .attr('style', 'padding-left: 6px');
        break;
      case (deg <= -10.0):
        button.find('span')
          .attr('style', 'padding-left: 10px');
        break;
      default:
        button.find('span')
          .attr('style', 'padding-left: 14px');
        break;
    }
  };

  /*
   * Called as event listener when map is rotated. Update url to reflect rotation reset
   *
   * @method rotate
   * @static
   *
   * @param {number} amount - value of degrees to rotate
   *
   * @param {number} duration - how long the animation should last
   *
   * @param {object} map - openLayers map object
   *
   * @returns {void}
   */
  this.rotate = function (amount, duration, map) {
    var currentDeg = (map.getView()
      .getRotation() * (180.0 / Math.PI));

    var currentView = ui.selected.getView();
    this.saveRotation(currentDeg, currentView);

    map.getView()
      .animate({
        rotation: map.getView()
          .getRotation() - (Math.PI / amount),
        duration: duration
      });
  };
};
