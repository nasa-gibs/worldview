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

    /**
      * Initialize a map object in Lat/Long projection, and add a "fake" layer to compute the map math.
      * Display the HTML UI with UI options.   *
      * @this {Download}
    */
    var init = function(){

        alignTo = { id: "wv-image-button" };
        container=document.getElementById(containerId);

        if (container===null){
            throw new Error("Error: element '"+containerId+"' not found!");
        }

        container.setAttribute("class","imagedownload");

        setPosition();
        $(window).resize(setPosition);

        var htmlElements = "<div>Resolution (per pixel): <select id='selImgResolution'><option value='1'>250m</option><option value='2'>500m</option><option value='4'>1km</option><option value='20'>5km</option><option value='40'>10km</option></select>";
        htmlElements +="<br />Format: <select id='selImgFormat'><option value='image/jpeg'>JPEG</option><option value='image/png'>PNG</option><option value='image/geotiff'>GeoTIFF</option></select>";
        htmlElements +="<br />Raw Image Size: ~ <span id='imgFileSize'> </span> MB <br />(<span id='imgWidth''></span> x <span id='imgHeight'></span> pixels)";
        htmlElements += "<br /><span style='font-size:10px; color:#aaa; font-style:italic;'>(Max Size: 250 MB)</span> ";//(<span id='imgWidth''></span> x <span id='imgHeight'></span> pixels)
        htmlElements += "<br /><input type='button' id='btnImgDownload' value='Download'/>";
        htmlElements +="</div>";

        $("#"+id).html(htmlElements);

        ui.rubberband.events.on("update", update);

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
                if( 0 === $('#selImgFormat option[value=KMZ]').length) {
                    $('#selImgFormat').append( $('<option></option>').val("KMZ").text("KMZ"));
                }
                conversionFactor = 0.002197;
            }
            else { //polar
             if( 0 !== $('#selImgFormat option[value=KMZ]').length) {
                    $('#selImgFormat option[value=KMZ]').remove();
                }
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


            $("select#selImgResolution").change(function () {
                        imgRes =  $("#selImgResolution option:selected").val();
                        imgWidth =  Math.round((Math.abs(lonlat2.lon - lonlat1.lon) / conversionFactor) / Number(imgRes));
                        imgHeight = Math.round((Math.abs(lonlat2.lat - lonlat1.lat) / conversionFactor) / Number(imgRes));
                        imgFilesize =  ((   imgWidth * imgHeight * 24) / 8388608).toFixed(2);

                $("#imgWidth").text((imgWidth));
                $("#imgHeight").text((imgHeight));
                $("#imgFileSize").text(imgFilesize);
                if(imgFilesize>250 || imgHeight === 0 || imgWidth === 0) { $("#imgFileSize").css("color", "#D99694");  $("#btnImgDownload").attr("disabled", "disabled"); }
                else { $("#imgFileSize").css("color", "white"); $("#btnImgDownload").removeAttr("disabled"); }
                })
             .change();


              $("#btnImgDownload").unbind('click').click(function(){
                 ntptEventTag('lc='+encodeURIComponent(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&width="+$("#imgWidth").text()+"&height="+$("#imgHeight").text() ) );
                 window.open(dlURL+"&format="+$("#selImgFormat option:selected").val()+"&width="+$("#imgWidth").text()+"&height="+$("#imgHeight").text(),"_blank");
              });
        } catch ( cause ) {
            wv.util.error(cause);
        }
    };

    init();
    return self;

};