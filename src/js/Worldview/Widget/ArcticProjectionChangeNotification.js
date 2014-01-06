/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

Worldview.namespace("Widget");

Worldview.Widget.ArcticProjectionChangeNotification = function(config, bank) {

    var self = {};

    var visitOld = false;
    var visitNew = false;
    var currentNew = true;
    var showNotice = true;
    var storageEngine;

    var oldEPSG = "EPSG:3995";
    var newEPSG = "EPSG:3413";

    var oldCoastlinesRegEx = new RegExp("arctic_coastlines(?!_)");
    var newCoastlinesRegEx = new RegExp("arctic_coastlines_3413");
    var oldCoastlines = "arctic_coastlines";
    var newCoastlines = "arctic_coastlines_3413";

    var newGraticulesRegEx = new RegExp("arctic_graticule_3413");
    var oldGraticulesRegEx = new RegExp("polarview:graticuleN");
    var newGraticules = "arctic_graticule_3413";
    var oldGraticules = "polarview:graticuleN";

    self.containerId = "arcticProjectionChangeNotification";

    var init = function() {
        try {
            storageEngine = YAHOO.util.StorageManager.get(
                YAHOO.util.StorageEngineHTML5.ENGINE_NAME,
                YAHOO.util.StorageManager.LOCATION_LOCAL,
                {
                    force: false,
                    order: [
                        YAHOO.util.StorageEngineHTML5
                    ]
                });
        } catch (error) {
            console.error("Storage engine not available");
        }

        self.changeDate = Worldview.ARCTIC_PROJECTION_CHANGE_DATE;
        if ( storageEngine && storageEngine.getItem(self.containerId) ) {
            showNotice = false;
        }
        if ( self.changeDate ) {
            REGISTRY.register(self.containerId, self);
            REGISTRY.markComponentReady(self.containerId);
        }
    };

    var updateLayers = function(queryString) {
        var products = Worldview.extractFromQuery("products", queryString);
        var newProducts = products;
        if ( currentNew ) {
            Worldview.Map.COORDINATE_CONTROLS["arctic"].projection =
                newEPSG;
            newProducts =
                    newProducts.replace(oldCoastlinesRegEx, newCoastlines);
            newProducts =
                    newProducts.replace(oldGraticulesRegEx, newGraticules);

        } else {
            Worldview.Map.COORDINATE_CONTROLS["arctic"].projection =
                oldEPSG;
            newProducts =
                    newProducts.replace(newCoastlinesRegEx, oldCoastlines);
            newProducts =
                    newProducts.replace(newGraticulesRegEx, oldGraticules);
        }

        if ( products !== newProducts ) {
            bank.setValue(newProducts);
        }
    };

    self.setValue = function() {};
    self.getValue = function() {};

    self.updateComponent = function(queryString) {
        try {
            var query = Worldview.queryStringToObject(queryString);
            if ( query["switch"] === "arctic" || query["switch"] === "antarctic" ) {
                var currentDay;
                if ( query.time ) {
                    try {
                        currentDay = wv.util.parseDateUTC(query.time);
                    } catch ( error ) {
                        console.warn("Invalid time: " + query.time);
                        currentDay = wv.util.today();
                    }
                } else {
                    currentDay = wv.util.today();
                }
                if ( currentDay < self.changeDate ) {
                    if ( REGISTRY.isLoadingQuery ) {
                        visitNew = false;
                    }
                    visitOld = true;
                    if ( currentNew ) {
                        currentNew = false;
                    }
                    if ( query["switch"] === "arctic" ) {
                        updateLayers(queryString);
                    }
                } else if ( currentDay >= self.changeDate ) {
                    visitNew = true;
                    if ( !currentNew ) {
                        currentNew = true;
                    }
                    if ( query["switch"] === "arctic" ) {
                        updateLayers(queryString);
                    }
                }
                if ( visitOld && visitNew && showNotice ) {
                    setTimeout(notify, 100);
                    showNotice = false;
                }
            }
        } catch ( error ) {
            Worldview.error("Internal error", error);
        }
    };

    var notify = function() {
        dialog = new YAHOO.widget.Panel("arcticChangeNotification", {
            width: "400px",
            zIndex: 1020,
            visible: false,
            modal: true,
            constraintoviewport: true
        });
        dialog.setHeader("Notice");
        var body = [
            "On " + wv.util.toISOStringDate(self.changeDate) + " the polar ",
            "projections changed as follows:" ,
            "<br/><br/>",
            "The <b>Arctic projection</b> changed from Arctic Polar ",
            "Stereographic (EPSG:3995, \"Greenwich down\") to NSIDC Polar ",
            "Stereographic North (EPSG:3413, \"Greenland down\").",
            "<br/><br/>" +
            "The <b>Antarctic projection</b> changed from being projected onto ",
            "a sphere with radius of 6371007.181 meters to being projected ",
            "onto the WGS84 ellipsoid. The projection is now the correct ",
            "Antarctic Polar Stereographic (EPSG:3031). This change results ",
            "in a shift of the imagery that ranges up to tens of kilometers, ",
            "depending on the location.",
            "<br/><br/>",

            "Imagery before this date has not yet been reprocessed to the ",
            "new projection. In addition, the \"Population Density\" and ",
            "\"Global Label\" layers can no longer be displayed properly ",
            "in the older projection.",
            "<br/><br/>",

            "Thanks for your patience as we improve and expand our ",
            "imagery archive.",
            "<br/><br/>",

            "<input id='arcticChangeNoticeDontShowAgain' value='false' ",
                "type='checkbox'>Do not show again"
        ].join("");
        dialog.setBody(body);
        dialog.render(document.body);
        dialog.show();
        dialog.center();
        dialog.hideEvent.subscribe(function(i) {
            setTimeout(function() {
                if ( $("#arcticChangeNoticeDontShowAgain").is(":checked") ) {
                    if ( storageEngine ) {
                        storageEngine.setItem(self.containerId, true);
                    }
                }
                dialog.destroy();
            }, 25);
        });
    };

    self.loadFromQuery = self.updateComponent;

    init();
    return self;
};

