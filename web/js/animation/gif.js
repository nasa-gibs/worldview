import $ from 'jquery';
import 'jquery-jcrop';
import React from 'react';
import ReactDOM from 'react-dom';
import GifStream from './gif-stream';
import lodashFind from 'lodash/find';
import lodashEach from 'lodash/each';
import lodashRound from 'lodash/round';
import lodashThrottle from 'lodash/throttle';
import lodashCapitalize from 'lodash/capitalize';
import canvg from 'canvg-browser';
import FileSaver from 'file-saver';
import { GA as googleAnalytics, GifResSelection } from 'worldview-components';
import {
  imageUtilGetLayerOpacities,
  imageUtilCalculateResolution,
  imageUtilGetLayers,
  imageUtilGetCoordsFromPixelValues,
  imageUtilGetConversionFactor
} from '../image/util';
import util from '../util/util';
import wvui from '../ui/ui';
import uiIndicator from '../ui/indicator';
const gifStream = new GifStream();

const conversionConstant = 3.6; // we are saying that the gif compresses each total by about 3.6x
const maxGifSize = 250;
const GRATICULE_WARNING =
  'The graticule layer cannot be used to take a snapshot. Would you ' +
  'like to hide this layer?';
const PALETTE_WARNING =
  'One or more layers on the map have been modified (changed palette, ' +
  'thresholds, etc.). These modifications cannot be used to take a ' +
  'snapshot. Would you like to temporarily revert to the original ' +
  'layer(s)?';
const ROTATE_WARNING = 'Image may not be downloaded when rotated. Would you like to reset rotation?';

const resolutionsGeo = {
  values: [
    { value: '0.125', text: '30m' },
    { value: '0.25', text: '60m' },
    { value: '0.5', text: '125m' },
    { value: '1', text: '250m' },
    { value: '2', text: '500m' },
    { value: '4', text: '1km' },
    { value: '20', text: '5km' },
    { value: '40', text: '10km' }
  ]
};
const resolutionsPolar = {
  values: [
    { value: '1', text: '250m' },
    { value: '2', text: '500m' },
    { value: '4', text: '1km' },
    { value: '20', text: '5km' },
    { value: '40', text: '10km' }
  ]
};

export function animationGif(models, config, ui) {
  var self = {};
  var jcropAPI = null;
  var animationCoordinates = null;
  var previousCoords = null;
  var animModel = models.anim;
  var $progress; // progress bar
  var loader;
  var showDates = true; // show date stamp
  var progressing = false; // if progress bar has started
  var panelCase;
  var resolution = null;
  var imgWidth;
  var imgHeight;
  var requestSize;
  var throttleSetDownloadButton;
  var lastRequestedDimensions = {};

  var renderPanel = function(options, mountEl) {
    return ReactDOM.render(
      React.createElement(GifResSelection, options),
      mountEl);
  };

  /*
   * sets listeners
   *
   *
   * @method init
   * @static
   *
   * @returns {void}
   *
   */
  self.init = function() {
    var options;
    models.anim.events.on('gif-click', setImageCoords);
    panelCase = document.createElement('div');
    panelCase.className = 'gif-dialog';
    throttleSetDownloadButton = lodashThrottle(setDownloadButtonClass, 300, { trailing: true });

    options = {
      resolution: '1',
      onSelectionChange: onSelectionChange,
      onClick: getGif,
      valid: true,
      resolutions: models.proj.selected.id === 'geographic' ? resolutionsGeo : resolutionsPolar,
      onCheck: onchecked,
      startDate: null,
      endDate: null,
      speed: null,
      maxGifSize: maxGifSize,
      checked: true,
      increment: lodashCapitalize(ui.anim.widget.getIncrements())
    };
    self.reactComponent = renderPanel(options, panelCase);
  };

  var getUpdatedProps = function() {
    var startDate, endDate;
    var state = animModel.rangeState;

    if (models.date.maxZoom < 4) {
      startDate = state.startDate.split('T')[0];
      endDate = state.endDate.split('T')[0];
    } else {
      startDate = state.startDate;
      endDate = state.endDate;
    }

    return {
      resolution: resolution,
      resolutions: models.proj.selected.id === 'geographic' ? resolutionsGeo : resolutionsPolar,
      valid: fileSizeValid(),
      fileSizeEstimate: lodashRound(requestSize / conversionConstant, 3),
      requestSize: lodashRound(requestSize, 3),
      imgHeight: lodashRound(imgHeight, 2),
      imgWidth: lodashRound(imgWidth, 2),
      startDate: startDate,
      endDate: endDate,
      speed: lodashRound(state.speed, 2),
      increment: lodashCapitalize(ui.anim.widget.getIncrements())
    };
  };

  var update = function(selectedRes, lonlats) {
    if (!animationCoordinates) return;
    var numDays, stateObj, dimensions, isGeoProjection;

    isGeoProjection = (models.proj.selected.id === 'geographic');
    resolution = selectedRes;
    stateObj = animModel.rangeState;
    numDays = util.getNumberOfDays(new Date(stateObj.startDate), new Date(stateObj.endDate), ui.anim.ui.getInterval());

    if (!resolution) {
      let currentZoom = Math.round(ui.map.selected.getView().getZoom());
      resolution = imageUtilCalculateResolution(currentZoom, isGeoProjection, models.proj.selected.resolutions);
    }
    dimensions = getDimensions(lonlats, models.proj.selected.id, resolution);
    imgWidth = dimensions[0];
    imgHeight = dimensions[1];

    requestSize = calulateFileSize(resolution, lonlats[0], lonlats[1], numDays, imgWidth, imgHeight);
    updatePanel(getUpdatedProps());
    throttleSetDownloadButton();
  };

  var updatePanel = function(options) {
    self.reactComponent.setState(options);
  };

  var onSelectionChange = function(selectedRes) {
    update(selectedRes, imageUtilGetCoordsFromPixelValues(animationCoordinates, ui.map.selected));
  };

  var fileSizeValid = function() {
    return (requestSize < maxGifSize && imgHeight !== 0 && imgWidth !== 0);
  };

  var setDownloadButtonClass = function() {
    var $iconCase;
    var boo;
    $iconCase = $('.wv-dl-gif-bt-case');
    if (!$iconCase.length) return;
    boo = fileSizeValid();

    if (!boo && !$iconCase.hasClass('disabled')) {
      $iconCase.addClass('disabled');
    } else if (boo && $iconCase.hasClass('disabled')) {
      $iconCase.removeClass('disabled');
    }
  };

  /*
   * Use class to create GIF
   *
   *
   * @method createGIF
   * @static
   *
   * @returns {void}
   *
   */
  self.createGIF = function() {
    var imageArra;
    var stampWidth;
    var build;
    var stampProps;
    var newImage;
    var breakPointOne = 300;
    var stampWidthRatio = 4.889;
    var stateObj = animModel.rangeState;
    var interval = stateObj.speed;
    var startDate = stateObj.startDate;
    var endDate = stateObj.endDate;

    lastRequestedDimensions.w = animationCoordinates.w;
    lastRequestedDimensions.h = animationCoordinates.h;
    loader = uiIndicator.loading();
    build = function(stamp, dateStamp, stampHeight) {
      var buildProgressBar = function() {
        $progress = $('<progress />') // display progress for GIF creation
          .attr('class', 'wv-gif-progress');
        wvui.getDialog()
          .append($progress)
          .dialog({ // dialog for progress
            title: 'Collecting Images...',
            width: 300,
            height: 100
          });
        $progress.attr('value', 0);
      };
      var onGifProgress = function(captureProgress) {
        $('#timeline-footer').removeClass('wv-anim-active');
        models.anim.rangeState.state = 'off';

        if (!progressing) {
          buildProgressBar();
          progressing = true;
          uiIndicator.hide(loader);
          $progress.parent()
            .dialog('option', 'title', 'Creating GIF...'); // set dialog title
        }
        $progress.attr('value', captureProgress / 100); // before value set, it is in indeterminate state
      };

      imageArra = getImageArray(startDate, endDate, interval);
      if (!imageArra) { // won't be true if there are too mant frames
        return;
      }
      gifStream.createGIF({
        'gifWidth': imgWidth,
        'gifHeight': imgHeight,
        'images': imageArra,
        'waterMarkXCoordinate': stampHeight * 0.01, // Margin based on GIF Height
        'waterMarkYCoordinate': stampHeight * 0.01, // Margin based on GIF Height
        'waterMarkHeight': stamp.height,
        'waterMark': stampHeight > 20 ? stamp : null,
        'waterMarkWidth': stamp.width,
        'fontSize': dateStamp.fontSize + 'px',
        'textXCoordinate': dateStamp.x,
        'textYCoordinate': dateStamp.y, // date location based on Dimensions
        'textAlign': dateStamp.align, // If textXCoordinate is null this takes precedence
        'textBaseline': 'top', // If textYCoordinate is null this takes precedence
        'fontColor': '#fff',
        'fontWeight': '300',
        'fontFamily': 'Open Sans, sans-serif',
        'progressCallback': onGifProgress,
        'showFrameText': stampHeight > 20,
        'extraLastFrameDelay': 1000,
        'text': '',
        'stroke': {
          'color': '#000',
          'pixels': dateStamp.fontSize * 0.05
        },
        'pause': 1
      }, onGifComplete);
    };
    stampProps = getStampProps(stampWidthRatio, breakPointOne, stampWidth);
    newImage = svgToPng('brand/images/wv-logo-w-shadow.svg', stampProps.stampHeight);

    build(newImage, stampProps.dateStamp, stampProps.stampHeight);
  };

  var svgToPng = function(svgURL, stampHeight) {
    var newImage;
    var canvasEl = document.createElement('canvas');
    var canvgOptions = {
      log: false,
      ignoreMouse: true,
      scaleHeight: stampHeight
    };
    canvg(canvasEl, svgURL, canvgOptions);
    newImage = new Image();
    newImage.src = canvasEl.toDataURL('image/png');
    newImage.width = canvasEl.width;
    newImage.height = canvasEl.height;

    return newImage;
  };

  var getStampProps = function(stampWidthRatio, breakPoint, stampWidth) {
    var dateStamp = {};
    var stampHeight;
    var stampHeightByImageWidth;
    // Set Logo-stamp dimensions based upon smallest total image dimension
    if (lastRequestedDimensions.w < breakPoint) {
      stampHeight = (imgWidth * 0.70) / stampWidthRatio < 60 ? ((imgWidth * 0.70) / stampWidthRatio) : 60;
      dateStamp.fontSize = lastRequestedDimensions.h > (stampHeight * 1.5) ? lodashRound(stampHeight * 0.65) : 0;
      dateStamp.align = 'left';
      dateStamp.x = imgWidth * 0.01;
      dateStamp.y = (imgHeight - (dateStamp.fontSize + (imgHeight * 0.01)) - 4);
    } else {
      stampWidth = imgWidth * 0.4;
      stampHeightByImageWidth = stampWidth / stampWidthRatio;
      stampHeight = stampHeightByImageWidth < 20 ? 20 : stampHeightByImageWidth > 60 ? 60 : stampHeightByImageWidth;
      dateStamp.fontSize = lastRequestedDimensions.h > (stampHeight * 1.5) ? lodashRound(stampHeight * 0.65) : 0;
      dateStamp.y = (imgHeight - (dateStamp.fontSize + (imgHeight * 0.01)) - 4);
      dateStamp.x = imgWidth * 0.01;
      dateStamp.align = 'left';
    }
    return { stampHeight: stampHeight, dateStamp: dateStamp };
  };

  /*
   * checks if rotation, changed palettes, or graticules
   * are active and ask to reset if any are active
   *
   * @method getGif
   * @static
   *
   * @returns {void}
   *
   */
  var getGif = function() {
    var layers;
    // check for rotation, changed palettes, and graticule layers and ask for reset if so

    // ui.anim.stop(); Add this
    layers = models.layers.get({
      renderable: true
    });
    if (models.palettes.inUse()) {
      wvui.ask({
        header: 'Notice',
        message: PALETTE_WARNING,
        onOk: function() {
          models.palettes.clear();
          getGif();
        }
      });
      return;
    }
    if (lodashFind(layers, {
      id: 'Graticule'
    }) && models.proj.selected.id === 'geographic') {
      wvui.ask({
        header: 'Notice',
        message: GRATICULE_WARNING,
        onOk: function() {
          models.layers.setVisibility('Graticule', false);
          self.getGif();
        }
      });
      return;
    }
    if (ui.map.selected.getView()
      .getRotation() !== 0.0) {
      wvui.ask({
        header: 'Reset rotation?',
        message: ROTATE_WARNING,
        onOk: function() {
          resetRotation();
          // Let rotation finish before reselecting can occur
          setTimeout(setImageCoords, 500);
        }
      });
      return;
    }
    googleAnalytics.event('Animation', 'Click', 'Create GIF');
    self.createGIF();
  };

  /*
   * retrieves renderable layers
   *
   * @method getProducts
   * @private
   *
   * @returns {array} array of layer objects
   *
   */
  var getProducts = function (date) {
    var layers = [];
    var products = models.layers.get({
      reverse: true,
      renderable: true
    });
    lodashEach(products, function (layer) {
      let layerDate = new Date(date);
      if (layer.endDate) {
        if (layerDate > new Date(layer.endDate)) return;
      }
      if (layer.visible && new Date(layer.startDate) <= layerDate) {
        layers.push(layer);
      } else if (!layer.startDate) {
        layers.push(layer);
      }
    });
    return layers;
  };

  /*
   * Dimenions from zoom & projection
   *
   * @method getDimensions
   * @private
   *
   * @returns {array} array with dimensions
   *
   */
  var getDimensions = function(lonlat, proj, res) {
    var conversionFactor = proj === 'geographic' ? 0.002197 : 256;
    return [
      Math.round((Math.abs(lonlat[1][0] - lonlat[0][0]) / conversionFactor) / Number(res)), // width
      Math.round((Math.abs(lonlat[1][1] - lonlat[0][1]) / conversionFactor) / Number(res)) // height
    ];
  };

  /*
   * loops through dates and created image
   * download urls and pushs them to an
   * array
   *
   * @method getImageArray
   * @private
   *
   * @returns {array} array of jpg urls
   *
   */
  var getImageArray = function(startDate, endDate, interval) {
    var url;
    var a = [];
    var fromDate = new Date(startDate);
    var toDate = new Date(endDate);
    var current = fromDate;
    var host;
    var path;
    var j = 0;
    var src;
    var strDate;
    var lonlat = imageUtilGetCoordsFromPixelValues(animationCoordinates, ui.map.selected);
    var layers;
    var proj = models.proj.selected.id;
    var opacities;
    var epsg = models.proj.selected.epsg;
    var products = getProducts();
    var intervalAmount = 1;

    if (config.features.imageDownload) {
      host = config.features.imageDownload.host;
      path = config.parameters.imagegen || config.features.imageDownload.path;
    } else {
      host = 'https://gibs.earthdata.nasa.gov';
      path = 'image-download';
    }

    while (current <= toDate) {
      j++;
      if (models.date.maxZoom > 3) {
        strDate = util.toISOStringSeconds(current);
      } else {
        strDate = util.toISOStringDate(current);
      }
      products = getProducts(current);

      layers = imageUtilGetLayers(products, proj);
      opacities = imageUtilGetLayerOpacities(products);
      url = util.format(host + '/' + path + '?{1}&extent={2}&epsg={3}&layers={4}&opacities={5}&worldfile=false&format=image/jpeg&width={6}&height={7}', 'TIME={1}', lonlat[0][0] + ',' + lonlat[0][1] + ',' + lonlat[1][0] + ',' + lonlat[1][1], epsg, layers.join(','), opacities.join(','), imgWidth, imgHeight);
      src = util.format(url, strDate);
      a.push({
        src: src,
        text: showDates ? strDate : '',
        delay: 1000 / interval
      });
      if (ui.anim.ui.getInterval() === 'minute') {
        intervalAmount = 10;
      } else {
        intervalAmount = 1;
      }
      current = util.dateAdd(current, ui.anim.ui.getInterval(), intervalAmount);
      if (j > 40) { // too many frames
        showUnavailableReason();
        uiIndicator.hide(loader);

        return false;
      }
    }
    return a;
  };

  /*
   * Thows an alert notifies the user
   * that too many frames were selected
   *
   * @method showUnavailableReason
   * @private
   *
   * @returns {void}
   *
   */
  var showUnavailableReason = function() {
    var headerMsg = "<h3 class='wv-data-unavailable-header'>GIF Not Available</h3>";
    var bodyMsg = 'Too many frames were selected. Please request less than 40 frames if you would like to generate a GIF';
    var callback = function() {
      $('#timeline-footer')
        .toggleClass('wv-anim-active');
    };
    wvui.notify(headerMsg + bodyMsg, 'Notice', 600, callback);
  };

  /*
   * resets map rotation to
   * zero degrees
   *
   * @method resetRotation
   * @private
   *
   * @returns {void}
   *
   */
  var resetRotation = function() {
    ui.map.selected.getView()
      .animate({
        duration: 400,
        rotation: 0
      });
  };

  /*
   * Handles GIF generater conpletion
   *
   * @method onGifComplete
   * @callback
   *
   * @param obj {object} gifShot GIF-complete
   *  object
   *
   * @returns {void}
   *
   */
  var onGifComplete = function(obj) { // callback function for when image is finished
    $('#timeline-footer').removeClass('wv-anim-active');
    models.anim.rangeState.state = 'off';
    if (!obj.error) {
      const blob = obj.blob;
      $progress.remove();
      progressing = false;
      var animatedImage = document.createElement('img');
      const blobURL = URL.createObjectURL(blob);
      animatedImage.src = blobURL;
      animatedImage.width = lastRequestedDimensions.w > window.innerWidth - 198 ? window.innerWidth - 198 : lastRequestedDimensions.w;
      animatedImage.height = lastRequestedDimensions.h > window.innerHeight - 120 ? window.innerHeight - 120 : lastRequestedDimensions.h;
      var dlURL = util.format('nasa-worldview-{1}-to-{2}.gif', animModel.rangeState.startDate, animModel.rangeState.endDate);
      var downloadSize = lodashRound((blob.size / 1024 * 0.001), 2);

      // Create download link and apply button CSS
      var $download = $('<a><span class=ui-button-text>Download</span></a>')
        .attr('type', 'button')
        .attr('role', 'button')
        .attr('class', 'ui-button ui-widget ui-state-default ui-button-text-only')
        .hover(function() {
          $(this)
            .addClass('ui-state-hover');
        }, function() {
          $(this)
            .removeClass('ui-state-hover');
        })
        .click(function(e) {
          e.preventDefault();
          FileSaver.saveAs(blob, dlURL);
          googleAnalytics.event('Animation', 'Download', 'GIF', downloadSize);
        });

      var $catalog =
        "<div class='gif-results-dialog' style='height: " + animatedImage.height + "px; min-height: 210px;' >" +
        '<div>' +
        '<div><b>' +
        'Size: ' +
        '</b></div>' +
        '<div>' +
        downloadSize + ' MB' +
        '</div>' +
        '</div>' +
        '<div>' +
        '<div><b>' +
        'Speed: ' +
        '</b></div>' +
        '<div>' +
        animModel.rangeState.speed + ' fps' +
        '</div>' +

        '</div>' +
        '<div>' +
        '<div><b>' +
        'Date Range: ' +
        '</b></div>' +
        '<div>' +
        animModel.rangeState.startDate +
        '</div>' +
        '<div>' +
        ' - ' +
        '</div>' +
        '<div>' +
        animModel.rangeState.endDate +
        '</div>' +
        '</div>' +
        '<div>' +
        '<div><b>' +
        'Increments: ' +
        '</b></div>' +
        '<div>' +
        lodashCapitalize(ui.anim.widget.getIncrements()) +
        '</div>' +

        '</div>' +
        '</div>';
      var $dialogBodyCase = $('<div></div>');
      $dialogBodyCase.addClass('gif-results-dialog-case');
      $dialogBodyCase.css('padding', '10px 0');
      $dialogBodyCase.append(animatedImage);
      $dialogBodyCase.append($catalog);
      // calculate the offset of the dialog position based on image size to display it properly
      // only height needs to be adjusted to center the dialog
      var posWidth = lastRequestedDimensions.w * 1 / window.innerWidth;
      var posHeight = lastRequestedDimensions.h * 50 / window.innerHeight;
      var atString = 'center-' + posWidth.toFixed() + '% center-' + posHeight.toFixed() + '%';

      // Create a dialog over the view and place the image there
      var $imgDialog = wvui.getDialog()
        .append($dialogBodyCase)
        .append($download);
      $imgDialog.dialog({
        dialogClass: 'wv-panel wv-gif-results',
        title: 'Your GIF',
        width: animatedImage.width + 198,
        resizable: false,
        maxWidth: window.innerWidth,
        maxHeight: window.innerHeight,
        close: function() {
          $imgDialog.find('img')
            .remove();
          models.anim.rangeState.state = 'on';
          $('#timeline-footer')
            .toggleClass('wv-anim-active');
        },
        position: { // based on image size
          my: 'center center',
          at: atString,
          of: window
        }
      });
    } else {
      var headerMsg = "<h3 class='wv-data-unavailable-header'>GIF Not Available</h3>";
      var bodyMsg = 'One or more of the frames requested was unable to be processed';
      uiIndicator.hide(loader);
      var callback = function() {
        $('#timeline-footer')
          .toggleClass('wv-anim-active');
      };
      wvui.notify(headerMsg + bodyMsg, 'Notice', 600, callback);
    }
  };

  /*
   * Builds selector dialog
   *
   * @method getSelectorDialog
   * @private
   *
   * @param width {number}
   *
   * @returns {JQuery} Selector diaglog element
   *
   */
  var getSelectorDialog = function(width) {
    var $dialogBox;
    $dialogBox = wvui.getDialog();
    $dialogBox.html(panelCase);
    $dialogBox.css({
      paddingBottom: '10px'
    });
    $dialogBox.dialog({
      dialogClass: 'wv-panel wv-image',
      title: 'Create An Animated GIF',
      height: 'auto',
      width: width,
      minHeight: 40,
      minWidth: 287,
      resizable: false,
      show: {
        effect: 'slide',
        direction: 'right'
      },
      position: {
        my: 'left top',
        at: 'right+10 top',
        of: $('.jcrop-tracker')
      },

      close: onCloseSelector
    });
    return $dialogBox;
  };

  var onCloseSelector = function() {
    $('#wv-map')
      .insertAfter('#productsHolder'); // retain map element before disabling jcrop
    jcropAPI.destroy();
    $('#timeline-footer')
      .toggleClass('wv-anim-active');
    if (models.proj.selected.id === 'geographic') {
      ui.map.events.trigger('selectiondone');
    }
  };

  /*
   * uses resolution and dimension to
   * calculates size of selected area
   *
   * @method calulateFileSize
   * @private
   *
   * @param c {object} dimension object
   *
   * @returns {number} Size of frame
   *
   */
  var calulateFileSize = function(imgRes, lonlat1, lonlat2, numDays, imgWidth, imgHeight) {
    var conversionFactor;

    conversionFactor = imageUtilGetConversionFactor(models.proj.selected.id);
    resolution = imgRes;
    imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(imgRes));
    imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(imgRes));

    return (((imgWidth * imgHeight * 24) / 8388608).toFixed(2) * numDays);
  };

  /*
   * removes jquery JCrop
   *
   * @method removeCrop
   * @private
   *
   * @param c {object} dimension object
   *
   * @returns {void}
   *
   */
  var removeCrop = function() {
    $('#wv-map')
      .insertAfter('#productsHolder'); // retain map element before disabling jcrop
    animationCoordinates = undefined;
    jcropAPI.destroy();
    if (models.proj.selected.id === 'geographic') {
      ui.map.events.trigger('selectiondone');
    }
  };

  /*
   * checkBox event handler
   *
   * @method onchecked
   * @private
   *
   * @param e {Jquery} event object
   *
   * @returns {void}
   *
   */
  var onchecked = function(showDatesBoolean) {
    showDates = showDatesBoolean;
  };

  /*
   * Sets diaglog width && location
   *
   * @method setDialogWidth
   * @private
   *
   * @param $dialog {Jquery} dialog
   * @param width {number} JCrop selector width
   *
   * @returns {void}
   *
   */
  var setDialogWidth = function($dialog, width) {
    var $parent;
    if (width < 287) {
      width = 287;
    }
    if ($dialog) {
      $parent = $dialog.parent();
      $parent.position({
        my: 'left top',
        at: 'right+10 top',
        collision: 'flipfit',
        of: $('.jcrop-tracker')
      });
    }
  };

  /*
   * Adjusts download icon size
   *
   * @method setIconFontSize
   * @private
   *
   * @param $el {Jquery} icon element
   * @param width {number} JCrop selector width
   *
   * @returns {void}
   *
   */
  var setIconFontSize = function($el, width) {
    if (!$el) { return; }
    var fontSize = Math.abs(width / 4); // Font size is 25% width
    fontSize = fontSize < 30 ? 30 : fontSize > 100 ? 100 : fontSize; // Set max and min font-size

    $el.css('font-size', fontSize);
  };

  var onBoundingBoxChange = function(c, $dialog, $dlButton) {
    animationCoordinates = c;

    if (c.h !== 0 && c.w !== 0) { // don't save coordinates if empty selection
      previousCoords = c;
    }
    // var dataSize = calcSize(c);
    // Update the gif selection dialog

    setDialogWidth($dialog, c.w);
    setIconFontSize($dlButton, c.w);
  };

  /*
   * Initializes and sets callbacks for
   *  Jcrop selector
   *
   * @method setImageCoords
   * @private
   *
   * @returns {void}
   *
   */
  var setImageCoords = function() {
    var starterWidth;
    var $dlButton;
    var $dialog;
    // Set JCrop selection
    if (previousCoords === null || previousCoords === undefined) {
      previousCoords = [($(window)
        .width() / 2) - 100, ($(window)
        .height() / 2) - 100, ($(window)
        .width() / 2) + 100, ($(window)
        .height() / 2) + 100];
    } else { previousCoords = [previousCoords.x, previousCoords.y, previousCoords.x2, previousCoords.y2]; }

    if (models.proj.selected.id === 'geographic') { ui.map.events.trigger('selecting'); }
    starterWidth = previousCoords[0] - previousCoords[2];
    // Start the image cropping. Show the dialog
    $('#wv-map')
      .Jcrop({
        bgColor: 'black',
        bgOpacity: 0.3,
        fullScreen: true,
        setSelect: previousCoords,
        onSelect: function(e) {
          onBoundingBoxChange(e, $dialog, $dlButton);
        },
        onChange: function(e) {
          onBoundingBoxChange(e, $dialog, $dlButton);
          update(resolution, imageUtilGetCoordsFromPixelValues(animationCoordinates, ui.map.selected));
        },
        onRelease: function() {
          removeCrop();
          if ($dialog) {
            wvui.close();
          }
        }
      }, function() {
        var $tracker;
        $dlButton =
          "<div class='wv-dl-gif-bt-case'>" +
          "<i class='fa fa-download'>" +
          '</div>';
        jcropAPI = this;
        $('#timeline-footer')
          .toggleClass('wv-anim-active');
        $dialog = getSelectorDialog(342);
        $tracker = this.ui.selection.find('.jcrop-tracker');
        $tracker.append($dlButton);
        $dlButton = $('.wv-dl-gif-bt-case i');
        setIconFontSize($dlButton, starterWidth);
        $dlButton.on('click', getGif);
      });

    update(null, imageUtilGetCoordsFromPixelValues(animationCoordinates, ui.map.selected));
  };
  self.init();
  return self;
};
