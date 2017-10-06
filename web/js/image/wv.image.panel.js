/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */
/*global $*/
/*global _*/
/*global React*/
/*global WVC*/
/*global ReactDOM*/
/*global ol*/
/*eslint no-unused-vars: "error"*/
/*eslint no-undef: "error"*/
var wv = wv || {};
wv.image = wv.image || {};

wv.image.panel = wv.image.panel || function(models, ui, config, dialogConfig) {

  var self = this;
  var container;  
  var containerId = "imagedownload";
  var coords;
  var resolution = "1";
  var format = "image/jpeg";
  var alignTo = config.alignTo;
  var worldfile = "false";
  var lastZoom = -1;
  var rangeSelectionFactory = React.createFactory(WVC.ImageResSelection);
  var htmlElements;
  var host;
  var path;
  var url;
  var containerId = "wv-image-button";
  var id = containerId;
  var container;
  // state items as global vars
  var lonlats;
  var imgWorldfile;
  var imgFormat;
  var imgWidth;
  var imgHeight;
  var imgRes;
  var imgFilesize;
  var resolutions;
  var fileTypes;
  var resolutionsGeo = {
    values:  [
      {value: '0.125', text: '30m'},
      {value: '0.25', text: '60m'},
      {value: '0.5', text: '125m'},
      {value: '1', text: '250m'},
      {value: '2', text: '500m'},
      {value: '4', text: '1km'},
      {value: '20', text: '5km'},
      {value: '40', text: '10km'}
    ]
  };
  var resolutionsPolar = {
    values:  [
      {value: '1', text: '250m'},
      {value: '2', text: '500m'},
      {value: '4', text: '1km'},
      {value: '20', text: '5km'},
      {value: '40', text: '10km'}
    ]
  };
  var fileTypesGeo = {
    values:  [
      {value: 'image/jpeg', text: 'JPEG'},
      {value: 'image/png', text: 'PNG'},
      {value: 'image/geotiff', text: 'GeoTIFF'},
      {value: 'image/kmz', text: 'KMZ'}
    ]
  };
  var fileTypesPolar = {
    values: [
      {value: 'image/jpeg', text: 'JPEG'},
      {value: 'image/png', text: 'PNG'},
      {value: 'image/geotiff', text: 'GeoTIFF'}
    ]
  };
  var init = function() {
    var options;

    checkConfig();
    htmlElements = document.createElement('div');
    setProjectionGlobals();
    options = {
      resolution: resolution,
      worldfile: worldfile,
      onSelectionChange: onSelectionChange,
      onDownloadClick: onDownload,
      fileType: format,
      valid: true,
      resolutions: resolutions,
      fileTypes: fileTypes
    };

    self.reactComponent = renderPanel(options, htmlElements);
  };
  var setProjectionGlobals = function() {
    if(models.proj.selected.id === 'geographic') {
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
      host = "http://map2.vis.earthdata.nasa.gov";
      path = "imagegen/index.php";
    }
    url = host + "/" + path + "?";

    if (config.parameters.imagegen) {
      wv.util.warn("Redirecting image download to: " + url);
    }
  };
  var getUpdatedProps = function() {
    return {
      resolution: imgRes,
      proj: models.proj.selected.id,
      worldfile: worldfile,
      valid: fileSizeValid(),
      fileSize: imgFilesize,
      imgHeight: imgHeight,
      imgWidth: imgWidth,
      resolutions: resolutions,
      fileTypes: fileTypes
    };
  };
  var renderPanel = function(options, mountEl) {
    return ReactDOM.render(rangeSelectionFactory(options), mountEl);
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
      id: "wv-image-button"
    };
    container = document.getElementById(containerId);

    if (container === null) {
      throw new Error("Error: element '" + containerId + "' not found!");
    }

    container.setAttribute("class", "imagedownload");
    

    var $dialog = wv.ui.getDialog()
      .html(htmlElements);
    $dialog.dialog(dialogConfig);
    //$("#wv-image-resolution").buttonset();
    //$("#wv-image-format").buttonset();
    $("#wv-image-download-button")
      .button();
    $(".ui-dialog")
      .zIndex(600);
    $(window)
      .resize(setPosition);

    // Auto-set default resolution to map's current zoom level; round it
    // for incremental zoom steps
    var curZoom = Math.round(ui.map.selected.getView()
      .getZoom());

    // Don't do anything if the user hasn't changed zoom levels; we want to
    // preserve their existing settings
    if (curZoom != lastZoom) {
      lastZoom = curZoom;
      var nZoomLevels = models.proj.selected.resolutions.length;
      var curResolution = (curZoom >= nZoomLevels) ?
        models.proj.selected.resolutions[nZoomLevels - 1] :
        models.proj.selected.resolutions[curZoom];

      // Estimate the option value used by "wv-image-resolution"
      var resolutionEstimate = (models.proj.selected.id == "geographic") ?
        curResolution / 0.002197265625 : curResolution / 256.0;

      // Find the closest match of resolution within the available values
      var possibleResolutions = (models.proj.selected.id == "geographic") ? [0.125, 0.25, 0.5, 1, 2, 4, 20, 40] : [1, 2, 4, 20, 40];
      var bestDiff = Infinity;
      var bestIdx = -1;
      var currDiff = 0;
      for (var i = 0; i < possibleResolutions.length; i++) {
        currDiff = Math.abs(possibleResolutions[i] - resolutionEstimate);
        if (currDiff < bestDiff) {
          resolution = possibleResolutions[i];
          bestDiff = currDiff;
          bestIdx = i;
        }
      }

      // Bump up resolution in certain cases where default is too low
      if (bestIdx > 0) {
        if (models.proj.selected.id == "geographic") {
          switch (curZoom) {
            case 3:
            case 4:
            case 6:
            case 7:
              resolution = possibleResolutions[bestIdx - 1];
          }
        } else {
          switch (curZoom) {
            case 1:
            case 2:
            case 4:
            case 5:
              resolution = possibleResolutions[bestIdx - 1];
          }
        }
      }
      imgRes = resolution;
      updatePanel(getUpdatedProps());
    }

    wv.ui.positionDialog($dialog, {
      my: "left top",
      at: "left bottom+5",
      of: ("#wv-image-button"),
    });
    $dialog.dialog("open");

    $(".wv-image-coords")
      .show();
  };


  self.update = function(c) {
    var pixels, map, px, x1, y1, x2, y2, crs;

    try {
      coords = c;
      map = ui.map.selected;
      pixels = coords;
      px = pixels;
      x1 = px.x;
      y1 = px.y;
      x2 = px.x2;
      y2 = px.y2;
      crs = models.proj.selected.crs;

      lonlats = getCoordsFromPixelValues(x1, x2, y1, y2, map);

      var geolonlat1 = ol.proj.transform(lonlats[0], crs, "EPSG:4326");
      var geolonlat2 = ol.proj.transform(lonlats[1], crs, "EPSG:4326");

      var minLon = geolonlat1[0];
      var maxLon = geolonlat2[0];
      var minLat = geolonlat2[1];
      var maxLat = geolonlat1[1];

      var ll = wv.util.formatCoordinate([minLon, maxLat]);
      var ur = wv.util.formatCoordinate([maxLon, minLat]);
      
      setBoundingBoxLabels(x1, x2, y1, y2, ll, ur);
      imgFilesize = calulateFileSize(imgRes, lonlats[0], lonlats[1]);
      updatePanel(getUpdatedProps());

    } catch (cause) {
      wv.util.error(cause);
    }
  };
  var getEPSG = function() {
    // NOTE: This needs to be changed back to the projection model
    // when the backfill removes the old projection.

    return (models.proj.change) ? models.proj.change.epsg : models.proj.selected.epsg;
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
  var setBoundingBoxLabels = function(x1, x2, y1, y2, ur, ll) {
    if (x2 - x1 < 150) {
      ll = "";
      ur = "";
    }
    $("#wv-image-top")
      .css({
        left: x1 - 10,
        top: y1 - 20,
        width: x2 - x1
      }).html(ur);
      
    $("#wv-image-bottom")
      .css({
        left: x1,
        top: y2,
        width: x2 - x1
      }).html(ll);
  };
  var getCoordsFromPixelValues =  function(x1, x2, y1, y2, map) {
    return  [
      map.getCoordinateFromPixel([Math.floor(x1), Math.floor(y2)]),
      map.getCoordinateFromPixel([Math.floor(x2), Math.floor(y1)])
    ];
  };
  var getLayerOpacities = function(products) {
    var opacities = [];
    _(products)
      .each(function(product) {
        opacities.push((_.isUndefined(product.opacity)) ? 1 : product.opacity);
      });
    return opacities;
  };
  var getConversionFactor = function(proj) {
    if(proj === 'geographic') return 0.002197;
    return 256;
  };
  var calulateFileSize = function(imgRes, lonlat1, lonlat2) {
    var conversionFactor;

    conversionFactor = getConversionFactor(models.proj.selected.id);
    resolution = imgRes;
    imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(imgRes));
    imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(imgRes));

    return ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);
  };
  var fileSizeValid = function() {
    return (imgFilesize < 250 && imgHeight != 0 && imgWidth != 0);
  };
  var onDownload = function() {
    var dlURL, products;
    
    products = models.layers.get({
      reverse: true,
      renderable: true
    });

    dlURL = createDownloadURL(models.date.selected, lonlats, getEPSG(), products, getLayerOpacities(products), url);
    WVC.GA.event('Image Download', 'Click', 'Download');
    wv.util.metrics('lc=' + encodeURIComponent(dlURL + "&worldfile=" + imgWorldfile + "&format=" + imgFormat + "&width=" + imgWidth + "&height=" + imgHeight));
    window.open(dlURL + "&worldfile=" + imgWorldfile + "&format=" + imgFormat + "&width=" + imgWidth + "&height=" + imgHeight, "_blank");   
  };

  var setPosition = function() {
    var offset = $("#" + alignTo.id)
      .offset();
    var left = offset.left + parseInt($("#" + alignTo.id)
      .css("width")) - parseInt($("#" + id)
        .css("width"));
    $("#" + id)
      .css("left", left + "px");
  };

  var createDownloadURL = function(time, lonlats, epsg, products, opacities, dlURL) {
    var layers, jStart, jDate;
    var dTime = time;

    layers = getLayers(products, models.proj.selected.id);
    //Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
    jStart = wv.util.parseDateUTC(dTime.getUTCFullYear() + "-01-01");
    jDate = "00" + (1 + Math.ceil((dTime.getTime() - jStart) / 86400000));
    dlURL += "TIME=" + dTime.getUTCFullYear() + (jDate)
      .substr((jDate.length) - 3);

    dlURL += "&extent=" + lonlats[0][0] + "," + lonlats[0][1] + "," + lonlats[1][0] + "," + lonlats[1][1];
    //dlURL += "&switch="+s;
    dlURL += "&epsg=" + epsg;
    dlURL += "&layers=" + layers.join(",");
    dlURL += "&opacities=" + opacities.join(",");

    return dlURL;
  };
  var getLayers = function(products, s) {
    var layers = [];
    _.each(products, function(layer) {
      if (layer.projections[s].layer) {
        layers.push(layer.projections[s].layer);
      } else {
        layers.push(layer.id);
      }
    });
    return layers;
  };
  init();
};