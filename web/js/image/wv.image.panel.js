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

wv.image.panel = wv.image.panel || function(models, ui, config) {

  var self = {};

  var container;
  var alignTo = config.alignTo;
  var containerId = "imagedownload";
  var id = containerId;
  var coords;
  var resolution = "1";
  var format = "image/jpeg";
  var worldfile = "false";
  var lastZoom = -1;
  var rangeSelectionFactory = React.createFactory(WVC.ResolutionSelection);
  var htmlElements;
  var host;
  var path;
  var url;

  var init = function() {
    var options;

    checkConfig();
    ui.rubberband.events.on("update", update);
    ui.rubberband.events.on("show", show);
    htmlElements = document.createElement('div');
    options ={
      resolution: resolution,
      proj: models.proj.selected.id,
      worldfile: worldfile,
      onClick: onDownload,
      format: format
    };

    self.reactComponent = renderPanel(options, htmlElements);
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
  var getUpdatedProps = function(resolution, proj, worldfile, valid) {
    return {
      resolution: resolution,
      proj: models.proj.selected.id,
      worldfile: worldfile,
      valid: valid
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
  var show = function() {
    alignTo = {
      id: "wv-image-button"
    };
    container = document.getElementById(containerId);

    if (container === null) {
      throw new Error("Error: element '" + containerId + "' not found!");
    }

    container.setAttribute("class", "imagedownload");

    setPosition();
    $(window)
      .resize(setPosition);

    var $dialog = wv.ui.getDialog()
      .html(htmlElements);
    $dialog.dialog({
      dialogClass: "wv-panel wv-image",
      title: "Take a snapshot",
      show: {
        effect: "slide",
        direction: "up"
      },
      hide: {
        effect: "slide",
        direction: "up"
      },
      width: 230,
      height: "auto",
      minHeight: 10,
      draggable: false,
      resizable: false,
      autoOpen: false
    });
    //$("#wv-image-resolution").buttonset();
    //$("#wv-image-format").buttonset();
    $("#wv-image-download-button")
      .button();
    $(".ui-dialog")
      .zIndex(600);


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

  var setPosition = function() {
    var offset = $("#" + alignTo.id)
      .offset();
    var left = offset.left + parseInt($("#" + alignTo.id)
      .css("width")) - parseInt($("#" + id)
        .css("width"));
    $("#" + id)
      .css("left", left + "px");
  };
  var update = function(c) {
    var opacities, time, pixels, s, products, map, lonlats;
    var px, x1, y1, x2, y2, crs, dlURL;

    try {
      coords = c;
      map = ui.map.selected;
      time = models.date.selected;
      pixels = coords;
      px = pixels;
      x1 = px.x;
      y1 = px.y;
      x2 = px.x2;
      y2 = px.y2;
      s = models.proj.selected.id;
      crs = models.proj.selected.crs;
      products = models.layers.get({
        reverse: true,
        renderable: true
      });

      // NOTE: This needs to be changed back to the projection model
      // when the backfill removes the old projection.
      var epsg = (models.proj.change) ? models.proj.change.epsg :
        models.proj.selected.epsg;

      // get layer transparencies (opacities)
      opacities = getLayerOpacities(products);
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


      var imgWidth = 0;
      var imgHeight = 0;
      
      dlURL = createDownloadURL(time, lonlats, epsg, products, opacities, s);

      $("#wv-image-resolution")
        .unbind("change")
        .change(function() {
          imgFormat = $("#wv-image-format option:checked")
            .val();
          imgWorldfile = $("#wv-image-worldfile option:checked")
            .val();
          if (invalid) {
            icon = "<i class='fa fa-times fa-fw'></i>";
            $(".wv-image-size")
              .addClass("wv-image-size-invalid");
            $("#wv-image-download-button")
              .button("disable");
          } else {
            icon = "<i class='fa fa-check fa-fw'></i>";
            $(".wv-image-size")
              .removeClass("wv-image-size-invalid");
            $("#wv-image-download-button")
              .button("enable");
          }
          $("#wv-image-width")
            .html((imgWidth));
          $("#wv-image-height")
            .html((imgHeight));
          $("#wv-image-size")
            .html(icon + imgFilesize + " MB");
        })
        .change();

    } catch (cause) {
      wv.util.error(cause);
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
  self.onResolutionChange = function() {

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
  var calulateFileSize = function(imgRes, conversionFactor, lonlat1, lonlat2) {
    var imgWidth, imgHeight;

    resolution = imgRes;
    imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(imgRes));
    imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(imgRes));

    return ((imgWidth * imgHeight * 24) / 8388608).toFixed(2);
  };
  var fileSizeInvalid = function(imgFilesize, imgHeight, imgWidth) {
    return (imgFilesize > 250 || imgHeight === 0 || imgWidth === 0);
  };
  var onDownload = function() {
    WVC.GA.event('Image Download', 'Click', 'Download');
    wv.util.metrics('lc=' + encodeURIComponent(dlURL + "&worldfile=" + imgWorldfile + "&format=" + imgFormat + "&width=" + imgWidth + "&height=" + imgHeight));
    window.open(dlURL + "&worldfile=" + imgWorldfile + "&format=" + imgFormat + "&width=" + imgWidth + "&height=" + imgHeight, "_blank");   
  };
  var createDownloadURL = function(time, lonlats, epsg, products, opacities) {
    var layers;
    var dlURL = url;
    var dTime = time;

    //Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
    var jStart = wv.util.parseDateUTC(dTime.getUTCFullYear() + "-01-01");
    var jDate = "00" + (1 + Math.ceil((dTime.getTime() - jStart) / 86400000));
    dlURL += "TIME=" + dTime.getUTCFullYear() + (jDate)
      .substr((jDate.length) - 3);

    dlURL += "&extent=" + lonlats[0][0] + "," + lonlats[0][1] + "," + lonlats[1][0] + "," + lonlats[1][1];

    //dlURL += "&switch="+s;
    dlURL += "&epsg=" + epsg;
    layers = getLayers(products);
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
  };
  init();

  return self;

};