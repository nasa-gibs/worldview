import util from './util/util';
import { dateLabel } from './date/label';

// compare
// import { compareUi } from './compare/ui';
import { alertUi } from './alert/ui';
// Timeline
import dateWheels from './date/wheels';
import { timeline } from './date/timeline';
import { timelineData } from './date/timeline-data';
import { timelineConfig } from './date/config';
import { timelineZoom } from './date/timeline-zoom';
import { timelineTicks } from './date/timeline-ticks';
import { timelinePick } from './date/timeline-pick';
import { timelinePan } from './date/timeline-pan';
import { timelineInput } from './date/timeline-input';
import { timelineCompare } from './date/compare-picks';
// Tour
// import { tourUi } from './tour/ui';
import { layersActive } from './layers/active';
import { mapui } from './map/ui';
import { mapAnimate } from './map/animate';
import { animationUi } from './animation/ui';
import { animationWidget } from './animation/widget';
import { animationRangeSelect } from './animation/range-select';
import { animationGif } from './animation/gif';
import { debugLayers } from './debug';
import { dataUi } from './map/data/ui';
import naturalEventsUI from './map/natural-events/ui';

/**
 *  Legacy UI Rendering
 * @param {Object} models | Legacy Models Object
 * @param {Object} config
 * @param {Object} MapMouseEvents | Map events object that is registered here and used in react to render coords
 */
export function combineUi(models, config, MapMouseEvents, store) {
  let ui = {};
  ui.map = mapui(models, config, store);
  ui.map.animate = mapAnimate(config, ui, store);
  if (config.features.tour) {
    // ui.alert = alertUi(ui, config);
    // ui.tour = tourUi(models, ui, config);
  }
  ui.activeLayers = layersActive(models, ui, config);
  // ui.addModal = layersModal(models, ui, config);
  // ui.layerSettingsModal = layersOptions(models, ui, config);
  // Test via a getter in the options object to see if the passive property is accessed
  ui.supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function() {
        ui.supportsPassive = true;
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {
    util.warn(e);
  }
  function timelineInit() {
    ui.timeline = timeline(models, config, ui);
    ui.timeline.data = timelineData(models, config, ui);
    ui.timeline.zoom = timelineZoom(models, config, ui);
    ui.timeline.ticks = timelineTicks(models, config, ui);
    ui.timeline.pick = timelinePick(models, config, ui);
    ui.timeline.pan = timelinePan(models, config, ui);
    ui.timeline.input = timelineInput(models, config, ui, store);
    ui.timeline.config = timelineConfig(models, config, ui);
    if (config.features.animation) {
      ui.anim = {};
      ui.anim.rangeselect = animationRangeSelect(models, config, ui); // SETS STATE: NEEDS TO LOAD BEFORE ANIMATION WIDGET
      ui.anim.widget = animationWidget(models, config, ui);
      ui.anim.gif = animationGif(models, config, ui);
      ui.anim.ui = animationUi(models, ui);
    }
    if (config.features.compare) {
      ui.timeline.compare = timelineCompare(models, config, ui);
    }

    ui.dateLabel = dateLabel(models);
  }
  if (config.startDate) {
    if (!util.browser.small) {
      // If mobile device, do not build timeline
      timelineInit();
    }
    ui.dateWheels = dateWheels(models, config);
  }
  if (config.features.dataDownload) {
    ui.data = dataUi(models, store, ui, config);
  }
  if (config.features.naturalEvents) {
    ui.naturalEvents = naturalEventsUI(models, ui, config, store);
  }
  registerMapMouseHandlers(ui.map.proj, MapMouseEvents);
  // Sink all focus on inputs if click unhandled
  $(document).click(function(event) {
    if (event.target.nodeName !== 'INPUT') {
      $('input').blur();
    }
  });
  debugLayers(ui, models, config);
  // Reset Worldview when clicking on logo
  $(document).click(function(e) {
    if (e.target.id === 'wv-logo') resetWorldview(e);
  });
  document.activeElement.blur();
  $('input').blur();

  return ui;
}
function registerMapMouseHandlers(maps, events) {
  Object.values(maps).forEach(map => {
    let element = map.getTargetElement();
    let crs = map
      .getView()
      .getProjection()
      .getCode();
    element.addEventListener('mousemove', event => {
      events.trigger('mousemove', event, map, crs);
    });
    element.addEventListener('mouseout', event => {
      events.trigger('mouseout', event, map, crs);
    });
  });
}
var resetWorldview = function(e) {
  e.preventDefault();
  if (window.location.search === '') return; // Nothing to reset
  var msg =
    'Do you want to reset Worldview to its defaults? You will lose your current state.';
  if (confirm(msg)) document.location.href = '/';
};
