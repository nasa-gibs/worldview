import $ from 'jquery';
import 'jquery-ui/dialog';
import 'perfect-scrollbar/jquery';
import lodashEach from 'lodash/each';
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
    var $layerDescription = $('<div>', {
      id: 'layer-description',
      'class': 'layer-description'
    });
    var $layerDateRange = $('<div>', {
      id: 'layer-date-range',
      'class': 'layer-date-range'
    });
    var $layerDateStart = $('<span>', {
      id: 'layer-date-start',
      'class': 'layer-date-start'
    });
    var $layerDateEnd = $('<span>', {
      id: 'layer-date-end',
      'class': 'layer-date-end'
    });
    var $layerDateWrap = $('<p>', {
      id: 'layer-date-wrap',
      'class': 'layer-date-wrap'
    });
    var $layerDateRangesButton = $('<a>', {
      id: 'layer-date-ranges-button',
      'class': 'layer-date-ranges-button',
      'text': '*Show All Date Ranges'
    });
    var $layerDateRanges = $('<ul>', {
      id: 'layer-date-ranges',
      'class': 'list-group layer-date-ranges',
      'style': 'display: none'
    });
    var $layerMeta = $('<div>', {
      id: 'layer-metadata',
      'class': 'layer-metadata'
    });

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
      if (layer.dateRanges) if ((layer.dateRanges).length > 1) $layerDateEnd.append('*');
      if (layer.id) $layerDateEnd.attr('id', layer.id + '-endDate');
      $layerDateRange.append($layerDateEnd);
      $layerDescription.append($layerDateRange);
    }

    if (layer.dateRanges) {
      if ((layer.dateRanges).length > 1) {
        $layerDateWrap.append($layerDateRangesButton);
        $layerDateWrap.append($layerDateRanges);
        $layerDescription.append($layerDateWrap);
        lodashEach(layer.dateRanges, function(dateRange) {
          let rangeStartDate = util.parseDate(dateRange.startDate);
          let rangeEndDate = util.parseDate(dateRange.endDate);
          if (layer.period !== 'subdaily') {
            rangeStartDate = rangeStartDate.getDate() + ' ' + util.giveMonth(rangeStartDate) + ' ' +
             rangeStartDate.getFullYear();
            rangeEndDate = rangeEndDate.getDate() + ' ' + util.giveMonth(rangeEndDate) + ' ' +
             rangeEndDate.getFullYear();
          } else {
            rangeStartDate = rangeStartDate.getDate() + ' ' + util.giveMonth(rangeStartDate) + ' ' +
            rangeStartDate.getFullYear() + ' ' + util.pad(rangeStartDate.getHours(), 2, '0') + ':' +
            util.pad(rangeStartDate.getMinutes(), 2, '0');
            rangeEndDate = rangeEndDate.getDate() + ' ' + util.giveMonth(rangeEndDate) + ' ' +
            rangeEndDate.getFullYear() + ' ' + util.pad(rangeEndDate.getHours(), 2, '0') + ':' +
            util.pad(rangeEndDate.getMinutes(), 2, '0');
          }
          $layerDateRanges.append('<li class="list-group-item">' + rangeStartDate + ' - ' +
          rangeEndDate + '</li>');
        });
        $layerDateRangesButton.click(function(e) {
          var text = $(this).text();
          e.preventDefault();
          if (text === '*Show All Date Ranges') {
            $layerDateRangesButton.text('*Hide All Date Ranges');
            $layerDateRanges.css('display', 'block');
          } else {
            $layerDateRangesButton.text('*Show All Date Ranges');
            $layerDateRanges.css('display', 'none');
          }
          $('#wv-layers-info-dialog').perfectScrollbar('update');
        });
      }
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

  var onLayerRemoved = function (removedLayer) {
    if (layer.id === removedLayer.id && $dialog) {
      $dialog.dialog('close');
    }
  };

  init();
  return self;
};
