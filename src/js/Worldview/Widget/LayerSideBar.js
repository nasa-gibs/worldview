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

Worldview.Widget.LayerSideBar = function(layersModel) {

    var HTML_TAB_ACTIVE_SELECTED =
        "<i class='productsIcon selected icon-layers'></i>" +
        "Active";

    var HTML_TAB_ACTIVE_UNSELECTED =
        "<i class='productsIcon selected icon-layers' title='Active'></i>";

    var HTML_TAB_ADD_SELECTED =
        "<i class='productsIcon selected icon-add'></i>" +
        "Add Layers";

    var HTML_TAB_ADD_UNSELECTED =
        "<i class='productsIcon selected icon-add' title='Add Layers'></i>";

    var HTML_TAB_DOWNLOAD_SELECTED =
        "<i class='productsIcon selected icon-download'></i>" +
        "Download";

    var HTML_TAB_DOWNLOAD_UNSELECTED =
        "<i class='productsIcon selected icon-download' title='Download'></i>";

    var collapsed = false;

    var self = {};

    self.id = "productsHolder";
    self.selector = "#productsHolder";
    self.events = Worldview.Events();

    var init = function() {
        render();
        if ( $(window).width() < Worldview.TRANSITION_WIDTH ) {
            slide();
        }
        $(window).resize(adjustAlignment);
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

    var render = function() {
        var $container = $(self.selector);
        $container.empty().addClass("products");

        var html =
            "<ul id='" + self.id + "tabs'>" +
                "<li class='layerPicker first'>" +
                    "<a href='#products' class='activetab tab'>" +
                        HTML_TAB_ACTIVE_SELECTED +
                    "</a>" +
                "</li>" +
                "<li class='layerPicker second'>" +
                    "<a href='#selectorbox' class='addlayerstab tab'>" +
                        HTML_TAB_ADD_UNSELECTED +
                    "</a>" +
                "</li>" +
                "<li class='layerPicker third'>" +
                    "<a href='#DataDownload' class='tab'>" +
                        HTML_TAB_DOWNLOAD_UNSELECTED +
                    "</a>" +
                "</li>" +
            "</ul>" +

            "<div id='" + self.id + "toggleButtonHolder'" +
                "class='toggleButtonHolder'>" +
                "<a class='accordionToggler atcollapse arrow' " +
                    "title='Hide'></a>" +
                "</a>" +
            "</div>" +

            "<div id='products'></div>" +
            "<div id='selectorbox'></div>" +
            "<div id='DataDownload'></div>";

        $container.html(html);

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

        var tab1 = ( ui.index === 0 )
            ? HTML_TAB_ACTIVE_SELECTED
            : HTML_TAB_ACTIVE_UNSELECTED;
        var tab2 = ( ui.index === 1 )
            ? HTML_TAB_ADD_SELECTED
            : HTML_TAB_ADD_UNSELECTED;
        var tab3 = ( ui.index === 2 )
            ? HTML_TAB_DOWNLOAD_SELECTED
            : HTML_TAB_DOWNLOAD_UNSELECTED;

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
            $('.accordionToggler').html("Layers (" + layersModel.total() + ")");

            var w = $('.products').outerWidth();
            $('.products').animate({left:'-'+w+"px"}, 300);
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

    init();
    return self;

};