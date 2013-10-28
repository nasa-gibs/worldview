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

Worldview.DataDownload.BulkDownloadPage = (function() {

    var ns = {};

    var pages = {
        wget: "pages/wget.html",
        curl: "pages/curl.html"
    };

    ns.show = function(selection, type) {
        var nonce = Date.now();
        var page = window.open(pages[type] + "?v=" + nonce,
                'Worldview_' + nonce);

        page.onload = function() {
            fillPage(page, selection, type);
        };
        setTimeout(function() {
            fillPage(page, selection, type);
        }, 10);
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
        page.document.getElementById("links").innerHTML =
            "<pre>" + downloadLinks.join("\n") + "</pre>";

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
            page.document.getElementById("fdm-password-instructions")
                .style.display = "block";
            page.document.getElementById("fdm-machine-names").innerHTML =
                "<pre>" + hostnames.join("\n") + "</pre>";
        }
        if ( indirectLinks.length > 0 ) {
            page.document.getElementById("indirect-instructions")
                .style.display = "block";
            page.document.getElementById("indirect").innerHTML =
                "<ul>" + indirectLinks.join("\n") + "</ul>";
        }
    };

    return ns;

})();