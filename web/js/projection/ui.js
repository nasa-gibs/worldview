import $ from 'jquery';
import 'jquery-ui/effect-slide';
import 'jquery-ui/button';
import 'jquery-ui/menu';
import lodashEach from 'lodash/each';
import wvui from '../ui/ui';

export function projectionUi(models, config) {
  var self = {};
  var $button;
  var $label;
  var $menuItems;

  var selector = '#wv-proj-button';

  var init = function () {
    if (config.ui && config.ui.projections) {
      render();
    }
  };

  var render = function () {
    $button = $('<input></input>')
      .attr('type', 'checkbox')
      .attr('id', 'wv-proj-button-check');
    $label = $('<label></label>')
      .attr('for', 'wv-proj-button-check')
      .attr('title', 'Switch projection');
    var $icon = $('<i></i>')
      .addClass('fa')
      .addClass('fa-globe')
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
      var checked = $('#wv-proj-button-check')
        .prop('checked');
      if (checked) {
        show();
      }
    });
  };

  var show = function () {
    var $menu = wvui.getMenu()
      .attr('id', 'wv-proj-menu');
    $menuItems = $('<ul></ul>');

    lodashEach(config.ui.projections, function (ui) {
      var $item = $(
        '<li data-proj=\'' + ui.id + '\'>' +
        '<a data-proj=\'' + ui.id + '\'>' +
        '<i class=\'ui-icon icon-large ' + ui.style + '\'>' +
        '</i>' + ui.name + '</a></li>');
      $menuItems.append($item);
      $item.click(function () {
        models.proj.select(ui.id);
        $('#wv-proj-button-check')
          .prop('checked', false);
        $button.button('refresh');
      });
    });
    $menu.append($menuItems);

    $menuItems.menu();
    wvui.positionMenu($menuItems, {
      my: 'left top',
      at: 'left bottom+5',
      of: $label
    });
    $menuItems.hide();
    $menuItems.show('slide', {
      direction: 'up'
    });
    $('#wv-proj-menu li')
      .removeClass('wv-menu-item-selected');
    $('#wv-proj-menu li[data-proj=\'' + models.proj.selected.id + '\']')
      .addClass('wv-menu-item-selected');

    var clickOut = function (event) {
      if ($button.parent()
        .has(event.target)
        .length > 0) {
        return;
      }
      $menuItems.hide();
      $('#wv-proj-button-check')
        .prop('checked', false);
      $('#wv-proj-button label')
        .removeClass('ui-state-hover');
      $button.button('refresh');
      $('body')
        .off('click', clickOut)
        .off('touchstart', clickOut);
    };
    $menuItems.on('touchstart', function (event) {
      event.stopPropagation();
    });
    $('body')
      .one('click', clickOut)
      .one('touchstart', clickOut);
  };

  init();
  return self;
};
