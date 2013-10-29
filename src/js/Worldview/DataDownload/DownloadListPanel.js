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
Worldview.namespace("DataDownload");

Worldview.DataDownload.DownloadListPanel = function(config, model) {

    var log = Logging.getLogger("Worldview.DataDownload");

    var echo = Worldview.DataDownload.ECHO;

    var NOTICE =
        "<div id='DataDownload_Notice'>" +
            "<img class='icon' src='images/info-icon-blue.svg'>" +
            "<p class='text'>" +
                "Some items you have selected require an account with the " +
                "EOSDIS User Registration System (URS) to download. " +
                "It is simple and free to sign up! " +
                "<a href='https://earthdata.nasa.gov/urs/register' target='urs'>" +
                "Click to register for an account.</a>" +
            "</p>" +
        "</div>";

    var panel = null;
    var selection;
    var self = {};
    var urs = false;

    self.events = Worldview.Events();

    self.show = function() {
        $("#DataDownload_DownloadListPanel .remove").off("click", removeGranule);
        $("#DataDownload_DownloadListPanel a.wget").off("click", showWgetPage);
        $("#DataDownload_DownloadListPanel a.curl").off("click", showCurlPage);

        selection = reformatSelection();
        log.debug("selection", selection);
        var newPanel = false;
        if ( !panel ) {
            newPanel = true;
            panel = new YAHOO.widget.Panel("DataDownload_DownloadListPanel", {
                width: "600px",
                height: "500px",
                zIndex: 1020,
                visible: false,
                constraintoviewport: true
            });
            panel.setHeader("Download Links");
        }
        panel.setBody(bodyText(selection));
        panel.setFooter(bulkDownloadText());

        if ( newPanel ) {
            panel.render(document.body);
            panel.show();
            panel.center();
            panel.hideEvent.subscribe(function() {
                setTimeout(dispose, 25);
            });
        }

        $("#DataDownload_DownloadListPanel a.wget").click(showWgetPage);
        $("#DataDownload_DownloadListPanel a.curl").click(showCurlPage);
        $("#DataDownload_DownloadListPanel .remove").click(removeGranule);

        var bulkVisible = isBulkDownloadable() &&
                Worldview.size(model.selectedGranules) !== 0;
        if ( bulkVisible ) {
            $("#DataDownload_DownloadListPanel .ft .bulk")
                    .css("visibility", "visible");
        } else {
            $("#DataDownload_DownloadListPanel .ft .bulk")
                    .css("visibility", "hidden");
        }
    };

    self.hide = function() {
        if ( panel ) {
            panel.hide();
        }
    };

    self.visible = function() {
        return panel !== null;
    };

    var dispose = function() {
        self.events.trigger("close");
        panel.destroy();
        panel = null;
        $("#DataDownload_DownloadListPanel a.wget").off("click", showWgetPage);
        $("#DataDownload_DownloadListPanel a.curl").off("click", showCurlPage);
    };

    var reformatSelection = function() {
        var selection = {};

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
                    noBulkDownload: productConfig.noBulkDownload || false,
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
                if ( link.rel !== echo.REL_DATA && link.rel !== echo.REL_BROWSE ) {
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
                    if ( link.rel === echo.REL_BROWSE ) {
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

        log.debug(selection);
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
            data: ( link.rel === echo.REL_DATA )
        };
    };

    var linksText = function(links) {
        var elements = [];
        elements.push("<ul>");
        $.each(links, function(index, link) {
            elements.push(
                "<li><a href='" + link.href + "' target='_blank'>" +
                link.title + "</a></li>");
        });
        elements.push("</ul>");
        return elements.join("\n");
    };

    var granuleText = function(product, granule) {
        if ( product.name !== granule.label ) {
            var elements = [
                "<tr>",
                    "<td><input type='button' class='remove' " +
                        "data-granule='" + granule.id + "' " +
                        "value='X'></input></td>",
                    "<td><nobr><ul><li>" + granule.label + "</li></ul></nobr></td>",
                    "<td>" + linksText(granule.links) + "</td>",
                "</tr>"
            ];
        } else {
            var elements = [
                "<tr>",
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
        if ( Worldview.size(model.selectedGranules) === 0 ) {
            return "<br/><h3>Selection Empty</h3>";
        }
        var elements = [];
        if ( urs ) {
            elements.push(NOTICE);
        }
        $.each(selection, function(key, product) {
            elements.push("\n<br/>\n" + productText(product));
        });

        var text = elements.join("\n<br/>\n") + "<br/>";
        return text;
    };

    var bulkDownloadText = function() {
        var bulk =
            "<div class='bulk'>" +
            "<h4>Bulk Download</h4>" +
            "<ul class='BulkDownload'>" +
            "<li><a class='wget' href='#'>List of Links:</a> " +
                "for wget or download managers that accept a list of " +
                "URLs</li>" +
            "<li><a class='curl' href='#'>List of cURL Commands:</a> " +
                "can be copied and pasted to " +
                "a terminal window to download using cURL.</li>" +
            "</ul>" +
            "</div>";
        return bulk;
    };

    var showWgetPage = function() {
        Worldview.DataDownload.BulkDownloadPage.show(selection, "wget");
    };

    var showCurlPage = function() {
        Worldview.DataDownload.BulkDownloadPage.show(selection, "curl");
    };

    var removeGranule = function() {
        var id = $(this).attr("data-granule");
        model.unselectGranule(model.selectedGranules[id]);
    };

    return self;

};
