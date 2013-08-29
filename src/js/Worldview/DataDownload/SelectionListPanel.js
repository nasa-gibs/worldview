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

Worldview.DataDownload.SelectionListPanel = function(config, model) {
    
    var REL_DATA = "http://esipfed.org/ns/fedsearch/1.1/data#";
    var REL_BROWSE = "http://esipfed.org/ns/fedsearch/1.1/browse#";
    
    var NOTICE = 
        "<div id='DataDownload_Notice'>" +
            "<img class='icon' src='images/info-icon-blue.svg'>" + 
            "<p class='text'>" + 
                "An account with the EOSDIS User Registration System (URS) " + 
                "may be necessary to download data. It is simple and " + 
                "free to sign up! Click to " + 
                "<a href='https://earthdata.nasa.gov/urs/register' target='urs'>" + 
                "register for an account.</a>" +
            "</p>" +
        "</div>";
        
    var panel;
    var selection;
    var self = {};
    
    self.show = function() {
        if ( panel ) {
            return;
        }
        panel = new YAHOO.widget.Panel("DataDownload_SelectionListPanel", {
            width: "600px",
            height: "400px",
            zIndex: 1020,
            visible: false
        });
        panel.setHeader("Download Links");
        selection = reformatSelection();
        panel.setBody(bodyText(selection));
        panel.render(document.body);
        panel.show();
        panel.center();
        panel.hideEvent.subscribe(function() {
            setTimeout(function() { panel.destroy(); }, 25);
        });
        
        $("#DataDownload_SelectionListPanel a.wget").click(showTextURLs);
    };
    
    self.hide = function() {
        panel.hide();
    };
    
    var reformatSelection = function() {
        var selection = {};
        
        $.each(model.selectedGranules, function(key, granule) {
            if ( !selection[granule.product] ) {
                selection[granule.product] = {
                    name: config.products[granule.product].name,
                    granules: [granule],
                    counts: {}
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
                if ( link.rel !== REL_DATA && link.rel !== REL_BROWSE ) {
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
                if ( count === product.granules.length ) {
                    product.links.push(reformatLink(link));
                }
            });
            
            $.each(product.granules, function(index, granule) {
                var item = {
                    label: granule.downloadLabel || granule.label,
                    links: []
                };
                $.each(granule.links, function(index, link) {
                    // Skip this link if now at the product level
                    var count = product.counts[link.href];
                    if ( count === product.granules.length ) {
                        return;
                    }
                    // Skip browse images per Kevin's request
                    if ( link.rel === REL_BROWSE ) {
                        return;
                    }
                    item.links.push(reformatLink(link));                           
                });
                product.list.push(item);                    
            });        
        });
        
        console.log(selection);
        return selection; 
    };
    
    var reformatLink = function(link) { 
        // For title, take it if found, otherwise, use the basename of the
        // URI
        return {
            href: link.href,
            title: ( link.title ) ? link.title : link.href.split("/").slice(-1)
        };
    };
    
    var linksText = function(links) {
        var elements = [];
        elements.push("<ul>");
        $.each(links, function(index, link) {
            elements.push(
                "<a href='" + link.href + "' target='_blank'>" + 
                link.title + "</a><br/>");
        });
        elements.push("</ul>");
        return elements.join("\n");
    };
    
    var granuleText = function(granule) {
        var elements = [
            "<tr>",
                "<td>" + granule.label + "</td>",
                "<td>" + linksText(granule.links) + "</td>",
            "</tr>"
        ];
        return elements.join("\n");  
    };
    
    var productText = function(product) {
        var elements = [
            "<h3>" + product.name + "</h3>"
        ];
        
        if ( product.links && product.links.length > 0 ) {
            elements.push("<h5>Data Collection Information</h5>");
            elements.push(linksText(product.links));
        }
        
        elements.push("<h5>Selected Data</h5>");
        elements.push("<table>");

        $.each(product.list, function(index, item) {
            elements.push(granuleText(item));
        });
        elements.push("</table>");
        return elements.join("\n");
    };
    
    var bodyText = function() {
        var elements = [
            NOTICE,
            "<div class='wget'>", 
                "<a class='wget' href='#'>Text URLs (wget)</a>", 
            "</div>"
        ];
        $.each(selection, function(key, product) {
            elements.push(productText(product));  
        });
        var text = elements.join("\n<br/>\n") + "<br/>";
        return text;
    };
    
    var showTextURLs = function() {
        var text = window.open('');
        text.document.write("<html><body><ul>");
        $.each(selection, function(key, product) { 
            $.each(product.list, function(index, item) { 
                $.each(item.links, function(index, link) {
                    writeLink(text.document, link);
                });
            });    
        });
        text.document.write("</ul></body></html>");
        text.document.close();
    };
    
    var writeLink = function(doc, link) {
        doc.write(
            "<li>" +
                "<a href='" + link.href + "'>" + link.href + "</a>" +
            "</li>"
        );
    };
    
    return self;

};
        
