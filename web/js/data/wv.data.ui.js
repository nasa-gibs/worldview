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
wv.data = wv.data || {};

wv.data.ui = wv.data.ui || function(models, ui, config) {

    var queryActive = false;
    var list = null;
    var model = models.data;
    var mapController = null;
    var selectionListPanel = null;
    var downloadListPanel = null;
    var lastResults = null;
    var maps = ui.map;

    var indicators = {
        query: null,
        noneInView: null,
        noResults: null
    };

    var self = {};
    self.selector = "#wv-data";
    self.id = "wv-data";

    var init = function() {
        model.events
            .on("activate", onActivate)
            .on("deactivate", onDeactivate)
            .on("productSelect", onProductSelect)
            .on("layerUpdate", onLayerUpdate)
            .on("query", onQuery)
            .on("queryResults", onQueryResults)
            .on("queryCancel", onQueryCancel)
            .on("queryError", onQueryError)
            .on("queryTimeout", onQueryTimeout)
            .on("granuleSelect", updateSelection)
            .on("granuleUnselect", updateSelection);
        $(window).resize(resize);
        ui.sidebar.events.on("select", function(tab) {
            if ( tab === "download" ) {
                resize();
                model.activate();
            } else {
                model.deactivate();
            }
        });
    };

    self.render = function() {
        var $container = $(self.selector).empty()
            .addClass(self.id + "list")
            .addClass("bank");
        var $actionButton = $("<button></button>")
            .attr("id", "wv-data-download-button")
            .addClass("action")
            .attr("type", "button")
            .attr("value", "")
            .on("click", showDownloadList);

        $container.append($actionButton);

        var $list = $("<div></div>")
            .attr("id", self.id + "content")
            .addClass("content");
        $container.append($list);
        $("#wv-data-download-button").button();

        self.refresh();
    };

    self.refresh = function() {
        var $content = $(self.selector + "content");
        var api = $content.data("jsp");
        if ( api ) {
            api.destroy();
        }
        $content = $(self.selector + "content").empty();
        var data = model.groupByProducts();
        $.each(data, function(key, value) {
            refreshProduct($content, key, value);
        });

        $('.dl-group[value="__NO_PRODUCT"] h3 span').click(function(e){
            showUnavailableReason();
        });
        resize();
    };

    var refreshProduct = function($content, key, value) {
        var title = value.title;
        var $header = $("<h3></h3>")
            .addClass("head")
            .html(title);

        // FIXME: Why is this needed?
        var $productSelector;
        if ( !value.notSelectable ) {
            var $selectedCount = $("<i></i>")
                .attr("id", key + "dynamictext")
                .addClass("dynamic")
                .html("0 selected");
            $productSelector = $("<input type='radio' />")
                .attr("value", key)
                .attr("data-product", key);

            $header.prepend($productSelector).append($selectedCount);
        }
        if ( model.selectedProduct === key ) {
            $productSelector.each(function() {
                this.checked = true;
            });
        }
        var $contentDlGroup = $("<div class='dl-group'></div>")
            .attr("value", key)
            .attr("data-product", key)
            .click(function() {
                model.selectProduct($(this).find("input").attr("data-product"));
                $(".dl-group").removeClass("dl-group-selected");
                $(this).addClass('dl-group-selected');
                $(".dl-group input").each(function(){
                    this.checked = false;
                });
                $(this).find("input").each(function(){
                    this.checked = true;
                });
            })
            .append($header);

        $content.append($contentDlGroup);

        var $products = $("<ul></ul>")
            .attr("id", self.id + key)
            .addClass(self.id + "category");

        $.each(value.items, function(index, item) {
            refreshLayers($products, key, value, item);
        });
        $contentDlGroup.append($products);
    };

    var refreshLayers = function($container, key, value, layer) {
        var $item = $("<li></li>")
            .attr("id", self.id + key + encodeURIComponent(layer.value))
            .addClass("item item-static");
        $item.append("<h4>" + layer.label + "</h4>");
        $item.append("<p>" + layer.sublabel + "</p>");
        $container.append($item);
    };

   var resize = function() {

        var tabs_height = $(".ui-tabs-nav").outerHeight(true);
        var button_height = $(self.selector + "_Button").outerHeight(true);
        $(self.selector).height(
            $(self.selector).parent().outerHeight() - tabs_height - button_height
        );

        var $pane = $(self.selector + "content");
        var api = $pane.data("jsp");
        if ( !wv.util.browser.small ) {
            if ( api ) {
                api.reinitialise();
            } else {
                $pane.jScrollPane({verticalGutter:0, contentWidth:238, autoReinitialise:false});
            }
        } else {
            if ( api ) {
                api.destroy();
            }
        }
   };

    self.onViewChange = function() {
        var indicator;
        var map = ui.map.selected;

        if ( !model.active || queryActive || !lastResults ) {
            return;
        }
        if ( lastResults.granules.length === 0 ) {
            return;
        }
        var hasCentroids = false;
        var inView = false;
        var extent = map.getView().calculateExtent(map.getSize());
        var crs = models.proj.selected.crs;
        _.each(lastResults.granules, function(granule) {
            if ( granule.centroid && granule.centroid[crs] ) {
                hasCentroids = true;
                if ( ol.extent.intersects(extent,
                        granule.centroid[crs].getExtent()) ) {
                    inView = true;
                    return true;
                }
            }
        });
        wv.ui.indicator.hide(indicators.noneInView);
        if ( hasCentroids && !inView ) {
            indicators.noneInView =
                    wv.ui.indicator.show("Zoom out or move map");
        }
    };

    var toggleMode = function() {
        model.toggleMode();
    };

    var onActivate = function() {
        ui.sidebar.selectTab("download");
        if ( !mapController ) {
            mapController = wv.data.map(model, maps, config);
        }
        onLayerUpdate();
        updateSelection();
    };

    var onDeactivate = function() {
        wv.ui.indicator.hide(indicators);
        if ( selectionListPanel ) {
            selectionListPanel.hide();
        }
        if ( downloadListPanel ) {
            downloadListPanel.hide();
        }
        mapController.dispose();
    };

    var onProductSelect = function(product) {
        $(self.selector + " input[value='" + product + "']")
            .prop("checked", "true");
    };

    var onLayerUpdate = function() {
        if ( !model.active ) {
            return;
        }
        self.refresh();
    };

    var onQuery = function() {
        queryActive = true;
        indicators.query = wv.ui.indicator.searching(indicators);
        if ( selectionListPanel ) {
            selectionListPanel.hide();
        }
        if ( downloadListPanel ) {
            downloadListPanel.hide();
        }
    };

    var onQueryResults = function(results) {
        if ( selectionListPanel ) {
            selectionListPanel.hide();
            selectionListPanel = null;
        }
        queryActive = false;
        lastResults = results;
        wv.ui.indicator.hide(indicators);
        var hasResults = true;
        if ( model.selectedProduct !== null && results.granules.length === 0 ) {
            indicators.noData = wv.ui.indicator.noData(indicators);
            hasResults = false;
        }
        if ( results.meta.showList && hasResults ) {
            selectionListPanel =
                    wv.data.ui.selectionListPanel(model, results);
            selectionListPanel.show();
        }
        updateSelection();
    };

    var onQueryCancel = function() {
        queryActive = false;
        wv.ui.indicator.hide(indicators);
    };

    var onQueryError = function(status, error) {
        queryActive = false;
        wv.ui.indicator.hide(indicators);
        if ( status !== "abort" ) {
            console.error("Unable to search", status, error);
            wv.ui.notify("Unable to search at this time.<br/><br/>Please try " +
                    "again later.");
        }
    };

    var onQueryTimeout = function() {
        queryActive = false;
        wv.ui.indicator.hide(indicators);
        wv.ui.notify(
            "No results received yet. This may be due to a " +
            "connectivity issue. Please try again later."
        );
    };

    var updateSelection = function() {
        var $button = $("#wv-data-download-button");
        var selected = _.size(model.selectedGranules);
        if ( selected > 0 ) {
            $button.button("enable");
            var totalSize = model.getSelectionSize();
            if ( totalSize ) {
                var formattedSize = Math.round(totalSize * 100) / 100;
                $button.find(".ui-button-text").html("Download Data (" + formattedSize + " MB)");
            } else {
                $button.find(".ui-button-text").html("Download Selected Data");
            }
        } else {
            $button.button("disable");
            $button.find(".ui-button-text").html("No Data Selected");
        }

        var counts = model.getSelectionCounts();
        $.each(counts, function(productId, count) {
            $("#" + productId + "dynamictext").html("" + count + " selected");
        });
        if ( downloadListPanel && downloadListPanel.visible() ) {
            downloadListPanel.refresh();
        }

    };

    var showDownloadList = function() {
        if ( selectionListPanel ) {
            selectionListPanel.setVisible(false);
        }
        if ( !downloadListPanel ) {
            downloadListPanel =
                    wv.data.ui.downloadListPanel(config, model);
            downloadListPanel.events.on("close", function() {
                if ( selectionListPanel ) {
                    selectionListPanel.setVisible(true);
                }
            });
        }
        downloadListPanel.show();
    };

    var updatePreference = function(event, ui) {
        model.setPreference(event.target.value);
    };

    var showUnavailableReason = function() {
        var headerMsg = "<h3 class='wv-data-unavailable-header'>Why are these layers not available for downloading?</h3>";
        var bodyMsg = 'Some layers in Worldview do not have corresponding source data products available for download.  These include National Boundaries, Orbit Tracks, Earth at Night, and MODIS Corrected Reflectance products.<br><br>For a downloadable product similar to MODIS Corrected Reflectance, please try the MODIS Land Surface Reflectance layers available in Worldview.  If you would like to generate MODIS Corrected Reflectance imagery yourself, please see the following document: <a href="https://earthdata.nasa.gov/sites/default/files/field/document/MODIS_True_Color.pdf" target="_blank">https://earthdata.nasa.gov/sites/default/files/field/document/MODIS_True_Color.pdf</a><br><br>If you would like to download only an image, please use the "camera" icon in the upper right.';

        wv.ui.notify(headerMsg + bodyMsg, "Notice", 600);
        /*
        wv.ui.notify(headerMsg + bodyMsg, {
            width: 600,
            height: 275
        });
        */
    };

    init();
    return self;

};


wv.data.ui.bulkDownloadPage = wv.data.ui.bulkDownloadPage ||
        (function() {

    var ns = {};

    var pages = {
        wget: "pages/wget.html",
        curl: "pages/curl.html"
    };

    ns.show = function(selection, type) {
        var nonce = Date.now();
        var page = window.open(pages[type] + "?v=" + nonce,
                'Worldview_' + nonce);

        var loaded = false;
        page.onload = function() {
            if ( !loaded ) {
                fillPage(page, selection, type);
                loaded = true;
            }
        };
        var checkCount = 0;
        var timer = setInterval(function() {
            checkCount++;
            if ( loaded ) {
                clearInterval(timer);
                return;
            }
            if ( checkCount > 20 ) {
                clearInterval(timer);
                return;
            }
            if ( fillPage(page, selection, type) ) {
                loaded = true;
                clearInterval(timer);
            }
        }, 100);
    };

    var fillPage = function(page, selection, type) {
        var downloadLinks = [];
        var hosts = {};
        var indirectLinks = [];
        $.each(selection, function(index, product) {
            $.each(product.list, function(index2, granule) {
                var netrc = "";
                if ( granule.urs ) {
                    netrc = "--netrc ";
                }
                $.each(granule.links, function(index2, link) {
                    if ( !link.data ) {
                        return;
                    }
                    if ( product.noBulkDownload ) {
                        indirectLinks.push("<li><a href='" + link.href + "'>" +
                            link.href + "</a></li>");
                        return;
                    }
                    if ( type === "curl" ) {
                        downloadLinks.push("curl --remote-name " + netrc +
                                link.href);
                    } else {
                        downloadLinks.push(link.href);
                    }
                    if ( granule.urs ) {
                        // Get the hostname from the URL, the text between
                        // the double slash and the first slash after that
                        var host = /\/\/([^\/]*)\//.exec(link.href);
                        if ( host ) {
                            hosts[host[1]] = true;
                        }
                    }
                });
            });
        });
        var links = page.document.getElementById("links");
        if ( !links ) {
            // Page is not ready
            return false;
        }
        links.innerHTML = "<pre>" + downloadLinks.join("\n") + "</pre>";

        var netrcEntries = [];
        var hostnames = [];
        $.each(hosts, function(host, value) {
            netrcEntries.push("machine " + host + " login URS_USER " +
                "password URS_PASSWORD");
            hostnames.push(host);
        });
        if ( netrcEntries.length > 0 ) {
            page.document.getElementById("netrc").innerHTML =
                "<pre>" + netrcEntries.join("\n") + "</pre>";
            page.document.getElementById("bulk-password-notice")
                .style.display = "block";
            page.document.getElementById("netrc-instructions")
                .style.display = "block";
            var instructions =
                page.document.getElementById("fdm-password-instructions");
            if ( instructions ) {
                instructions.style.display = "block";
            }
            var machineNames =
                page.document.getElementById("fdm-machine-names");
            if ( machineNames ) {
                machineNames.innerHTML = "<pre>" + hostnames.join("\n") +
                    "</pre>";
            }
        }
        if ( indirectLinks.length > 0 ) {
            page.document.getElementById("indirect-instructions")
                .style.display = "block";
            page.document.getElementById("indirect").innerHTML =
                "<ul>" + indirectLinks.join("\n") + "</ul>";
        }
        return true;
    };

    return ns;

})();


wv.data.ui.downloadListPanel = function(config, model) {

    var cmr = wv.data.cmr;

    var NOTICE =
        "<div id='wv-data-selection-notice'>" +
            "<i class='icon fa fa-info-circle fa-3x'></i>" +
            "<p class='text'>" +
                "Some items you have selected require a profile with the " +
                "EOSDIS User Registration System (URS) to download. " +
                "It is simple and free to sign up! " +
                "<a href='https://urs.earthdata.nasa.gov/users/new' target='urs'>" +
                "Click to register for a profile.</a>" +
            "</p>" +
        "</div>";

    var selection;
    var self = {};
    var urs = false;
    var $dialog;

    self.events = wv.util.events();

    self.show = function() {
        $dialog = wv.ui.getDialog()
            .attr("id", "wv-data-selection");

        $dialog.dialog({
            title: "Download Links",
            width: 600,
            height: 500,
            autoOpen: false
        });
        var $bottomPane = $("<div></div>")
            .attr("id", "wv-data-bulk-download-links")
            .addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix")
            .html(bulkDownloadText());
        $(".ui-dialog").append($bottomPane);
        $(".ui-dialog .ui-dialog-titlebar-close").attr("tabindex", -1);

        $dialog.dialog("open");

        $("a.wget").click(showWgetPage);
        $("a.curl").click(showCurlPage);

        $dialog.find(".collapse").accordion({
            collapsible: true,
            active: false,
            icons: {
                header: "fa fa-caret-right fa-fw",
                activeHeader: "fa fa-caret-down fa-fw"
            }
        });
        $dialog.on("dialogclose", function() {
            self.events.trigger("close");
        });
        self.refresh();
    };

    self.refresh = function() {
        var $data_select = $("#wv-data-selection");
        selection = reformatSelection();
        $data_select.html(bodyText(selection));
        var bulkVisible = isBulkDownloadable() &&
                _.size(model.selectedGranules) !== 0;
        if ( bulkVisible ) {
            $("wv-data-bulk-download-links").show();
        } else {
            $("wv-data-bulk-download-links").hide();
        }
        $data_select.find(".remove").click(removeGranule);
        $data_select.find("tr").on("mouseenter", onHoverOver);
        $data_select.find("tr").on("mouseleave", onHoverOut);
    };

    self.hide = function() {
        var $d = $(".ui-dialog");
        if ( $d.length !== 0 ) {
            $d.hide();
        }
    };

    self.visible = function() {
        var $d = $(".ui-dialog");
        if ( $d.length !== 0 ) {
            return $d.is(":visible");
        }
        return false;
    };

    var dispose = function() {
        self.events.trigger("close");
        panel.destroy();
        panel = null;
    };

    var reformatSelection = function() {
        var selection = {}, productConfig;

        urs = false;
        $.each(model.selectedGranules, function(key, granule) {
            if ( granule.urs ) {
                urs = true;
            }
            if ( !selection[granule.product] ) {
                productConfig = config.products[granule.product];
                selection[granule.product] = {
                    name: productConfig.name,
                    granules: [granule],
                    counts: {},
                    noBulkDownload: productConfig.noBulkDownload || false
                };
            } else {
                selection[granule.product].granules.push(granule);
            }

            var product = selection[granule.product];
            var id = granule.product;

            // For each link that looks like metadata, see if that link is
            // repeated in all granules for that product. If so, we want to
            // bump that up to product level instead of at the granule level.
            $.each(granule.links, function(index, link) {
                if ( link.rel !== cmr.REL_DATA && link.rel !== cmr.REL_BROWSE ) {
                    if ( !product.counts[link.href]  ) {
                        product.counts[link.href] = 1;
                    } else {
                        product.counts[link.href]++;
                    }
                }
            });
        });

        $.each(selection, function(key, product) {
            product.links = [];
            product.list = [];

            // Check the first granule, and populate product level links
            // where the count equals the number of granules
            var granule = product.granules[0];
            $.each(granule.links, function(index, link) {
                var count = product.counts[link.href];
                if ( count % product.granules.length === 0 ) {
                    product.links.push(reformatLink(link));
                }
            });

            $.each(product.granules, function(index, granule) {
                var item = {
                    id: granule.id,
                    label: granule.downloadLabel || granule.label,
                    links: [],
                    urs: granule.urs
                };
                $.each(granule.links, function(index, link) {
                    // Skip this link if now at the product level
                    var count = product.counts[link.href];
                    if ( count % product.granules.length === 0 ) {
                        return;
                    }
                    // Skip browse images per Kevin's request
                    if ( link.rel === cmr.REL_BROWSE ) {
                        return;
                    }
                    item.links.push(reformatLink(link));
                });
                product.list.push(item);
            });
            product.list.sort(function(a, b) {
                if ( a.label > b.label ) {
                    return 1;
                }
                if ( a.label < b.label ) {
                    return -1;
                }
                return 0;
            });
        });

        return selection;
    };

    var isBulkDownloadable = function() {
        var result = false;
        $.each(selection, function(index, product) {
            if ( !product.noBulkDownload ) {
                result = true;
            }
        });
        return result;
    };

    var reformatLink = function(link) {
        // For title, take it if found, otherwise, use the basename of the
        // URI
        return {
            href: link.href,
            title: ( link.title ) ? link.title : link.href.split("/").slice(-1),
            data: ( link.rel === cmr.REL_DATA )
        };
    };

    var linksText = function(links) {
        var elements = [];
        elements.push("<ul>");
        $.each(links, function(index, link) {
            elements.push(
                "<li class='link'><a href='" + link.href + "' target='_blank'>" +
                link.title + "</a></li>");
        });
        elements.push("</ul>");
        return elements.join("\n");
    };

    var granuleText = function(product, granule) {
        var elements;
        if ( product.name !== granule.label ) {
            elements = [
                "<tr data-granule='" + granule.id + "'>",
                    "<td><input type='button' class='remove' " +
                        "data-granule='" + granule.id + "' " +
                        "value='X'></input></td>",
                    "<td><nobr><ul><li>" + granule.label + "</li></ul></nobr></td>",
                    "<td class='wv-data-granule-link'>" + linksText(granule.links) + "</td>",
                "</tr>"
            ];
        } else {
            elements = [
                "<tr data-granule='" + granule.id + "'>",
                    "<td><input type='button' class='remove' " +
                        "data-granule='" + granule.id + "' " +
                        "value='X'></input></td>",
                    "<td colspan='2'>" + linksText(granule.links) + "</td>",
                "</tr>"
            ];
        }
        return elements.join("\n");
    };

    var productText = function(product) {
        var elements = [
            "<h3>" + product.name + "</h3>"
        ];

        elements.push("<h5>Selected Data</h5>");
        elements.push("<table>");

        $.each(product.list, function(index, item) {
            elements.push(granuleText(product, item));
        });
        elements.push("</table>");

        if ( product.links && product.links.length > 0 ) {
            elements.push("<h5>Data Collection Information</h5>");
            elements.push("<div class='product'>");
            elements.push(linksText(product.links));
            elements.push("</div>");
        }

        return elements.join("\n");
    };

    var bodyText = function() {
        if ( _.size(model.selectedGranules) === 0 ) {
            return "<br/><h3>Selection Empty</h3>";
        }
        var elements = [];
        if ( urs ) {
            elements.push(NOTICE);
        }
        var products = [];
        $.each(selection, function(key, product) {
            products.push(productText(product));
        });
        elements.push(products.join("<br/><br/><br/>"));
        return elements.join("");
    };

    var bulkDownloadText = function() {
        return ("<div class='bulk collapse'>" +
            "<h5>Bulk Download</h5>" +
            "<ul class='BulkDownload'>" +
            "<li><a class='wget' href='#'>List of Links</a>: " +
                "for wget or download managers that accept a list of " +
                "URLs</li>" +
            "<li><a class='curl' href='#'>List of cURL Commands</a>: " +
                "can be copied and pasted to " +
                "a terminal window to download using cURL.</li>" +
            "</ul>" +
            "</div>");
    };

    var showWgetPage = function() {
        wv.data.ui.bulkDownloadPage.show(selection, "wget");
    };

    var showCurlPage = function() {
        wv.data.ui.bulkDownloadPage.show(selection, "curl");
    };

    var removeGranule = function() {
        var id = $(this).attr("data-granule");
        model.unselectGranule(model.selectedGranules[id]);
        onHoverOut.apply(this);
    };

    var onHoverOver = function() {
        model.events.trigger("hoverOver",
                model.selectedGranules[$(this).attr("data-granule")]);
    };

    var onHoverOut = function() {
        model.events.trigger("hoverOut",
                model.selectedGranules[$(this).attr("data-granule")]);
    };

    return self;

};


wv.data.ui.selectionListPanel = function(model, results) {

    var self = {};
    var granules = {};
    var $dialog;

    var init = function() {
        model.events.on("granuleUnselect", onGranuleUnselect);
    };

    self.show = function() {
        $dialog = wv.ui.getDialog("wv-data-list");
        $dialog
            .attr("id", "wv-data-list")
            .html(bodyText())
            .dialog({
                title: "Select data",
                width: 400,
                height: 400
            });
        $("button.ui-dialog-titlebar-close").hide();

        $.each(results.granules, function(index, granule) {
            granules[granule.id] = granule;
        });
        $("#wv-data-list").find("input").on("click", toggleSelection);
    };

    self.hide = function() {
        var $d = $(".ui-dialog");
        if ( $d.length !== 0 ) {
            $d.hide();
        }
    };

    self.visible = function() {
        var $d = $(".ui-dialog");
        if ( $d.length !== 0 ) {
            return $d.is(":visible");
        }
        return false;
    };

    self.setVisible = function(value) {
        if ( !value ) {
            self.hide();
        } else {
            self.show();
        }
    };

    var dispose = function() {
        panel.destroy();
        panel = null;
        $("#wv-data-selection_GranuleList").find("input").off("click", toggleSelection);
    };

    var resultsText = function() {
        var elements = [];
        $.each(results.granules, function(index, granule) {
            var selected = model.isSelected(granule) ? "checked='true'" : "";
            elements.push(
                "<tr>" +
                "<td>" +
                "<input type='checkbox' value='" + granule.id + "' " +
                selected + ">" +
                "</td>" +
                "<td class='label'>" + granule.label + "</td>" +
                "</tr>"
            );
        });
        return elements.join("\n");
    };

    var bodyText = function() {
        var elements = [
            "<div'>",
            "<table>",
            resultsText(),
            "</table>",
            "</div>"
        ];
        return elements.join("\n") + "<br/>";
    };

    var toggleSelection = function(event, ui) {
        var granule = granules[$(this).attr("value")];
        var selected = $(this).prop("checked");
        if ( selected ) {
            model.selectGranule(granule);
        } else {
            model.unselectGranule(granule);
        }
    };

    var onGranuleUnselect = function(granule) {
        $("#wv-data-list").find("input[value='" + granule.id + "']").removeAttr("checked");
    };


    init();
    return self;

};
