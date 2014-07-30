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
    var coords;
    var resolution = "1";
    var format = "image/jpeg";
    
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
            "<div class='wv-image-header'>" +
            "<select id='wv-image-resolution'>" +
                "<option value='1' >250m</option>" +
                "<option value='2' >500m</option>" +
                "<option value='4' >1km</option>" +
                "<option value='20'>5km</option>" +
                "<option value='40'>10km</option>" +
            "</select>Resolution (per pixel)</div>" +
            "<div class='wv-image-header'>" +
            "<select id='wv-image-format'>" +
                "<option value='image/jpeg'>JPEG</option>" +
                "<option value='image/png'>PNG</option>" +
                "<option value='image/geotiff'>GeoTIFF</option>" +
                "<option  value='image/kmz'>KMZ</option>" +
            "</select>Format</div>" +
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
            title: "Take a snapshot",
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
        //$("#wv-image-resolution").buttonset();
        //$("#wv-image-format").buttonset();
        $("#wv-image-download-button").button();
        $(".ui-dialog").zIndex(600);

        if ( models.proj.selected.id !== "geographic" ) {
             $("#wv-image-format-kmz").button("disable");
        }
        $("#wv-image-format").change(function() {
            format = $("#wv-image-format option:checked").val();
            update(coords);
        });
        
        $("#wv-image-resolution option").removeAttr("selected");
        $("#wv-image-resolution option[value='" + resolution + "']").attr("selected", "selected");

        $("#wv-image-format option").removeAttr("selected");
        $("#wv-image-format option[value='" + format + "']").attr("selected", "selected");
        
        $dialog.dialog("open");        
    };

    var setPosition = function(){
        var offset = $("#"+alignTo.id).offset();
        var left = offset.left + parseInt($("#"+alignTo.id).css("width")) - parseInt($("#"+id).css("width"));
        $("#"+id).css("left",left+"px");
    };


    var update = function(c){
        try {
            coords = c;
            var map = ui.map.selected;
            var bbox = map.getExtent();
            var time = models.date.selected;
            var pixels = coords;
            var s = models.proj.selected.id;
            var products = models.layers.get({
                reverse: true,
                renderable: true
            });
            // NOTE: This need to be changed back to the projection model
            // when the backfill removes the old projection.
            var epsg = models.proj.change.epsg;

            //console.log("EPSG: " + epsg);

            var px = pixels;
            var x1 = px.x; var y1= px.y; var x2 = px.x2; var y2=px.y2;
            var lonlat1 = map.getLonLatFromViewPortPx(new OpenLayers.Pixel(Math.floor(x1), Math.floor(y2)));
            var lonlat2 = map.getLonLatFromViewPortPx(new OpenLayers.Pixel(Math.floor(x2), Math.floor(y1)));

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



            dlURL += "&extent="+lonlat1.lon+","+lonlat1.lat+","+lonlat2.lon+","+lonlat2.lat;

            //dlURL += "&switch="+s;
            dlURL += "&epsg="+epsg;
            dlURL +="&layers=" + _.pluck(products, "id").join(",");

            var imgWidth=0; var imgHeight=0;
            var imageRes, imgFileSize, imgFormat;

            $("#wv-image-resolution").unbind("change").change(function () {
                imgRes =  $("#wv-image-resolution option:checked").val();
                resolution = imgRes;
                imgWidth =  Math.round((Math.abs(lonlat2.lon - lonlat1.lon) / conversionFactor) / Number(imgRes));
                imgHeight = Math.round((Math.abs(lonlat2.lat - lonlat1.lat) / conversionFactor) / Number(imgRes));
                imgFilesize =  ((   imgWidth * imgHeight * 24) / 8388608).toFixed(2);
                imgFormat = $("#wv-image-format option:checked").val();
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
