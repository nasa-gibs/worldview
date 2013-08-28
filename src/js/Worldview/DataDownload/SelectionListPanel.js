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

Worldview.DataDownload.SelectionListPanel = function(model) {
    
    var panel;
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
        panel.setBody(bodyText());
        panel.render(document.body);
        panel.show();
        panel.center();
        panel.hideEvent.subscribe(function() {
            setTimeout(function() { panel.destroy(); }, 25);
        });
    };
    
    self.hide = function() {
        panel.hide();
    };
    
    var linkText = function(granule) {
        var elements = ["<ul>"];
        $.each(granule.links, function(index, link) {
            var title = ( link.title ) ? link.title : granule.producer_granule_id;
            elements.push(
                "<li>" + 
                    "<a target='_blank' href='" + link.href + "'>" + title + "</a>" +
                "</li>"
            );
        });    
        elements.push["</ul>"];
        return elements.join("\n");
    };
    
    var granuleText = function(granule) {
        var text = "<li>" + granule.producer_granule_id + 
            linkText(granule) + "</li>";  
        return text;      
    };
    
    var bodyText = function() {
        var elements = ["<ul>"];
        $.each(model.selectedGranules, function(key, granule) {
            elements.push(granuleText(granule));            
        });
        elements.push("</ul>");
        var text = elements.join("\n");
        console.log(text);
        return text;
    };
    
    return self;

};
        
