import $ from 'jquery';
import 'jquery-ui/dialog';
import 'jquery.joyride';
import util from './util/util';
import wvui from './ui/ui';
import { GA as googleAnalytics } from 'worldview-components';
import feedbackModal from './feedback';

export default function (models, ui, config) {
  var self = {};

  var init = function () {
    $('#wv-tour')
      .click(function () {
        self.start();
      });
    self.introduction();
  };

  self.introduction = function () {
    if (!config.features.tour) {
      return;
    }

    // Don't start tour if coming in via a permalink
    if (window.location.search && !config.parameters.tour) {
      return;
    }

    // Tour does not work on IE 9 or below
    if (util.browser.ie && util.browser.version <= 9) {
      return;
    }

    // Don't annoy with the tour if they cannot opt out in the future
    if (!util.browser.localStorage) {
      return;
    }

    // Don't show tour if the user has opted out
    if (localStorage.getItem('hideSplash')) {
      return;
    }

    // Don't show tour on small screens
    if (!validScreenSize()) {
      return;
    }

    self.start(true);
  };

  /**
   * Create the splash screen and tour panels and control iteration over them.
   */
  self.start = function (introduction) {
    if (util.browser.ie && util.browser.version <= 9) {
      wvui.unsupported('tour');
      return;
    }

    if (!validScreenSize()) {
      wvui.notify('Unfortunately the @NAME@ tour can only be viewed in larger web browser windows.');
      return;
    }

    var $content = $('#wv-tour-content');
    if ($content.children()
      .length === 0) {
      $content.load('pages/tour.html', function () {
        onLoad(introduction);
      });
    } else {
      onLoad(introduction);
    }
  };

  var onLoad = function (introduction) {
    wvui.close();
    var $startDialog = $('#wv-tour-intro');
    $startDialog
      .dialog({
        title: 'Welcome to @NAME@!',
        dialogClass: 'tour',
        modal: true,
        width: 700,
        height: 'auto',
        draggable: false,
        resizable: false
      });

    if (introduction) {
      $('#wv-tour-skip')
        .show();
    } else {
      $('#wv-tour-skip')
        .hide();
    }

    var mapAnchor = document.getElementById('mapPanelTourAnchor');
    if (!mapAnchor) {
      var owner = document.getElementById('wv-map');
      mapAnchor = document.createElement('div');
      mapAnchor.setAttribute('id', 'mapPanelTourAnchor');
      mapAnchor.setAttribute('style', 'float:right; height:68px; right:14px; top:90px; width:36px; position:relative; z-index:-1');
      owner.appendChild(mapAnchor);
    }

    var endTour = function () {
      wvui.close();
      var $dialog = $('#wv-tour-end');
      $dialog
        .dialog({
          title: 'Finished!',
          dialogClass: 'tour',
          modal: true,
          width: 600,
          height: 'auto',
          draggable: false,
          resizable: false
        });
      feedbackModal.decorate($dialog.find('.feedback'));
      $('#repeat')
        .click(repeatTour);
      $('#done')
        .click(handleDone);
    };

    /*
     * Restart the tour at the beginning.
     */
    var repeatTour = function (e) {
      e.stopPropagation();
      $('.ui-dialog-content')
        .dialog('close');
      $('#joyRideTipContent')
        .joyride({
          autoStart: true,
          includepage: true,
          template: {
            'link': '<a href="#" class="joyride-close-tip">X</a>'
          },
          postStepCallback: function (index, tip) {
            if (index === 5) {
              endTour();
            }
          }
        });
    };

    /*
     * Hide the tour.
     */
    var handleDone = function (e) {
      e.stopPropagation();
      $('.ui-dialog-content')
        .dialog('close');
    };

    /*
     * Close the splash and go straight to worldview.
     */
    var handleSkipTour = function () {
      $('.ui-dialog-content')
        .dialog('close');
    };

    var onStop = function (index, tip, button) {
      setTourState();
      googleAnalytics.event('Tour', 'Click', 'Post Tour View', index + 1);
      if (index === 5 && button === false) {
        endTour();
      }
    };

    /*
     * Close the splash and start the tour.
     */
    var handleTakeTour = function (e) {
      e.stopPropagation();
      $('.ui-dialog-content')
        .dialog('close');
      initTourState();
      googleAnalytics.event('Tour', 'Click', 'Take Tour');
      $('#joyRideTipContent')
        .joyride({
          autoStart: true,
          includepage: true,
          template: {
            'link': '<a href="#" class="joyride-close-tip">X</a>'
          },
          postStepCallback: onStop
        });
    };

    /*
     * Toggle the value of the "hideSplash" flag.
     */
    var setDoNotShow = function () {
      if (!util.browser.localStorage) return;
      var hideSplash = localStorage.getItem('hideSplash');
      localStorage.setItem('hideSplash', !hideSplash);
    };

    // assign events and start
    $('#takeTour')
      .click(handleTakeTour);
    $('#skipTour')
      .click(handleSkipTour);
    $('#dontShowAgain')
      .click(setDoNotShow);
  };

  var initTourState = function () {
    var map = ui.map.selected;
    models.proj.selectDefault();
    models.date.select(util.today());
    models.layers.reset();
    var leading = models.map.getLeadingExtent();
    map.getView()
      .fit(leading, map.getSize());
    setTourState();
  };

  var setTourState = function () {
    ui.sidebar.expandNow();
    ui.sidebar.selectTab('active');
    ui.timeline.expandNow();
    models.proj.selectDefault();
  };

  var validScreenSize = function () {
    var viewWidth = $(window)
      .width();
    var viewHeight = $(window)
      .height();
    return viewWidth > 800 && viewHeight > 680;
  };

  init();
  return self;
};
