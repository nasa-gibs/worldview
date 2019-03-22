import 'jquery-ui-bundle/jquery-ui';
import wvui from './ui';
import util from '../util/util';
import { feedbackUi } from '../feedback';

export function uiInfo (ui, config) {
  var feedbackDialog = feedbackUi();
  var selector = '#wv-info-button';
  var $button = $('<input />')
    .attr('type', 'checkbox')
    .attr('id', 'wv-info-button-check');
  var $label = $('<label></label>')
    .attr('for', 'wv-info-button-check')
    .attr('title', 'Information');
  var $icon = $('<i></i>')
    .addClass('fa')
    .addClass('fa-info-circle')
    .addClass('fa-2x');
  $label.append($icon);
  $(selector)
    .append($label);
  $(selector)
    .append($button);

  $button.button({
    text: false
  });

  $button.click(function (event) {
    event.stopPropagation();
    wvui.close();
    var checked = $('#wv-info-button-check')
      .prop('checked');
    if (checked) {
      show();
    }
  });

  var show = function () {
    var $menu = wvui.getMenu()
      .attr('id', 'wv-info-menu');
    var $alerts;
    var whatsNewUrl = 'https://github.com/nasa-gibs/worldview/releases';
    var $menuItems = $('<ul></ul>');
    var $feedback = $('<li><a class=\'feedback\' href=\'mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool\'><i class=\'ui-icon fa fa-envelope fa-fw\'></i>Send Feedback</a></li>');
    var $tour = $('<li><a><i class=\'ui-icon fa fa-truck fa-fw\'></i>Explore Worldview</a></li>');
    var $about = $('<li><a><i class=\'ui-icon fa fa-file fa-fw\'></i>About</a></li>');
    var $source = $('<li><a><i class=\'ui-icon fa fa-code fa-fw\'></i>Source Code</a></li>');
    var $new = $('<li><a target=\'_blank\' href=\'' + whatsNewUrl + '\'><i class=\'ui-icon fa fa-flag fa-fw\'></i>What\'s New</a></li>');

    if (config.features.notification) {
      $alerts = ui.notification.getAlert();
    }
    if (config.features.feedback) {
      $menuItems.append($feedback);
    }
    if (config.features.tour && config.stories && config.storyOrder && window.innerWidth >= 740 && window.innerHeight >= 450) {
      $menuItems.append($tour);
    }
    $menuItems.append($source);
    $menuItems.append($about);
    $menuItems.append($new);
    if ($alerts) {
      $menuItems.append($alerts);
    }
    $menuItems.append($about);
    $menu.append($menuItems);

    $menuItems.menu();
    wvui.positionMenu($menuItems, {
      my: 'left top',
      at: 'left bottom + 5',
      of: $label
    });
    $menuItems.hide();

    $about.click(function () {
      if (util.browser.small) {
        window.open('pages/about.html?v=@BUILD_NONCE@', '_blank');
      } else {
        wvui.getDialog()
          .dialog({
            title: 'About',
            width: 625,
            height: 525,
            show: {
              effect: 'fade'
            },
            hide: {
              effect: 'fade'
            },
            closeText: ''
          })
          .load('pages/about.html?v=@BUILD_NONCE@ #page')
          .addClass('wv-opaque');
      }
    });
    $source.click(function (e) {
      window.open('https://github.com/nasa-gibs/worldview', '_blank');
    });

    $feedback.click(function (event) {
      event.preventDefault();
      feedbackDialog.showFeedback();
    });

    $tour.click(function () {
      ui.tour.startTour();
    });

    $('#wv-toolbar')
      .find('input:not(#wv-info-button-check)')
      .prop('checked', false)
      .button('refresh');
    $menuItems.show('slide', {
      direction: 'up'
    });

    var clickOut = function (event) {
      if ($button.parent()
        .has(event.target)
        .length > 0) {
        return;
      }
      $menuItems.hide();
      $('#wv-info-button-check')
        .prop('checked', false);
      $('#wv-info-button')
        .find('label')
        .removeClass('ui-state-hover');
      $button.button('refresh');
      $('body')
        .off('click', clickOut)
        .off('touchstart', clickOut);
    };
    $menuItems.on('touchstart', function (event) {
      event.stopPropagation();
    });
    $('html')
      .one('click', clickOut)
      .one('touchstart', clickOut);
  };
};
