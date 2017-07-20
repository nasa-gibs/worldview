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
/*eslint no-unused-vars: "error"*/
var wv = wv || {};
wv.image = wv.image || {};

wv.image.panel = wv.image.panel || function(models, ui, config) {

    var self = {};

    var resSelectionFactory;
    var containerId = "imagedownload";
    var coords;
    var resolution = "1";
    var format = "image/jpeg";
    var worldfile = "false";
    var lastZoom = -1;

    var host, path;

     if ( config.features.imageDownload ) {
         host = config.features.imageDownload.host;
         path = config.parameters.imagegen || config.features.imageDownload.path;
     } else {
         host = "http://map2.vis.earthdata.nasa.gov";
         path = "imagegen/index.php";
     }
     url = host + "/" + path + "?";

    if ( config.parameters.imagegen ) {
        wv.util.warn("Redirecting image download to: " + url);

    }


    var init = function() {
        var container = getContainer(containerId);
        resSelectionFactory = React.createFactory(WVC.ResolutionSelection);
        var modal = ReactDOM.render(resSelectionFactory(), container);
        ui.rubberband.events.on("update", update);
        ui.rubberband.events.on("show", show);
    };

    var getContainer = function(id) {
        var container = document.getElementById(id);
        if (container === null){
            throw new Error("Error: element #'" + id + "' not found!");
        }
        return container;
    };

    /**
      * Initialize a map object in Lat/Long projection, and add a "fake" layer to compute the map math.
      * Display the HTML UI with UI options.   *
      * @this {Download}
    */
    var show = function(){
        var geographic = (models.proj.selected.id === "geographic");
        alignTo = { id: "wv-image-button" };

        setPosition();
        $(window).resize(setPosition);

        
        // $dialog.dialog({
        //     dialogClass: "wv-panel wv-image",
        //     title: "Take a snapshot",
        //     show: { effect: "slide", direction: "up" },
        //     hide: { effect: "slide", direction: "up" },
        //     width: 230,
        //     height: "auto",
        //     minHeight: 10,
        //     draggable: false,
        //     resizable: false,
        //     autoOpen: false
        // });
        //$("#wv-image-resolution").buttonset();
        //$("#wv-image-format").buttonset();
        $("#wv-image-download-button").button();
        $(".ui-dialog").zIndex(600);

        // Remove higher resolution options from polar views since no higher
        // resolution polar layers currenly exist


        // Auto-set default resolution to map's current zoom level; round it
        // for incremental zoom steps
        var curZoom = Math.round(ui.map.selected.getView().getZoom());

        // Don't do anything if the user hasn't changed zoom levels; we want to
        // preserve their existing settings
        if (curZoom != lastZoom) {
            lastZoom = curZoom;

            // Find the closest match of resolution within the available values

            resolution = getCurrentRes(resolutionEstimate, geographic);
        }


        $("#wv-image-format").change(function() {
            format = $("#wv-image-format option:checked").val();
            update(coords);
        });


        $("#wv-image-worldfile").change(function(){
            worldfile=$("#wv-image-worldfile option:checked").val();
            update(coords);
        });
    };

    var getCurrentRes = function(resolutionEstimate, geographic) {
        var resolution, bestDiff, bestIdx, currDiff, possibleResolutions, nZoomLevels, curResolution;

        vnZoomLevels = models.proj.selected.resolutions.length;
        curResolution = (curZoom >= nZoomLevels) ?
                models.proj.selected.resolutions[nZoomLevels-1] :
                models.proj.selected.resolutions[curZoom];

            // Estimate the option value used by "wv-image-resolution"
            var resolutionEstimate = (geographic) ?
                curResolution / 0.002197265625 : curResolution / 256.0;

        
        bestDiff = Infinity;
        bestIdx = -1;
        currDiff = 0;
        possibleResolutions = geographic ? [0.125, 0.25, 0.5, 1, 2, 4, 20, 40] : [1, 2, 4, 20, 40];

        for(var i = 0; i < possibleResolutions.length; i++) {
            currDiff = Math.abs(possibleResolutions[i] - resolutionEstimate);
            if(currDiff < bestDiff){
                resolution = possibleResolutions[i];
                bestDiff = currDiff;
                bestIdx = i;
            }
        }
        // Bump up resolution in certain cases where default is too low
        if (bestIdx > 0) {
            if (geographic) {
                switch (curZoom) {
                    case 3:
                    case 4:
                    case 6:
                    case 7:
                        resolution = possibleResolutions[bestIdx-1];
                }
            }
            else {
                switch (curZoom) {
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        resolution = possibleResolutions[bestIdx-1];
                }
            }
        }
        return resolution;
    };
    var getProps = function() {
        var firstSelection = getResOptions();
        var secondSelection = getResolutionTypes();
        var resolution = getCurrentRes();

        return {
            firstSelection: firstSelection,
            secondSelection: secondSelection,
            resolution: resolution,
        };
    };
    var updateComponentState = function() {
        var props = getProps();
    };
    var getPosition = function(){
        var offset = $("#" + alignTo.id).offset();
        var left = offset.left + parseInt($("#"+alignTo.id).css("width")) - parseInt($("#"+id).css("width"));
        $("#"+id).css("left",left+"px");
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
            opacities.push( ( _.isUndefined(product.opacity) ) ? 1: product.opacity );
        });
        return opacities;
    };

    var update = function(c){
        try {
            coords = c;
            var map = ui.map.selected;
            //What's this for?
            //var bbox = map.getExtent();
            var time = models.date.selected;
            var pixels = coords;
            var s = models.proj.selected.id;
            var products = models.layers.get({
                reverse: true,
                renderable: true
            });
            // NOTE: This needs to be changed back to the projection model
            // when the backfill removes the old projection.
            var epsg = ( models.proj.change ) ? models.proj.change.epsg :
                    models.proj.selected.epsg;

            // get layer transparencies (opacities)
            opacities = getOpacities(products);

            var px = pixels;
            var x1 = px.x; var y1= px.y; var x2 = px.x2; var y2=px.y2;

            var crs = models.proj.selected.crs;
            var lonlat1 = map.getCoordinateFromPixel([Math.floor(x1), Math.floor(y2)]);
            var lonlat2 = map.getCoordinateFromPixel([Math.floor(x2), Math.floor(y1)]);

            var geolonlat1 = ol.proj.transform(lonlat1, crs, "EPSG:4326");
            var geolonlat2 = ol.proj.transform(lonlat2, crs, "EPSG:4326");

            var minLon = geolonlat1[0];
            var maxLon = geolonlat2[0];
            var minLat = geolonlat2[1];
            var maxLat = geolonlat1[1];

            var ll = wv.util.formatCoordinate([minLon, maxLat]);
            var ur = wv.util.formatCoordinate([maxLon, minLat]);

            if ( x2 - x1 < 150 ) {
                ll = "";
                ur = "";
            }

            $("#wv-image-top").css({
                left: x1 - 10,
                top: y1 - 20,
                width: x2 - x1
            }).html(ur);
            $("#wv-image-bottom").css({
                left: x1,
                top: y2,
                width: x2 - x1
            }).html(ll);

            var dlURL = url;
            var conversionFactor = 256;
            if (s=="geographic") {
                conversionFactor = 0.002197;
            }

             var dTime = time;
             //Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
             var jStart = wv.util.parseDateUTC(dTime.getUTCFullYear() + "-01-01");
             var jDate = "00" + (1+Math.ceil((dTime.getTime() - jStart) / 86400000));
             dlURL += "TIME="+dTime.getUTCFullYear()+(jDate).substr((jDate.length)-3);

            dlURL += "&extent="+lonlat1[0]+","+lonlat1[1]+","+lonlat2[0]+","+lonlat2[1];

            //dlURL += "&switch="+s;
            dlURL += "&epsg="+epsg;
            var layers = [];
            _.each(products, function(layer) {
                if ( layer.projections[s].layer ) {
                    layers.push(layer.projections[s].layer);
                } else {
                    layers.push(layer.id);
                }
            });
            dlURL +="&layers=" + layers.join(",");
            dlURL +="&opacities="+opacities.join(",");

            var imgWidth=0; var imgHeight=0;
            var imgFormat, imgWorldfile;

            $("#wv-image-resolution").unbind("change").change(function () {
                imgRes =  $("#wv-image-resolution option:checked").val();
                resolution = imgRes;
                imgWidth =  Math.round((Math.abs(lonlat2[0] - lonlat1[0]) / conversionFactor) / Number(imgRes));
                imgHeight = Math.round((Math.abs(lonlat2[1] - lonlat1[1]) / conversionFactor) / Number(imgRes));
                imgFilesize =  ((   imgWidth * imgHeight * 24) / 8388608).toFixed(2);
                imgFormat = $("#wv-image-format option:checked").val();
                imgWorldfile = $("#wv-image-worldfile option:checked").val();
                var invalid = (imgFilesize>250 || imgHeight === 0 || imgWidth === 0);
                var icon;
                if ( invalid ) {
                    icon = "<i class='fa fa-times fa-fw'></i>";
                    $(".wv-image-size").addClass("wv-image-size-invalid");
                    $("#wv-image-download-button").button("disable");
                } else {
                    icon = "<i class='fa fa-check fa-fw'></i>";
                    $(".wv-image-size").removeClass("wv-image-size-invalid");
                    $("#wv-image-download-button").button("enable");
                }
                $("#wv-image-width").html((imgWidth));
                $("#wv-image-height").html((imgHeight));
                $("#wv-image-size").html(icon + imgFilesize + " MB");
            }).change();


            $("#wv-image-download-button").unbind('click').click(function() {
                WVC.GA.event('Image Download', 'Click', 'Download');
                wv.util.metrics('lc='+encodeURIComponent(dlURL+"&worldfile="+imgWorldfile+"&format="+imgFormat+"&width="+imgWidth+"&height="+imgHeight) );
                window.open(dlURL+"&worldfile="+imgWorldfile+"&format="+imgFormat+"&width="+imgWidth+"&height="+imgHeight,"_blank");
            });
        } catch ( cause ) {
            wv.util.error(cause);
        }

    };
    var getResOptions = function() {
        if(models.proj.selected.id !== "geographic") {
            return [
                {value: '1', text: '250m'},
                {value: '2', text: '500m'},
                {value: '4', text: '1km'},
                {value: '20', text: '5km'},
                {value: '40', text: '10km'}
            ];
        }
        return [
            {value: '0.125', text: '30m'},
            {value: '0.25', text: '60m'},
            {value: '0.5', text: '125m'},
            {value: '1', text: '250m'},
            {value: '2', text: '500m'},
            {value: '4', text: '1km'},
            {value: '20', text: '5km'},
            {value: '40', text: '10km'}
        ];
    };
    var getResolutionTypes = function() {
        if(models.proj.selected.id !== "geographic") {
            return [
                {value: 'image/jpeg', text: 'JPEG'},
                {value: 'image/png', text: 'PNG'},
                {value: 'image/geotiff', text: 'GeoTIFF'},
            ];
        }
        return [
            {value: 'image/jpeg', text: 'JPEG'},
            {value: 'image/png', text: 'PNG'},
            {value: 'image/geotiff', text: 'GeoTIFF'},
            {value: 'image/kmz', text: 'KMZ'}
        ];
    };
    init();

    return self;

};
