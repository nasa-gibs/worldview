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

Worldview.DataDownload.SelectionListPanel = function(model, results) {
    
    var log = Logging.getLogger("Worldview.DataDownload");
       
    var NOTICE = 
            "These results cannot be displayed on the map. Select from the " +
            "list below.";
        
    var panel = null;
    var self = {};
    var granules = {};
    
    self.show = function() {
        panel = new YAHOO.widget.Panel("DataDownload_SelectionListPanel", {
            width: "600px",
            height: "400px",
            zIndex: 1020,
            visible: false
        });
        panel.setHeader("Select data");
        
        panel.setBody(bodyText());
        panel.render(document.body);
        panel.show();
        panel.center();
        panel.hideEvent.subscribe(function() {
            setTimeout(function() { panel.destroy(); panel = null; }, 25);
        });
        
        $.each(results.granules, function(index, granule) {
            granules[granule.id] = granule;    
        });
        
        $("#DataDownload_GranuleList").trigger("create");
        $("#DataDownload_GranuleList").on("change", updateSelection);
    };
    
    self.hide = function() {
        if ( panel ) {
            panel.hide();
        }
    };
    
    self.visible = function() {
        return panel !== null;
    };

    var resultsText = function() {
        var elements = [];
        $.each(results.granules, function(index, granule) {
            elements.push("<input type='checkbox' name='granule-list' id='" + granule.id + "' class='custom'/>");
            elements.push("<label for='" + granule.id + "'>" + granule.label + "</label>");      
        });
        var text = elements.join("\n");
        return text;    
    };
    
    var bodyText = function() {
        var elements = [
            NOTICE,
            "<div id='DataDownload_GranuleList' data-role='fieldcontain'>",
            "<fieldset data-role='controlgroup'>",
            resultsText(),
            "</fieldset>",
            "</div>"
        ];
        var text = elements.join("\n<br/>\n") + "<br/>";
        return text;
    };
         
    var updateSelection = function(event, ui) {
        var granule = granules[event.target.id];
        if ( event.target.checked ) {
            log.debug(granule);
            model.selectGranule(granule);
        } else {
            model.unselectGranule(granule);
        }
    };
       
    return self;

};