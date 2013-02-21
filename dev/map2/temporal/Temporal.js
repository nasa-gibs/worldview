$(function() {
    
    var resolutions = [
        0.5625, 0.28125, 0.140625,
        0.0703125, 0.03515625, 0.017578125,
        0.0087890625, 0.00439453125, 0.002197265625  
    ];

    var serverResolutions = [
        0.5625, 0.28125, 0.140625,
        0.0703125, 0.03515625, 0.017578125,
        0.0087890625, 0.00439453125, 0.002197265625
    ];

    var EPSG_WGS_84 = "EPSG:4326";

    var map = new OpenLayers.Map({
        div: "map",
        maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90),
        projection: EPSG_WGS_84,
        fractionalZoom: false,
        resolutions: resolutions,
        allOverlays: true,
        controls: [
            new OpenLayers.Control.Navigation({
                dragPanOptions: {
                    enableKinetic: true
                }       
            }),
            new OpenLayers.Control.Zoom(),
            new OpenLayers.Control.LayerSwitcher(),
        ]
    });
    
    var modis = {
        name: "Corrected Reflectance (True Color)",
        url: "http://map1a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi",
        layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
        matrixSet: "EPSG4326_250m",
        format: "image/jpeg",
        buffer: 0,
        style: "",
        opacity: 1.0,
        projection: EPSG_WGS_84,
        //numZoomLevels: 9,
        maxResolution: 0.5625,
        //resolutions: resolutions,
        //serverResolutions: serverResolutions,
        visibility: true,
        tileSize: new OpenLayers.Size(512, 512),
        maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90),
        isBaseLayer: true,        
    };
    
    var layerSet = Worldview.OpenLayers.GIBS.TemporalLayerSet({
        map: map,
        layerClass: OpenLayers.Layer.WMTS,
        options: modis
    });
        
    map.zoomToMaxExtent();

    var setDay = function(date) {
        currentDay = date;
        d = new Date(currentDay);
        $("#date").html(d.toISOString().split("T")[0]);
        layerSet.setDay(new Date(currentDay));    
    };
    
    setDay(Date.now());
    
    $("#previous").click(function() {
        setDay(currentDay - (1000 * 60 * 60 * 24));
    });
    
    $("#next").click(function() {
        setDay(currentDay + (1000 * 60 * 60 * 24));

    });
        
    window.stats = function() {
        console.log("Map: " + map.getNumLayers());
        var stats = layerSet.getStatistics();
        console.log("Stats: quick(" + stats.active + "), redraw(" + stats.inactive + ")");
    };
    
});
