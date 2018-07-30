import React from 'react';
import ReactDOM from 'react-dom';
import { TimelineDragger } from 'worldview-components';
import $ from 'jquery';
import lodashDebounce from 'lodash/debounce';
import util from '../util/util';

const DEBOUCE_TIME = 100;
const PICK_PATH =
  'M 7.3151,0.7426 C 3.5507,0.7426 0.5,3.7926 0.5,7.5553 l 0,21.2724 14.6038,15.7112 14.6039,15.7111 14.6038,-15.7111 14.6037,-15.7112 0,-21.2724 c 0,-3.7627 -3.051,-6.8127 -6.8151,-6.8127 l -44.785,0 z';
export function timelineCompare(models, config, ui) {
  var self = {};
  var xmlns = 'http://www.w3.org/2000/svg';

  var timeline = ui.timeline;
  var $footer = $('#timeline-footer');
  var $header = $('#timeline-header');
  var $timeline = $('#timeline');
  var mountObjectA;
  var mountObjectB;
  var parentSvg;
  if (models.compare.active) {
    $timeline.addClass('ab-active');
  }
  var init = function() {
    mountObjectA = document.createElementNS(xmlns, 'g');
    mountObjectB = document.createElementNS(xmlns, 'g');
    parentSvg = document.getElementById('timeline-footer-svg');
    parentSvg.appendChild(mountObjectA);
    parentSvg.appendChild(mountObjectB);
    applyActiveClasses();
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
    models.date.events
      .on('timeline-change', updateState)
      .on('select', updateState);
  };

  var applyActiveClasses = function() {
    if (models.compare.isCompareA) {
      mountObjectA.setAttribute('class', 'ab-group-case ab-group-case-active');
      mountObjectB.setAttribute('class', 'ab-group-case');
      parentSvg.insertBefore(mountObjectB, mountObjectA);
    } else {
      mountObjectA.setAttribute('class', 'ab-group-case ');
      mountObjectB.setAttribute('class', 'ab-group-case ab-group-case-active');
      parentSvg.insertBefore(mountObjectA, mountObjectB);
    }
  };
  var getInitialProps = function(compareLetter, label) {
    return {
      id: 'selected' + compareLetter,
      onDrag: lodashDebounce(onDrag, DEBOUCE_TIME),
      yOffset: 15,
      path: PICK_PATH,
      height: 59.51,
      width: 58.42,
      textColor: null,
      color: null,
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
