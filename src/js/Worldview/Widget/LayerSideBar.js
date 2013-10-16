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

Worldview.Widget.LayerSideBar = function() {

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

    var self = {};
    self.id = "productsHolder";
    self.selector = "#productsHolder";
    self.events = Worldview.Events();

    var init = function() {
        render();
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
            "<div id='products'></div>" +
            "<div id='selectorbox'></div>" +
            "<div id='DataDownload'></div>";
        $container.html(html);

        $container.tabs({
            show: onTabChange
        });

        /*
        var toggleButtonHolder = document.createElement("div");
        toggleButtonHolder.setAttribute("id",this.id+"toggleButtonHolder");
        toggleButtonHolder.setAttribute("class","toggleButtonHolder");
        var accordionToggler = document.createElement("a");
        accordionToggler.setAttribute("class","accordionToggler atcollapse arrow");
        accordionToggler.setAttribute("title","Hide Layer Selector");
        this.isCollapsed = false;
        toggleButtonHolder.appendChild(accordionToggler);
        this.container.appendChild(toggleButtonHolder);
        */

        /*
        //this.container.appendChild(productContainer);
        var self = this;
        $('#'+this.id).tabs({show: function(e, ui) {
            e.data = { self: self };
            SOTE.widget.Products.change(e, ui);
        }});

        this.b = Worldview.Widget.ActiveLayers(this.config);


        //$('#'+this.id+"prods").on("tabsshow",SOTE.widget.Products.change);
           $('.accordionToggler').bind('click',{self:this},SOTE.widget.Products.toggle);

        if($(window).width() < 720){
            SOTE.widget.Products.toggle({data: {self:this}});
        }


        //setTimeout(SOTE.forceResize();

        // Mark the component as ready in the registry if called via init()
        if ((this.initRenderComplete === false) && REGISTRY) {
            this.initRenderComplete = true;
            REGISTRY.markComponentReady(this.id);
        }
        var self = this;
        $(window).resize(function(){
            self.b.render();
            self.s.resize();
            self.adjustAlignment();
        });

        $("#products").bind("fire", {self:this}, SOTE.widget.Products.handleFire);
        */
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

    init();
    return self;

};