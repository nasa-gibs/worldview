import $ from 'jquery';
import 'jquery-ui/dialog';
import 'perfect-scrollbar/jquery';
import wvui from '../ui/ui';
import util from '../util/util';

export function layersInfo(config, models, layer) {
  var $dialog;
  var self = {};

  var init = function () {
    loaded();
  };

  var loaded = function (custom) {
    var names;

    $dialog = wvui.getDialog();
    $dialog
      .addClass('wv-layers-info-dialog')
      .attr('id', 'wv-layers-info-dialog')
      .attr('data-layer', layer.id);
    renderDescription($dialog);

    names = models.layers.getTitles(layer.id);
    $dialog.dialog({
      dialogClass: 'wv-panel',
      title: names.title,
      show: {
        effect: 'slide',
        direction: 'left'
      },
      width: 450,
      minHeight: 150,
      maxHeight: 300,
      resizable: false,
      draggable: false,
      position: {
        my: 'left top',
        at: 'right+5 top',
        of: $('#products')
      },
      // Wait for the dialog box to load, then force scroll to top
      open: function () {
        $(this)
          .parent()
          .promise()
          .done(function () {
            $('.ui-dialog-content')
              .scrollTop('0');
          });
      },
      close: dispose
    });

    $('#wv-layers-info-dialog')
      .perfectScrollbar();

    models.layers.events
      .on('remove', onLayerRemoved);
  };

  var dispose = function () {
    $dialog = null;
    wvui.closeDialog();
  };

  var renderDescription = function ($dialog) {
    var startDate, endDate;
    var $layerDescription = $('<div></div>')
      .addClass('layer-description');
    var $layerDateRange = $('<p></p>')
      .addClass('layer-date-range');
    var $layerDateStart = $('<span></span>')
      .addClass('layer-date-start');
    var $layerDateEnd = $('<span></span>')
      .addClass('layer-date-end');
    var $layerMeta = $('<div></div>')
      .addClass('layer-metadata');

    if (layer.startDate) {
      startDate = util.parseDate(layer.startDate);
      if (layer.period !== 'subdaily') {
        startDate = startDate.getDate() + ' ' + util.giveMonth(startDate) + ' ' +
         startDate.getFullYear();
      } else {
        startDate = startDate.getDate() + ' ' + util.giveMonth(startDate) + ' ' +
        startDate.getFullYear() + ' ' + util.pad(startDate.getHours(), 2, '0') + ':' +
        util.pad(startDate.getMinutes(), 2, '0');
      }
      $layerDateStart.html('Temporal coverage: ' + startDate + ' - ');
      if (layer.id) $layerDateStart.attr('id', layer.id + '-startDate');
      $layerDateRange.append($layerDateStart);

      if (layer.endDate) {
        endDate = util.parseDate(layer.endDate);
        if (layer.period !== 'subdaily') {
          endDate = endDate.getDate() + ' ' + util.giveMonth(endDate) + ' ' +
          endDate.getFullYear();
        } else {
          endDate = endDate.getDate() + ' ' + util.giveMonth(endDate) + ' ' +
          endDate.getFullYear() + ' ' + util.pad(endDate.getHours(), 2, '0') + ':' +
          util.pad(endDate.getMinutes(), 2, '0');
        }
        $layerDateEnd.html(endDate);
      } else {
        $layerDateEnd.append('Present');
      }
      if (layer.id) $layerDateEnd.attr('id', layer.id + '-endDate');
      $layerDateRange.append($layerDateEnd);
      $layerDescription.append($layerDateRange);
    }

    if (layer.description) {
      $.get('config/metadata/' + layer.description + '.html')
        .success(function (data) {
          $layerMeta.html(data);
          $layerDescription.append($layerMeta);
          $layerMeta.find('a')
            .attr('target', '_blank');
        });
    }
    $dialog.append($layerDescription);
  };

  init();
  return self;
};
