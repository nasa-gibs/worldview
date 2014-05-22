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
wv.layers.sidebar = wv.layers.sidebar || function(models, config) {

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
        if ( wv.util.browser.small ) {
            slide();
        }
        $(window).resize(adjustAlignment);
        models.proj.events.on("change", onProjectionChange);
    };

    self.selectTab = function(tabName) {
        if ( tabName === "active" ) {
            $(self.selector).tabs("option", "active", 0);
        } else if ( tabName === "add" ) {
            $(self.selector).tabs("option", "active", 1);
        } else if ( tabName === "download" ) {
            $(self.selector).tabs("option", "active", 2);
        } else {
            throw new Error("Invalid tab: " + tabName);
        }
    };

    self.collapse = function() {
        collpased = true;
        slide();
    };

    self.expand = function(now) {
        if ( !collapsed ) {
            return;
        }
        collapsed = true;
        slide(null, null, now);
    };

    self.expandNow = function() {
        self.expand(true);
    };

    var render = function() {
        var $container = $(self.selector);
        $container.empty().addClass("products");

        var $tabs = $("<ul></ul>")
            .attr("id", self.id + "tabs");

        var $activeTab = $("<li></li>")
            .addClass("layerPicker")
            .addClass("first")
            .attr("data-tab", "active");
        var $activeLink = $("<a></a>")
            .attr("href", "#products")
            .addClass("activetab")
            .addClass("tab")
            .html(HTML_TAB_ACTIVE_SELECTED);
        $activeTab.append($activeLink);
        $tabs.append($activeTab);

        var $addTab = $("<li></li>")
            .addClass("layerPicker")
            .addClass("second")
            .attr("data-tab", "add");
        var $addLink = $("<a></a>")
            .attr("href", "#selectorbox")
            .addClass("tab")
            .html(HTML_TAB_ADD_UNSELECTED);
        $addTab.append($addLink);
        $tabs.append($addTab);

        if ( config.features.dataDownload ) {
            var $downloadTab = $("<li></li>")
                .addClass("layerPicker")
                .addClass("third")
                .attr("data-tab", "download");
            var $downloadLink = $("<a></a>")
                .attr("href", "#DataDownload")
                .addClass("tab")
                .html(HTML_TAB_DOWNLOAD_UNSELECTED);
            $downloadTab.append($downloadLink);
            $tabs.append($downloadTab);
        }

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
                  .append($("<div id='wv-data'></div>"));

        $container.tabs({
            beforeActivate: onBeforeTabChange,
            activate: onTabChange
        });
        $('.accordionToggler').bind('click', slide);
    };

    var onTabChange = function(e, ui) {
        self.events.trigger("select", ui.newTab.attr("data-tab"));
    };

    var onBeforeTabChange = function(e, ui) {
        // FIXME: This code is very clunky.
        var tab = ui.newTab.attr("data-tab");
        if ( tab === "active" ) {
            $('.ui-tabs-nav')
                  .addClass('firstselected')
                  .removeClass('secondselected')
                  .removeClass('thirdselected');
            $('.ui-tabs-nav li.first').addClass("ui-state-active");
            $('.ui-tabs-nav li.second').removeClass("ui-state-active");
            $('.ui-tabs-nav li.third').removeClass("ui-state-active");
        } else if ( tab === "add" ) {
            $('.ui-tabs-nav')
                  .removeClass('firstselected')
                  .addClass('secondselected')
                  .removeClass('thirdselected');
            $('.ui-tabs-nav li.first').removeClass("ui-state-active");
            $('.ui-tabs-nav li.second').addClass("ui-state-active");
            $('.ui-tabs-nav li.third').removeClass("ui-state-active");
        } else if ( tab === "download" ) {
            $('.ui-tabs-nav')
                  .removeClass('firstselected')
                  .removeClass('secondselected')
                  .addClass('thirdselected');
            $('.ui-tabs-nav li.first').removeClass("ui-state-active");
            $('.ui-tabs-nav li.second').removeClass("ui-state-active");
            $('.ui-tabs-nav li.third').addClass("ui-state-active");
        } else {
            throw new Error("Invalid tab index: " + ui.index);
        }

        var tab1 = ( tab === "active" ) ?
            HTML_TAB_ACTIVE_SELECTED : HTML_TAB_ACTIVE_UNSELECTED;
        var tab2 = ( tab === "add" ) ?
            HTML_TAB_ADD_SELECTED : HTML_TAB_ADD_UNSELECTED;
        var tab3 = ( tab === "download" ) ?
            HTML_TAB_DOWNLOAD_SELECTED : HTML_TAB_DOWNLOAD_UNSELECTED;

        if ( ui.index === "download" ) {
            self.events.trigger("dataDownloadSelect");
        } else {
            self.events.trigger("dataDownloadUnselect");
        }

        self.events.trigger("before-select", tab);

        $('.ui-tabs-nav li.first a').html(tab1);
        $('.ui-tabs-nav li.second a').html(tab2);
        $('.ui-tabs-nav li.third a').html(tab3);

        return true;
    };

    var slide = function(e, ui, now) {
        if ( collapsed ) {
            $('.accordionToggler')
                .removeClass('atexpand')
                .addClass('atcollapse')
                .removeClass('staticLayers dateHolder')
                .addClass('arrow');
            $('.accordionToggler').attr("title","Hide Layer Selector");
            $('.accordionToggler').empty();
            $('.products').animate({left:'0'}, now ? 0 : 300);
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
            $('.accordionToggler').html("Layers (" + models.layers.get().length + ")");
            var w = $('#app').outerWidth();
            $('.products').animate({left:'-'+w+"px"}, 100);
            collapsed = true;
            $("#" + self.id).after($('.accordionToggler'));
        }
    };

    var adjustAlignment = function() {
        if ( wv.util.browser.small && collapsed ) {
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
