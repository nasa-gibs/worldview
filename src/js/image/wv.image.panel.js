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

var wv = wv || {};
wv.image = wv.image || {};

wv.image.panel = wv.image.panel || function(models, ui, config) {

    var self = {};

    var BASE_URL = "http://map2.vis.earthdata.nasa.gov/imagegen/index";
    var container;
    var alignTo = config.alignTo;
    var containerId = "imagedownload";
    var id = containerId;

    if ( config.parameters.imagegen ) {
        wv.util.warn("Redirecting image download to: " + BASE_URL +
               "-" + config.parameters.imagegen + ".php");
    }

    var init = function() {
        ui.rubberband.events.on("update", update);
        ui.rubberband.events.on("show", show);
    };

    /**
      * Initialize a map object in Lat/Long projection, and add a "fake" layer to compute the map math.
      * Display the HTML UI with UI options.   *
      * @this {Download}
    */
    var show = function(){
        alignTo = { id: "wv-image-button" };
        container=document.getElementById(containerId);

        if (container===null){
            throw new Error("Error: element '"+containerId+"' not found!");
        }

        container.setAttribute("class","imagedownload");

        setPosition();
        $(window).resize(setPosition);

        var htmlElements =
            "<div id='wv-image-resolution'>" +
                "<input type='radio' id='wv-image-resolution-250m' name='wv-image-resolution' value='1' checked><label for='wv-image-resolution-250m'>250m</label>" +
                "<input type='radio' id='wv-image-resolution-500m' name='wv-image-resolution' value='2' ><label for='wv-image-resolution-500m'>500m</label>" +
                "<input type='radio' id='wv-image-resolution-1km'  name='wv-image-resolution' value='4' ><label for='wv-image-resolution-1km' >1km</label>" +
                "<input type='radio' id='wv-image-resolution-5km'  name='wv-image-resolution' value='20'><label for='wv-image-resolution-5km' >5km</label>" +
                "<input type='radio' id='wv-image-resolution-10km' name='wv-image-resolution' value='40'><label for='wv-image-resolution-10km' >10km</label>" +
            "</div>" +
            "<div class='wv-image-header'>Format</div>" +
            "<div id='wv-image-format'>" +
                "<input type='radio' id='wv-image-format-jpeg'    name='wv-image-format' value='image/jpeg' checked><label for='wv-image-format-jpeg'   >JPEG</label>" +
                "<input type='radio' id='wv-image-format-png'     name='wv-image-format' value='image/png'     ><label for='wv-image-format-png'    >PNG</label>" +
                "<input type='radio' id='wv-image-format-geotiff' name='wv-image-format' value='image/geotiff' ><label for='wv-image-format-geotiff'>GeoTIFF</label>" +
                "<input type='radio' id='wv-image-format-kmz'     name='wv-image-format' value='image/kmz'     ><label for='wv-image-format-kmz'    >KMZ</label>" +
            "</div>" +
            "<table class='wv-image-download'>" +
                "<tr>" +
                    "<th>Raw Size</th>" +
                    "<th>Maximum</th>" +
                "</tr>" +
                "<tr>" +
                    "<td id='wv-image-size' class='wv-image-size'>000.00MB</td>" +
                    "<td class='wv-image-size'>250 MB</td>" +
                "</tr>" +
                "<tr>" +
                    "<td><span id='wv-image-width'>0000</span> x <span id='wv-image-height'>0000</span> px</td>" +
                    "<td><button id='wv-image-download-button'>Download</button>" +
                "</tr>" +
            "</table>" +
            "</div>";

        var $dialog = wv.ui.getDialog().html(htmlElements);
        $dialog.dialog({
            dialogClass: "wv-panel wv-image",
            title: "Resolution (per pixel)",
            show: { effect: "slide", direction: "up" },
            hide: { effect: "slide", direction: "up" },
            width: 230,
            height: "auto",
            minHeight: 10,
            position: {
                my: "left top",
                at: "left bottom+5",
                of: ("#wv-image-button"),
            },
            draggable: false,
            resizable: false,
            autoOpen: false
        });
        $("#wv-image-resolution").buttonset();
        $("#wv-image-format").buttonset();
        $("#wv-image-download-button").button();
        $(".ui-dialog").zIndex(600);

        if ( models.proj.selected.id !== "geographic" ) {
             $("#wv-image-format-kmz").button("disable");
        }
        $dialog.dialog("open");
    };

    var setPosition = function(){
        var offset = $("#"+alignTo.id).offset();
        var left = offset.left + parseInt($("#"+alignTo.id).css("width")) - parseInt($("#"+id).css("width"));
        $("#"+id).css("left",left+"px");
    };


    var update = function(coords){
        try {
            var map = models.map.selected;
            var bbox = map.getExtent();
            var time = models.date.selected;
            var pixels = coords;
            var s = models.proj.selected.id;
            var products = models.layers.get({
                visibleOnly: true,
                reverse: true,
                availableOnly: true
            });
            // NOTE: This need to be changed back to the projection model
            // when the backfill removes the old projection.
            var epsg = models.proj.change.epsg;

            //console.log("EPSG: " + epsg);

            var px = pixels;
            var x1 = px.x; var y1= px.y; var x2 = px.x2; var y2=px.y2;
            var lonlat1 = map.getLonLatFromViewPortPx(new OpenLayers.Pixel(Math.floor(x1), Math.floor(y2)));
            var lonlat2 = map.getLonLatFromViewPortPx(new OpenLayers.Pixel(Math.floor(x2), Math.floor(y1)));

            var dlURL = null;
            var imagegen = config.parameters.imagegen;
            if ( imagegen ) {
                dlURL = BASE_URL + "-" + imagegen + ".php?";
            } else {
                dlURL= BASE_URL + ".php?";
            }

            var conversionFactor = 256;
            if (s=="geographic") {
                conversionFactor = 0.002197;
            }

             var dTime = time;
             //Julian date, padded with two zeros (to ensure the julian date is always in DDD format).
             var jStart = wv.util.parseDateUTC(dTime.getUTCFullYear() + "-01-01");
             var jDate = "00" + (1+Math.ceil((dTime.getTime() - jStart) / 86400000));
             dlURL += "TIME="+dTime.getUTCFullYear()+(jDate).substr((jDate.length)-3);



            dlURL += "&extent="+lonlat1.lon+","+lonlat1.lat+","+lonlat2.lon+","+lonlat2.lat;

            //dlURL += "&switch="+s;
            dlURL += "&epsg="+epsg;
            dlURL +="&layers=" + _.pluck(products, "id").join(",");

            var imgWidth=0; var imgHeight=0;
            var imageRes, imgFileSize, imgFormat;

            $("#wv-image-resolution").change(function () {
                        imgRes =  $("#wv-image-resolution input:checked").val();
                        imgWidth =  Math.round((Math.abs(lonlat2.lon - lonlat1.lon) / conversionFactor) / Number(imgRes));
                        imgHeight = Math.round((Math.abs(lonlat2.lat - lonlat1.lat) / conversionFactor) / Number(imgRes));
                        imgFilesize =  ((   imgWidth * imgHeight * 24) / 8388608).toFixed(2);
                        imgFormat = $("#wv-image-format input:checked").val();
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
                })
             .change();


              $("#wv-image-download-button").unbind('click').click(function(){
                 wv.util.metrics('lc='+encodeURIComponent(dlURL+"&format="+imgFormat+"&width="+imgWidth+"&height="+imgHeight) );
                 window.open(dlURL+"&format="+imgFormat+"&width="+imgWidth+"&height="+imgHeight,"_blank");
              });
        } catch ( cause ) {
            wv.util.error(cause);
        }
    };

    init();

    return self;

};