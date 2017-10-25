var wv = wv || {};

wv.anim = wv.anim || {};

wv.anim.gif = wv.anim.gif || function(models, config, ui) {
  var self = {};
  var $cropee = $("#wv-map");
  var jcropAPI = null;
  var coords = null;
  var animCoords = null;
  var previousCoords = null;
  var animModel = models.anim;
  var $progress; // progress bar
  var loader;
  var showDates = true; // show date stamp
  var progressing = false; //if progress bar has started
  var GRATICLE_WARNING =
    "The graticule layer cannot be used to take a snapshot. Would you " +
    "like to hide this layer?";
  var PALETTE_WARNING =
    "One or more layers on the map have been modified (changed palette, " +
    "thresholds, etc.). These modifications cannot be used to take a " +
    "snapshot. Would you like to temporarily revert to the original " +
    "layer(s)?";
  var ROTATE_WARNING = "Image may not be downloaded when rotated. Would you like to reset rotation?";

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
    models.anim.events.on('gif-click', setImageCoords);
  };

  /*
   * Uses, frameUrl array and gifShot
   * Library to create GIF
   *
   *
   * @method createGIF
   * @static
   *
   * @returns {void}
   *
   */
  self.createGIF = function() {
    var stateObj = animModel.rangeState;
    var interval = stateObj.speed;
    var startDate = stateObj.startDate;
    var endDate = stateObj.endDate;
    var shootGIFafterImageLoad;
    var imageArra;
    var stamp;
    var build;

    loader = wv.ui.indicator.loading();
    build = function(stamp) {
      var buildProgressBar = function() {
        $progress = $("<progress />") //display progress for GIF creation
          .attr("class", "wv-gif-progress");
        wv.ui.getDialog()
          .append($progress)
          .dialog({ //dialog for progress
            title: "Collecting Images...",
            width: 300,
            height: 100
          });
        $progress.attr("value", 0);
      };
      var onGifProgress = function(captureProgress) {
        if (!progressing) {
          buildProgressBar();
          progressing = true;
          wv.ui.indicator.hide(loader);
        }
        $progress.parent()
          .dialog("option", "title", "Creating GIF..."); //set dialog title
        $progress.attr("value", captureProgress); //before value set, it is in indeterminate state
      };

      imageArra = getImageArray(startDate, endDate, $progress);
      if (!imageArra) { // won't be true if there are too mant frames
        return;
      }

      gifshot.createGIF({
        'gifWidth': animCoords.w,
        'gifHeight': animCoords.h,
        'images': imageArra,
        'stamp': stamp,
        'textAlign': 'right',
        'textBaseline': 'top',
        'fontColor': '#fff',
        'fontWeight': 'lighter',
        'fontFamily': 'Helvetica Neue',
        'fontSize': '16px',
        'interval': 1 / interval,
        'progressCallback': onGifProgress,
        'stroke': {
          'color': '#000',
          'pixels': 1.7
        },
        'pause': 1
      }, onGifComplete);
    };
    stamp = new Image();
    stamp.onload = function() {
      build(stamp);
    };
    stamp.onerror = function() {
      build(null);
    };
    stamp.src = 'brand/images/wv-icon-w-shadow.png';
  };

  /*
   * Calculates resolution of frame based
   * on zoom and projection
   *
   *
   * @func calcRes
   * @private
   *
   * @returns {void}
   *
   */
  var calcRes = function(mode) { //return either multiplier or string resolution
    //geographic has 10 zoom levels from 0 to 9, polar projections have 8 from 0 to 7
    var isGeographic = models.proj.selected.id === "geographic";

    //Map the zoom level from 0-9 / 0-7 to an index from 0-4
    var zoom_res = [40, 20, 4, 2, 1],
      str, res;
    if (isGeographic)
      res = zoom_res[Math.floor(ui.map.selected.getView()
        .getZoom() / 2)];

    else
      res = zoom_res[Math.floor(((ui.map.selected.getView()
        .getZoom() + 2) / 2))];

    if (mode === 0)
      return res;
    else {
      switch (res) {
        case 1:
          str = "250m";
          break;
        case 2:
          str = "500m";
          break;
        case 4:
          str = "1km";
          break;
        case 20:
          str = "5km";
          break;
        default:
          str = "10km";
      }

      return str;
    }
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
  self.getGif = function() {
    var layers;
    //check for rotation, changed palettes, and graticule layers and ask for reset if so

    //ui.anim.stop(); Add this
    layers = models.layers.get({
      renderable: true
    });
    if (models.palettes.inUse()) {
      wv.ui.ask({
        header: "Notice",
        message: PALETTE_WARNING,
        onOk: function() {
          previousPalettes = models.palettes.active;
          models.palettes.clear();
          self.getGif();
        }
      });
      return;
    }
    if (_.find(layers, {
      id: "Graticule"
    }) && models.proj.selected.id === "geographic") {
      wv.ui.ask({
        header: "Notice",
        message: GRATICULE_WARNING,
        onOk: function() {
          models.layers.setVisibility("Graticule", false);
          self.getGif(startDate, endDate, delta, interval);
        }
      });
      return;
    }
    if (ui.map.selected.getView()
      .getRotation() !== 0.0) {
      wv.ui.ask({
        header: "Reset rotation?",
        message: ROTATE_WARNING,
        onOk: function() {
          resetRotation();
          //Let rotation finish before reselecting can occur
          setImageCoords();
        }
      });
      return;
    }
    WVC.GA.event('Animation', 'Click', 'Create GIF');
    self.createGIF();
  };

  /*
   * Retieves avtive layers by day
   *
   * @method getLayersForDay
   * @private
   *
   * @param {array} array of layers
   *
   * @returns {array} array of layer ids
   *
   */
  var getLayers = function(products, proj) {
    var layers = [];
    _.each(products, function(layer) {
      if (layer.projections[proj].layer) {
        layers.push(layer.projections[proj].layer);
      } else {
        layers.push(layer.id);
      }
    });
    return layers;
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
  var getProducts = function(date) {
    var layers = [];
    var products = models.layers.get({
      reverse: true,
      renderable: true
    });
    _.each(products, function(layer) {
      if (layer.endDate) {
        if (date > new Date(layer.endDate)) return;
      }
      if (layer.visible && new Date(layer.startDate) < date) {
        layers.push(layer);
      } else if (!layer.startDate) {
        layers.push(layer);
      }
    });
    return layers;
  };

  /*
   * Retieves opacities from palettes
   *
   * @method getOpacities
   * @private
   *
   * @param {array} array of layers
   *
   * @returns {array} array of opacities
   *
   */
  var getOpacities = function(products) {
    var opacities = [];
    _.each(products, function(product) {
      opacities.push((_.isUndefined(product.opacity)) ? 1 : product.opacity);
    });
    return opacities;
  };

  /*
   * Retieves coordinates from pixel
   *
   * @method getCoords
   * @private
   *
   * @returns {array} array of coords
   *
   */
  var getCoords = function() {
    return [ui.map.selected.getCoordinateFromPixel([Math.floor(animCoords.x), Math.floor(animCoords.y2)]),
      ui.map.selected.getCoordinateFromPixel([Math.floor(animCoords.x2), Math.floor(animCoords.y)])];
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
  var getDimensions = function(lonlat, proj) {

    var conversionFactor = proj === "geographic" ? 0.002197 : 256;
    var res = calcRes(0);
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
  var getImageArray = function(startDate, endDate) {
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
    var lonlat = getCoords();
    var proj = models.proj.selected.id;
    var dimensions = getDimensions(lonlat, proj);
    var opacities;
    var epsg = (models.proj.change) ? models.proj.change.epsg : models.proj.selected.epsg;
    var products = getProducts();


    if (config.features.imageDownload) {
      host = config.features.imageDownload.host;
      path = config.parameters.imagegen || config.features.imageDownload.path;
    } else {
      host = 'https://gibs.earthdata.nasa.gov';
      path = 'image-download';
    }

    while (current <= toDate) {
      j++;
      strDate = wv.util.toISOStringDate(current);
      products = getProducts(current);

      layers = getLayers(products, proj);
      opacities = getOpacities(products);
      url = wv.util.format(host + '/' + path + "?{1}&extent={2}&epsg={3}&layers={4}&opacities={5}&worldfile=false&format=image/jpeg&width={6}&height={7}", "TIME={1}", lonlat[0][0] + "," + lonlat[0][1] + "," + lonlat[1][0] + "," + lonlat[1][1], epsg, layers.join(","), opacities.join(","), dimensions[0], dimensions[1]);
      src = wv.util.format(url, strDate);
      if (showDates) {
        a.push({
          src: src,
          text: strDate
        });
      } else {
        a.push(src);
      }
      current = wv.util.dateAdd(current, ui.anim.ui.getInterval(), 1);
      if (j > 40) { // too many frames
        showUnavailableReason();
        wv.ui.indicator.hide(loader);

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
    callback = function() {
      $('#timeline-footer')
        .toggleClass('wv-anim-active');
    };
    wv.ui.notify(headerMsg + bodyMsg, "Notice", 600, callback);
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
  var onGifComplete = function(obj) { //callback function for when image is finished
    if (obj.error === false) {
      $progress.remove();
      progressing = false;
      var animatedImage = document.createElement('img');

      //Create a blob out of the image's base64 encoding because Chrome can't handle large data URIs, taken from:
      //http://stackoverflow.com/questions/16761927/aw-snap-when-data-uri-is-too-large
      var byteCharacters = atob(obj.image.substring(22)),
        byteArrays = []; //remove "data:image/gif;base64,"
      for (var offset = 0; offset < byteCharacters.length; offset += 512) {
        var slice = byteCharacters.slice(offset, offset + 512);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++)
          byteNumbers[i] = slice.charCodeAt(i);

        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      var blob = new Blob(byteArrays, {
        type: "image/gif"
      });
      var blobURL = URL.createObjectURL(blob); //supported in Chrome and FF
      animatedImage.src = blobURL;
      var dlURL = wv.util.format("nasa-worldview-{1}-to-{2}.gif", animModel.rangeState.startDate, animModel.rangeState.endDate);
      var downloadSize = (blob.size / 1024)
        .toFixed();

      //Create download link and apply button CSS
      var $download = $("<a><span class=ui-button-text>Download</span></a>")
        .attr("type", "button")
        .attr("role", "button")
        .attr("download", dlURL)
        .attr("href", blobURL)
        .attr("class", "ui-button ui-widget ui-state-default ui-button-text-only")
        .hover(function() {
          $(this)
            .addClass("ui-state-hover");
        }, function() {
          $(this)
            .removeClass("ui-state-hover");
        })
        .click(function() {
          WVC.GA.event('Animation', 'Download', 'GIF', downloadSize);
        });

      var $catalog =
        "<div class='gif-results-dialog' style='height: " + animCoords.h + "px; min-height: 210px;' >" +
        "<div>" +
        "<div><b>" +
        "Size: " +
        "</b></div>" +
        "<div>" +
        downloadSize + " KB" +
        "</div>" +
        "</div>" +
        "<div>" +
        "<div><b>" +
        "Speed: " +
        "</b></div>" +
        "<div>" +
        animModel.rangeState.speed + " fps" +
        "</div>" +

        "</div>" +
        "<div>" +
        "<div><b>" +
        "Date Range: " +
        "</b></div>" +
        "<div>" +
        animModel.rangeState.startDate +
        "</div>" +
        "<div>" +
        " - " +
        "</div>" +
        "<div>" +
        animModel.rangeState.endDate +
        "</div>" +
        "</div>" +
        "<div>" +
        "<div><b>" +
        "Increments: " +
        "</b></div>" +
        "<div>" +
        ui.anim.widget.getIncrements() +
        "</div>" +

        "</div>" +
        "</div>";
      var $dialogBodyCase = $("<div></div>");
      $dialogBodyCase.addClass('gif-results-dialog-case');
      $dialogBodyCase.css('padding', '10px 0');
      $dialogBodyCase.append(animatedImage);
      $dialogBodyCase.append($catalog);
      //calculate the offset of the dialog position based on image size to display it properly
      //only height needs to be adjusted to center the dialog
      var pos_width = animCoords.w * 1 / window.innerWidth,
        pos_height = animCoords.h * 50 / window.innerHeight;
      var at_string = "center-" + pos_width.toFixed() + "% center-" + pos_height.toFixed() + "%";

      //Create a dialog over the view and place the image there
      var $imgDialog = wv.ui.getDialog()
        .append($dialogBodyCase)
        .append($download);
      $imgDialog.dialog({
        dialogClass: "wv-panel wv-gif-results",
        title: "Your GIF",
        width: animCoords.w + 198,
        resizable: false,
        close: function() {
          animCoords = null;
          $imgDialog.find("img")
            .remove();
          $('#timeline-footer')
            .toggleClass('wv-anim-active');
        },
        position: { //based on image size
          my: "center center",
          at: at_string,
          of: window
        }
      });
    } else {
      var headerMsg = "<h3 class='wv-data-unavailable-header'>GIF Not Available</h3>";
      var bodyMsg = 'One or more of the frames requested was unable to be processed';
      wv.ui.indicator.hide(loader);
      callback = function() {
        $('#timeline-footer')
          .toggleClass('wv-anim-active');
      };
      wv.ui.notify(headerMsg + bodyMsg, "Notice", 600, callback);
    }
  };

  /*
   * uses resolution and dimension to
   * calculates size of selected area
   *
   * @method calcSize
   * @private
   *
   * @param c {object} dimension object
   *
   * @returns {number} Size of frame
   *
   */
  var calcSize = function(c) {
    var lonlat1 = ui.map.selected.getCoordinateFromPixel([Math.floor(c.x), Math.floor(c.y2)]),
      lonlat2 = ui.map.selected.getCoordinateFromPixel([Math.floor(c.x2), Math.floor(c.y)]);

    var conversionFactor = models.proj.selected.id === "geographic" ? 0.002197 : 256,
      res = calcRes(0);

    var imgWidth = Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(res)),
      imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(res));

    return ((imgWidth * imgHeight * 24) / 8388608)
      .toFixed(2);
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
    $("#wv-map")
      .insertAfter('#productsHolder'); //retain map element before disabling jcrop
    animCoords = undefined;
    jcropAPI.destroy();
    if (models.proj.selected.id === "geographic")
      ui.map.events.trigger('selectiondone');
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
  self.getSelectorDialog = function(width) {
    var $dialogBox;
    var $createButton;
    var $footer;
    var $dialog = $("<div class='gif-dialog'></div>");
    var $checkBox;
    var dialog =
      "<div class='content'>" +
      "Create an animation from " +
      "<b>" +
      animModel.rangeState.startDate +
      "</b>" +
      " to " +
      "<b>" +
      animModel.rangeState.endDate +
      "</b>" +
      " at a rate of " +
      animModel.rangeState.speed +
      " frames per second" +
      "</div>";
    $createButton = $("<a><span class=ui-button-text>Create GIF</span></a>")
      .attr("type", "button")
      .attr("role", "button")
      .attr("class", "ui-button ui-widget ui-state-default ui-button-text-only")
      .hover(function() {
        $(this)
          .addClass("ui-state-hover");
      }, function() {
        $(this)
          .removeClass("ui-state-hover");
      });
    $checkBox = $("<div class='wv-checkbox-date'><label for='checkbox-date'><input type='checkbox' title='Check box to remove dates from Animating GIF' name='checkbox-date' class='checkbox-date-input' id='checkbox-date-input'>Include Date Stamps</label></div>");
    $footer = $('<div></div>');
    $footer.append($createButton)
      .append($checkBox);
    $dialog.html(dialog)
      .append($footer);
    // init Checkbox state and listeners
    initCheckBox($checkBox);

    $createButton.on('click', self.getGif);
    $dialogBox = wv.ui.getDialog();
    $dialogBox.html($dialog);
    $dialogBox.css({
      paddingBottom: '10px'
    });
    $dialogBox.dialog({
      dialogClass: "wv-panel wv-image",
      title: "Generate GIF",
      height: 'auto',
      width: width,
      minHeight: 40,
      minWidth: 287,
      resizable: false,
      show: {
        effect: "slide",
        direction: "down"
      },
      position: {
        my: "left top",
        at: "left bottom+10",
        of: $(".jcrop-tracker")
      },

      close: function(event) {
        destoryCheckboxListeners($checkBox);
        $("#wv-map")
          .insertAfter('#productsHolder'); //retain map element before disabling jcrop
        jcropAPI.destroy();
        if (models.proj.selected.id === "geographic")
          ui.map.events.trigger('selectiondone');
      }
    });
    return $dialogBox;
  };

  /*
   * Inits iCheck default
   * to enable Gif-date-stamp
   * toggling
   *
   * @method initCheckBox
   * @private
   *
   * @param $checkBox {Jquery} checkbox
   *
   * @returns {void}
   *
   */
  var initCheckBox = function($checkBox) {
    $checkBox.iCheck({
      checkboxClass: 'icheckbox_square-red'
    });
    $checkBox.iCheck('check');
    showDates = true;
    $checkBox.on('ifChecked', onchecked);
    $checkBox.on('ifUnchecked', onchecked);
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
  var onchecked = function(e) {
    if (e.type === 'ifUnchecked') {
      showDates = false;
    } else {
      showDates = true;
    }
  };
  /*
   * checkBox event listener destroyer
   *
   * @method destoryCheckboxListeners
   * @private
   *
   * @param $checkBox {Jquery} checkbox
   *
   * @returns {void}
   *
   */
  var destoryCheckboxListeners = function($checkBox) {
    $checkBox.off('ifChecked', onchecked);
    $checkBox.off('ifUnchecked', onchecked);
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
      $parent.width(width);
      $parent.position({
        my: "left top",
        at: "left bottom+10",
        of: $(".jcrop-tracker")
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
    var fs = Math.abs(width / 4);
    if (!$el)
      return;
    if (fs <= 30) {
      fs = 30;
    }
    $el.css('font-size', fs);
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
    //Set JCrop selection
    if (previousCoords === null || previousCoords === undefined)
      previousCoords = [($(window)
        .width() / 2) - 100, ($(window)
        .height() / 2) - 100, ($(window)
        .width() / 2) + 100, ($(window)
        .height() / 2) + 100];
    else
      previousCoords = [previousCoords.x, previousCoords.y, previousCoords.x2, previousCoords.y2];

    if (models.proj.selected.id === "geographic")
      ui.map.events.trigger('selecting');
    starterWidth = previousCoords[0] - previousCoords[2];
    //Start the image cropping. Show the dialog
    $("#wv-map")
      .Jcrop({
        bgColor: 'black',
        bgOpacity: 0.3,
        fullScreen: true,
        setSelect: previousCoords,
        onSelect: function(c) {
          animCoords = c;
          $("#wv-gif-width")
            .html((c.w));
          $("#wv-gif-height")
            .html((c.h));
        },
        onChange: function(c) { //Update gif size and image size in MB
          var modalLeftMargin;
          animCoords = c;

          if (c.h !== 0 && c.w !== 0) //don't save coordinates if empty selection
            previousCoords = c;
          var dataSize = calcSize(c);
          //Update the gif selection dialog
          $("#wv-gif-width")
            .html((c.w));
          $("#wv-gif-height")
            .html((c.h));
          $("#wv-gif-size")
            .html(dataSize + " MB");

          if (dataSize > 250) { //disable GIF generation if GIF would be too large
            $("#wv-gif-button")
              .button("disable");
          } else {
            $("#wv-gif-button")
              .button("enable");
          }
          setDialogWidth($dialog, c.w);
          setIconFontSize($dlButton, c.w);
        },
        onRelease: function(c) {
          removeCrop();
          $('#timeline-footer')
            .toggleClass('wv-anim-active');
          if ($dialog) {
            wv.ui.close();
          }
        }
      }, function() {
        var $tracker;
        $dlButton =
          "<div class='wv-dl-gif-bt-case'>" +
          "<i class='fa fa-download'>" +
          "</div>";
        jcropAPI = this;
        $('#timeline-footer')
          .toggleClass('wv-anim-active');
        $dialog = self.getSelectorDialog();
        $tracker = this.ui.selection.find('.jcrop-tracker');
        $tracker.append($dlButton);
        $dlButton = $('.wv-dl-gif-bt-case i');
        setIconFontSize($dlButton, starterWidth);
        $dlButton.on('click', self.getGif);


      });
  };
  self.init();
  return self;
};
