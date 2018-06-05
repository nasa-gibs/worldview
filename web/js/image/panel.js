import $ from 'jquery';
import 'jquery-ui/button';
import 'jquery-ui/dialog';
import olProj from 'ol/proj';
import { GA as googleAnalytics, ImageResSelection } from 'worldview-components';
import util from '../util/util';
import wvui from '../ui/ui';
import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';

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
    { value: 'image/tiff', text: 'GeoTIFF' },
    { value: 'application/vnd.google-earth.kmz', text: 'KMZ' }
  ]
};
const fileTypesPolar = {
  values: [
    { value: 'image/jpeg', text: 'JPEG' },
    { value: 'image/png', text: 'PNG' },
    { value: 'image/tiff', text: 'GeoTIFF' }
  ]
};

export function imagePanel (models, ui, config, dialogConfig) {
  let self = {};

  let container;
  let url;
  let alignTo = config.alignTo;
  let coords;
  let resolution = '1';
  let lastZoom = -1;
  let htmlElements;
  let containerId = 'wv-image-button';
  let id = containerId;
  // state items as global lets
  let lonlats;
  let imgWorldfile = 'false';
  let imgFormat = 'image/jpeg';
  let imgWidth;
  let imgHeight;
  let imgRes;
  let imgFilesize;
  let resolutions;
  let fileTypes;

  /* FIXME: Put in configuration */
  url = 'http://localhost:8080/wvs/v1';

  if (config.parameters.imagegen) {
    util.warn('Redirecting image download to: ' + url);
  }

  let init = function() {
    let options;

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
  let setProjectionGlobals = function() {
    let isGeoProjection = (models.proj.selected.id === 'geographic');
    let curZoom = Math.round(ui.map.selected.getView()
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
  let onSelectionChange = function(res, worldfile, format) {
    imgWorldfile = worldfile;
    imgFormat = format;
    imgRes = res;
    self.update(coords);
  };

  let getUpdatedProps = function() {
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
  let renderPanel = function(options, mountEl) {
    return ReactDOM.render(React.createElement(ImageResSelection, options), mountEl);
  };
  let updatePanel = function(options) {
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

    let $dialog = wvui.getDialog()
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
    let curZoom = Math.round(ui.map.selected.getView()
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
  let setBoundingBoxLabels = function(x1, x2, y1, y2, bottomLeftCoordinates, topRightCoordinates) {
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

  let calulateFileSize = function(imgRes, lonlat1, lonlat2) {
    let conversionFactor;

    conversionFactor = imageUtilGetConversionFactor(models.proj.selected.id);
    resolution = imgRes;
    imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(imgRes));
    imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(imgRes));

    return ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);
  };
  let fileSizeValid = function() {
    return (imgFilesize < 250 && imgHeight !== 0 && imgWidth !== 0);
  };
  let onDownload = function() {
    const layers = models.layers.get({
      reverse: true,
      renderable: true
    });

    let imageLayers = imageUtilGetLayers(layers, models.proj.selected.id);
    let opacities = imageUtilGetLayerOpacities(layers);

    let bbox;
    if (models.proj.selected.units === 'm') {
      // When meters are specified, bbox is minx,miny,maxx,maxy
      bbox =
        lonlats[0][0] + ',' + lonlats[0][1] + ',' +
        lonlats[1][0] + ',' + lonlats[1][1];
    } else {
      // When degrees are specified, bbox is minlat,minlon,maxlat,maxlon
      bbox =
        lonlats[0][1] + ',' + lonlats[0][0] + ',' +
        lonlats[1][1] + ',' + lonlats[1][0];
    }

    let params = [
      'REQUEST=GetSnapshot',
      'LAYERS=' + imageLayers.join(','),
      'BBOX=' + bbox,
      'CRS=' + models.proj.selected.crs,
      'FORMAT=' + imgFormat,
      'WIDTH=' + imgWidth,
      'HEIGHT=' + imgHeight,
      'TIME=' + moment(models.date.selected).utc().format('YYYY-MM-DD')
    ];
    if (opacities) {
      params.push('OPACITIES=' + opacities.join(','));
    }
    if (imgWorldfile && imgWorldfile !== 'false') {
      params.push('WORLDFILE=' + imgWorldfile);
    }
    const snapshotUrl = url + '?' + params.join('&');
    googleAnalytics.event('Image Download', 'Click', 'Download');
    window.open(snapshotUrl, '_blank');
  };

  let setPosition = function() {
    let offset = $('#' + alignTo.id)
      .offset();
    let left = offset.left + parseInt($('#' + alignTo.id)
      .css('width')) - parseInt($('#' + id)
      .css('width'));
    $('#' + id)
      .css('left', left + 'px');
  };

  init();
  return self;
};
