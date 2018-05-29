import $ from 'jquery';
import 'jquery-ui/button';
import 'jquery-ui/dialog';
import olProj from 'ol/proj';
import { GA as googleAnalytics, ImageResSelection } from 'worldview-components';
import util from '../util/util';
import wvui from '../ui/ui';
import React from 'react';
import ReactDOM from 'react-dom';

import {
  imageUtilCalculateResolution,
  imageUtilGetLayerOpacities,
  imageUtilGetCoordsFromPixelValues,
  imageUtilGetLayers,
  imageUtilGetConversionFactor
} from './util';

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
const fileTypesGeo = {
  values: [
    { value: 'image/jpeg', text: 'JPEG' },
    { value: 'image/png', text: 'PNG' },
    { value: 'image/geotiff', text: 'GeoTIFF' },
    { value: 'image/kmz', text: 'KMZ' }
  ]
};
const fileTypesPolar = {
  values: [
    { value: 'image/jpeg', text: 'JPEG' },
    { value: 'image/png', text: 'PNG' },
    { value: 'image/geotiff', text: 'GeoTIFF' }
  ]
};

export function imagePanel (models, ui, config, dialogConfig) {
  var self = {};

  var container;
  var url;
  var alignTo = config.alignTo;
  var coords;
  var resolution = '1';
  var lastZoom = -1;
  var htmlElements;
  var host;
  var path;
  var containerId = 'wv-image-button';
  var id = containerId;
  // state items as global vars
  var lonlats;
  var imgWorldfile = 'false';
  var imgFormat = 'image/jpeg';
  var imgWidth;
  var imgHeight;
  var imgRes;
  var imgFilesize;
  var resolutions;
  var fileTypes;

  if (config.features.imageDownload) {
    host = config.features.imageDownload.host;
    path = config.parameters.imagegen || config.features.imageDownload.path;
  } else {
    host = 'http://map2.vis.earthdata.nasa.gov';
    path = 'imagegen/index.php';
  }
  url = host + '/' + path + '?';

  if (config.parameters.imagegen) {
    util.warn('Redirecting image download to: ' + url);
  }

  var init = function() {
    var options;

    checkConfig();
    htmlElements = document.createElement('div');
    setProjectionGlobals();
    options = {
      resolution: resolution,
      worldfile: imgWorldfile,
      onSelectionChange: onSelectionChange,
      onDownloadClick: onDownload,
      fileType: imgFormat,
      valid: true,
      resolutions: resolutions,
      fileTypes: fileTypes
    };

    self.reactComponent = renderPanel(options, htmlElements);
    models.proj.events.on('select', setProjectionGlobals);
  };
  var setProjectionGlobals = function() {
    var isGeoProjection = (models.proj.selected.id === 'geographic');
    var curZoom = Math.round(ui.map.selected.getView()
      .getZoom());
    imgRes = imageUtilCalculateResolution(curZoom, isGeoProjection, models.proj.selected.resolutions);
    if (isGeoProjection) {
      resolutions = resolutionsGeo;
      fileTypes = fileTypesGeo;
    } else {
      resolutions = resolutionsPolar;
      fileTypes = fileTypesPolar;
    }
  };
  var onSelectionChange = function(res, worldfile, format) {
    imgWorldfile = worldfile;
    imgFormat = format;
    imgRes = res;
    self.update(coords);
  };

  var checkConfig = function() {
    if (config.features.imageDownload) {
      host = config.features.imageDownload.host;
      path = config.parameters.imagegen || config.features.imageDownload.path;
    } else {
      host = 'http://map2.vis.earthdata.nasa.gov';
      path = 'imagegen/index.php';
    }
    url = host + '/' + path + '?';

    if (config.parameters.imagegen) {
      util.warn('Redirecting image download to: ' + url);
    }
  };
  var getUpdatedProps = function() {
    return {
      resolution: imgRes.toString(),
      proj: models.proj.selected.id,
      worldfile: imgWorldfile,
      valid: fileSizeValid(),
      fileSize: imgFilesize,
      imgHeight: imgHeight,
      imgWidth: imgWidth,
      resolutions: resolutions,
      fileTypes: fileTypes,
      fileType: imgFormat
    };
  };
  var renderPanel = function(options, mountEl) {
    return ReactDOM.render(React.createElement(ImageResSelection, options), mountEl);
  };
  var updatePanel = function(options) {
    self.reactComponent.setState(options);
  };
  /**
   * Initialize a map object in Lat/Long projection, and add a "fake" layer to compute the map math.
   * Display the HTML UI with UI options.   *
   * @this {Download}
   */
  self.show = function() {
    alignTo = {
      id: 'wv-image-button'
    };
    container = document.getElementById(containerId);

    if (container === null) {
      throw new Error("Error: element '" + containerId + "' not found!");
    }

    container.setAttribute('class', 'imagedownload');

    var $dialog = wvui.getDialog()
      .html(htmlElements);
    $dialog.dialog(dialogConfig);
    // $("#wv-image-resolution").buttonset();
    // $("#wv-image-format").buttonset();
    $('#wv-image-download-button')
      .button();
    $('.ui-dialog')
      .zIndex(600);
    $(window)
      .resize(setPosition);

    // Auto-set default resolution to map's current zoom level; round it
    // for incremental zoom steps
    var curZoom = Math.round(ui.map.selected.getView()
      .getZoom());
    // Don't do anything if the user hasn't changed zoom levels; we want to
    // preserve their existing settings
    if (curZoom !== lastZoom) {
      lastZoom = curZoom;
      let isGeoProjection = (models.proj.selected.id === 'geographic');
      imgRes = imageUtilCalculateResolution(curZoom, isGeoProjection, models.proj.selected.resolutions);
      updatePanel(getUpdatedProps());
    }

    wvui.positionDialog($dialog, {
      my: 'right top',
      at: 'right bottom+5',
      of: ('#wv-image-button')
    });
    $dialog.dialog('open');

    $('.wv-image-coords')
      .show();
  };

  self.update = function(c) {
    try {
      let pixels, map, px, x1, y1, x2, y2, crs;
      let geolonlat1, geolonlat2, minLon, maxLon;
      let minLat, maxLat, topRightCoordinates, bottomLeftCoordinates;

      coords = c;
      map = ui.map.selected;
      pixels = coords;
      px = pixels;
      x1 = px.x;
      y1 = px.y;
      x2 = px.x2;
      y2 = px.y2;
      crs = models.proj.selected.crs;

      lonlats = imageUtilGetCoordsFromPixelValues(pixels, map);

      geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
      geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');

      minLon = geolonlat1[0];
      maxLon = geolonlat2[0];
      minLat = geolonlat2[1];
      maxLat = geolonlat1[1];

      bottomLeftCoordinates = util.formatCoordinate([minLon, maxLat]);
      topRightCoordinates = util.formatCoordinate([maxLon, minLat]);

      setBoundingBoxLabels(x1, x2, y1, y2, bottomLeftCoordinates, topRightCoordinates);
      imgFilesize = calulateFileSize(imgRes, lonlats[0], lonlats[1]);
      updatePanel(getUpdatedProps());
    } catch (cause) {
      util.error(cause);
    }
  };
  /*
   * Sets labels of bounding box of Jcrop
   * selector
   *
   * @method setBoundingBoxLabels
   *
   * @param {Number} x1 - right x pixel value
   * @param {Number} x2 - left x pixel value
   * @param {Number} y1 - top y pixel value
   * @param {Number} y2 - bottom y pixel value
   *
   * @returns {void}
   */
  var setBoundingBoxLabels = function(x1, x2, y1, y2, bottomLeftCoordinates, topRightCoordinates) {
    if (x2 - x1 < 150) {
      bottomLeftCoordinates = '';
      topRightCoordinates = '';
    }
    $('#wv-image-top')
      .css({
        left: x1 - 10,
        top: y1 - 20,
        width: x2 - x1
      }).html(topRightCoordinates);

    $('#wv-image-bottom')
      .css({
        left: x1,
        top: y2,
        width: x2 - x1
      }).html(bottomLeftCoordinates);
  };

  var calulateFileSize = function(imgRes, lonlat1, lonlat2) {
    var conversionFactor;

    conversionFactor = imageUtilGetConversionFactor(models.proj.selected.id);
    resolution = imgRes;
    imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(imgRes));
    imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(imgRes));

    return ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);
  };
  var fileSizeValid = function() {
    return (imgFilesize < 250 && imgHeight !== 0 && imgWidth !== 0);
  };
  var onDownload = function() {
    var dlURL, products;

    products = models.layers.get({
      reverse: true,
      renderable: true
    });

    dlURL = createDownloadURL(models.date.selected, lonlats, models.proj.selected.epsg, products, imageUtilGetLayerOpacities(products), url);
    googleAnalytics.event('Image Download', 'Click', 'Download');
    util.metrics('lc=' + encodeURIComponent(dlURL + '&worldfile=' + imgWorldfile + '&format=' + imgFormat + '&width=' + imgWidth + '&height=' + imgHeight));
    window.open(dlURL + '&worldfile=' + imgWorldfile + '&format=' + imgFormat + '&width=' + imgWidth + '&height=' + imgHeight, '_blank');
  };

  var setPosition = function() {
    var offset = $('#' + alignTo.id)
      .offset();
    var left = offset.left + parseInt($('#' + alignTo.id)
      .css('width')) - parseInt($('#' + id)
      .css('width'));
    $('#' + id)
      .css('left', left + 'px');
  };

  var createDownloadURL = function(time, lonlats, epsg, products, opacities, dlURL) {
    var layers, jStart, jDate;
    var dTime = time;

    layers = imageUtilGetLayers(products, models.proj.selected.id);
    // Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
    jStart = util.parseDateUTC(dTime.getUTCFullYear() + '-01-01');
    jDate = '00' + (1 + Math.ceil((dTime.getTime() - jStart) / 86400000));
    dlURL += 'TIME=' + dTime.getUTCFullYear() + (jDate)
      .substr((jDate.length) - 3);

    dlURL += '&extent=' + lonlats[0][0] + ',' + lonlats[0][1] + ',' + lonlats[1][0] + ',' + lonlats[1][1];
    dlURL += '&epsg=' + epsg;
    dlURL += '&layers=' + layers.join(',');
    dlURL += '&opacities=' + opacities.join(',');

    return dlURL;
  };

  init();
  return self;
};
