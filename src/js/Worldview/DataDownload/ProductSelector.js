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

Worldview.DataDownload.ProductSelector = function(model, selector) {
    
    var self = {};
    
    var init = function() {
        $(selector).html("<select size='1'></select>");
        $(selector + " select").change(function() {
            onSelect();
        });
        
        model.events.on("layerUpdate", onLayerUpdate)
        model.events.on("layerSelect", onSelectUpdate);
        
        onLayerUpdate();
    };    

    var onLayerUpdate = function() {
        var options = [];
        $.each(model.layers, function(index, layer) {
            var selected = "";
            if ( layer.id === model.selectedLayer ) {
                selected = " selected";
            }
            var option = "<option value='" + layer.id + "'" + selected + ">" + 
                layer.name + "; " + layer.description + "</option>";
            options.push(option);
        })
        $(selector + " select").html(options.join("\n"));   
    };
    
    var onSelect = function() {
        var layer = $(selector + " select option:selected").val();
        model.selectLayer(layer);
    };
    
    var onSelectUpdate = function(selectedLayer) {
        $(selector + " select").val(selectedLayer)        
    };
    
    init();
    return self;

}
