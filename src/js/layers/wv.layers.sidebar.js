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

/**
 * @module wv.layers
 */
var wv = wv || {};
wv.layers = wv.layers || {};

/**
 * @class wv.layers.sidebar
 */
wv.layers.sidebar = wv.layers.sidebar || function(models) {

    var HTML_TAB_ACTIVE_SELECTED =
        "<i class='productsIcon selected icon-layers'></i>" +
        "Active";

    var HTML_TAB_ACTIVE_UNSELECTED =
        "<i class='productsIcon selected icon-layers' title='Active Layers'></i>";

    var HTML_TAB_ADD_SELECTED =
        "<i class='productsIcon selected icon-add'></i>" +
        "Add Layers";

    var HTML_TAB_ADD_UNSELECTED =
        "<i class='productsIcon selected icon-add' title='Add Layers'></i>";

    var HTML_TAB_DOWNLOAD_SELECTED =
        "<i class='productsIcon selected icon-download'></i>" +
        "Download";

    var HTML_TAB_DOWNLOAD_UNSELECTED =
        "<i class='productsIcon selected icon-download' title='Download Data'></i>";

    var collapsed = false;
    var mobile = false;
    var portrait = false;
    var self = {};

    self.id = "productsHolder";
    self.selector = "#productsHolder";
    self.events = wv.util.events();

    var init = function() {
        render();
        if ( $(window).width() < Worldview.TRANSITION_WIDTH ) {
            slide();
        }
        $(window).resize(adjustAlignment);
        models.proj.events.on("change", onProjectionChange);
    };

    self.selectTab = function(tabName) {
        var selectedTab = $("#" + this.id).tabs("option", "selected");
        if ( tabName === "download" ) {
            if ( selectedTab !== 2 ) {
                $("#" + this.id).tabs("select", 2);
            }
        } else {
            throw new Error("Invalid tab: " + tabName);
        }
    };

    self.collapse = function() {
        collpased = true;
        slide();
    };

    var render = function() {
        var $container = $(self.selector);
        $container.empty().addClass("products");

        var $tabs = $("<ul></ul>")
            .attr("id", self.id + "tabs");

        var $activeTab = $("<li></li>")
            .addClass("layerPicker")
            .addClass("first");
        var $activeLink = $("<a></a>")
            .attr("href", "#products")
            .addClass("activetab")
            .addClass("tab")
            .html(HTML_TAB_ACTIVE_SELECTED);
        $activeTab.append($activeLink);
        $tabs.append($activeTab);

        var $addTab = $("<li></li>")
            .addClass("layerPicker")
            .addClass("second");
        var $addLink = $("<a></a>")
            .attr("href", "#selectorbox")
            .addClass("tab")
            .html(HTML_TAB_ADD_UNSELECTED);
        $addTab.append($addLink);
        $tabs.append($addTab);

        var $downloadTab = $("<li></li>")
            .addClass("layerPicker")
            .addClass("third");
        var $downloadLink = $("<a></a>")
            .attr("href", "#DataDownload")
            .addClass("tab")
            .html(HTML_TAB_DOWNLOAD_UNSELECTED);
        $downloadTab.append($downloadLink);
        $tabs.append($downloadTab);
        $container.append($tabs);

        var $collapseContainer = $("<div></div>")
            .attr("id", self.id + "toggleButtonHolder")
            .addClass("toggleButtonHolder");
        var $collapseButton = $("<a></a>")
            .addClass("accordionToggler")
            .addClass("atcollapse")
            .addClass("arrow")
            .attr("title", "Hide");
        $collapseContainer.append($collapseButton);
        $container.append($collapseContainer);

        $container.append($("<div id='products'></div>"))
                  .append($("<div id='selectorbox'></div>"))
                  .append($("<div id='DataDownload'></div>"));

        $container.tabs({
            show: onTabChange
        });
        $('.accordionToggler').bind('click', slide);
    };

    var onTabChange = function(e, ui) {
        if ( ui.index === 0 ) {
            $('.ui-tabs-nav')
                  .addClass('firstselected')
                  .removeClass('secondselected')
                  .removeClass('thirdselected');
        }
        else if ( ui.index === 1 ) {
            $('.ui-tabs-nav')
                  .removeClass('firstselected')
                  .addClass('secondselected')
                  .removeClass('thirdselected');
        } else if ( ui.index === 2 ) {
            $('.ui-tabs-nav')
                  .removeClass('firstselected')
                  .removeClass('secondselected')
                  .addClass('thirdselected');
        } else {
            throw new Error("Invalid tab index: " + ui.index);
        }

        var tab1 = ( ui.index === 0 ) ?
            HTML_TAB_ACTIVE_SELECTED : HTML_TAB_ACTIVE_UNSELECTED;
        var tab2 = ( ui.index === 1 ) ?
            HTML_TAB_ADD_SELECTED : HTML_TAB_ADD_UNSELECTED;
        var tab3 = ( ui.index === 2 ) ?
            HTML_TAB_DOWNLOAD_SELECTED : HTML_TAB_DOWNLOAD_UNSELECTED;

        if ( ui.index === 2 ) {
            self.events.trigger("dataDownloadSelect");
        } else {
            self.events.trigger("dataDownloadUnselect");
        }

        $('.ui-tabs-nav li.first a').html(tab1);
        $('.ui-tabs-nav li.second a').html(tab2);
        $('.ui-tabs-nav li.third a').html(tab3);

        return false;
    };

    var slide = function(e, ui) {
        if ( collapsed ) {
            $('.accordionToggler')
                .removeClass('atexpand')
                .addClass('atcollapse')
                .removeClass('staticLayers dateHolder')
                .addClass('arrow');
            $('.accordionToggler').attr("title","Hide Layer Selector");
            $('.accordionToggler').empty();
            $('.products').animate({left:'0'}, 300);
            collapsed = false;
            $('.accordionToggler').appendTo("#"+self.id+"toggleButtonHolder");
        }
        else {
            $('.accordionToggler')
                .removeClass('atcollapse')
                .addClass('dateHolder')
                .removeClass('arrow')
                .addClass('staticLayers');
            $('.accordionToggler').attr("title","Show Layer Selector");
            $('.accordionToggler').html("Layers (" + models.layers.total() + ")");
            var w = $('#app').outerWidth();
            $('.products').animate({left:'-'+w+"px"}, 100);
            collapsed = true;
            $("#" + self.id).after($('.accordionToggler'));
        }
    };

    var adjustAlignment = function() {
        if ( $(window).width() < Worldview.TRANSITION_WITH && collapsed ) {
            var w = $('.products').outerWidth();
            $('.products').css("left", "-" + w + "px");
        }
    };

    var onProjectionChange = function() {
        if ( collapsed ) {
            $('.accordionToggler').html("Layers (" + models.layers.total() + ")");
        }
    };

    init();
    return self;

};