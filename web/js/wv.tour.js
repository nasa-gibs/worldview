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

wv.tour = wv.tour || function(models, ui, config) {

    var self = {};

    var conclusionPanel = null;
    var splashOverlay = null;

    var init = function() {
        $("#wv-tour").click(function() {
            self.start();
        });
        self.introduction();
    };

    self.introduction = function() {
        if ( !config.features.tour ) { return; }

        // Don't start tour if coming in via a permalink
        if ( window.location.search && !config.parameters.tour ) { return; }

        // Tour does not work on IE 9 or below
        if ( wv.util.browser.ie && wv.util.browser.version <= 9 ) { return; }

        // Don't annoy with the tour if they cannot opt out in the future
        if ( !wv.util.browser.localStorage ) { return ; }

        // Don't show tour if the user has opted out
        if ( wv.util.localStorage("hideSplash") ) { return; }

        // Don't show tour on small screens
        if ( !validScreenSize() ) { return; }

        self.start(true);
    };

    /**
     * Create the splash screen and tour panels and control iteration over them.
     */
    self.start = function(introduction) {
        if ( wv.util.browser.ie && wv.util.browser.version <= 9) {
            wv.ui.unsupported("tour");
            return;
        }

        if ( !validScreenSize() ) {
            wv.ui.notify("Unfortunately the @NAME@ tour can only be viewed in larger web browser windows.");
            return;
        }

        var $content = $("#wv-tour-content");
        if ( $content.children().length === 0 ) {
            $content.load("pages/tour.html", function() { onLoad(introduction); });
        } else {
            onLoad(introduction);
        }
    };

    var onLoad = function(introduction) {
        var padding = 15; // padding - used for all of the tour windows
        var pos, width, height, xval, yval; // helpful calculation vars

        wv.ui.close();
        var $startDialog = $("#wv-tour-intro");
        $startDialog
            .dialog({
                title: "Welcome to @NAME@!",
                dialogClass: "tour",
                modal: true,
                width: 700,
                height: "auto",
                draggable: false,
                resizable: false
            });

        if ( introduction ) {
            $("#wv-tour-skip").show();
        } else {
            $("#wv-tour-skip").hide();
        }

        var mapAnchor = document.getElementById("mapPanelTourAnchor");
        if(!mapAnchor) {
            //console.log("creating mapanchor");
            var owner = document.getElementById("wv-map");
            mapAnchor = document.createElement("div");
            mapAnchor.setAttribute("id", "mapPanelTourAnchor");
            mapAnchor.setAttribute("style", "float:right; height:68px; right:14px; top:90px; width:36px; position:relative; z-index:-1");
            owner.appendChild(mapAnchor);
        }

        var endTour = function() {
            wv.ui.close();
            var $dialog = $("#wv-tour-end");
            $dialog
                .dialog({
                    title: "Finished!",
                    dialogClass: "tour",
                    modal: true,
                    width: 600,
                    height: "auto",
                    draggable: false,
                    resizable: false
                });
            wv.feedback.decorate($dialog.find(".feedback"));
            $("#repeat").click(repeatTour);
            $("#done").click(handleDone);
        };

        /*
         * Restart the tour at the beginning.
         */
        var repeatTour = function(e) {
            e.stopPropagation();
            $(".ui-dialog-content").dialog("close");
            $('#joyRideTipContent').joyride({adjustForPhone:false,
                                             bordered:true,
                                             includepage:true,
                                             template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                             postStepCallback : function (index, tip) {
                                                 if(index == 5) {
                                                     endTour();
                                                 }
                                             }});
        };

        /*
         * Hide the tour.
         */
        var handleDone = function(e) {
            e.stopPropagation();
            $(".ui-dialog-content").dialog("close");
        };

        /*
         * Close the splash and go straight to worldview.
         */
        var handleSkipTour = function() {
            $(".ui-dialog-content").dialog("close");
        };

        var onStop = function(index, tip, button) {
            //console.log(index, tip, button);
            setTourState();
            if(index == 5 && button !== "previous") {
                endTour();
            }
        };

        /*
         * Close the splash and start the tour.
         */
        var handleTakeTour = function(e) {
            e.stopPropagation();
            $(".ui-dialog-content").dialog("close");
            initTourState();

            $('#joyRideTipContent').joyride({adjustForPhone:false,
                                             bordered:true,
                                             includepage:true,
                                             template : {'link':'<a href="#" class="joyride-close-tip">X</a>'},
                                             postStepCallback : onStop});
        };

        /*
         * Toggle the value of the "hideSplash" flag.
         */
        var setDoNotShow = function() {
            var hideSplash = wv.util.localStorage('hideSplash');
            wv.util.localStorage('hideSplash', !hideSplash);
        };

        // assign events and start
        $("#takeTour").click(handleTakeTour);
        $("#skipTour").click(handleSkipTour);
        $("#dontShowAgain").click(setDoNotShow);

    };

    var initTourState = function() {
        var map = ui.map.selected;
        models.proj.selectDefault();
        models.date.select(wv.util.today());
        models.layers.reset();
        var leading = models.map.getLeadingExtent();
        map.getView().fitExtent(leading, map.getSize());
        setTourState();
    };

    var setTourState = function() {
        ui.sidebar.expandNow();
        ui.sidebar.selectTab("active");
        ui.timeline.expandNow();
        models.proj.selectDefault();
    };

    var validScreenSize = function() {
        var viewWidth = $(window).width();
        var viewHeight = $(window).height();
        return viewWidth >= 768 && viewHeight >= 680;
    };

    init();
    return self;
};
