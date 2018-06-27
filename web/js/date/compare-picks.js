import React from 'react';
import ReactDOM from 'react-dom';
import { TimelineDragger } from 'worldview-components';
import $ from 'jquery';
import lodashDebounce from 'lodash/debounce';
import util from '../util/util';

const DEBOUCE_TIME = 100;

export function timelineCompare(models, config, ui) {
  var self = {};
  var xmlns = 'http://www.w3.org/2000/svg';

  var timeline = ui.timeline;
  var $footer = $('#timeline-footer');
  var $header = $('#timeline-header');
  var $timeline = $('#timeline');
  var mountObjectA;
  var mountObjectB;
  if (models.compare.active) {
    $timeline.addClass('ab-active');
  }
  var init = function() {
    mountObjectA = document.createElementNS(xmlns, 'g');
    mountObjectB = document.createElementNS(xmlns, 'g');
    applyActiveClasses();

    var svg = document.getElementById('timeline-footer-svg');
    svg.appendChild(mountObjectA);
    svg.appendChild(mountObjectB);
    self.comparePickA = ReactDOM.render(
      React.createElement(TimelineDragger, getInitialProps('', 'A')),
      mountObjectA
    );
    self.comparePickB = ReactDOM.render(
      React.createElement(TimelineDragger, getInitialProps('B', 'B')),
      mountObjectB
    );
    models.compare.events.on('toggle', () => {
      $timeline.toggleClass('ab-active');
      updateState();
    });
    models.compare.events.on('toggle-state', applyActiveClasses);
    models.date.events.on('timeline-change', updateState);
  };
  var applyActiveClasses = function() {
    if (models.compare.isCompareA) {
      mountObjectA.setAttribute('class', 'ab-group-case ab-group-case-active');
      mountObjectB.setAttribute('class', 'ab-group-case');
    } else {
      mountObjectA.setAttribute('class', 'ab-group-case ');
      mountObjectB.setAttribute('class', 'ab-group-case ab-group-case-active');
    }
  };
  var getInitialProps = function(compareLetter, label) {
    return {
      id: 'selected' + compareLetter,
      onDrag: lodashDebounce(onDrag, DEBOUCE_TIME),
      yOffset: 15,
      draggerID: 'compare-dragger-' + compareLetter,
      position: getLocationFromStringDate(
        models.date['selected' + compareLetter]
      ),
      text: label
    };
  };
  var updateState = function() {
    self.comparePickA.setState({
      position: getLocationFromStringDate(models.date['selected'])
    });
    self.comparePickB.setState({
      position: getLocationFromStringDate(models.date['selectedB'])
    });
  };
  /*
   * calculates offset of timeline
   *
   * @method getHeaderOffset
   * @static
   *
   * @returns {number} OffsetX
   *
   */
  self.getHeaderOffset = function() {
    return (
      $header.width() +
      Number($timeline.css('left').replace('px', '')) +
      Number($footer.css('margin-left').replace('px', ''))
    );
  };
  var getLocationFromStringDate = function(date) {
    return timeline.x(util.roundTimeTenMinute(date));
  };
  /*
   * Handles click on widget:
   *  switches current date to
   *  date clicked
   *
   * @method onRangeClick
   * @static
   *
   * @param e {object} native event object
   *
   * @returns {object} props
   *
   */
  var onDrag = function(e, id, offsetX) {
    var date = timeline.x.invert(offsetX);
    models.date.select(date, id);
  };

  init();
  return self;
}
