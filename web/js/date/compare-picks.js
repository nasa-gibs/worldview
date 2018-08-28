import React from 'react';
import ReactDOM from 'react-dom';
import TimelineDragger from '../components/range-selection/dragger';
import { getMaxTimelineWidth } from './util';
import $ from 'jquery';
import lodashDebounce from 'lodash/debounce';
import util from '../util/util';

const DEBOUNCE_TIME = 50;
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
  var max;
  self.events = util.events();
  if (models.compare.active) {
    $timeline.addClass('ab-active');
  }
  var init = function() {
    mountObjectA = document.createElementNS(xmlns, 'g');
    mountObjectB = document.createElementNS(xmlns, 'g');
    mountObjectA.addEventListener('mousedown', toggleCheck);
    mountObjectB.addEventListener('mousedown', toggleCheck);
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
    models.date.events.on('timeline-change', setMax);
    $(window).resize(setMax);

    models.compare.events.on('toggle-state', applyActiveClasses);
    models.date.events
      .on('timeline-change', updateState)
      .on('select', updateState);
    self.events
      .on('drag', showPickHoverDate)
      .on('drag', debounceDateSelect)
      .on('drag-end', dateSelect)
      .on('drag-end', removeTicks);
  };
  var setMax = function() {
    max = getMaxTimelineWidth(ui);
    self.comparePickA.setState({
      max: max
    });
    self.comparePickB.setState({
      max: max
    });
  };
  var applyActiveClasses = function() {
    if (models.compare.isCompareA) {
      mountObjectA.setAttribute('class', 'ab-group-case ab-group-case-active');
      mountObjectB.setAttribute(
        'class',
        'ab-group-case ab-group-case-inactive'
      );
      parentSvg.insertBefore(mountObjectB, mountObjectA);
    } else {
      mountObjectA.setAttribute(
        'class',
        'ab-group-case ab-group-case-inactive'
      );
      mountObjectB.setAttribute('class', 'ab-group-case ab-group-case-active');
      parentSvg.insertBefore(mountObjectA, mountObjectB);
    }
  };
  var toggleCheck = function(e) {
    if ($(this).hasClass('ab-group-case-active')) return;
    models.compare.toggleState();
  };
  var getInitialProps = function(compareLetter, label) {
    max = getMaxTimelineWidth(ui);
    return {
      id: 'selected' + compareLetter,
      onDrag: (e, id, position) => {
        self.events.trigger('drag', e, id, position);
      },

      onStop: (id, position) => {
        self.dragging = false;
        self.events.trigger('drag-end', null, id, position);
      },
      yOffset: 15,
      path: PICK_PATH,
      height: 59.51,
      width: 58.42,
      textColor: null,
      color: null,
      max: max,
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
  var dateSelect = function(e, id, offsetX) {
    var position = offsetX;
    if (position > max - 5) {
      position = max - 5;
    } else if (position <= 5) {
      position = 5;
    }
    var date = timeline.x.invert(position);
    if (models.date[id] !== date) {
      models.date.select(date, id);
    }
  };
  var debounceDateSelect = lodashDebounce(dateSelect, DEBOUNCE_TIME);
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
  var showPickHoverDate = function(e, id, offsetX) {
    if (offsetX < max - 5 && offsetX > 5) {
      let date = timeline.x.invert(offsetX);
      ui.timeline.pick.hoverDate(date, true);
    }
  };
  var removeTicks = function() {
    ui.timeline.ticks.label.remove();
    updateState();
  };
  init();
  return self;
}
