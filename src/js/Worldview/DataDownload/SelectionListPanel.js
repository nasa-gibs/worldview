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
               
    var panel = null;
    var self = {};
    var granules = {};
    
    self.show = function() {
        panel = new YAHOO.widget.Panel("DataDownload_SelectionListPanel", {
            width: "400px",
            height: "400px",
            zIndex: 1020,
            visible: false,
            close: false
        });
        panel.setHeader("Select data");
        
        panel.setBody(bodyText());
        panel.render(document.body);
        panel.show();
        panel.center();
        panel.hideEvent.subscribe(function() {
            setTimeout(dispose, 25);
        });
        
        $.each(results.granules, function(index, granule) {
            granules[granule.id] = granule;    
        });
        
        $("#DataDownload_GranuleList img.button").on("click", toggleSelection);
        model.events.on("granuleSelect", onGranuleSelect);
        model.events.on("granuleUnselect", onGranuleUnselect);
    };
    
    self.hide = function() {
        if ( panel ) {
            panel.hide();
        }
    };
    
    self.visible = function() {
        return panel !== null;
    };
    
    self.setVisible = function(value) {
        if ( !value ) {
            $("#DataDownload_SelectionListPanel").hide();
        } else {
            $("#DataDownload_SelectionListPanel").show();
        }
    };

    var dispose = function() {
        panel.destroy(); 
        panel = null;
        $("#DataDownload_GranuleList img.button").off("click", toggleSelection);   
        model.events.off("granuleSelect", onGranuleSelect);
        model.events.off("granuleUnselect", onGranuleUnselect);             
    };
    
    var resultsText = function() {
        var elements = [];
        $.each(results.granules, function(index, granule) {
            var selected = model.isSelected(granule);
            var button = ( selected ) 
                ? Worldview.DataDownload.IMAGE_UNSELECT
                : Worldview.DataDownload.IMAGE_SELECT;
            elements.push(
                "<tr>" + 
                "<td>" + 
                "<img " + 
                    "id='" + granule.id + "' " + 
                    "src='" + button + "' " + 
                    "data-selected='" + selected + "'" + 
                    "class='button'>" +
                "</td>" + 
                "<td class='label'>" + granule.label + "</td>" + 
                "</tr>"
            ); 
        });
        var text = elements.join("\n");
        return text;    
    };
    
    var bodyText = function() {
        var elements = [
            "<div id='DataDownload_GranuleList'>",
            "<table>",
            resultsText(),
            "</table>",
            "</div>"
        ];
        var text = elements.join("\n") + "<br/>";
        return text;
    };
         
    var toggleSelection = function(event, ui) {
        var granule = granules[event.target.id];
        var selected = $(this).attr("data-selected") === "true";
        if ( selected ) {
            model.unselectGranule(granule);
        } else {
            model.selectGranule(granule);
        }
    };
       
    var onGranuleSelect = function(granule) {
        log.debug(granule);
        $("#" + granule.id)
            .attr("src", Worldview.DataDownload.IMAGE_UNSELECT)
            .attr("data-selected", "true");
    };
    
    var onGranuleUnselect = function(granule) {
        log.debug(granule);
        $("#" + granule.id)
            .attr("src", Worldview.DataDownload.IMAGE_SELECT)
            .attr("data-selected", "false");
    };
        
    return self;

};