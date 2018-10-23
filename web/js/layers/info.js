import 'jquery-ui-bundle/jquery-ui';
import 'perfect-scrollbar/jquery';
import lodashForEachRight from 'lodash/forEachRight';
import wvui from '../ui/ui';
import util from '../util/util';

export function layersInfo(config, models, layer) {
  var $dialog;
  var self = {};

  var init = function() {
    loaded();
  };

  var loaded = function(custom) {
    var names;

    $dialog = wvui.getDialog();
    $dialog
      .addClass('wv-layers-info-dialog')
      .attr('id', 'wv-layers-info-dialog')
      .attr('data-layer', layer.id);
    renderDescription($dialog);
    names = models.layers.getTitles(layer.id);
    $dialog.dialog({
      dialogClass: 'wv-panel wv-info-panel wv-info-panel-' + layer.id,
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
        of: $('#productsHolder')
      },
      // Wait for the dialog box to load, then force scroll to top
      open: function() {
        $(this)
          .parent()
          .promise()
          .done(function() {
            $('.ui-dialog-content').scrollTop('0');
          });
      },
      closeText: '',
      close: dispose
    });

    $('#wv-layers-info-dialog').perfectScrollbar();

    models.layers.events.on('remove', onLayerRemoved);
  };

  var dispose = function() {
    $dialog = null;
    wvui.closeDialog();
  };

  // this function takes an array of date ranges in this format:
  // [{ layer.period, dateRanges.startDate: Date, dateRanges.endDate: Date, dateRanges.dateInterval: Number}]
  // the array is first sorted, and then checked for any overlap
  var dateOverlap = function(period, dateRanges) {
    var sortedRanges = dateRanges.sort((previous, current) => {
      // get the start date from previous and current
      var previousTime = util.parseDate(previous.startDate);
      previousTime = previousTime.getTime();
      var currentTime = util.parseDate(current.startDate);
      currentTime = currentTime.getTime();

      // if the previous is earlier than the current
      if (previousTime < currentTime) {
        return -1;
      }

      // if the previous time is the same as the current time
      if (previousTime === currentTime) {
        return 0;
      }

      // if the previous time is later than the current time
      return 1;
    });

    var result = sortedRanges.reduce(
      (result, current, idx, arr) => {
        // get the previous range
        if (idx === 0) {
          return result;
        }
        var previous = arr[idx - 1];

        // check for any overlap
        var previousEnd = util.parseDate(previous.endDate);
        // Add dateInterval
        if (previous.dateInterval > 1 && period === 'daily') {
          previousEnd = new Date(
            previousEnd.setTime(
              previousEnd.getTime() +
                (previous.dateInterval * 86400000 - 86400000)
            )
          );
        }
        if (period === 'monthly') {
          previousEnd = new Date(
            previousEnd.setMonth(
              previousEnd.getMonth() + (previous.dateInterval - 1)
            )
          );
        } else if (period === 'yearly') {
          previousEnd = new Date(
            previousEnd.setFullYear(
              previousEnd.getFullYear() + (previous.dateInterval - 1)
            )
          );
        }
        previousEnd = previousEnd.getTime();

        var currentStart = util.parseDate(current.startDate);
        currentStart = currentStart.getTime();

        var overlap = previousEnd >= currentStart;
        // store the result
        if (overlap) {
          // yes, there is overlap
          result.overlap = true;
          // store the specific ranges that overlap
          result.ranges.push({
            previous: previous,
            current: current
          });
        }

        return result;
      },
      {
        overlap: false,
        ranges: []
      }
    );

    // return the final results
    return result;
  };

  var renderDescription = function($dialog) {
    var startDate, endDate;
    var $layerDescription = $('<div>', {
      id: 'layer-description',
      class: 'layer-description'
    });
    var $layerDateRange = $('<div>', {
      id: 'layer-date-range',
      class: 'layer-date-range'
    });
    var $layerDateStart = $('<span>', {
      id: 'layer-date-start',
      class: 'layer-date-start'
    });
    var $layerDateEnd = $('<span>', {
      id: 'layer-date-end',
      class: 'layer-date-end'
    });
    var $layerDateWrap = $('<div>', {
      id: 'layer-date-wrap',
      class: 'layer-date-wrap d-none'
    });
    var $layerDateRangesButton = $('<a>', {
      id: 'layer-date-ranges-button',
      class: 'layer-date-ranges-button',
      title: 'View all date ranges'
    });
    var $layerDateRanges = $('<ul>', {
      id: 'layer-date-ranges',
      class: 'list-group layer-date-ranges'
    });
    var $layerMeta = $('<div>', {
      id: 'layer-metadata',
      class: 'layer-metadata'
    });

    if (layer.startDate) {
      startDate = util.parseDate(layer.startDate);
      if (layer.period === 'subdaily') {
        startDate =
          startDate.getDate() +
          ' ' +
          util.giveMonth(startDate) +
          ' ' +
          startDate.getFullYear() +
          ' ' +
          util.pad(startDate.getHours(), 2, '0') +
          ':' +
          util.pad(startDate.getMinutes(), 2, '0');
      } else if (layer.period === 'yearly') {
        startDate = startDate.getFullYear();
      } else if (layer.period === 'monthly') {
        startDate = util.giveMonth(startDate) + ' ' + startDate.getFullYear();
      } else {
        startDate =
          startDate.getDate() +
          ' ' +
          util.giveMonth(startDate) +
          ' ' +
          startDate.getFullYear();
      }
      $layerDateStart.html('Temporal coverage: ' + startDate + ' - ');
      if (layer.id) $layerDateStart.attr('id', layer.id + '-startDate');
      $layerDateRange.append($layerDateStart);

      if (layer.endDate) {
        endDate = util.parseDate(layer.endDate);
        if (layer.period === 'subdaily') {
          endDate =
            endDate.getDate() +
            ' ' +
            util.giveMonth(endDate) +
            ' ' +
            endDate.getFullYear() +
            ' ' +
            util.pad(endDate.getHours(), 2, '0') +
            ':' +
            util.pad(endDate.getMinutes(), 2, '0');
        } else if (layer.period === 'yearly') {
          endDate = new Date(endDate.setFullYear(endDate.getFullYear() - 1));
          endDate = endDate.getFullYear();
        } else if (layer.period === 'monthly') {
          endDate = new Date(endDate.setMonth(endDate.getMonth() - 1));
          endDate = util.giveMonth(endDate) + ' ' + endDate.getFullYear();
        } else {
          if (
            layer.dateRanges &&
            layer.dateRanges.slice(-1)[0].dateInterval !== '1'
          ) {
            endDate = new Date(endDate.setTime(endDate.getTime() - 86400000));
          }
          endDate =
            endDate.getDate() +
            ' ' +
            util.giveMonth(endDate) +
            ' ' +
            endDate.getFullYear();
        }
        $layerDateEnd.html(endDate);
      } else {
        $layerDateEnd.append('Present');
      }
      if (layer.id) $layerDateEnd.attr('id', layer.id + '-endDate');
      $layerDateRange.append($layerDateEnd);
      $layerDescription.append($layerDateRange);
    }
    // If the layer has date ranges...
    if (layer.dateRanges && layer.dateRanges.length > 1) {
      var firstDateRange = true;
      $layerDateWrap.append('<p>Date Ranges:</p>', $layerDateRanges);
      $layerDescription.append($layerDateWrap);

      // Start creating an array of date ranges without overlapping dates //

      var dateRanges = dateOverlap(layer.period, layer.dateRanges);

      if (dateRanges.overlap === false) {
        if (layer.dateRanges && layer.dateRanges.length > 1) {
          $layerDateEnd.append(
            $layerDateRangesButton.append(' <sup>*View Dates</sup>')
          );
        }
        lodashForEachRight(layer.dateRanges, function(dateRange, index) {
          let rangeStartDate = dateRange.startDate;
          let rangeEndDate = dateRange.endDate;
          rangeStartDate = util.parseDate(rangeStartDate);
          rangeEndDate = util.parseDate(rangeEndDate);
          if (layer.period === 'yearly') {
            if (
              dateRange.dateInterval === '1' &&
              dateRange.startDate === dateRange.endDate
            ) {
              rangeStartDate = rangeStartDate.getFullYear();
              $layerDateRanges.append(
                '<li class="list-group-item">' + rangeStartDate + '</li>'
              );
            } else {
              rangeStartDate = rangeStartDate.getFullYear();
              if (dateRange.dateInterval !== '1') {
                rangeEndDate = new Date(
                  rangeEndDate.setFullYear(
                    rangeEndDate.getFullYear() + (dateRange.dateInterval - 1)
                  )
                );
              }
              rangeEndDate = rangeEndDate.getFullYear();
              if (firstDateRange) {
                if (layer.endDate === undefined) {
                  rangeEndDate = 'Present';
                } else if (
                  util.parseDate(layer.endDate) <= util.today() &&
                  !layer.inactive
                ) {
                  rangeEndDate = 'Present';
                }
                firstDateRange = false;
              }
              $layerDateRanges.append(
                '<li class="list-group-item">' +
                  rangeStartDate +
                  ' - ' +
                  rangeEndDate +
                  '</li>'
              );
            }
          } else if (layer.period === 'monthly') {
            if (
              dateRange.dateInterval === '1' &&
              dateRange.startDate === dateRange.endDate
            ) {
              rangeStartDate =
                util.giveMonth(rangeStartDate) +
                ' ' +
                rangeStartDate.getFullYear();
              $layerDateRanges.append(
                '<li class="list-group-item">' + rangeStartDate + '</li>'
              );
            } else {
              rangeStartDate =
                util.giveMonth(rangeStartDate) +
                ' ' +
                rangeStartDate.getFullYear();
              if (dateRange.dateInterval !== '1') {
                rangeEndDate = new Date(
                  rangeEndDate.setMonth(
                    rangeEndDate.getMonth() + (dateRange.dateInterval - 1)
                  )
                );
              }
              rangeEndDate =
                util.giveMonth(rangeEndDate) + ' ' + rangeEndDate.getFullYear();
              if (firstDateRange) {
                if (layer.endDate === undefined) {
                  rangeEndDate = 'Present';
                } else if (
                  util.parseDate(layer.endDate) <= util.today() &&
                  !layer.inactive
                ) {
                  rangeEndDate = 'Present';
                }
                firstDateRange = false;
              }
              $layerDateRanges.append(
                '<li class="list-group-item">' +
                  rangeStartDate +
                  ' - ' +
                  rangeEndDate +
                  '</li>'
              );
            }
          } else if (layer.period === 'daily') {
            if (
              dateRange.dateInterval === '1' &&
              dateRange.startDate === dateRange.endDate
            ) {
              rangeStartDate =
                rangeStartDate.getDate() +
                ' ' +
                util.giveMonth(rangeStartDate) +
                ' ' +
                rangeStartDate.getFullYear();
              $layerDateRanges.append(
                '<li class="list-group-item">' + rangeStartDate + '</li>'
              );
            } else {
              rangeStartDate =
                rangeStartDate.getDate() +
                ' ' +
                util.giveMonth(rangeStartDate) +
                ' ' +
                rangeStartDate.getFullYear();
              if (dateRange.dateInterval !== '1') {
                rangeEndDate = new Date(
                  rangeEndDate.setTime(
                    rangeEndDate.getTime() +
                      (dateRange.dateInterval * 86400000 - 86400000)
                  )
                );
              }
              rangeEndDate =
                rangeEndDate.getDate() +
                ' ' +
                util.giveMonth(rangeEndDate) +
                ' ' +
                rangeEndDate.getFullYear();
              if (firstDateRange) {
                if (layer.endDate === undefined) {
                  rangeEndDate = 'Present';
                } else if (
                  util.parseDate(layer.endDate) <= util.today() &&
                  !layer.inactive
                ) {
                  rangeEndDate = 'Present';
                }
                firstDateRange = false;
              }
              $layerDateRanges.append(
                '<li class="list-group-item">' +
                  rangeStartDate +
                  ' - ' +
                  rangeEndDate +
                  '</li>'
              );
            }
          } else if (layer.period === 'subdaily') {
            rangeStartDate =
              rangeStartDate.getDate() +
              ' ' +
              util.giveMonth(rangeStartDate) +
              ' ' +
              rangeStartDate.getFullYear() +
              ' ' +
              util.pad(rangeStartDate.getHours(), 2, '0') +
              ':' +
              util.pad(rangeStartDate.getMinutes(), 2, '0');
            rangeEndDate =
              rangeEndDate.getDate() +
              ' ' +
              util.giveMonth(rangeEndDate) +
              ' ' +
              rangeEndDate.getFullYear() +
              ' ' +
              util.pad(rangeEndDate.getHours(), 2, '0') +
              ':' +
              util.pad(rangeEndDate.getMinutes(), 2, '0');
            if (firstDateRange) {
              if (layer.endDate === undefined) {
                rangeEndDate = 'Present';
              } else if (
                util.parseDate(layer.endDate) <= util.today() &&
                !layer.inactive
              ) {
                rangeEndDate = 'Present';
              }
              firstDateRange = false;
            }
            $layerDateRanges.append(
              '<li class="list-group-item">' +
                rangeStartDate +
                ' - ' +
                rangeEndDate +
                '</li>'
            );
          }
        });
      }

      $layerDateRangesButton.click(function(e) {
        e.preventDefault();
        $layerDateWrap.toggleClass('d-none');
        $('#wv-layers-info-dialog').perfectScrollbar('update');
      });
    }

    if (layer.description) {
      $.get('config/metadata/' + layer.description + '.html').done(function(
        data
      ) {
        $layerMeta.html(data);
        $layerDescription.append($layerMeta);
        $layerMeta.find('a').attr('target', '_blank');
      });
    }

    $dialog.append($layerDescription);
  };

  var onLayerRemoved = function(removedLayer) {
    if (layer.id === removedLayer.id && $dialog) {
      $dialog.dialog('close');
    }
  };

  init();
  return self;
}
