import $ from 'jquery';
import 'jquery-ui/button';
import 'jquery-ui/dialog';
import 'jquery-ui/menu';
import wvui from './ui';
import util from '../util/util';
import feedbackModal from '../feedback';

export function uiInfo (ui, config) {
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
    var $alerts, $new;
    var whatsNewUrl = 'https://github.com/nasa-gibs/worldview/releases';
    var $menuItems = $('<ul></ul>');
    var $feedback = $('<li><a class=\'feedback\'><i class=\'ui-icon fa fa-envelope fa-fw\'></i>Send Feedback</a></li>');
    var $tour = $('<li><a><i class=\'ui-icon fa fa-truck fa-fw\'></i>Start Tour</a></li>');
    var $about = $('<li><a><i class=\'ui-icon fa fa-file fa-fw\'></i>About</a></li>');
    var $source = $('<li><a><i class=\'ui-icon fa fa-code fa-fw\'></i>Source Code</a></li>');

    if (config.features.alert) {
      $alerts = ui.alert.getAlert();
      $new = ui.alert.getMessages();
      if (config.features.alert.releases) {
        whatsNewUrl = config.features.alert.releases;
      }
    }
    if (!$new) {
      $new = $('<li><a target=\'_blank\' href=\'' + whatsNewUrl + '\'><i class=\'ui-icon fa fa-flag fa-fw\'></i>What\'s New</a></li>');
    }
    if (config.features.feedback) {
      $menuItems.append($feedback);
    }
    if (config.features.tour) {
      $menuItems.append($tour);
    }
    $menuItems.append($source);
    $menuItems.append($about);
    if (config.features.whatsNew) {
      $menuItems.append($new);
    }
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
      if (util.browser.small || util.browser.touchDevice) {
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
            }
          })
          .load('pages/about.html?v=@BUILD_NONCE@ #page')
          .addClass('wv-opaque');
      }
    });
    $source.click(function (e) {
      window.open('https://github.com/nasa-gibs/worldview', '_blank');
    });

    feedbackModal.decorate($feedback.find('a'));

    $tour.click(function () {
      ui.tour.start();
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
